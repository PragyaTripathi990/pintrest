from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_current_user_optional
from ..models import Board, Follow, Pin, Save, User
from ..schemas import BoardBrief, BoardOut, PinPage, ProfileUpdate, UserProfile
from ..serializers import serialize_board, serialize_pins
from ..utils import media_url, slugify

router = APIRouter(prefix="/api/users", tags=["users"])


def _counts(db: Session, user: User) -> dict:
    followers = (
        db.execute(
            select(func.count()).select_from(Follow).where(Follow.following_id == user.id)
        ).scalar()
        or 0
    )
    following = (
        db.execute(
            select(func.count()).select_from(Follow).where(Follow.follower_id == user.id)
        ).scalar()
        or 0
    )
    pin_count = (
        db.execute(
            select(func.count()).select_from(Pin).where(Pin.uploader_id == user.id)
        ).scalar()
        or 0
    )
    board_count = (
        db.execute(
            select(func.count()).select_from(Board).where(Board.owner_id == user.id)
        ).scalar()
        or 0
    )
    return {
        "followers_count": followers,
        "following_count": following,
        "pin_count": pin_count,
        "board_count": board_count,
    }


@router.patch("/me", response_model=UserProfile)
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    if "username" in data and data["username"]:
        new_username = slugify(data["username"]).replace("-", "")
        clash = db.execute(
            select(User).where(User.username == new_username, User.id != user.id)
        ).first()
        if clash:
            raise HTTPException(409, "Username already taken")
        user.username = new_username
    for field in ("full_name", "bio", "website"):
        if field in data and data[field] is not None:
            setattr(user, field, data[field])
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar": media_url(user.avatar),
        "bio": user.bio,
        "website": user.website,
        "created_at": user.created_at,
        "is_following": False,
        **_counts(db, user),
    }


def _get_user_or_404(db: Session, username: str) -> User:
    user = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.get("/{username}", response_model=UserProfile)
def get_profile(
    username: str,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    user = _get_user_or_404(db, username)
    is_following = False
    if viewer is not None:
        is_following = (
            db.execute(
                select(Follow).where(
                    Follow.follower_id == viewer.id, Follow.following_id == user.id
                )
            ).first()
            is not None
        )
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar": media_url(user.avatar),
        "bio": user.bio,
        "website": user.website,
        "created_at": user.created_at,
        "is_following": is_following,
        **_counts(db, user),
    }


@router.get("/{username}/boards", response_model=list[BoardBrief])
def user_boards(
    username: str,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    user = _get_user_or_404(db, username)
    stmt = select(Board).where(Board.owner_id == user.id)
    if viewer is None or viewer.id != user.id:
        stmt = stmt.where(Board.is_secret.is_(False))
    boards = db.execute(stmt.order_by(Board.created_at.desc())).scalars()
    return [serialize_board(db, b) for b in boards]


@router.get("/{username}/boards/{slug}", response_model=BoardOut)
def user_board_by_slug(
    username: str,
    slug: str,
    db: Session = Depends(get_db),
):
    user = _get_user_or_404(db, username)
    board = db.execute(
        select(Board).where(Board.owner_id == user.id, Board.slug == slug)
    ).scalar_one_or_none()
    if not board:
        raise HTTPException(404, "Board not found")
    return serialize_board(db, board)


@router.get("/{username}/pins", response_model=PinPage)
def user_pins(
    username: str,
    cursor: int | None = None,
    limit: int = 25,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    user = _get_user_or_404(db, username)
    limit = min(max(limit, 1), 50)
    stmt = (
        select(Pin)
        .where(Pin.uploader_id == user.id)
        .order_by(Pin.id.desc())
        .limit(limit + 1)
    )
    if cursor:
        stmt = stmt.where(Pin.id < cursor)
    pins = list(db.execute(stmt).scalars())
    next_cursor = None
    if len(pins) > limit:
        pins = pins[:limit]
        next_cursor = pins[-1].id
    return {"items": serialize_pins(db, pins, viewer), "next_cursor": next_cursor}


@router.get("/{username}/saved", response_model=PinPage)
def user_saved(
    username: str,
    cursor: int | None = None,
    limit: int = 25,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    user = _get_user_or_404(db, username)
    limit = min(max(limit, 1), 50)
    stmt = (
        select(Pin, Save.id)
        .join(Save, Save.pin_id == Pin.id)
        .where(Save.user_id == user.id)
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


@router.post("/{username}/follow", status_code=204)
def follow_user(
    username: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    target = _get_user_or_404(db, username)
    if target.id == user.id:
        raise HTTPException(400, "Cannot follow yourself")
    existing = db.execute(
        select(Follow).where(
            Follow.follower_id == user.id, Follow.following_id == target.id
        )
    ).first()
    if not existing:
        db.add(Follow(follower_id=user.id, following_id=target.id))
        db.commit()


@router.delete("/{username}/follow", status_code=204)
def unfollow_user(
    username: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    target = _get_user_or_404(db, username)
    existing = db.execute(
        select(Follow).where(
            Follow.follower_id == user.id, Follow.following_id == target.id
        )
    ).scalar_one_or_none()
    if existing:
        db.delete(existing)
        db.commit()
