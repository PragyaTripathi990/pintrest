from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import LoginRequest, SignupRequest, Token, UserOut
from ..security import create_access_token, hash_password, verify_password
from ..utils import media_url, slugify

router = APIRouter(prefix="/api/auth", tags=["auth"])


def unique_username(db: Session, base: str) -> str:
    base = slugify(base).replace("-", "") or "user"
    username = base
    i = 1
    while db.execute(select(User).where(User.username == username)).first():
        i += 1
        username = f"{base}{i}"
    return username


@router.post("/signup", response_model=Token, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    if payload.username:
        username = slugify(payload.username).replace("-", "")
        if db.execute(select(User).where(User.username == username)).first():
            raise HTTPException(409, "Username already taken")
    else:
        base = payload.full_name or payload.email.split("@")[0]
        username = unique_username(db, base)

    user = User(
        email=payload.email,
        username=username,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name or username,
        birthdate=payload.birthdate,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.id))


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Incorrect email or password")
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "username": user.username,
        "full_name": user.full_name,
        "avatar": media_url(user.avatar),
        "email": user.email,
        "bio": user.bio,
        "website": user.website,
        "is_business": user.is_business,
        "created_at": user.created_at,
    }
