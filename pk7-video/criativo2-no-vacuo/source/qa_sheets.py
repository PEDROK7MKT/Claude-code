import os, sys
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
D = os.environ.get('OUT', 'frames'); Q = os.environ.get('QA', 'qa'); NF = 1305
def sheet(out, frames, cols, W, H):
    rows = (len(frames) + cols - 1) // cols
    s = Image.new('RGB', (cols * (W + 8) + 8, rows * (H + 30) + 8), (25, 25, 25)); d = ImageDraw.Draw(s)
    for i, f in enumerate(frames):
        im = Image.open(f'{D}/f{f:05d}.jpg').convert('RGB').resize((W, H), Image.LANCZOS)
        x, y = 8 + (i % cols) * (W + 8), 8 + (i // cols) * (H + 30)
        s.paste(im, (x, y + 24)); d.text((x, y), f'{f/30:.2f}s (f{f})', fill=(255, 230, 0), font=F)
    s.save(out, quality=86)
os.makedirs(Q, exist_ok=True)
TR = [0.0, 0.8, 1.95, 2.66, 3.06, 4.45, 4.80, 5.85, 6.30, 7.70, 8.35, 9.20, 10.80, 11.05, 12.85, 13.25, 14.30, 15.20, 16.50, 17.40, 18.10, 19.10, 20.30, 21.40, 23.09, 24.75, 25.10, 25.85, 26.30, 27.60, 28.05, 29.51, 30.59, 31.0, 32.55, 33.05, 34.25, 35.30, 36.60, 38.62, 39.55, 40.0, 41.15, 43.2]
for T in TR:
    c = round(T * 30); sheet(f'{Q}/tr_{T:05.2f}.jpg', [f for f in range(c - 12, c + 15) if 0 <= f < NF], 9, 216, 384)
fr = list(range(0, NF, 15))
for k in range(0, len(fr), 16):
    sheet(f'{Q}/scene_{k//16:02d}.jpg', fr[k:k + 16], 8, 270, 480)
print(len(os.listdir(Q)))
