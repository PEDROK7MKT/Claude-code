#!/usr/bin/env python3
"""Assemble a page from core.css/core.js + acts/<ID>.js (+ acts/<ID>.css if present).
usage: python3 build.py [--acts A1,A2,A3] [--out index.html]"""
import sys, os, argparse
ap = argparse.ArgumentParser(); ap.add_argument('--acts', default='A1,A2,A3'); ap.add_argument('--out', default='index.html')
a = ap.parse_args()
H = os.path.dirname(os.path.abspath(__file__))
css = open(os.path.join(H, 'core.css'), encoding='utf-8').read()
js = open(os.path.join(H, 'core.js'), encoding='utf-8').read()
for act in a.acts.split(','):
    p = os.path.join(H, 'acts', act + '.js')
    if not os.path.exists(p):
        print('skip (missing)', act); continue
    c = os.path.join(H, 'acts', act + '.css')
    if os.path.exists(c): css += '\n/* ---- ' + act + ' */\n' + open(c, encoding='utf-8').read()
    js += '\n// ==================================================================== ' + act + '\n' + open(p, encoding='utf-8').read()
html = ('<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">\n<link rel="stylesheet" href="fonts/fonts.css">\n<style>\n'
        + css + '\n</style></head>\n<body><div id="stage"></div>\n<script>\n' + js + '\nboot();window.render(0);\n</script>\n</body></html>\n')
open(os.path.join(H, a.out), 'w', encoding='utf-8').write(html)
print('wrote', a.out, len(html))
