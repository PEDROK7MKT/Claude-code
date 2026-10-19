#!/usr/bin/env python3
"""PK7 criativo 5 "SÓ TRÁFEGO NÃO VENDE" (36.0 s): trilha + efeitos, reaproveitando os instrumentos, os efeitos, o ducking,
o limitador e os relatórios do audio8.py (criativo 4) com a linha do tempo do criativo 5.

  0.00-10.90  tensão (Ré menor): baixo abafado + pizz, relógio; a partir de 6.60 bumbo suave e pad crescendo;
              9.78 carimbo LEAD PERDIDO: tudo cai para um drone grave
 10.90-11.08  silêncio digital (música E efeitos)
 11.08-11.60  riser curto + swell reverso
 11.60        DROP (A MÁQUINA LIGA): groove confiante em Ré maior, uma camada por etapa acesa
              (hats 12.85, palmas 14.55, synth-bass 16.25, acordes 17.95, groove cheio 19.90 = CONTRATO ASSINADO)
 26.95        freio (o groove para): "não precisa decidir tudo hoje" só com pad
 28.90        o groove volta abafado (passa-baixa) até o selo
 30.60        selo do Pedro: groove cheio de novo
 34.90        sting final em Ré maior
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
C5 = os.path.dirname(HERE)
C4A = os.path.join(os.path.dirname(C5), 'c4', 'audio')
os.environ.setdefault('CUES', os.path.join(C5, 'build', 'cues.json'))
os.environ.setdefault('CUE_EDITS', os.path.join(HERE, 'cue_edits.json'))
os.environ.setdefault('OUT_DIR', os.path.join(HERE, 'out'))
os.environ.setdefault('SRT', os.path.join(HERE, 'legendas_provisorias.srt'))
sys.path.insert(0, C4A)
import numpy as np
from scipy import signal
import audio8 as a

G0, G1 = 11.00, 11.17
DROP, WIN, SEAL, STING = 11.70, 19.90, 30.60, 34.90
STAMP2 = 8.30
# ---- linha do tempo do criativo 5 nos globais do audio8 (gates, âncoras, camadas, relatórios)
a.GATE0, a.GATE1 = G0, G1; a.HOLE = (G0, G1); a.VACUO = (G0, G1)
a.RISER0, a.RISER1 = G1, DROP - .05
a.DROP_T = a.BAR0 = DROP
a.HATS_T, a.CLAP_T, a.SYNB_T, a.CHORD_T, a.FULL_T = 12.90, 14.30, 15.70, 17.10, WIN
a.SCRATCH_T, a.LP_BACK, a.SEAL_T, a.STING_T = 99.0, 99.0, SEAL, STING
a.HERO_NOMINAL = (0.0, DROP, SEAL, STING)
a.HERO_TIMES = a._hero_times()
a.SFX_GATE[:] = 1; a.SFX_GATE[a.ns(G0):a.ns(G1)] = 0
N, B, ns, tt, hz = a.N, a.B, a.ns, a.tt, a.hz
TOTAL = a.TOTAL


def tension(sc):
    """0-10.90: Ré menor, 120 BPM. Baixo abafado nos tempos 1 e 3, pizz nos 2 e 4, uma linha de pizz na ponta dos pés;
    relógio (hat fechado bem baixo) nas colcheias a partir de 3.20; bumbo suave + pad crescendo a partir de 6.60;
    no carimbo (9.78) tudo cai para um drone grave."""
    r = np.random.default_rng(901)
    i0 = 0; n = ns(.7); t = tt(n)
    sc.add('bass', a.osc(38 + 34 * np.exp(-t / .03), n) * a.env(n, .004, .25) * .5, i0=i0)
    sc.add('bass', a.muted_bass(r, hz(38), .7, .3), i0=i0)
    CH = {'Dm': (38, 45, [62, 65, 69]), 'Bb': (46, 41, [62, 65, 70]), 'A7': (45, 40, [61, 64, 67]), 'Gm': (43, 38, [62, 67, 70])}
    BARS = [('Dm', 'Dm'), ('Dm', 'A7'), ('Bb', 'A7'), ('Gm', 'A7'), ('Dm', 'A7')]
    MEL = [[(4, 69), (6, 68)], [(1, 69), (3, 72), (5, 73)], [(0, 74), (4, 72), (6, 70)], [(1, 70), (3, 69), (5, 67), (7, 64)], []]
    L = 1.35
    for bi, (h1, h2) in enumerate(BARS):
        bar0 = bi * 4 * B
        for b in range(4):
            tb = bar0 + b * B; ch = CH[h1 if b < 2 else h2]
            if tb >= STAMP2 - .02:
                continue
            if b in (0, 2):
                if bi == 0 and b == 0:
                    continue
                sc.add('bass', a.muted_bass(r, hz(ch[0] if b == 0 else ch[1]), .9 * L * (1 if b == 0 else .8)), tb)
                if tb >= 6.55:
                    sc.add('drums', a.kick(r, .30 + .1 * (tb - 6.5) / 3, soft=True), tb)
            else:
                for k, m in enumerate(ch[2]):
                    sc.add('mid', a.pizz(r, hz(m), .1 * L, .16, .4), tb + .004 * k, 1, (-.35, 0, .35)[k], .15)
        for pos, m in MEL[bi]:
            te = bar0 + pos * B / 2
            if te < STAMP2 - .05:
                sc.add('mid', a.pizz(r, hz(m), .24 * L, .26, .5), te, 1, .2 if pos % 2 else -.15, .2)
    k = 0
    while True:                                    # relógio: colcheias, acento no tempo
        te = 3.20 + k * B / 2; k += 1
        if te >= STAMP2 - .02:
            break
        sc.add('perc', a.hat(r, .07 if k % 2 else .11), te, 1, .35)
    d = STAMP2 - 6.55                              # pad crescendo sob "o cliente não espera"
    p = a.pad_chord(r, [50, 53, 57, 62], d + .1, .5, 1100, 1.2, .1, hp=150)
    sc.add('pad', p * np.linspace(.15, 1, p.shape[1]), 6.55, 1, 0, .3)
    # carimbo: sub + drone grave em Ré até o silêncio
    i = ns(STAMP2); n = ns(.8); t = tt(n)
    sc.add('bass', a.osc(36 + 30 * np.exp(-t / .03), n) * a.env(n, .003, .3) * .55, i0=i)
    dd = G0 - STAMP2
    dr = a.pad_chord(r, [38, 45, 50], dd, .45, 600, .02, .3, hp=40)
    sc.add('pad', dr, STAMP2, 1, 0, .25)


def riser(sc):
    r = np.random.default_rng(902)
    d = DROP - G1 - .03; n = ns(d); u = np.linspace(0, 1, n)
    p = a.pad_chord(r, [45, 52, 57, 61, 64], d, 1.0, 6000, .03, .02, hp=150)[:, :n]
    p = np.vstack([a.stft_filter(p[c], lambda f, tm: 1 / (1 + (f / (500 * 10 ** np.clip(tm / d, 0, 1))) ** 4)) for c in range(2)])
    nz = a.swept_noise(r, n, 600 * 10 ** u, .6) * u ** 2
    x = p * (.2 + .8 * u ** 1.5) + a.pan2(nz * .1, 0)
    sc.add('pad', a.fade(x, .005, .01), G1, 1, 0, .2)
    sc.add('perc', a.pan2(a.cymbal_swell(r, d, .07), 0), G1)


def hit(sc, t, r, big=True):
    i = ns(t)
    sc.add('pad', a.stab_chord(r, [50, 54, 57, 62], .34 if big else .26, .5, 1800, .14), i0=i, send=.25)
    sc.add('drums', a.kick(r, .55), i0=i)
    sc.add('bass', a.bass_note(r, hz(38), .35, .34, 2.0, 1400, 2.5, .06), i0=i)


def build_music(cues=None, stem_gain=None):
    sg = dict(a.STEM_GAIN, **(stem_gain or {}))
    anc = {'stamp': 0.0, 'drop': DROP, 'seal': SEAL, 'sting': STING}
    sA, sR, sC = (a.Score() for _ in range(3))
    tension(sA); riser(sR)
    r = np.random.default_rng(903)
    hit(sC, DROP, r)
    a.groove(sC, anc, DROP, TOTAL, 911)
    hit(sC, WIN, r)                                            # TRÁFEGO + ESTRUTURA = VENDA
    sC.add('perc', a.pan2(a.cymbal_swell(r, .35, .05), 0), WIN - .35)
    for j in range(4):
        sC.add('drums', a.snare(r, .1 + .05 * j), WIN - .5 + j * B / 4, 1, 0, .15)
    hit(sC, SEAL, r, big=False)                                # selo do Pedro no CTA
    for j, v in enumerate((.1, .14, .18)):
        sC.add('drums', a.snare(r, v), STING - .5 + j * B / 4, 1, 0, .15)
    i = ns(STING)
    sC.add('pad', a.pad_chord(r, [50, 57, 62, 66], .9, .42, 1900, .01, .45), i0=i, send=.2)
    sC.add('bass', a.bass_note(r, hz(38), .6, .34, 2.0, 1400, 3.0, .3), i0=i)
    sC.add('drums', a.kick(r, .42, soft=True), i0=i)
    sC.add('mid', a.filt(a.strum(r, [62, 66, 69, 74], .12, True, .5, .6, .9, spread=.008), 'lowpass', 2200), i0=i, send=.15)
    sC.add('pad', a.stab_chord(r, [50, 54, 57, 62], .28, .4, 1800, .1), i0=i)
    t = tt(N)

    def mixdown(sc):
        return sum(sc.st[k] * sg[k] for k in sc.STEMS), a.convolve_st(sc.send, a.IR_MUS) * a.WET
    da, wa = mixdown(sA); A = (da + wa) * np.clip((G0 - t) / .004, 0, 1)
    dr_, wr = mixdown(sR); R = dr_ + wr
    dc, wc = mixdown(sC); C = dc + wc * np.clip((TOTAL - .1 - t) / .5, 0, 1)
    mus = a.filt(A + R + C, 'highpass', 30)
    g = np.ones(N); i0, i1 = ns(G0), ns(G1); fl = ns(.004)
    g[i0:i1] = 0; g[i0 - fl:i0] = np.minimum(g[i0 - fl:i0], np.linspace(1, 0, fl))
    g *= np.clip((TOTAL - t) / .1, 0, 1)
    a.MUSIC_GATE[:] = g
    sc = a.Score()
    for k2 in sc.STEMS:
        sc.st[k2] = sum(s.st[k2] for s in (sA, sR, sC))
    return mus * g, sc


a.build_music = build_music
a.section_levels = lambda *x, **k: []      # relatório por seção do criativo 4 não se aplica a esta linha do tempo
if __name__ == '__main__':
    a.main()
