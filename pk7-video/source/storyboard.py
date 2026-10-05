# storyboard_preview.jpg: one representative frame per scene, labelled
import sys
from PIL import Image, ImageDraw, ImageFont
B = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 19)
R = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 21)
SHOTS = [(2.8, '1 · Gancho', '0–4,5s'), (10.4, '2 · A dor', '4,5–11s'), (14.2, '3 · Dê um Google', '11–15,5s'),
         (17.4, '4 · Google responde', '15,5–22,5s'), (31.2, '4 · Google já diz', '22,5–32,5s'),
         (37.6, '4 · Foco em vendas', '32,5–38,5s'), (41.2, '5 · PK7 + Pedro R Gomes', '38,5–42,3s'), (45.6, '5 · Time de elite', '42,3–46,5s'),
         (56.9, '6 · Método PK7', '46,5–60s'), (65.6, '7 · Números reais', '60–66,3s'), (69.4, '7 · +40 · 3 continentes', '66,3–70s'),
         (73.6, '8 · Direto com o Pedro', '70–74,5s'), (78.6, '9 · Mensagem central', '74,5–79,5s'), (86.5, '10 · CTA', '79,5–87,5s')]
W, H, cols = 300, 533, 7
rows = (len(SHOTS) + cols - 1) // cols
S = Image.new('RGB', (cols * (W + 14) + 14, rows * (H + 80) + 14), (10, 15, 44)); d = ImageDraw.Draw(S)
for i, (t, title, rng) in enumerate(SHOTS):
    x, y = 14 + (i % cols) * (W + 14), 14 + (i // cols) * (H + 80)
    S.paste(Image.open(f'frames/f{round(t*30):05d}.jpg').convert('RGB').resize((W, H), Image.LANCZOS), (x, y))
    d.text((x, y + H + 8), title, fill=(183, 228, 0), font=B); d.text((x, y + H + 42), rng, fill=(220, 225, 255), font=R)
S.save(sys.argv[1] if len(sys.argv) > 1 else 'storyboard_preview.jpg', quality=88)
