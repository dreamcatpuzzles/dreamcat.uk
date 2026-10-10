#!/usr/bin/env python3
"""Crop every PNG in a directory to the same rectangle: the union of all
non-transparent pixels across the set. The cropped images keep identical
dimensions, so they can still be layered on top of each other while the
composite is as small as possible.

Usage: python3 crop.py [directory]
       (defaults to the directory containing this script)

Requires Pillow. Re-running is safe: once cropped, each image's alpha
bounding box fills the frame, so the union is a no-op crop.
"""

import sys
from pathlib import Path

from PIL import Image


def union_bbox(directory: Path) -> tuple[int, int, int, int] | None:
    union = None
    for path in sorted(directory.glob("*.png")):
        with Image.open(path) as image:
            bbox = image.convert("RGBA").getchannel("A").getbbox()
        if bbox is None:
            print(f"  {path.name}: fully transparent, ignored for bounds")
            continue
        if union is None:
            union = bbox
        else:
            union = (
                min(union[0], bbox[0]),
                min(union[1], bbox[1]),
                max(union[2], bbox[2]),
                max(union[3], bbox[3]),
            )
    return union


def main() -> None:
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent
    if not directory.is_dir():
        sys.exit(f"not a directory: {directory}")

    paths = sorted(directory.glob("*.png"))
    if not paths:
        sys.exit(f"no PNG files found in {directory}")

    union = union_bbox(directory)
    if union is None:
        sys.exit("all PNGs are fully transparent; nothing to crop")

    print(f"crop box {union} ({union[2] - union[0]}x{union[3] - union[1]})")
    for path in paths:
        with Image.open(path) as image:
            cropped = image.crop(union)
            if cropped.size == image.size:
                print(f"  {path.name}: already {cropped.size}, skipped")
                continue
            cropped.save(path)
            print(f"  {path.name}: {image.size} -> {cropped.size}")


if __name__ == "__main__":
    main()
