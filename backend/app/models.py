from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))

    full_name: Mapped[str] = mapped_column(String(120), default="")
    avatar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str] = mapped_column(String(500), default="")
    website: Mapped[str] = mapped_column(String(255), default="")
    birthdate: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_business: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    pins: Mapped[list[Pin]] = relationship(back_populates="uploader", cascade="all, delete-orphan")
    boards: Mapped[list[Board]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    saves: Mapped[list[Save]] = relationship(back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[list[Comment]] = relationship(back_populates="user", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Topics / Interests
# ---------------------------------------------------------------------------
class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(120), default="")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class PinTopic(Base):
    __tablename__ = "pin_topics"
    __table_args__ = (UniqueConstraint("pin_id", "topic_id", name="uq_pin_topic"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    pin_id: Mapped[int] = mapped_column(ForeignKey("pins.id", ondelete="CASCADE"), index=True)
    topic_id: Mapped[int] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), index=True)


# ---------------------------------------------------------------------------
# Pins
# ---------------------------------------------------------------------------
class Pin(Base):
    __tablename__ = "pins"

    id: Mapped[int] = mapped_column(primary_key=True)
    uploader_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(200), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    alt_text: Mapped[str] = mapped_column(String(500), default="")
    link: Mapped[str] = mapped_column(String(500), default="")
    source_name: Mapped[str] = mapped_column(String(120), default="")

    image: Mapped[str] = mapped_column(String(255))  # stored filename or external URL
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)
    dominant_color: Mapped[str] = mapped_column(String(9), default="#efefef")

    # The board the pin was originally created on (optional)
    board_id: Mapped[int | None] = mapped_column(
        ForeignKey("boards.id", ondelete="SET NULL"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    uploader: Mapped[User] = relationship(back_populates="pins")
    board: Mapped[Board | None] = relationship(foreign_keys=[board_id])
    saves: Mapped[list[Save]] = relationship(back_populates="pin", cascade="all, delete-orphan")
    comments: Mapped[list[Comment]] = relationship(back_populates="pin", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Boards
# ---------------------------------------------------------------------------
class Board(Base):
    __tablename__ = "boards"
    __table_args__ = (UniqueConstraint("owner_id", "slug", name="uq_board_owner_slug"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), index=True)
    description: Mapped[str] = mapped_column(String(500), default="")
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    owner: Mapped[User] = relationship(back_populates="boards")
    sections: Mapped[list[BoardSection]] = relationship(
        back_populates="board", cascade="all, delete-orphan"
    )
    saves: Mapped[list[Save]] = relationship(back_populates="board", cascade="all, delete-orphan")
    collaborators: Mapped[list[BoardCollaborator]] = relationship(
        back_populates="board", cascade="all, delete-orphan"
    )


class BoardSection(Base):
    __tablename__ = "board_sections"
    __table_args__ = (UniqueConstraint("board_id", "slug", name="uq_section_board_slug"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    board: Mapped[Board] = relationship(back_populates="sections")


class BoardCollaborator(Base):
    __tablename__ = "board_collaborators"
    __table_args__ = (
        UniqueConstraint("board_id", "user_id", name="uq_board_collaborator"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    board: Mapped[Board] = relationship(back_populates="collaborators")
    user: Mapped[User] = relationship()


# ---------------------------------------------------------------------------
# Saves (a pin saved/repinned onto a board)
# ---------------------------------------------------------------------------
class Save(Base):
    __tablename__ = "saves"
    __table_args__ = (UniqueConstraint("pin_id", "board_id", name="uq_save_pin_board"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    pin_id: Mapped[int] = mapped_column(ForeignKey("pins.id", ondelete="CASCADE"), index=True)
    board_id: Mapped[int] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), index=True)
    section_id: Mapped[int | None] = mapped_column(
        ForeignKey("board_sections.id", ondelete="SET NULL"), nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    note: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    pin: Mapped[Pin] = relationship(back_populates="saves")
    board: Mapped[Board] = relationship(back_populates="saves")
    user: Mapped[User] = relationship(back_populates="saves")


# ---------------------------------------------------------------------------
# Comments
# ---------------------------------------------------------------------------
class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    pin_id: Mapped[int] = mapped_column(ForeignKey("pins.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"), nullable=True, index=True
    )
    text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    pin: Mapped[Pin] = relationship(back_populates="comments")
    user: Mapped[User] = relationship(back_populates="comments")


# ---------------------------------------------------------------------------
# Reactions (polymorphic: pin or comment)
# ---------------------------------------------------------------------------
REACTION_TYPES = ("like", "heart", "applause", "wow", "idea")


class Reaction(Base):
    __tablename__ = "reactions"
    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_reaction_unique"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    target_type: Mapped[str] = mapped_column(String(20), index=True)  # "pin" | "comment"
    target_id: Mapped[int] = mapped_column(Integer, index=True)
    type: Mapped[str] = mapped_column(String(20), default="like")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


# ---------------------------------------------------------------------------
# Follows (user -> user)
# ---------------------------------------------------------------------------
class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follow_unique"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    following_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
