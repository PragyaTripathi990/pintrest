import re
import unicodedata

from .config import settings


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^\w\s-]", "", value).strip().lower()
    value = re.sub(r"[-\s]+", "-", value)
    return value or "untitled"


def media_url(value: str | None) -> str | None:
    """Turn a stored image reference into an absolute URL."""
    if not value:
        return None
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"{settings.base_url}/uploads/{value}"
