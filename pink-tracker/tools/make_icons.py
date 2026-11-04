#!/usr/bin/env python3
"""Generates the app icons into ../icons. Needs Pillow:  python3 tools/make_icons.py"""
import math
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
TOP, BOTTOM = (255, 122, 168), (255, 77, 141)  # #FF7AA8 -> #FF4D8D


def gradient(size):
    img = Image.new("RGB", (size, size))
    px = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        px.line([(0, y), (size, y)], fill=tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3)))
    return img


def heart_points(size, scale):
    pts = []
    for i in range(361):
        t = math.radians(i)
        pts.append((16 * math.sin(t) ** 3,
                    -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    k = size * scale / max(w, h)
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    return [(size / 2 + (x - cx) * k, size / 2 + (y - cy) * k) for x, y in pts]


def make(path, size, rounded, heart_scale):
    big = size * 4  # supersample for smooth edges
    img = gradient(big).convert("RGBA")
    draw = ImageDraw.Draw(img)
    draw.polygon(heart_points(big, heart_scale), fill=(255, 255, 255, 255))
    if rounded:
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.225), fill=255)
        img.putalpha(mask)
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, path))
    print("wrote", path)


os.makedirs(OUT, exist_ok=True)
make("icon-192.png", 192, True, 0.52)
make("icon-512.png", 512, True, 0.52)
make("icon-maskable-512.png", 512, False, 0.42)       # full bleed, heart inside the safe zone
make("apple-touch-icon.png", 180, False, 0.52)        # iOS rounds the corners itself
