from fastapi import APIRouter, Depends
from sqlalchemy import distinct, func, or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user_optional
from ..models import Pin, PinTopic, Topic, User
from ..schemas import PinPage, TopicOut
from ..serializers import serialize_pins, serialize_topic
from ..services.feed_generator import generate_pins

router = APIRouter(prefix="/api", tags=["search"])

# Map common search terms -> topic-name fragments so a demo search like
# "dress" surfaces Fashion pins even though no pin literally says "dress".
SEARCH_ALIASES: dict[str, list[str]] = {
    "dress": ["fashion"],
    "dresses": ["fashion"],
    "outfit": ["fashion"],
    "outfits": ["fashion"],
    "clothes": ["fashion"],
    "style": ["fashion"],
    "ootd": ["fashion"],
    "wallpaper": ["art", "photography"],
    "wallpapers": ["art", "photography"],
    "aesthetic": ["art", "photography"],
    "recipe": ["food"],
    "recipes": ["food"],
    "dinner": ["food"],
    "cooking": ["food"],
    "vacation": ["travel"],
    "trip": ["travel"],
    "holiday": ["travel"],
    "makeup": ["beauty"],
    "skincare": ["beauty"],
    "hair": ["beauty"],
    "room": ["home decor"],
    "bedroom": ["home decor"],
    "decor": ["home decor"],
    "interior": ["home decor", "architecture"],
    "house": ["home decor", "architecture"],
    "cat": ["animals"],
    "cats": ["animals"],
    "dog": ["animals"],
    "puppy": ["animals"],
    "pet": ["animals"],
    "painting": ["art"],
    "drawing": ["art"],
    "quote": ["quotes"],
    "motivation": ["quotes"],
    "mountain": ["nature", "travel"],
    "forest": ["nature"],
    "flower": ["nature"],
    "craft": ["diy and crafts"],
    "diy": ["diy and crafts"],
}

# Curated chips/suggestions shown for the demo.
DEMO_TERMS = [
    "Home decor", "Travel", "Fashion", "Food and drink", "Beauty", "Art",
    "Nature", "Animals", "Quotes", "Architecture", "Photography", "DIY and crafts",
    "Dress", "Recipes", "Wallpaper", "Makeup", "Bedroom", "Mountain",
]


@router.get("/search/pins", response_model=PinPage)
def search_pins(
    q: str = "",
    cursor: int | None = None,
    limit: int = 25,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    limit = min(max(limit, 1), 50)
    stmt = select(Pin).order_by(Pin.id.desc()).limit(limit + 1)
    term = q.strip()
    if term:
        like = f"%{term}%"
        # Match the query against topic names (plus any aliases)
        fragments = [term] + SEARCH_ALIASES.get(term.lower(), [])
        topic_conds = [Topic.name.ilike(f"%{f}%") for f in fragments]
        matched = db.execute(select(Topic).where(or_(*topic_conds))).scalars().all()
        topic_ids = [t.id for t in matched]

        # On the first page, mint fresh results for this query so every search
        # shows new images (topical via Pexels if a key is set). If a topic
        # matched, tag the new pins to it; otherwise force the title so the
        # title-match below still finds them.
        if not cursor:
            generate_pins(
                db,
                30,
                topics=matched or None,
                query=term,
                topical=True,
                title=None if matched else term,
            )

        conditions = [
            Pin.title.ilike(like),
            Pin.description.ilike(like),
            Pin.alt_text.ilike(like),
        ]
        if topic_ids:
            conditions.append(
                Pin.id.in_(select(PinTopic.pin_id).where(PinTopic.topic_id.in_(topic_ids)))
            )
        stmt = stmt.where(or_(*conditions))
    if cursor:
        stmt = stmt.where(Pin.id < cursor)
    pins = list(db.execute(stmt).scalars())
    next_cursor = None
    if len(pins) > limit:
        pins = pins[:limit]
        next_cursor = pins[-1].id
    return {"items": serialize_pins(db, pins, viewer), "next_cursor": next_cursor}


@router.get("/search/suggestions")
def suggestions(q: str = "") -> list[str]:
    term = q.strip().lower()
    if not term:
        return DEMO_TERMS[:12]
    matches = [t for t in DEMO_TERMS if term in t.lower()]
    for alias, topics in SEARCH_ALIASES.items():
        if term in alias:
            matches.extend(t.title() for t in topics)
    seen: set[str] = set()
    out: list[str] = []
    for m in matches:
        if m.lower() not in seen:
            seen.add(m.lower())
            out.append(m)
    return out[:12]


@router.get("/topics", response_model=list[TopicOut])
def list_topics(db: Session = Depends(get_db)):
    topics = db.execute(select(Topic).order_by(Topic.name.asc())).scalars()
    return [serialize_topic(db, t) for t in topics]


@router.get("/topics/{slug}/pins", response_model=PinPage)
def topic_pins(
    slug: str,
    cursor: int | None = None,
    limit: int = 25,
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_current_user_optional),
):
    limit = min(max(limit, 1), 50)
    topic = db.execute(select(Topic).where(Topic.slug == slug)).scalar_one_or_none()
    if not topic:
        return {"items": [], "next_cursor": None}
    # First page: mint a fresh batch tagged to this topic (topical via Pexels).
    if not cursor:
        generate_pins(db, 30, topics=[topic], query=topic.name, topical=True)
    stmt = (
        select(Pin)
        .join(PinTopic, PinTopic.pin_id == Pin.id)
        .where(PinTopic.topic_id == topic.id)
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


@router.get("/explore", response_model=list[TopicOut])
def explore(db: Session = Depends(get_db)):
    topics = db.execute(select(Topic).order_by(func.random()).limit(20)).scalars()
    return [serialize_topic(db, t) for t in topics]
