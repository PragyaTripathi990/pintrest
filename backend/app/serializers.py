from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models
from .utils import media_url


def user_brief(u: models.User | None) -> dict:
    if u is None:
        return {"id": 0, "username": "unknown", "full_name": "", "avatar": None}
    return {
        "id": u.id,
        "username": u.username,
        "full_name": u.full_name,
        "avatar": media_url(u.avatar),
    }


def serialize_pins(db: Session, pins: list[models.Pin], viewer: models.User | None = None) -> list[dict]:
    if not pins:
        return []
    ids = [p.id for p in pins]

    save_counts = dict(
        db.execute(
            select(models.Save.pin_id, func.count())
            .where(models.Save.pin_id.in_(ids))
            .group_by(models.Save.pin_id)
        ).all()
    )
    comment_counts = dict(
        db.execute(
            select(models.Comment.pin_id, func.count())
            .where(models.Comment.pin_id.in_(ids))
            .group_by(models.Comment.pin_id)
        ).all()
    )
    reaction_counts = dict(
        db.execute(
            select(models.Reaction.target_id, func.count())
            .where(models.Reaction.target_type == "pin", models.Reaction.target_id.in_(ids))
            .group_by(models.Reaction.target_id)
        ).all()
    )

    uploader_ids = {p.uploader_id for p in pins}
    users = {
        u.id: u
        for u in db.execute(select(models.User).where(models.User.id.in_(uploader_ids))).scalars()
    }

    saved_set: set[int] = set()
    reaction_map: dict[int, str] = {}
    if viewer is not None:
        saved_set = set(
            db.execute(
                select(models.Save.pin_id).where(
                    models.Save.user_id == viewer.id, models.Save.pin_id.in_(ids)
                )
            ).scalars()
        )
        reaction_map = dict(
            db.execute(
                select(models.Reaction.target_id, models.Reaction.type).where(
                    models.Reaction.user_id == viewer.id,
                    models.Reaction.target_type == "pin",
                    models.Reaction.target_id.in_(ids),
                )
            ).all()
        )

    out = []
    for p in pins:
        out.append(
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "alt_text": p.alt_text,
                "link": p.link,
                "source_name": p.source_name,
                "image": media_url(p.image),
                "width": p.width,
                "height": p.height,
                "dominant_color": p.dominant_color,
                "created_at": p.created_at,
                "uploader": user_brief(users.get(p.uploader_id)),
                "save_count": save_counts.get(p.id, 0),
                "reaction_count": reaction_counts.get(p.id, 0),
                "comment_count": comment_counts.get(p.id, 0),
                "viewer_has_saved": p.id in saved_set,
                "viewer_reaction": reaction_map.get(p.id),
            }
        )
    return out


def serialize_pin(db: Session, pin: models.Pin, viewer: models.User | None = None) -> dict:
    return serialize_pins(db, [pin], viewer)[0]


def board_pin_count(db: Session, board_id: int) -> int:
    return (
        db.execute(
            select(func.count()).select_from(models.Save).where(models.Save.board_id == board_id)
        ).scalar()
        or 0
    )


def board_cover_images(db: Session, board_id: int, limit: int = 3) -> list[str]:
    rows = (
        db.execute(
            select(models.Pin.image)
            .join(models.Save, models.Save.pin_id == models.Pin.id)
            .where(models.Save.board_id == board_id)
            .order_by(models.Save.created_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return [media_url(i) for i in rows if i]


def serialize_board(db: Session, board: models.Board) -> dict:
    section_count = (
        db.execute(
            select(func.count())
            .select_from(models.BoardSection)
            .where(models.BoardSection.board_id == board.id)
        ).scalar()
        or 0
    )
    return {
        "id": board.id,
        "name": board.name,
        "slug": board.slug,
        "description": board.description,
        "owner": user_brief(board.owner),
        "pin_count": board_pin_count(db, board.id),
        "section_count": section_count,
        "cover_images": board_cover_images(db, board.id),
        "is_secret": board.is_secret,
        "created_at": board.created_at,
    }


def serialize_comment(db: Session, c: models.Comment, viewer: models.User | None = None) -> dict:
    reaction_count = (
        db.execute(
            select(func.count())
            .select_from(models.Reaction)
            .where(models.Reaction.target_type == "comment", models.Reaction.target_id == c.id)
        ).scalar()
        or 0
    )
    viewer_reacted = False
    if viewer is not None:
        viewer_reacted = (
            db.execute(
                select(models.Reaction.id).where(
                    models.Reaction.user_id == viewer.id,
                    models.Reaction.target_type == "comment",
                    models.Reaction.target_id == c.id,
                )
            ).first()
            is not None
        )
    return {
        "id": c.id,
        "text": c.text,
        "created_at": c.created_at,
        "user": user_brief(c.user),
        "parent_id": c.parent_id,
        "reaction_count": reaction_count,
        "viewer_reacted": viewer_reacted,
    }


def topic_cover(db: Session, topic_id: int) -> str | None:
    """A representative image for a topic = most recent pin in it."""
    row = db.execute(
        select(models.Pin.image)
        .join(models.PinTopic, models.PinTopic.pin_id == models.Pin.id)
        .where(models.PinTopic.topic_id == topic_id)
        .order_by(models.Pin.id.desc())
        .limit(1)
    ).scalar_one_or_none()
    return media_url(row) if row else None


def serialize_topic(db: Session, t: models.Topic) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "slug": t.slug,
        "image": media_url(t.image),
        "cover_image": media_url(t.image) or topic_cover(db, t.id),
        "category": t.category,
    }
