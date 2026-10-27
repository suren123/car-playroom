from __future__ import annotations

import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "illustrations" / "individual" / "png"
OUTPUT = ROOT / "public" / "assets" / "illustrations" / "v1"
MANIFEST = ROOT / "public" / "assets" / "illustrations" / "v1" / "manifest.json"


def main() -> None:
    files = sorted(SOURCE.glob("*.png"))
    if len(files) != 60:
        raise SystemExit(f"Expected 60 source PNGs, found {len(files)} in {SOURCE}")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    entries = []
    for source in files:
        with Image.open(source) as image:
            rgba = image.convert("RGBA")
            alpha = rgba.getchannel("A")
            bounds = alpha.point(lambda value: 255 if value > 2 else 0).getbbox()
            if bounds is None:
                raise SystemExit(f"Image has no visible pixels: {source.name}")
            left, top, right, bottom = bounds
            padding = 5
            crop = (
                max(0, left - padding),
                max(0, top - padding),
                min(rgba.width, right + padding),
                min(rgba.height, bottom + padding),
            )
            trimmed = rgba.crop(crop)
            output = OUTPUT / source.name
            trimmed.save(output, format="PNG", optimize=True)
            entries.append({
                "file": source.name,
                "source": f"assets/illustrations/individual/png/{source.name}",
                "sourceSize": [rgba.width, rgba.height],
                "trimRect": list(crop),
                "size": [trimmed.width, trimmed.height],
                "bytes": output.stat().st_size,
            })

    MANIFEST.write_text(json.dumps({"version": 1, "assets": entries}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total_bytes = sum(item["bytes"] for item in entries)
    print(f"Exported {len(entries)} trimmed PNGs ({total_bytes / 1024 / 1024:.2f} MiB) to {OUTPUT}")


if __name__ == "__main__":
    main()
