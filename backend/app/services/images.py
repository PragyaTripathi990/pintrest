import io
import uuid

from PIL import Image

from ..config import settings

MAX_DIMENSION = 1400  # cap stored image size
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}


def _dominant_color(img: Image.Image) -> str:
    """Average color as a hex string — mimics Pinterest's colored placeholders."""
    small = img.convert("RGB").resize((1, 1))
    r, g, b = small.getpixel((0, 0))
    return f"#{r:02x}{g:02x}{b:02x}"


def process_image_bytes(data: bytes) -> dict:
    """Validate, normalize, store an image. Returns metadata dict."""
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Invalid image file") from exc

    fmt = (img.format or "").upper()
    if fmt not in ALLOWED_FORMATS:
        raise ValueError(f"Unsupported image format: {fmt or 'unknown'}")

    # Normalize mode
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        rgb = img.convert("RGBA")
        background.paste(rgb, mask=rgb.split()[-1])
        img = background
    else:
        img = img.convert("RGB")

    # Downscale if huge
    if max(img.size) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(img.size)
        img = img.resize((round(img.width * ratio), round(img.height * ratio)))

    color = _dominant_color(img)
    filename = f"{uuid.uuid4().hex}.jpg"
    path = settings.upload_dir / filename
    img.save(path, format="JPEG", quality=85, optimize=True)

    return {
        "image": filename,
        "width": img.width,
        "height": img.height,
        "dominant_color": color,
    }
