from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# --------------------------- Auth ---------------------------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)
    full_name: str = Field(default="", max_length=120)
    username: str | None = Field(default=None, max_length=60)
    birthdate: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --------------------------- Users ---------------------------
class UserBrief(BaseModel):
    id: int
    username: str
    full_name: str
    avatar: str | None = None


class UserOut(UserBrief):
    email: EmailStr
    bio: str
    website: str
    is_business: bool
    created_at: datetime


class UserProfile(UserBrief):
    bio: str
    website: str
    created_at: datetime
    followers_count: int
    following_count: int
    pin_count: int
    board_count: int
    is_following: bool


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    bio: str | None = Field(default=None, max_length=500)
    website: str | None = Field(default=None, max_length=255)
    username: str | None = Field(default=None, max_length=60)


# --------------------------- Pins ---------------------------
class PinCreate(BaseModel):
    title: str = Field(default="", max_length=200)
    description: str = Field(default="", max_length=2000)
    link: str = Field(default="", max_length=500)
    alt_text: str = Field(default="", max_length=500)
    board_id: int | None = None
    image_url: str | None = None  # external/seed image (no file upload)


class PinUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    link: str | None = None
    board_id: int | None = None


class PinOut(BaseModel):
    id: int
    title: str
    description: str
    alt_text: str
    link: str
    source_name: str
    image: str | None
    width: int
    height: int
    dominant_color: str
    created_at: datetime
    uploader: UserBrief
    save_count: int
    reaction_count: int
    comment_count: int
    viewer_has_saved: bool
    viewer_reaction: str | None = None


# --------------------------- Boards ---------------------------
class BoardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    is_secret: bool = False


class BoardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_secret: bool | None = None


class BoardBrief(BaseModel):
    id: int
    name: str
    slug: str
    owner: UserBrief
    pin_count: int
    section_count: int
    cover_images: list[str]
    is_secret: bool
    created_at: datetime


class BoardOut(BoardBrief):
    description: str


# --------------------------- Sections ---------------------------
class SectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class SectionOut(BaseModel):
    id: int
    name: str
    slug: str
    pin_count: int


# --------------------------- Saves ---------------------------
class SaveRequest(BaseModel):
    board_id: int
    section_id: int | None = None
    note: str = Field(default="", max_length=500)


# --------------------------- Comments ---------------------------
class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    parent_id: int | None = None


class CommentOut(BaseModel):
    id: int
    text: str
    created_at: datetime
    user: UserBrief
    parent_id: int | None = None
    reaction_count: int
    viewer_reacted: bool


# --------------------------- Reactions ---------------------------
class ReactionRequest(BaseModel):
    type: str = "like"


# --------------------------- Topics ---------------------------
class TopicOut(BaseModel):
    id: int
    name: str
    slug: str
    image: str | None = None
    cover_image: str | None = None
    category: str


# --------------------------- Paginated ---------------------------
class PinPage(BaseModel):
    items: list[PinOut]
    next_cursor: int | None = None
