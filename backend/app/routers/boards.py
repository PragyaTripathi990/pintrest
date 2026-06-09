from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_current_user_optional
from ..models import Board, BoardSection, Pin, Save, User
from ..schemas import (
    BoardCreate,
    BoardOut,
    BoardUpdate,
    PinPage,
    SectionCreate,
    SectionOut,
)
from ..serializers import board_pin_count, serialize_board, serialize_pins
from ..utils import slugify

router = APIRouter(prefix="/api/boards", tags=["boards"])


def unique_board_slug(db: Session, owner_id: int, name: str) -> str:
    base = slugify(name)
    slug = base
    i = 1
    while db.execute(
        select(Board).where(Board.owner_id == owner_id, Board.slug == slug)
    ).first():
        i += 1
        slug = f"{base}-{i}"
    return slug


@router.post("", response_model=BoardOut, status_code=201)
def create_board(
    payload: BoardCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = Board(
        owner_id=user.id,
        name=payload.name,
        slug=unique_board_slug(db, user.id, payload.name),
        description=payload.description,
        is_secret=payload.is_secret,
    )
    db.add(board)
    db.commit()
    db.refresh(board)
    return serialize_board(db, board)


@router.get("/{board_id}", response_model=BoardOut)
def get_board(board_id: int, db: Session = Depends(get_db)):
    board = db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    return serialize_board(db, board)


@router.patch("/{board_id}", response_model=BoardOut)
def update_board(
    board_id: int,
    payload: BoardUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    if board.owner_id != user.id:
        raise HTTPException(403, "Not your board")
    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        board.name = data["name"]
        board.slug = unique_board_slug(db, user.id, data["name"])
    if "description" in data:
        board.description = data["description"]
    if "is_secret" in data and data["is_secret"] is not None:
        board.is_secret = data["is_secret"]
    db.commit()
    db.refresh(board)
    return serialize_board(db, board)


@router.delete("/{board_id}", status_code=204)
def delete_board(
    board_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    if board.owner_id != user.id:
        raise HTTPException(403, "Not your board")
    db.delete(board)
    db.commit()


@router.get("/{board_id}/pins", response_model=PinPage)
def board_pins(
    board_id: int,
    cursor: int | None = None,
    limit: int = 25,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    limit = min(max(limit, 1), 50)
    stmt = (
        select(Pin, Save.id)
        .join(Save, Save.pin_id == Pin.id)
        .where(Save.board_id == board_id)
        .order_by(Save.id.desc())
        .limit(limit + 1)
    )
    if cursor:
        stmt = stmt.where(Save.id < cursor)
    rows = db.execute(stmt).all()
    pins = [r[0] for r in rows]
    save_ids = [r[1] for r in rows]
    next_cursor = None
    if len(pins) > limit:
        pins = pins[:limit]
        next_cursor = save_ids[limit - 1]
    return {"items": serialize_pins(db, pins, viewer), "next_cursor": next_cursor}


# ----------------------------- Sections -----------------------------
@router.get("/{board_id}/sections", response_model=list[SectionOut])
def list_sections(board_id: int, db: Session = Depends(get_db)):
    sections = db.execute(
        select(BoardSection).where(BoardSection.board_id == board_id)
    ).scalars()
    out = []
    for s in sections:
        count = (
            db.execute(
                select(func.count()).select_from(Save).where(Save.section_id == s.id)
            ).scalar()
            or 0
        )
        out.append({"id": s.id, "name": s.name, "slug": s.slug, "pin_count": count})
    return out


@router.post("/{board_id}/sections", response_model=SectionOut, status_code=201)
def create_section(
    board_id: int,
    payload: SectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    board = db.get(Board, board_id)
    if not board:
        raise HTTPException(404, "Board not found")
    if board.owner_id != user.id:
        raise HTTPException(403, "Not your board")
    section = BoardSection(
        board_id=board_id, name=payload.name, slug=slugify(payload.name)
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return {"id": section.id, "name": section.name, "slug": section.slug, "pin_count": 0}
