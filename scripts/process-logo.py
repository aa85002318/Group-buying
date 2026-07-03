#!/usr/bin/env python3
"""Remove black background and transparent letter counters (D, O, P holes)."""

from collections import deque
from pathlib import Path

from PIL import Image

SOURCE = Path(
    "/Users/rachel/.cursor/projects/Users-rachel-Projects-store-group-buy/assets/"
    "0ae277bd-ef53-4a95-b215-e39589d1b1c6-067f3ed6-630b-41f1-bbd6-93e22ca86287.png"
)
OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "images"
EDGE_THRESHOLD = 30
COUNTER_THRESHOLD = 40


def is_dark(r: int, g: int, b: int, threshold: int) -> bool:
    return r <= threshold and g <= threshold and b <= threshold


def remove_edge_black(img: Image.Image) -> Image.Image:
    """Flood-fill dark pixels connected to image border; set them transparent."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    visited = [[False] * w for _ in range(h)]
    queue: deque[tuple[int, int]] = deque()

    for x in range(w):
        for y in (0, h - 1):
            if is_dark(*pixels[x, y][:3], EDGE_THRESHOLD):
                queue.append((x, y))
                visited[y][x] = True
    for y in range(h):
        for x in (0, w - 1):
            if not visited[y][x] and is_dark(*pixels[x, y][:3], EDGE_THRESHOLD):
                queue.append((x, y))
                visited[y][x] = True

    while queue:
        x, y = queue.popleft()
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if is_dark(*pixels[nx, ny][:3], EDGE_THRESHOLD):
                    visited[ny][nx] = True
                    queue.append((nx, ny))

    return rgba


def remove_enclosed_dark(img: Image.Image) -> Image.Image:
    """Make enclosed near-black regions transparent (letter counters)."""
    pixels = img.load()
    w, h = img.size
    visited = [[False] * w for _ in range(h)]

    for start_x in range(w):
        for start_y in range(h):
            if visited[start_y][start_x]:
                continue
            r, g, b, a = pixels[start_x, start_y]
            if a == 0 or not is_dark(r, g, b, COUNTER_THRESHOLD):
                continue

            component: list[tuple[int, int]] = []
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            visited[start_y][start_x] = True
            touches_border = start_x == 0 or start_x == w - 1 or start_y == 0 or start_y == h - 1

            while queue:
                x, y = queue.popleft()
                component.append((x, y))
                if x == 0 or x == w - 1 or y == 0 or y == h - 1:
                    touches_border = True
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                        cr, cg, cb, ca = pixels[nx, ny]
                        if ca > 0 and is_dark(cr, cg, cb, COUNTER_THRESHOLD):
                            visited[ny][nx] = True
                            queue.append((nx, ny))

            if not touches_border:
                for x, y in component:
                    r, g, b, _ = pixels[x, y]
                    pixels[x, y] = (r, g, b, 0)

    return img


def process_logo(img: Image.Image) -> Image.Image:
    result = remove_edge_black(img)
    return remove_enclosed_dark(result)


def verify_rgba(path: Path) -> None:
    with Image.open(path) as img:
        assert img.mode == "RGBA", f"{path}: expected RGBA, got {img.mode}"
        alpha = img.getchannel("A")
        transparent = sum(1 for p in alpha.getdata() if p < 255)
        opaque = sum(1 for p in alpha.getdata() if p == 255)
        print(f"{path.name}: {img.size[0]}x{img.size[1]} RGBA, transparent={transparent}, opaque={opaque}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as src:
        result = process_logo(src)

    for name in ("logo.png", "logo-transparent.png"):
        out = OUT_DIR / name
        result.save(out, "PNG")
        verify_rgba(out)


if __name__ == "__main__":
    main()
