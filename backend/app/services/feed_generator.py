"""On-demand pin generation for an "infinite", always-fresh feed.

Real Pinterest keeps every pin persistent (so it stays clickable, saveable and
commentable) while the feed shows an ever-changing selection. We mirror that:
each *first* page load generates a small batch of brand-new ``Pin`` rows backed
by external image URLs, so every refresh surfaces new images and infinite scroll
keeps pulling more — without ever downloading or processing images at request
time (the browser loads them straight from the source).

Image source
------------
* **Default** -> Lorem Picsum (``https://picsum.photos``): keyless, fast, good
  curated photos. Generic (not category-specific).
* **Optional** -> Pexels API (set ``PEXELS_API_KEY``): real *topical* images for
  search and topic pages, e.g. searching "dress" returns actual fashion photos.
"""

from __future__ import annotations

import hashlib
import random
import uuid

import httpx
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Pin, PinTopic, Save, Topic, User

# Picsum width matches Pinterest's real column width; varied heights make masonry.
PICSUM_WIDTH = 564
PICSUM_HEIGHTS = [520, 600, 680, 760, 840, 940]

# Light words so generated pins get topical-ish titles (helps search title match).
_DESCRIPTORS = ["ideas", "inspiration", "inspo", "aesthetic", "mood", "picks", "finds"]

# Keep DB growth bounded — prune oldest *generated* pins that nobody saved.
_PRUNE_KEEP = 1200
_PRUNE_SLACK = 400


def _synth_color(seed: str) -> str:
    """Deterministic soft-pastel hex from a string — the loading placeholder tint."""
    h = hashlib.md5(seed.encode()).hexdigest()
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    # blend each channel toward white (255) for a gentle pastel
    r, g, b = (r + 510) // 3, (g + 510) // 3, (b + 510) // 3
    return f"#{r:02x}{g:02x}{b:02x}"


def _picsum_url(seed: str, w: int, h: int) -> str:
    # /seed/ makes the URL deterministic, so a persisted pin always shows the
    # same image; a unique seed per pin makes every pin a different image.
    return f"https://picsum.photos/seed/{seed}/{w}/{h}"


def _pexels_photos(query: str, count: int) -> list[dict]:
    """Up to ``count`` topical photos for a query via Pexels; ``[]`` on any issue."""
    key = settings.pexels_api_key
    if not key or not query:
        return []
    try:
        resp = httpx.get(
            "https://api.pexels.com/v1/search",
            params={
                "query": query,
                "per_page": min(max(count, 1), 80),
                "page": random.randint(1, 15),  # vary results across refreshes
                "orientation": "portrait",
            },
            headers={"Authorization": key},
            timeout=10,
        )
        resp.raise_for_status()
        out: list[dict] = []
        for p in resp.json().get("photos", []):
            src = p.get("src", {})
            url = src.get("large") or src.get("medium") or src.get("original")
            if not url:
                continue
            out.append(
                {
                    "url": url,
                    "width": p.get("width") or PICSUM_WIDTH,
                    "height": p.get("height") or 800,
                    "color": p.get("avg_color"),  # Pexels returns a real avg color
                }
            )
        return out
    except Exception:  # noqa: BLE001 — image sourcing must never break the feed
        return []


def _title_for(topic: Topic | None, fallback: str | None) -> str:
    if topic:
        return f"{topic.name} {random.choice(_DESCRIPTORS)}"
    return fallback or ""


def _prune(db: Session) -> None:
    """Cap accumulation of generated pins, deleting only un-saved ones."""
    total = (
        db.execute(select(func.count()).select_from(Pin).where(Pin.image.like("http%"))).scalar()
        or 0
    )
    if total <= _PRUNE_KEEP + _PRUNE_SLACK:
        return
    excess = total - _PRUNE_KEEP
    saved = select(Save.pin_id)
    old_ids = (
        db.execute(
            select(Pin.id)
            .where(Pin.image.like("http%"), Pin.id.not_in(saved))
            .order_by(Pin.id.asc())
            .limit(excess)
        )
        .scalars()
        .all()
    )
    if old_ids:
        db.execute(delete(Pin).where(Pin.id.in_(old_ids)))
        db.commit()


def generate_pins(
    db: Session,
    count: int = 30,
    *,
    topics: list[Topic] | None = None,
    query: str | None = None,
    topical: bool = False,
    title: str | None = None,
) -> list[Pin]:
    """Create ``count`` brand-new persistent pins backed by external images.

    * ``topics=None``  -> tag pins across a random spread of topics (home variety).
    * ``topics=[...]`` -> cycle the given topics (search / topic pages).
    * ``topical=True`` + ``PEXELS_API_KEY`` + ``query`` -> use real Pexels images.
    * ``title``        -> force a title (so search title-matching finds them when
                          no topic matched the query).
    """
    user_ids = db.execute(select(User.id)).scalars().all()
    if not user_ids:
        return []

    if topics is None:
        topics = db.execute(select(Topic).order_by(func.random()).limit(6)).scalars().all()

    photos = _pexels_photos(query, count) if topical else []

    created: list[Pin] = []
    for i in range(count):
        topic = topics[i % len(topics)] if topics else None
        if i < len(photos):
            ph = photos[i]
            image, w, h = ph["url"], ph["width"], ph["height"]
            color = ph.get("color") or _synth_color(image)
        else:
            seed = f"dyn-{uuid.uuid4().hex[:12]}"
            w, h = PICSUM_WIDTH, random.choice(PICSUM_HEIGHTS)
            image = _picsum_url(seed, w, h)
            color = _synth_color(seed)
        label = _title_for(topic, title)
        pin = Pin(
            uploader_id=random.choice(user_ids),
            title=label,
            description="",
            alt_text=label,
            image=image,
            width=w,
            height=h,
            dominant_color=color,
        )
        db.add(pin)
        db.flush()  # assign pin.id so we can link the topic
        if topic:
            db.add(PinTopic(pin_id=pin.id, topic_id=topic.id))
        created.append(pin)

    db.commit()
    _prune(db)
    return created
