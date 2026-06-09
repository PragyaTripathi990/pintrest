from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_current_user_optional
from ..models import Comment, Pin, Reaction, User
from ..schemas import CommentCreate, CommentOut, ReactionRequest
from ..serializers import serialize_comment

router = APIRouter(prefix="/api", tags=["comments"])


@router.get("/pins/{pin_id}/comments", response_model=list[CommentOut])
def list_comments(
    pin_id: int,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    comments = db.execute(
        select(Comment).where(Comment.pin_id == pin_id).order_by(Comment.id.asc())
    ).scalars()
    return [serialize_comment(db, c, viewer) for c in comments]


@router.post("/pins/{pin_id}/comments", response_model=CommentOut, status_code=201)
def create_comment(
    pin_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    pin = db.get(Pin, pin_id)
    if not pin:
        raise HTTPException(404, "Pin not found")
    comment = Comment(
        pin_id=pin_id, user_id=user.id, text=payload.text, parent_id=payload.parent_id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return serialize_comment(db, comment, user)


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != user.id:
        raise HTTPException(403, "Not your comment")
    db.delete(comment)
    db.commit()


@router.post("/comments/{comment_id}/react", response_model=CommentOut)
def react_comment(
    comment_id: int,
    payload: ReactionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(404, "Comment not found")
    existing = db.execute(
        select(Reaction).where(
            Reaction.user_id == user.id,
            Reaction.target_type == "comment",
            Reaction.target_id == comment_id,
        )
    ).scalar_one_or_none()
    if existing:
        existing.type = payload.type
    else:
        db.add(
            Reaction(
                user_id=user.id,
                target_type="comment",
                target_id=comment_id,
                type=payload.type,
            )
        )
    db.commit()
    return serialize_comment(db, comment, user)


@router.delete("/comments/{comment_id}/react", response_model=CommentOut)
def unreact_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = db.get(Comment, comment_id)
    if not comment:
        raise HTTPException(404, "Comment not found")
    existing = db.execute(
        select(Reaction).where(
            Reaction.user_id == user.id,
            Reaction.target_type == "comment",
            Reaction.target_id == comment_id,
        )
    ).scalar_one_or_none()
    if existing:
        db.delete(existing)
        db.commit()
    return serialize_comment(db, comment, user)
