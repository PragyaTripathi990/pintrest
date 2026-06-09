"""Seed the database with users, topics, pins (downloaded images), boards, saves,
comments, reactions and follows so the app looks full out of the box.

Run from the backend dir:  ./.venv/bin/python -m seed.seed
"""
import io
import random

import httpx
from PIL import Image
from sqlalchemy import delete, select

from app import models
from app.database import Base, SessionLocal, engine
from app.security import hash_password
from app.services.images import process_image_bytes
from app.utils import slugify

from .data import BOARD_NAMES, COMMENTS, CONTENT, TOPICS, USERS

random.seed(42)

PIN_COUNT = 60
WIDTH = 564
HEIGHTS = [520, 600, 680, 760, 840, 940]


def fetch_image(client: httpx.Client, seed: str, w: int, h: int) -> bytes:
    url = f"https://picsum.photos/seed/{seed}/{w}/{h}"
    resp = client.get(url, timeout=30, follow_redirects=True)
    resp.raise_for_status()
    return resp.content


def fallback_image(w: int, h: int, i: int) -> bytes:
    """Vertical two-tone gradient, used if a download fails."""
    random.seed(i)
    c1 = tuple(random.randint(60, 200) for _ in range(3))
    c2 = tuple(random.randint(60, 200) for _ in range(3))
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        row = tuple(round(c1[k] + (c2[k] - c1[k]) * t) for k in range(3))
        for x in range(w):
            px[x, y] = row
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def wipe(db) -> None:
    for model in (
        models.Reaction,
        models.Comment,
        models.Save,
        models.Follow,
        models.BoardCollaborator,
        models.BoardSection,
        models.PinTopic,
        models.Pin,
        models.Board,
        models.Topic,
        models.User,
    ):
        db.execute(delete(model))
    db.commit()


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("Wiping existing data...")
    wipe(db)

    client = httpx.Client()

    # ---- Users ----
    print("Creating users...")
    users = []
    for u in USERS:
        avatar = None
        try:
            data = fetch_image(client, f"avatar-{u['username']}", 240, 240)
            avatar = process_image_bytes(data)["image"]
        except Exception:  # noqa: BLE001
            pass
        user = models.User(
            email=u["email"],
            username=u["username"],
            full_name=u["full_name"],
            bio=u["bio"],
            hashed_password=hash_password("password123"),
            avatar=avatar,
        )
        db.add(user)
        users.append(user)
    db.commit()
    for user in users:
        db.refresh(user)

    # ---- Topics ----
    print("Creating topics...")
    topics: dict[str, models.Topic] = {}
    for name, cat in TOPICS:
        t = models.Topic(name=name, slug=slugify(name), category=cat)
        db.add(t)
        topics[name] = t
    db.commit()
    for t in topics.values():
        db.refresh(t)

    # ---- Boards ----
    print("Creating boards...")
    boards_by_user: dict[int, list[models.Board]] = {}
    for user in users:
        names = BOARD_NAMES.get(user.username, ["My Ideas"])
        blist = []
        for n in names:
            b = models.Board(owner_id=user.id, name=n, slug=slugify(n))
            db.add(b)
            blist.append(b)
        boards_by_user[user.id] = blist
    db.commit()
    for blist in boards_by_user.values():
        for b in blist:
            db.refresh(b)

    # ---- Pins ----
    print(f"Creating {PIN_COUNT} pins (downloading images)...")
    categories = list(CONTENT.keys())
    pins: list[models.Pin] = []
    for i in range(PIN_COUNT):
        cat = categories[i % len(categories)]
        pool = CONTENT[cat]
        title = pool["titles"][i % len(pool["titles"])]
        desc = pool["desc"]
        h = HEIGHTS[i % len(HEIGHTS)]
        try:
            data = fetch_image(client, f"pin-{i}", WIDTH, h)
        except Exception:  # noqa: BLE001
            data = fallback_image(WIDTH, h, i)
        meta = process_image_bytes(data)

        uploader = users[i % len(users)]
        board = boards_by_user[uploader.id][i % len(boards_by_user[uploader.id])]
        pin = models.Pin(
            uploader_id=uploader.id,
            title=title,
            description=desc,
            alt_text=title,
            source_name=random.choice(["", "", "etsy.com", "amazon.com", ""]),
            board_id=board.id,
            **meta,
        )
        db.add(pin)
        db.commit()
        db.refresh(pin)
        pins.append(pin)

        db.add(models.PinTopic(pin_id=pin.id, topic_id=topics[cat].id))
        db.add(models.Save(pin_id=pin.id, board_id=board.id, user_id=uploader.id))
        db.commit()
        if (i + 1) % 10 == 0:
            print(f"  ...{i + 1}/{PIN_COUNT} pins")

    client.close()

    # ---- Cross saves ----
    print("Adding cross-saves...")
    existing_pairs = {
        (s.pin_id, s.board_id) for s in db.execute(select(models.Save)).scalars()
    }
    for user in users:
        ub = boards_by_user[user.id]
        for _ in range(10):
            pin = random.choice(pins)
            board = random.choice(ub)
            if (pin.id, board.id) in existing_pairs:
                continue
            existing_pairs.add((pin.id, board.id))
            db.add(
                models.Save(pin_id=pin.id, board_id=board.id, user_id=user.id)
            )
    db.commit()

    # ---- Comments + reactions ----
    print("Adding comments and reactions...")
    for pin in pins:
        for _ in range(random.randint(0, 3)):
            commenter = random.choice(users)
            db.add(
                models.Comment(
                    pin_id=pin.id, user_id=commenter.id, text=random.choice(COMMENTS)
                )
            )
        reactors = random.sample(users, random.randint(0, len(users)))
        for r in reactors:
            db.add(
                models.Reaction(
                    user_id=r.id, target_type="pin", target_id=pin.id, type="like"
                )
            )
    db.commit()

    # ---- Follows ----
    print("Adding follows...")
    for a in users:
        for b in users:
            if a.id != b.id and random.random() < 0.5:
                db.add(models.Follow(follower_id=a.id, following_id=b.id))
    db.commit()

    # ---- Summary ----
    def count(model) -> int:
        from sqlalchemy import func

        return db.execute(select(func.count()).select_from(model)).scalar() or 0

    print("\nSeed complete:")
    print(f"  users:    {count(models.User)}")
    print(f"  topics:   {count(models.Topic)}")
    print(f"  pins:     {count(models.Pin)}")
    print(f"  boards:   {count(models.Board)}")
    print(f"  saves:    {count(models.Save)}")
    print(f"  comments: {count(models.Comment)}")
    print(f"  follows:  {count(models.Follow)}")
    print("\nDemo login: alex@demo.com / password123")
    db.close()


if __name__ == "__main__":
    run()
