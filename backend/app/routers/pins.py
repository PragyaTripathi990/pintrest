import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_user, get_current_user_optional
from ..models import Board, Pin, Reaction, Save, User
from ..schemas import PinOut, PinPage, PinUpdate, ReactionRequest, SaveRequest
from ..serializers import serialize_pin, serialize_pins
from ..services.feed_generator import generate_pins
from ..services.images import process_image_bytes

router = APIRouter(prefix="/api/pins", tags=["pins"])


@router.get("/feed", response_model=PinPage)
def feed(
    cursor: int | None = None,
    limit: int = 25,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    limit = min(max(limit, 1), 50)
    # On the first page (a fresh load/refresh), mint a new batch of pins so the
    # feed is different every time and infinite scroll never runs dry. Later
    # pages just paginate the existing pool (stable cursors).
    if not cursor:
        generate_pins(db, 30)
    stmt = select(Pin).order_by(Pin.id.desc()).limit(limit + 1)
    if cursor:
        stmt = stmt.where(Pin.id < cursor)
    pins = list(db.execute(stmt).scalars())
    next_cursor = None
    if len(pins) > limit:
        pins = pins[:limit]
        next_cursor = pins[-1].id
    return {"items": serialize_pins(db, pins, viewer), "next_cursor": next_cursor}


@router.post("", response_model=PinOut, status_code=201)
async def create_pin(
    title: str = Form(""),
    description: str = Form(""),
    link: str = Form(""),
    alt_text: str = Form(""),
    board_id: int | None = Form(None),
    image_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if file is not None:
        data = await file.read()
    elif image_url:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(image_url, timeout=20, follow_redirects=True)
                resp.raise_for_status()
                data = resp.content
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(400, f"Could not fetch image_url: {exc}")
    else:
        raise HTTPException(400, "Provide an image file or image_url")

    try:
        meta = process_image_bytes(data)
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    pin = Pin(
        uploader_id=user.id,
        title=title,
        description=description,
        link=link,
        alt_text=alt_text,
        board_id=board_id,
        **meta,
    )
    db.add(pin)
    db.commit()
    db.refresh(pin)

    # Also save to the chosen board so it shows up there
    if board_id:
        board = db.get(Board, board_id)
        if board and board.owner_id == user.id:
            db.add(Save(pin_id=pin.id, board_id=board_id, user_id=user.id))
            db.commit()

    return serialize_pin(db, pin, user)


@router.get("/{pin_id}", response_model=PinOut)
def get_pin(
    pin_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    return serialize_pin(db, pin, viewer)


@router.get("/{pin_id}/related", response_model=PinPage)
def related_pins(
    pin_id: int,
    cursor: int | None = None,
    limit: int = 25,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    limit = min(max(limit, 1), 50)
    stmt = select(Pin).where(Pin.id != pin_id).order_by(Pin.id.desc()).limit(limit + 1)
    if cursor:
        stmt = stmt.where(Pin.id < cursor)
    pins = list(db.execute(stmt).scalars())
    next_cursor = None
    if len(pins) > limit:
        pins = pins[:limit]
        next_cursor = pins[-1].id
    return {"items": serialize_pins(db, pins, viewer), "next_cursor": next_cursor}


@router.get("/{pin_id}/download")
def download_pin(pin_id: int, db: Session = Depends(get_db)):
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    if pin.image.startswith("http"):
        return RedirectResponse(pin.image)
    path = settings.upload_dir / pin.image
    if not path.exists():
        raise HTTPException(404, "Image not found")
    return FileResponse(path, media_type="image/jpeg", filename=f"pin-{pin_id}.jpg")


@router.patch("/{pin_id}", response_model=PinOut)
def update_pin(
    pin_id: int,
    payload: PinUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    if pin.uploader_id != user.id:
        raise HTTPException(403, "Not your pin")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pin, field, value)
    db.commit()
    db.refresh(pin)
    return serialize_pin(db, pin, user)


@router.delete("/{pin_id}", status_code=204)
def delete_pin(
    pin_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    if pin.uploader_id != user.id:
        raise HTTPException(403, "Not your pin")
    db.delete(pin)
    db.commit()


# ----------------------------- Save / Unsave -----------------------------
@router.post("/{pin_id}/save", response_model=PinOut)
def save_pin(
    pin_id: int,
    payload: SaveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    board = db.get(Board, payload.board_id)
    if not board or board.owner_id != user.id:
        raise HTTPException(403, "Board not found or not yours")

    existing = db.execute(
        select(Save).where(Save.pin_id == pin_id, Save.board_id == payload.board_id)
    ).scalar_one_or_none()
    if not existing:
        db.add(
            Save(
                pin_id=pin_id,
                board_id=payload.board_id,
                section_id=payload.section_id,
                user_id=user.id,
                note=payload.note,
            )
        )
        db.commit()
    return serialize_pin(db, pin, user)


@router.delete("/{pin_id}/save", response_model=PinOut)
def unsave_pin(
    pin_id: int,
    board_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Save).where(Save.pin_id == pin_id, Save.user_id == user.id)
    if board_id:
        stmt = stmt.where(Save.board_id == board_id)
    for save in db.execute(stmt).scalars():
        db.delete(save)
    db.commit()
    pin = db.get(Pin, pin_id)
    return serialize_pin(db, pin, user)


# ----------------------------- React -----------------------------
@router.post("/{pin_id}/react", response_model=PinOut)
def react_pin(
    pin_id: int,
    payload: ReactionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    existing = db.execute(
        select(Reaction).where(
            Reaction.user_id == user.id,
            Reaction.target_type == "pin",
            Reaction.target_id == pin_id,
        )
    ).scalar_one_or_none()
    if existing:
        existing.type = payload.type
    else:
        db.add(
            Reaction(user_id=user.id, target_type="pin", target_id=pin_id, type=payload.type)
        )
    db.commit()
    return serialize_pin(db, pin, user)


@router.delete("/{pin_id}/react", response_model=PinOut)
def unreact_pin(
    pin_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.execute(
        select(Reaction).where(
            Reaction.user_id == user.id,
            Reaction.target_type == "pin",
            Reaction.target_id == pin_id,
        )
    ).scalar_one_or_none()
    if existing:
        db.delete(existing)
        db.commit()
    pin = db.get(Pin, pin_id)
    return serialize_pin(db, pin, user)
