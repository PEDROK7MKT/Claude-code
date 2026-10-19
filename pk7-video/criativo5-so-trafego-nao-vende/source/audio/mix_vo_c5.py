#!/usr/bin/env python3
"""Mixagem final do criativo 5 com a voz real: aplica a linha do tempo do criativo 5 (audio_c5.py) ao audio8 e roda
o mix_vo8.py do criativo 4 (ducking pela voz, efeitos audíveis, -14 LUFS, <= -3 dBTP).
uso: python3 mix_vo_c5.py VOZ_ALINHADA.wav SAIDA.wav"""
import os, sys, runpy
HERE = os.path.dirname(os.path.abspath(__file__)); C5 = os.path.dirname(HERE)
C4A = os.path.join(os.path.dirname(C5), 'c4', 'audio')
os.environ['SRT'] = os.path.join(C5, 'vo', 'legendas_narracao.srt')
sys.path.insert(0, HERE)
import audio_c5  # noqa: F401  (aplica a linha do tempo do criativo 5 no módulo audio8)
sys.argv = ['mix_vo8.py'] + sys.argv[1:]
runpy.run_path(os.path.join(C4A, 'mix_vo8.py'), run_name='__main__')
