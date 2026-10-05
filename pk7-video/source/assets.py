"""Crops of the real Google prints + highlight rectangles measured from the text pixels."""
import json
from PIL import Image
U = '/root/.claude/uploads/035299b2-141f-5d15-8a9c-6a7a88242d8a/'
HL = {}
def crop(name, src, box, marks):
    im = Image.open(U + src).convert('RGB').crop(box); im.save(f'a/{name}.jpg', quality=94)
    x0, y0 = box[0], box[1]; P = 6
    HL[name] = {'w': im.size[0], 'h': im.size[1]}
    for key, rows in marks.items():   # rows in SOURCE coords: (xa, xb, ya, yb)
        HL[name][key] = [[xa - x0 - P, ya - y0 - P, xb - xa + 2 * P, yb - ya + 2 * P] for xa, xb, ya, yb in rows]
    print(name, im.size)
# search answer for "pedro R GOMES PK7"
crop('doc1', '0756d3d3-image.jpg', (95, 25, 770, 1365), {
    'name': [(124, 730, 376, 400), (123, 623, 416, 441)],
    'modelo': [(160, 718, 981, 1008), (160, 630, 1022, 1050), (161, 438, 1063, 1090)]})
# vantagem / foco / contacto direto
crop('doc4', '679169fa-image.jpg', (205, 20, 921, 1400), {
    'vant': [(239, 829, 46, 76), (239, 879, 90, 119), (239, 784, 134, 163), (239, 841, 177, 208), (239, 383, 221, 251)],
    'focoH': [(240, 874, 470, 502), (240, 586, 517, 550)],
    'foco': [(397, 747, 718, 747), (239, 783, 762, 791), (239, 799, 805, 835), (240, 784, 849, 879), (239, 380, 894, 917)],
    'direto': [(509, 741, 1182, 1211), (239, 600, 1226, 1255)]})
# time de elite
crop('elite', '351038c4-image.jpg', (205, 0, 907, 400), {
    'mark': [(275, 775, 135, 165), (274, 769, 179, 209)]})
# IA no WhatsApp (step 4)
crop('ia', '331f3cdf-image.jpg', (22, 526, 1146, 822), {
    'mark': [(455, 1063, 685, 732), (52, 970, 757, 804)]})
# result strip for the CTA (first lines of the real answer)
crop('res', '0756d3d3-image.jpg', (95, 360, 770, 452), {
    'mark': [(124, 730, 376, 400), (123, 623, 416, 441)]})
json.dump(HL, open('hl.json', 'w'))
print(json.dumps(HL))
