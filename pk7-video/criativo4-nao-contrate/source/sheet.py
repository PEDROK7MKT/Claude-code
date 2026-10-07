#!/usr/bin/env python3
"""usage: python3 sheet.py <dir_with_t_*.jpg> <out.jpg> [cols=8] [thumb_w=270]  — contact sheet with time labels"""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 8; tw = int(sys.argv[4]) if len(sys.argv) > 4 else 270
fs = sorted(glob.glob(os.path.join(d, 't_*.jpg')), key=lambda f: float(os.path.basename(f)[2:-4]))
th = tw * 16 // 9; rows = (len(fs) + cols - 1) // cols
im = Image.new('RGB', (cols * tw, rows * (th + 22)), 'white'); dr = ImageDraw.Draw(im)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
except Exception: font = None
for i, f in enumerate(fs):
    x, y = (i % cols) * tw, (i // cols) * (th + 22)
    im.paste(Image.open(f).resize((tw, th)), (x, y + 22)); dr.text((x + 4, y + 2), os.path.basename(f)[2:-4] + 's', fill='black', font=font)
im.save(out, quality=85); print(out, len(fs), 'frames')
