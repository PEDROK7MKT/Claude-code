#!/usr/bin/env python3
"""PK7 launch video (V3.1): music + sound design, mix and master.

Every SFX comes from cues.json, exported from the animation timeline in index.html
(window.CUES), so each sound is locked to the frame of its animation.

Phone-first rules (V2 effects were inaudible on phone speakers):
  * every effect carries its identity in 300 Hz - 8 kHz; sub layers are a bonus only;
  * per-type loudness is normalised on the phone band (HP 300 Hz), not on the sub;
  * music is ducked in the 1-5 kHz band when an effect hits, keyed from the effects' own mid/high band;
  * the music bed has a real energy arc and a beat grid that never stumbles (all scene cuts are on beats);
  * audibility is measured the way a phone plays it: mono, HP 300 Hz + LP 8 kHz, A-weighted,
    each cue against everything else (music + all other cues). The build reports every cue.

Outputs: trilha.wav, efeitos_sonoros.wav (stems from the same buses), mix_completo.wav (-14 LUFS),
mix_narracao.wav (bed for the voice-over, -24 LUFS, voice windows carved), audio_report.json
"""
import json, os, re, wave
import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, uniform_filter1d
import pyloudnorm as pyln

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
CUES = json.load(open(os.path.join(HERE, 'cues.json')))
TOTAL = CUES['total']
N = int(round(SR * TOTAL))
rng = np.random.default_rng(20261004)


# ------------------------------------------------------------------ DSP helpers
def tt(d):
    return np.arange(int(round(SR * d))) / SR


def env(n, a=.002, r=.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-5)) * np.exp(-t / max(r, 1e-5))


def fade(x, a=.002, r=.01):
    n = x.shape[-1]; e = np.ones(n)
    na, nr = max(1, int(SR * a)), max(1, int(SR * r))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


_sos = {}


def filt(x, kind, f, order=2):
    key = (kind, tuple(np.atleast_1d(f)), order)
    if key not in _sos:
        _sos[key] = signal.butter(order, f, kind, fs=SR, output='sos')
    return signal.sosfilt(_sos[key], x, axis=-1)


def noise(n):
    return rng.standard_normal(n)


def osc(freq, n):
    return np.sin(2 * np.pi * np.cumsum(np.broadcast_to(freq, (n,))) / SR)


def tri(freq, n):
    p = (np.cumsum(np.broadcast_to(freq, (n,))) / SR) % 1.0
    return 4 * np.abs(p - .5) - 1


def saw(freq, n, ph=0.0):
    p = (ph + np.cumsum(np.broadcast_to(freq, (n,))) / SR) % 1.0
    return 2 * p - 1


def svf(x, fc, q=1.0):
    """Chamberlin state-variable band-pass with a per-sample cutoff."""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    F = 2 * np.sin(np.pi * np.minimum(fc, SR / 7) / SR)
    damp = 1.0 / q; low = band = 0.0; out = np.empty_like(x)
    for i in range(len(x)):
        high = x[i] - low - damp * band
        band += F[i] * high; low += F[i] * band; out[i] = band
    return out


def pan2(x, p):
    p = float(np.clip(p, -1, 1))
    return np.vstack([x * np.sqrt((1 - p) / 2) * 1.4142, x * np.sqrt((1 + p) / 2) * 1.4142])


def phone_norm(x, target_db=-12.0):
    """Loudest 50 ms RMS measured on the phone band (HP 300 Hz) -> target."""
    m = x if x.ndim == 1 else x.mean(0)
    m = filt(m, 'highpass', 300, 4)
    w = int(SR * .05)
    c = np.cumsum(np.concatenate([[0], m ** 2]))
    r = np.sqrt(np.max((c[w:] - c[:-w]) / w) + 1e-12) if len(m) > w else np.sqrt(np.mean(m ** 2) + 1e-12)
    return x * (10 ** (target_db / 20) / r)


def make_ir(rt60, pre=.012, lp=6500, seed=3):
    r = np.random.default_rng(seed); n = int(SR * rt60 * 1.1); t = np.arange(n) / SR; ir = []
    for c in range(2):
        x = r.standard_normal(n) * np.exp(-6.9 * t / rt60)
        x = filt(x, 'lowpass', lp); x[:int(pre * SR)] = 0
        for k in range(6):
            i = int(SR * (pre + .004 + .006 * k + .002 * c)); x[i] += .6 * (.7 ** k) * (1 if (k + c) % 2 else -1)
        ir.append(x / np.sqrt(np.sum(x ** 2)))
    return np.array(ir)


def convolve_st(x, ir):
    mono = x.mean(0)
    return np.vstack([signal.fftconvolve(mono, ir[c])[:x.shape[1]] for c in range(2)])


def place(buf, x, t0, g=1.0, p=0.0):
    x = pan2(x, p) if x.ndim == 1 else x
    i = int(round(t0 * SR))
    if i < 0:
        x = x[:, -i:]; i = 0
    j = min(buf.shape[1], i + x.shape[1])
    if j > i:
        buf[:, i:j] += x[:, :j - i] * g
    return i


# ------------------------------------------------------------------ sound effects (identity lives in 300 Hz-8 kHz)
PENTA = [880, 1047, 1175, 1319, 1568, 1760, 2093]


def fx_key():
    n = int(SR * .09); t = tt(.09)
    clk = filt(noise(n), 'bandpass', [2500, 8000]) * env(n, .0003, .006)
    thock = np.sin(2 * np.pi * rng.uniform(240, 300) * t) * env(n, .0008, .016) * .55
    x = clk + thock
    k = int(SR * .035); rel = filt(noise(n - k), 'bandpass', [3000, 8000]) * env(n - k, .0003, .003) * .4
    x[k:] += rel
    return np.tanh(2.5 * x / np.max(np.abs(x))) / 2.5   # lower crest: keys must not pump the master limiter


def fx_keyS():
    return filt(fx_key(), 'lowpass', 3000)


def fx_tap():
    n = int(SR * .1); t = tt(.1)
    return osc(950 + 750 * np.exp(-t * 80), n) * env(n, .0008, .028) + filt(noise(n), 'highpass', 3000) * env(n, .0002, .002) * .5


def fx_click():
    def one(g):
        n = int(SR * .025); t = tt(.025)
        return g * (filt(noise(n), 'bandpass', [1800, 9000]) * env(n, .0002, .003)
                    + np.sin(2 * np.pi * 2700 * t) * env(n, .0003, .004) * .55
                    + np.sin(2 * np.pi * 420 * t) * env(n, .0005, .012) * .5)
    x = np.zeros(int(SR * .13)); a = one(1.0); x[:len(a)] += a
    b = one(.65); k = int(SR * .085); x[k:k + len(b)] += b
    return x


def fx_pop(idx=None):
    f0 = PENTA[int(idx) % len(PENTA)] * .5 if idx is not None else PENTA[int(rng.integers(0, 5))] * .5
    n = int(SR * .16); t = tt(.16); f = f0 * (1 + 1.2 * np.exp(-t * 85))
    x = osc(f, n) * env(n, .0008, .05) + .45 * osc(f * 2, n) * env(n, .0005, .025)
    return x + filt(noise(n), 'highpass', 2500) * env(n, .0002, .003) * .45


def marimba(f, d=.7):
    n = int(SR * d); t = tt(d)
    return fade(np.sin(2 * np.pi * f * t) * env(n, .001, .17) + .35 * np.sin(2 * np.pi * f * 3.93 * t) * env(n, .0005, .03)
                + .18 * np.sin(2 * np.pi * f * 9.3 * t) * env(n, .0003, .008), r=.05)


def fx_notif():
    x = np.zeros(int(SR * .85)); a = marimba(1046.5); x[:len(a)] += a
    b = marimba(1568.0) * .9; k = int(SR * .1); x[k:k + len(b)] += b[:len(x) - k]
    return x


def fx_error():
    def blip(f):
        n = int(SR * .075)
        return fade(filt(tri(f, n) + .3 * saw(f, n), 'lowpass', 3000), .003, .015)
    a, b = blip(659), blip(523); x = np.zeros(len(a) + len(b) + int(SR * .025))
    x[:len(a)] += a; x[len(a) + int(SR * .025):] += b
    return x


def fx_ding(f=1568.0):
    n = int(SR * 3.0); t = tt(3.0); x = np.zeros(n)
    for m, a, r in ((1, 1, .9), (2.0, .45, .5), (2.76, .35, .32), (4.07, .2, .18), (5.4, .12, .1)):
        x += a * np.sin(2 * np.pi * f * m * t + rng.uniform(0, 6)) * env(n, .001, r)
    return fade(x + filt(noise(n), 'highpass', 4000) * env(n, .0002, .003) * .4, r=.06)


def fx_chime():
    x = np.zeros(int(SR * 3.3))
    for k, f in enumerate((1046.5, 1318.5, 1568.0, 2093.0)):
        d = fx_ding(f) * .75; s = int(k * .065 * SR); x[s:s + len(d)] += d[:len(x) - s]
    return x


def fx_shimmer():
    n = int(SR * 1.6); out = np.zeros((2, n))
    for k, f in enumerate((1760, 2217, 2637, 3520, 4434, 5274, 2637, 3520)):
        s = int(k * .045 * SR); m = n - s
        y = np.sin(2 * np.pi * f * np.arange(m) / SR) * env(m, .004, .35)
        out[:, s:] += pan2(fade(y, r=.05), (-1) ** k * .6) * .3
    return out


def fx_marker(d=.4):
    """Felt-tip stroke that follows an ease-out highlight: loud while fast, fades as it slows."""
    d = max(.15, d); n = int(SR * d); t = tt(d); p = t / d
    base = filt(noise(n), 'bandpass', [1800, 5500])
    grain = 1 + .35 * np.sin(2 * np.pi * rng.uniform(35, 45) * t + rng.uniform(0, 6))
    e = np.minimum(1, t / .005) * (1 - p) ** 1.3
    return fade(base * grain * e, .001, .02)


def fx_sweep(d=.6):
    """Highlighter sweep with an ease-in-out speed curve."""
    n = int(SR * d); t = tt(d); p = t / d
    base = filt(noise(n), 'bandpass', [1200, 4000])
    grain = 1 + .45 * np.sin(2 * np.pi * rng.uniform(60, 80) * t)
    return fade(base * grain * np.sin(np.pi * p) ** .7, .002, .02)


def fx_tick():
    n = int(SR * .035); t = tt(.035)
    return fade(np.sin(2 * np.pi * 2650 * t) * env(n, .0003, .009) + .5 * np.sin(2 * np.pi * 4150 * t) * env(n, .0003, .005)
                + filt(noise(n), 'highpass', 5000) * env(n, .0001, .0015) * .4, r=.005)


def whoosh(d, f0, f1, peak=.5, air=.15, p0=-.7, p1=.7):
    n = int(SR * d); x = noise(n); p = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** (p ** 1.1)
    y = svf(x, fc, q=1.3) + .45 * svf(x, fc * 1.9, q=2.2)
    amp = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.6)
    y = y * amp + filt(noise(n), 'bandpass', [3500, 9000]) * amp * air
    y = filt(y, 'lowpass', 11000)
    pan = np.linspace(p0, p1, n)
    return np.vstack([y * np.sqrt((1 - pan) / 2) * 1.4142, y * np.sqrt((1 + pan) / 2) * 1.4142])


def fx_whoosh():
    return whoosh(.45, 380, 4200, .3)


def fx_swoosh():
    return whoosh(.5, 600, 5000, .5, air=.18, p0=.8, p1=-.8)


def fx_swipe(d=.6):
    return whoosh(max(.3, d), 500, 4000, .5, air=.12, p0=.35, p1=-.35)


def fx_whooshBig():
    w = whoosh(.85, 220, 3600, .7, air=.2, p0=-.9, p1=.9)
    n = w.shape[1]; p = np.linspace(0, 1, n)
    amp = np.where(p < .7, (p / .7) ** 2.5, ((1 - p) / .3) ** 1.4)
    body = filt(noise(n), 'bandpass', [250, 900]) * amp * 1.0
    rev = filt(noise(n), 'bandpass', [3500, 8000]) * np.where(p < .7, (p / .7) ** 4, 0) * .45
    return w + pan2(body + rev, 0)


def fx_riser(d=.8):
    n = int(SR * d); p = np.linspace(0, 1, n)
    f = 220 * (1760 / 220) ** (p ** 1.3)
    tone = filt(saw(f, n) + saw(f * 1.005, n), 'lowpass', 4500) * .45
    nz = svf(noise(n), 500 * (5000 / 500) ** p, q=1.6)
    trem = 1 - .3 * (.5 + .5 * np.sin(2 * np.pi * np.cumsum(5 + 20 * p) / SR))
    e = p ** 2.2 * np.minimum(1, (n - np.arange(n)) / (SR * .006))
    return filt((tone + nz * .9) * trem * e, 'lowpass', 9000)


def fx_impact():
    d = 1.9; n = int(SR * d); t = tt(d)
    snap = filt(noise(n), 'highpass', 1500) * env(n, .001, .035) * 1.2
    body = np.tanh(6 * osc(88 + 120 * np.exp(-t * 22), n)) * env(n, .001, .17) * .8
    sub = filt(np.sin(2 * np.pi * 47 * t) * env(n, .004, .45), 'highpass', 35) * .3
    crunch = filt(noise(n), 'bandpass', [700, 5000]) * env(n, .001, .11) * 1.3
    ring = (np.sin(2 * np.pi * 1180 * t) + np.sin(2 * np.pi * 1770 * t) + np.sin(2 * np.pi * 2360 * t)) * env(n, .0005, .07) * .35
    tail = filt(noise(n), 'bandpass', [300, 2500]) * env(n, .006, .4) * .3
    return fade(snap + body + sub + crunch + ring + tail, .0005, .2)


def fx_thump():
    d = .8; n = int(SR * d); t = tt(d)
    body = np.tanh(2.2 * osc(55 + 85 * np.exp(-t * 30), n)) * env(n, .001, .2) * .5
    knock = np.sin(2 * np.pi * 480 * t) * env(n, .0008, .06) * 1.0
    click = filt(noise(n), 'bandpass', [1500, 6000]) * env(n, .0002, .009) * 1.2
    slap = filt(noise(n), 'bandpass', [900, 3500]) * env(n, .0005, .03) * .8
    return fade(body + knock + click + slap, .0005, .1)


def fx_glitch(d=.3):
    n = int(SR * d); out = np.zeros(n); i = 0; prev = None
    while i < n:
        m = min(int(rng.uniform(.012, .04) * SR), n - i); r = rng.random()
        if prev is not None and r < .3:
            seg = np.resize(prev, m)
        elif r < .65:
            seg = np.sign(np.sin(2 * np.pi * rng.uniform(400, 2800) * np.arange(m) / SR)) * .6
        else:
            seg = filt(noise(m), 'bandpass', sorted(rng.uniform(600, 7000, 2)))
        hold = int(rng.integers(3, 10)); seg = np.repeat(seg[::hold], hold)[:m]
        bits = 2 ** int(rng.integers(3, 6)); seg = np.round(seg * bits) / bits
        out[i:i + len(seg)] = seg; prev = seg; i += m
    return fade(filt(filt(out, 'highpass', 300), 'lowpass', 9000), .002, .02)


def fx_wa():
    def blip(f):
        n = int(SR * .06); t = tt(.06)
        return osc(f * (1 + .35 * np.exp(-t * 120)), n) * env(n, .0015, .02)
    x = np.zeros(int(SR * .16)); a = blip(1180); x[:len(a)] += a
    b = blip(1760) * .8; k = int(SR * .07); x[k:k + len(b)] += b
    return x


def fx_zap():
    d = .38; n = int(SR * d); t = tt(d)
    car = np.sin(2 * np.pi * 900 * t + 9 * np.exp(-t * 7) * np.sin(2 * np.pi * 73 * t)) * env(n, .001, .12)
    crack = filt(noise(n), 'highpass', 3000) * (rng.random(n) < .08) * env(n, .001, .1) * 2.0
    return fade(car + crack, r=.02)


# type: (generator, relative level dB, reverb send, uses duration)
FX = {
    'key': (fx_key, -6, .03), 'keyS': (fx_keyS, -5, .03), 'tap': (fx_tap, -5, .08), 'click': (fx_click, -2, .06),
    'pop': (fx_pop, -4, .12), 'notif': (fx_notif, -4, .2), 'error': (fx_error, -6, .1), 'ding': (fx_ding, -6, .3),
    'chime': (fx_chime, -6, .35), 'shimmer': (fx_shimmer, -8, .4), 'marker': (fx_marker, -5, .05), 'sweep': (fx_sweep, -8, .05),
    'tick': (fx_tick, -8, .04), 'whoosh': (fx_whoosh, -4, .2), 'swoosh': (fx_swoosh, 0, .2), 'swipe': (fx_swipe, -6, .12),
    'whooshBig': (fx_whooshBig, -2, .3), 'riser': (fx_riser, -2, .25), 'impact': (fx_impact, 0, .3), 'thump': (fx_thump, -1, .15),
    'glitch': (fx_glitch, -3, .1), 'wa': (fx_wa, -5, .1), 'zap': (fx_zap, -7, .15),
}
DUR_TYPES = {'marker', 'sweep', 'swipe', 'riser'}


def render_cue(c):
    gen, rel, rv = FX[c['n']]
    if c['n'] in DUR_TYPES:
        x = gen(c.get('d', .6))
    elif c['n'] == 'pop':
        x = gen(c.get('d'))
    else:
        x = gen()
    return phone_norm(x, -12.0) * 10 ** (rel / 20) * c['v'], rv


def build_sfx(cues, extra_db=None):
    extra_db = extra_db or {}
    dry = np.zeros((2, N)); send = np.zeros((2, N)); placed = []
    for c in cues:
        x, rv = render_cue(c)
        x = x * 10 ** (extra_db.get(c['n'], 0) / 20)
        xs = pan2(x, c['p']) if x.ndim == 1 else x
        i = place(dry, xs, c['t']); place(send, xs, c['t'], rv)
        placed.append((c, i, xs))
    wet = convolve_st(send, make_ir(1.1, pre=.015, lp=7000, seed=5))
    out = filt(dry + wet * .5, 'lowpass', 14000)
    return out, placed


# ------------------------------------------------------------------ music
BEAT = .5  # 120 BPM; every scene cut sits on this grid
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
AM, F, CM, G, E = (45, (57, 60, 64)), (41, (57, 60, 65)), (48, (55, 60, 64)), (43, (55, 59, 62)), (40, (56, 59, 64))
PROG = [AM, F, CM, G]


class Music:
    def __init__(self):
        self.pad = np.zeros((2, N)); self.bass = np.zeros((2, N)); self.lead = np.zeros((2, N))
        self.drums = np.zeros((2, N)); self.send = np.zeros((2, N)); self.kicks = []

    def pad_chord(self, notes, t0, d, cut=1500, g=.09, att=.35):
        n = int(SR * (d + .6)); t = np.arange(n) / SR
        e = np.minimum(1, t / att) * np.clip((d + .6 - t) / .6, 0, 1)
        for m in notes:
            for det, pn in ((-.08, -.55), (0, 0), (.08, .55)):
                y = saw(hz(m) * 2 ** (det / 12), n, rng.random())
                y = filt(filt(y, 'lowpass', cut), 'highpass', 250) * e * g
                place(self.pad, y, t0, 1, pn); place(self.send, y, t0, .35, pn)

    def bass_note(self, m, t0, d, g=.34):
        n = int(SR * d); t = np.arange(n) / SR
        y = saw(hz(m), n) + .5 * saw(hz(m) * 1.004, n)
        e = np.exp(-t / .07)
        y = filt(y, 'lowpass', 1100) * e + filt(y, 'lowpass', 280) * (1 - e)
        harm = filt(np.tanh(4 * y), 'bandpass', [200, 1200]) * .35
        y = np.tanh(1.6 * y) + .7 * np.sin(2 * np.pi * hz(m) * t) + harm
        amp = np.minimum(1, t / .004) * np.clip((d - t) / .03, 0, 1) * (.75 + .25 * np.exp(-t / .1))
        place(self.bass, y * amp * g, t0)

    def pluck(self, m, t0, g=.15, p=0.0):
        d = .7; n = int(SR * d); t = np.arange(n) / SR
        y = saw(hz(m), n) + saw(hz(m) * 1.007, n); e = np.exp(-t / .05)
        y = filt(y, 'lowpass', 3600) * e + filt(y, 'lowpass', 800) * (1 - e)
        y = fade(y * np.exp(-t / .2) * g, .002, .01)
        place(self.lead, y, t0, 1, p); place(self.send, y, t0, .5, p)

    def stab(self, notes, t0, g=.11):
        d = .5; n = int(SR * d); t = np.arange(n) / SR
        for m in notes:
            for det, pn in ((-.1, -.4), (.1, .4)):
                y = fade(filt(saw(hz(m + 12) * 2 ** (det / 12), n), 'lowpass', 3800) * np.exp(-t / .13) * g, .002, .02)
                place(self.lead, y, t0, 1, pn); place(self.send, y, t0, .5, pn)

    def epiano(self, notes, t0, d=1.8, g=.12):
        n = int(SR * d); t = np.arange(n) / SR
        for k, m in enumerate(notes):
            f = hz(m)
            y = np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t / .35) * np.sin(2 * np.pi * f * t)) * np.exp(-t / .9)
            y = fade(y * g, .003, .05)
            place(self.lead, y, t0 + k * .012, 1, (k - 1.5) * .25); place(self.send, y, t0, .6)

    def kick(self, t0, g=.9, soft=False):
        n = int(SR * .6); t = np.arange(n) / SR
        y = np.tanh(3.5 * osc(48 + 125 * np.exp(-t * 34), n)) * np.exp(-t / .26) * .8
        y += filt(noise(n), 'bandpass', [2000, 5000]) * env(n, .0002, .006) * (.3 if soft else .9)
        if soft:
            y = filt(y, 'lowpass', 600)
        place(self.drums, fade(y * g, .0005, .05), t0); self.kicks.append((t0, g))

    def clap(self, t0, g=.5):
        n = int(SR * .4); t = np.arange(n) / SR
        e = sum((t >= dt) * np.exp(-np.maximum(t - dt, 0) / .01) for dt in (0, .009, .019))
        e = e + (t >= .02) * np.exp(-np.maximum(t - .02, 0) / .11) * .7
        y = fade(filt(noise(n), 'bandpass', [900, 4200]) * e, .0005, .03)
        place(self.drums, y * g, t0); place(self.send, y * g, t0, .5)

    def hat(self, t0, g=.11, open_=False, p=.25):
        n = int(SR * (.3 if open_ else .07))
        y = fade(filt(noise(n), 'bandpass', [6000, 11000]) * env(n, .0003, .16 if open_ else .022), .0003, .01)
        place(self.drums, y * g, t0, 1, p)

    def snare_roll(self, t0, t1, g=.35):
        t = t0
        while t < t1 - 1e-6:
            pr = (t - t0) / (t1 - t0); self.clap(t, g * (.15 + .85 * pr ** 1.5)); t += BEAT / (4 if pr < .5 else 8)

    def swell(self, t1, d=1.2, g=.25):
        n = int(SR * d); p = np.linspace(0, 1, n)
        place(self.send, filt(noise(n), 'bandpass', [300, 6000]) * p ** 3 * g, t1 - d, 1)

    def grid(self, t0, t1, chords=None, *, kick=True, clap=True, hats=True, bass=True, pad=True, arp=1.0,
             stabs=False, hat16=False, open_hat=False, lvl=1.0, pad_cut=1500):
        """Beat-grid groove; chords follow GLOBAL bars (2 s) so sections never re-anchor the beat."""
        b0 = int(round(t0 / BEAT)); b1 = int(round(t1 / BEAT))
        for b in range(b0, b1):
            tb = b * BEAT; bar = b // 4; pos = b % 4
            root, ch = (chords or PROG)[bar % len(chords or PROG)] if not callable(chords) else chords(tb)
            if pad and (pos == 0 or b == b0):
                d = min((bar + 1) * 4 * BEAT, t1) - tb
                self.pad_chord(ch, tb, d, pad_cut, .09 * lvl)
            if kick:
                self.kick(tb, .9 * lvl)
            if clap and pos in (1, 3):
                self.clap(tb, .5 * lvl)
            for h in range(2):
                th = tb + h * BEAT / 2
                if bass:
                    self.bass_note(root - 12 + (12 if (b * 2 + h) % 4 == 3 else 0), th, BEAT / 2 * .92, .34 * lvl)
                if hats and h == 1:
                    self.hat(th, .11 * lvl, open_=open_hat and pos in (1, 3))
                if hat16:
                    self.hat(th + BEAT / 4, .06 * lvl, p=-.25)
                if stabs and ((pos == 0 and h == 0) or (pos == 1 and h == 1)):
                    self.stab(ch, th, .1 * lvl)
                if arp:
                    seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[0] + 12, ch[1], ch[2] + 12]
                    for s in range(2):
                        ta = th + s * BEAT / 4
                        if ta < t1 - .02:
                            k = (b * 4 + h * 2 + s) % 8
                            self.pluck(seq[k] + 12, ta, .15 * arp * lvl, .35 if s else -.35)

    def pump(self, depth=.5, rel=.15):
        g = np.ones(N); t = np.arange(N) / SR
        for tk, gk in self.kicks:
            i = int(tk * SR); j = min(N, i + int(SR * .6))
            g[i:j] = np.minimum(g[i:j], 1 - depth * min(1, gk) * np.exp(-(t[i:j] - tk) / rel))
        return filt(g, 'lowpass', 60)


def build_music():
    m = Music()
    # S1 0-4.5: dark drone, clock hats, heartbeat; drop-out under the 2.0 s punchline
    m.pad_chord((45, 52, 57, 60), 0, 4.5, 700, .11, att=.05)
    m.bass_note(33, 0, 4.4, .26)
    for k in range(9):
        m.hat(.25 + k * .5, .06, p=.4)
    for b in (0.0, 1.0):
        m.kick(b, .55, soft=True); m.kick(b + .23, .32, soft=True)
    m.swell(4.5, 1.6, .3)
    # S2 4.5-11: pressure (no clap), Am F Am E, snare roll into the cut
    m.grid(4.5, 11.0, [AM, AM, AM, F, AM, E], clap=False, arp=0, pad_cut=900, lvl=.85)
    m.snare_roll(10.0, 11.0, .3)
    # S3 11-15.5: lift - no drums
    m.pad_chord((48, 55, 59, 62, 64), 11.0, 2.0, 1400, .08)
    m.pad_chord((43, 55, 59, 62, 67), 13.0, 2.5, 1400, .08)
    m.bass_note(36, 11.0, 2.0, .26); m.bass_note(31, 13.0, 2.5, .26)
    for i, n_ in enumerate((72, 76, 79, 83, 79, 76, 74, 79, 83)):
        m.pluck(n_, 11.0 + i * .5, .12, .3 if i % 2 else -.3)
    m.swell(15.5, 1.4, .3)
    # S4 15.5-38.5: groove; the Google quote card (25.0-32.5) gets the floor: pad only, low
    m.grid(15.5, 25.0, arp=1)
    m.grid(25.0, 32.5, kick=False, clap=False, hats=False, bass=False, arp=.4, lvl=.85, pad_cut=1200)
    m.swell(32.5, 1.0, .3)
    m.grid(32.5, 38.5, arp=1)
    m.snare_roll(37.5, 38.5, .32)
    # S5 38.5-46.5: brand drop
    m.grid(38.5, 46.5, arp=1, stabs=True, hat16=True, open_hat=True, lvl=1.12)
    # S6 46.5-60: method (lighter)
    m.grid(46.5, 60.0, arp=1, lvl=.9)
    # S7 60-70: results peak
    m.grid(60.0, 70.0, arp=1, stabs=True, hat16=True, open_hat=True, lvl=1.1)
    # S8 70-74: groove, then a half-beat gap before the breakdown
    m.grid(70.0, 74.0, arp=1)
    m.swell(74.5, .8, .25)
    # S9 74.5-79.5: breakdown under the central line; V -> I lands on "RESULTADO" (75.8)
    m.pad_chord((53, 57, 60, 64), 74.5, .9, 1400, .07); m.epiano((53, 57, 60, 64), 74.5, 1.4)
    m.epiano((55, 59, 62, 67), 75.32, 1.0); m.pad_chord((55, 59, 62, 67), 75.32, .5, 1400, .07)
    m.pad_chord((48, 55, 60, 64, 67), 75.82, 3.68, 2200, .08); m.epiano((60, 64, 67, 72), 75.82, 2.4, .14)
    m.bass_note(36, 75.82, 3.6, .28)
    m.snare_roll(79.0, 79.5, .3); m.swell(79.5, 1.0, .3)
    # S10 79.5-87.5: final groove, cadence F-G -> C add9 sting at 85.5 (lands with the button punch)
    m.grid(79.5, 85.5, [F, AM, G, G], arp=1, stabs=True, open_hat=True, lvl=1.1)
    m.pad_chord((48, 55, 60, 64, 67), 85.5, 1.95, 2600, .11, att=.05); m.kick(85.5, 1.0)
    m.bass_note(36, 85.5, 1.9, .34); m.stab((60, 64, 67), 85.5, .16); m.epiano((60, 64, 67, 72), 85.5, 2.0, .14)
    pump = m.pump()
    music = (m.pad + m.lead) * pump + m.bass * (.35 + .65 * pump) + m.drums
    music += convolve_st(m.send, make_ir(1.8, pre=.02, lp=5000, seed=9)) * .35
    music = filt(music, 'highpass', 30)
    fo = int(SR * .35); music[:, -fo:] *= np.linspace(1, 0, fo) ** 1.5
    return np.tanh(music * 1.1) / 1.1


# ------------------------------------------------------------------ mix & master
def follower(x, att=.005, rel=.12):
    dec = 8; m = np.abs(x)
    pad = (-len(m)) % dec; md = np.pad(m, (0, pad)).reshape(-1, dec).max(1)
    a = np.exp(-dec / (SR * att)); r = np.exp(-dec / (SR * rel)); y = np.empty_like(md); s = 0.0
    for i, v in enumerate(md):
        s = a * s + (1 - a) * v if v > s else r * s + (1 - r) * v
        y[i] = s
    return np.repeat(y, dec)[:len(m)]


def duck(music, sfx, full_db=3.0, mid_db=6.0):
    """Music dips 3 dB overall and up to 6 dB in 1-5 kHz while an effect is sounding (key = effects >800 Hz)."""
    key = follower(filt(sfx.mean(0), 'highpass', 800, 4))
    ref = np.percentile(key[key > 1e-6], 90) if np.any(key > 1e-6) else 1
    amt = np.clip(key / (ref * .5), 0, 1) ** .8
    mid = filt(music, 'bandpass', [1000, 5000])
    g_mid = 10 ** (-mid_db * amt / 20); g_all = 10 ** (-full_db * amt / 20)
    return (music + (g_mid - 1) * mid) * g_all


def limiter(x, ceil_db=-1.9, look=.004):
    """Look-ahead peak limiter computed on a 4x oversampled detector (catches inter-sample peaks)."""
    ceil = 10 ** (ceil_db / 20)
    up = np.abs(signal.resample_poly(x, 4, 1, axis=1)).max(0)
    pk = up.reshape(-1, 4).max(1)[:x.shape[1]] if len(up) >= 4 * x.shape[1] else np.pad(up, (0, 4 * x.shape[1] - len(up))).reshape(-1, 4).max(1)
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9)); L = int(SR * look)
    g = minimum_filter1d(g, 2 * L + 1); w = np.hanning(2 * L + 1); w /= w.sum()
    g = signal.fftconvolve(g, w, 'same')
    g2 = uniform_filter1d(minimum_filter1d(g, int(SR * .03)), int(SR * .03))
    return x * np.minimum(g, g2)


def true_peak_db(x):
    return 20 * np.log10(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=1))) + 1e-12)


METER = pyln.Meter(SR)
lufs = lambda x: METER.integrated_loudness(x.T)


def master(x, target, ceil_tp=-1.5):
    g = 0.0
    for _ in range(8):
        y = limiter(x * 10 ** (g / 20), ceil_db=ceil_tp - .4); L = lufs(y); g += target - L
        if abs(target - L) < .05:
            break
    y = limiter(x * 10 ** (g / 20), ceil_db=ceil_tp - .4); tp = true_peak_db(y)
    if tp > ceil_tp:
        y *= 10 ** ((ceil_tp - tp) / 20)
    return y, g, lufs(y), true_peak_db(y)


def write_wav(path, x):
    d = np.clip(x + (rng.random(x.shape) - rng.random(x.shape)) / 32768, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((d.T * 32767).astype('<i2').tobytes())


# ---- phone simulation: mono, HP 300 Hz + LP 8 kHz (4th order), A-weighting
def _aweight_sos():
    f1, f2, f3, f4 = 20.598997, 107.65265, 737.86223, 12194.217
    z = [0, 0, 0, 0]; p = [-2 * np.pi * f1] * 2 + [-2 * np.pi * f2, -2 * np.pi * f3] + [-2 * np.pi * f4] * 2
    k = (2 * np.pi * f4) ** 2 * 10 ** (1.9997 / 20)
    zd, pd, kd = signal.bilinear_zpk(z, p, k, SR)
    return signal.zpk2sos(zd, pd, kd)


AW = _aweight_sos()


def phone(x):
    m = x.mean(0) if x.ndim == 2 else x
    return signal.sosfilt(AW, filt(filt(m, 'highpass', 300, 4), 'lowpass', 8000, 4))


CRIT = {'impact', 'thump', 'whoosh', 'whooshBig', 'swoosh', 'marker', 'sweep'}
LAYER = {'shimmer', 'keyS'}  # sweeteners that sit under another hit by design


def audibility(placed, total, music, sfx_gain, label):
    """Per cue: its loudest 50 ms on a phone vs everything else playing at that moment."""
    tot = phone(total); w = int(SR * .05); rows = []
    for c, i, xs in placed:
        cp = phone(xs * sfx_gain)
        w = min(int(SR * .05), len(cp) - 1)
        if w < 32:
            continue
        cs = np.cumsum(np.concatenate([[0], cp ** 2])); k = int(np.argmax(cs[w:] - cs[:-w]))
        a, b = i + k, min(len(tot), i + k + w)
        e_c = (cs[k + w] - cs[k]) / w
        e_m = np.mean((tot[a:b] - cp[k:k + (b - a)]) ** 2) + 1e-12
        rows.append({'t': c['t'], 'n': c['n'], 'snr': float(10 * np.log10(e_c / e_m + 1e-12))})
    snr = np.array([r['snr'] for r in rows])
    crit = [r for r in rows if r['n'] in CRIT]
    fails = [r for r in rows if r['n'] not in LAYER and (r['snr'] < 3 or (r['n'] in CRIT and r['snr'] < 6))]
    by = {}
    for r in rows:
        by.setdefault(r['n'], []).append(r['snr'])
    print(f'[{label}] phone-sim (mono, HP300+LP8k, A-wt) cue vs everything else: median {np.median(snr):+.1f} dB, '
          f'p10 {np.percentile(snr, 10):+.1f}, min {snr.min():+.1f}; key hits median {np.median([r["snr"] for r in crit]):+.1f}; '
          f'fails {len(fails)}/{len(rows)}')
    print('   by type:', ', '.join(f'{n} {np.median(v):+.0f}' for n, v in sorted(by.items(), key=lambda kv: np.median(kv[1]))))
    if fails:
        print('   fails:', ', '.join(f"{r['n']}@{r['t']:.2f}={r['snr']:+.1f}" for r in sorted(fails, key=lambda r: r['snr'])[:14]))
    return rows, by, fails


def srt_windows(path):
    txt = open(path, encoding='utf-8').read()
    def s(x):
        h, m, r = x.split(':'); sec, ms = r.split(',')
        return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
    return [(s(a), s(b)) for a, b in re.findall(r'(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)', txt)]


def vo_carve(x, wins, cut_db=-4.0, presence_db=-3.0):
    g = np.zeros(N)
    for a, b in wins:
        g[int(a * SR):int(b * SR)] = 1
    g = uniform_filter1d(g, int(SR * .12))
    pres = filt(x, 'bandpass', [1800, 3500])
    y = x + (10 ** (presence_db / 20) - 1) * pres * g
    return y * 10 ** (cut_db * g / 20)


if __name__ == '__main__':
    cues = CUES['cues']
    music = build_music()
    music = music * 10 ** ((-19 - lufs(music)) / 20)
    extra = {}; used = {}
    gain = None
    for it in range(4):
        sfx, placed = build_sfx(cues, extra)
        if gain is None:
            gain = 10 ** ((-21.5 - lufs(sfx)) / 20)      # effects bus by loudness, not by one transient (fixed after it0)
        sfx = np.tanh(sfx * gain / .5) * .5 / gain          # fast soft clip on the effects bus only
        mus_d = duck(music, sfx * gain)
        full = mus_d + sfx * gain
        rows, by, fails = audibility(placed, full, mus_d, gain, f'completo it{it}')
        need = {}
        for r in fails:
            tgt = 6 if r['n'] in CRIT else 3
            need[r['n']] = max(need.get(r['n'], 0), tgt - r['snr'])
        if not need:
            used = dict(extra); break
        used = dict(extra)
        for n_, d_ in need.items():
            if n_ in ('key', 'keyS'):
                continue
            extra[n_] = min(6.0, extra.get(n_, 0) + min(2.5, d_ * .7 + .3))
        print('   raising:', {k: round(v, 1) for k, v in extra.items()})
    print(f'   bus loudness: music {lufs(mus_d):.1f} LUFS, effects {lufs(sfx * gain):.1f} LUFS')
    sfx, placed = build_sfx(cues, used); sfx = np.tanh(sfx * gain / .5) * .5 / gain
    mus_d = duck(music, sfx * gain); full = mus_d + sfx * gain
    rows, by, fails = audibility(placed, full, mus_d, gain, 'completo FINAL')
    full_m, G1, L1, tp1 = master(full, -14.0, ceil_tp=-3.0)
    print(f'mix_completo: {L1:.2f} LUFS, true peak {tp1:.2f} dBTP')

    # narration bed: music -10 dB, effects -7 dB, no counter ticks, voice windows carved
    trim = {'key': .4, 'keyS': .4, 'click': .5, 'swoosh': .63}
    cues_n = [dict(c, v=c['v'] * trim.get(c['n'], 1)) for c in cues if c['n'] != 'tick'
              and not (c['t'] >= 85.4 and c['n'] in ('impact', 'shimmer'))]
    sfx_n, placed_n = build_sfx(cues_n, {})
    sfx_n = sfx_n * gain * 10 ** (-7 / 20)
    mus_n = duck(music * 10 ** (-10 / 20), sfx_n)
    wins = srt_windows(os.path.join(HERE, 'legendas_narracao.srt'))
    narr = vo_carve(mus_n + sfx_n, wins)
    narr_m, G2, L2, tp2 = master(narr, -27.0, ceil_tp=-9.0)
    st = []
    for a, b in wins:
        seg = narr_m[:, int(a * SR):int(b * SR)]
        try:
            st.append(METER.integrated_loudness(seg.T))
        except Exception:
            st.append(-70)
    print(f'mix_narracao: {L2:.2f} LUFS, true peak {tp2:.2f} dBTP; bed inside voice windows: max {max(st):.1f} LUFS, median {np.median(st):.1f}')

    write_wav(os.path.join(HERE, 'mix_completo.wav'), full_m)
    write_wav(os.path.join(HERE, 'mix_narracao.wav'), narr_m)
    # stems from the same buses and the same master gain: trilha + efeitos == mix_completo before the limiter
    gm = 10 ** (G1 / 20)
    stems_peak = max(np.abs(mus_d * gm).max(), np.abs(sfx * gain * gm).max())
    sg = min(1.0, 10 ** (-3 / 20) / stems_peak)
    write_wav(os.path.join(HERE, 'trilha.wav'), mus_d * gm * sg)
    write_wav(os.path.join(HERE, 'efeitos_sonoros.wav'), sfx * gain * gm * sg)
    json.dump({'completo': {'lufs': L1, 'tp': tp1}, 'narracao': {'lufs': L2, 'tp': tp2, 'bed_in_vo_max': max(st)},
               'extra_db': used, 'cues': rows}, open(os.path.join(HERE, 'audio_report.json'), 'w'), indent=1)
    print('ok')
