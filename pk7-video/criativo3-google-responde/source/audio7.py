#!/usr/bin/env python3
"""PK7 "NO VÁCUO" (43.5 s vertical Reels, pt-BR): score, sound design, mix and master (v6).

Every audio finding of qa_round1.json is addressed:
  * no tanh / soft clipping anywhere. The only waveform-level non-linearity is the master look-ahead limiter
    (4x oversampled detector, <= 3 dB GR everywhere, <= 2 dB at 20.30 / 21.30 / 25.229 / 34.336); the report gives its
    gain reduction per second. Effects are gain-staged by a per-cue peak cap (a level choice), never clipped;
  * every SFX is synthesised from modal resonators, shaped noise, layered bodies and close early reflections, carries
    its identity in 300 Hz-8 kHz and has no sub layer that could drive the limiter;
  * audibility is measured LEAVE-ONE-OUT: the full chain with and without each cue, same master gain, through the phone
    simulation (mono, HP300 + LP8k 4th order, A-weighting), post-limiter, no clipper (see loo());
  * the music makes room through mix automation lanes, computed once per build and identical in the with / without
    renders: a zero-phase phone-band duck keyed from the effects, and a slow ride (>= 40 ms ramps) where music + hit
    peaks would otherwise need more limiter GR. Textures (whooshes, typing, coins...) dip under the hits the same way;
  * cues that are the same audible event (a tick on the stop button, a bubble pop inside the reply motif, a swipe
    flick on a sent bubble) are rendered as one event; sweeteners that bloom after a hit are measured as layers;
  * every random generator is seeded per cue instance / per music voice: re-runs are bit-identical (WAVs and report),
    so what is measured is what is shipped;
  * the score keeps real mid-register content in every section (hold music on a phone line, the tension ostinato
    doubled by muted guitar + marimba + strings, the CTA with pad, plucks and a D2 bass), every fill and stab sits on
    its grid, the brand stab is sample-aligned with the impact cue, and the ending decays out before a 100 ms fade.

Inputs:  env CUES (default ./cues.json), env SRT (default ./legendas_narracao_v2.srt)
Outputs: audio_v2/trilha.wav, efeitos_sonoros.wav (stems at the mix gain staging: trilha + efeitos = mix before the
         limiter), mix_completo.wav (-14 LUFS, <= -3 dBTP), mix_narracao.wav (bed for a VO, -27 LUFS, <= -9 dBTP),
         audio_report.json.  All WAVs: stereo, 48 kHz, 24-bit, exactly TOTAL seconds.
"""
import json, os, re, sys, time, wave, zlib
import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, maximum_filter1d, uniform_filter1d
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__))
CUES_PATH = os.environ.get('CUES', os.path.join(HERE, 'cues.json'))
SRT_PATH = os.environ.get('SRT', os.path.join(HERE, 'legendas_narracao.srt'))
OUT_DIR = os.path.join(HERE, 'audio_v3')

SR = 48000
CUES_DATA = json.load(open(CUES_PATH, encoding='utf-8'))
TOTAL = float(CUES_DATA.get('total', 43.5))
N = int(round(SR * TOTAL))

# ------------------------------------------------------------------ fixed timeline anchors (scene cuts sit on them)
B = 60 / 112                # groove beat (112 BPM), grid from 0
BT = B
A = 8 * B                   # results drop (4.286)
D3 = 28 * B                 # the quote section lift (15.0)
GA = 60 * B                 # proof hit (32.143)
CTA_T = 70 * B              # 37.5
FINAL_T = 78 * B            # 41.79 final sting
END_SIL = 43.15
M0 = STOP_END = HOLD_END = TOTAL + 5     # no vácuo in this film
SMASH = DRIP0 = FILL_T = GATE0 = TOTAL + 5
HOLE = (TOTAL + 5, TOTAL + 6)

HERO = {'wa', 'swstop', 'switch', 'slam', 'stamp', 'patch', 'impact', 'toggleOn', 'chime', 'sent', 'clock'}
SWEET = {'shimmer', 'squeak'}
# priority when two cues start within LAYER_DT of each other: the lower one is a deliberate layer (target >= 0 dB)
PRIORITY = ['wa', 'swstop', 'switch', 'slam', 'impact', 'stamp', 'patch', 'toggleOn', 'chime', 'sent', 'clock',
            'click', 'pop', 'coin', 'tick', 'tap', 'thock', 'snip', 'read', 'flip', 'paper', 'swoosh', 'whooshBig',
            'whoosh', 'swipe', 'coins', 'cells', 'count', 'up', 'ff', 'typing', 'riser', 'coinFar', 'shimmer', 'squeak']
LAYER_DT = 0.03
TARGET = {'hero': 8.0, 'normal': 4.0, 'layer': 0.0}


# ------------------------------------------------------------------ DSP primitives
def ns(d):
    return int(round(SR * d))


def tt(n):
    return np.arange(n) / SR


def env(n, a=.002, tau=.1):
    """Linear attack of `a` s, exponential decay with time constant `tau` s."""
    t = tt(n)
    return np.minimum(1, t / max(a, 1e-6)) * np.exp(-t / max(tau, 1e-6))


def fade(x, a=.001, r=.01):
    n = x.shape[-1]; e = np.ones(n)
    na, nr = min(n, max(1, ns(a))), min(n, max(1, ns(r)))
    e[:na] = np.linspace(0, 1, na); e[n - nr:] *= np.linspace(1, 0, nr)
    return x * e


_SOS = {}


def filt(x, kind, f, order=2):
    key = (kind, tuple(np.atleast_1d(f).tolist()), order)
    if key not in _SOS:
        _SOS[key] = signal.butter(order, f, kind, fs=SR, output='sos')
    return signal.sosfilt(_SOS[key], x, axis=-1)


def peq_sos(f0, gain_db, q):
    """RBJ peaking biquad as one SOS row."""
    Aa = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q)
    b = np.array([1 + al * Aa, -2 * np.cos(w), 1 - al * Aa]); a = np.array([1 + al / Aa, -2 * np.cos(w), 1 - al / Aa])
    return np.concatenate([b / a[0], a / a[0]])[None, :]


def peq(x, f0, gain_db, q=1.0):
    return signal.sosfilt(peq_sos(f0, gain_db, q), x, axis=-1)


def reson(x, f, tau):
    """Two-pole resonator: unit-amplitude damped sine impulse response at f with decay time constant tau."""
    w = 2 * np.pi * min(f, SR * .45) / SR; r = np.exp(-1 / (tau * SR))
    return signal.lfilter([np.sin(w)], [1, -2 * r * np.cos(w), r * r], x)


def mallet(n, contact_ms, r, noise_amt=.15):
    """Excitation: half-sine contact pulse (longer = softer mallet) plus a little contact noise."""
    w = max(2, ns(contact_ms / 1000)); x = np.zeros(n)
    x[:w] = np.sin(np.pi * np.arange(w) / w)
    k = min(n, 2 * w)
    x[:k] += r.standard_normal(k) * np.hanning(k) * noise_amt
    return x / (2 * w / np.pi)


MODAL_SPREAD_MS = 1.0


def modal(r, n, modes, contact_ms=.4, noise_amt=.15, jit=.012, spread_ms=None):
    """Struck object: excitation through a bank of decaying resonators (freq, amp, tau).
    Each mode is excited with its own sub-millisecond onset offset (the impact spreads over the body), which
    keeps the modes from summing coherently on one sample: same sound, 3-5 dB less crest factor."""
    exc = mallet(n, contact_ms, r, noise_amt); y = np.zeros(n)
    sp = MODAL_SPREAD_MS if spread_ms is None else spread_ms
    for f, a, tau in modes:
        k = int(r.uniform(0, sp) * SR / 1000) if sp > 0 else 0
        e = exc if k == 0 else np.concatenate([np.zeros(k), exc[:n - k]])
        y += a * reson(e, f * (1 + jit * r.uniform(-1, 1)), tau)
    return y


def nburst(r, n, band, a=.0003, tau=.003, order=2):
    """Band-limited noise transient."""
    lo, hi = band
    x = r.standard_normal(n)
    x = filt(x, 'bandpass', [lo, min(hi, SR * .45)], order) if lo > 0 else filt(x, 'lowpass', hi, order)
    return x * env(n, a, tau)


def stft_filter(x, gain_fn, nper=512, hop=128):
    """Time-varying linear filtering in the STFT domain. gain_fn(freqs[:,None], times[None,:]) -> gain."""
    n = len(x)
    f, t, Z = signal.stft(x, SR, nperseg=nper, noverlap=nper - hop)
    Z = Z * gain_fn(f[:, None], t[None, :])
    _, y = signal.istft(Z, SR, nperseg=nper, noverlap=nper - hop)
    return y[:n] if len(y) >= n else np.pad(y, (0, n - len(y)))


def swept_noise(r, n, fc, bw_oct=.5, extra=None):
    """Noise through a moving gaussian (in log-frequency) band centred on fc(t) (array of length n)."""
    x = r.standard_normal(n)
    fc = np.asarray(fc, float)

    def g(f, t):
        c = np.interp(t * SR, np.arange(n), fc)
        lf = np.log2(np.maximum(f, 20.0) / c)
        out = np.exp(-.5 * (lf / bw_oct) ** 2)
        if extra is not None:
            out = out + extra(f, t)
        return out
    y = stft_filter(x, g)
    return y / (np.sqrt(np.mean(y ** 2)) + 1e-12)


def polyblep_saw(f, n, ph=0.0):
    f = np.broadcast_to(np.asarray(f, float), (n,))
    dt = f / SR; p = (ph + np.cumsum(dt)) % 1.0
    y = 2 * p - 1
    m1 = p < dt; u = p[m1] / dt[m1]; y[m1] -= u + u - u * u - 1
    m2 = p > 1 - dt; u = (p[m2] - 1) / dt[m2]; y[m2] -= u * u + u + u + 1
    return y


def osc(f, n, ph=0.0):
    f = np.broadcast_to(np.asarray(f, float), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + ph)


def pan2(x, p):
    """Constant-power pan; centre = unity in both channels (mono fold-down = x)."""
    p = float(np.clip(p, -1, 1))
    return np.vstack([x * np.sqrt((1 - p) / 2) * np.sqrt(2), x * np.sqrt((1 + p) / 2) * np.sqrt(2)])


def pan_moving(x, p0, p1):
    p = np.linspace(p0, p1, len(x))
    return np.vstack([x * np.sqrt((1 - p) / 2) * np.sqrt(2), x * np.sqrt((1 + p) / 2) * np.sqrt(2)])


def room_er(x, r, amt=1.0, lp=6000):
    """Close early reflections (desk / small room, 4-38 ms): body and realism after a transient,
    more energy without a higher peak."""
    n = len(x); y = x.copy(); src = filt(x, 'lowpass', lp)
    for d, g in ((.0043, .5), (.0081, .42), (.0127, .36), (.0183, .3), (.0252, .24), (.0318, .18), (.0377, .13)):
        k = int((d * r.uniform(.92, 1.08)) * SR)
        if k < n:
            y[k:] += src[:n - k] * g * amt * (1 if r.random() < .7 else -1)
    return y


def place(buf, x, t0=None, g=1.0, p=0.0, i0=None):
    """Add x (mono -> panned, or stereo) into buf at time t0 (or sample i0). Returns the start sample."""
    x = pan2(x, p) if x.ndim == 1 else x
    i = int(round(t0 * SR)) if i0 is None else int(i0)
    if i < 0:
        x = x[:, -i:]; i = 0
    j = min(buf.shape[1], i + x.shape[1])
    if j > i:
        buf[:, i:j] += x[:, :j - i] * g
    return i


def make_ir(rt60, pre=.012, lp=6500, seed=3, er=6, width=1.0):
    r = np.random.default_rng(seed); n = ns(rt60 * 1.1); t = tt(n); ir = []
    for c in range(2):
        x = r.standard_normal(n) * np.exp(-6.9 * t / rt60)
        x = filt(x, 'lowpass', lp); x[:ns(pre)] = 0
        for k in range(er):
            i = ns(pre + .003 + .0057 * k + .0021 * c * width); x[i] += .5 * (.72 ** k) * (1 if (k + c) % 2 else -1)
        ir.append(x / np.sqrt(np.sum(x ** 2)))
    return np.array(ir)


def convolve_st(x, ir):
    """Stereo reverb: mono sum of x convolved with a stereo IR, same length as x."""
    mono = x.mean(0)
    return np.vstack([signal.fftconvolve(mono, ir[c])[:x.shape[1]] for c in range(2)])


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def seed_of(*parts):
    return zlib.crc32('|'.join(str(p) for p in parts).encode())


# ================================================================== SOUND EFFECTS
# Every generator gets its own seeded rng `r`; returns mono (panned later) or stereo. Identity in 300 Hz-8 kHz.
PENTA_CLICK = [880.0, 987.8, 1174.7, 1318.5, 1480.0]          # A5 B5 D6 E6 F#6 (D major pentatonic, rising)
POP_SCALE = [587.3, 659.3, 784.0, 880.0, 987.8, 1174.7, 1318.5, 1568.0]


def tick_body(r, n, f, tau=.006, bright=.5, contact=.25):
    return modal(r, n, [(f, 1, tau), (f * 1.58, .55 * bright + .2, tau * .7), (f * 2.37, .35 * bright, tau * .5)],
                 contact_ms=contact, noise_amt=.3)


def fx_sent(r):
    """Outgoing message: airy upward swish leading into a soft bubble pop (pop lands ~50 ms after start)."""
    n = ns(.24); x = np.zeros(n); t = tt(n)
    m = ns(.065); u = np.linspace(0, 1, m)
    sw = swept_noise(r, m, 1600 * (4.2 ** u), .45) * u ** 1.6 * .32
    x[:m] += fade(sw, .002, .006)
    k = ns(.05); m2 = n - k; t2 = tt(m2)
    f = 980 - 430 * np.exp(-t2 / .007)                        # bubble: pitch rises quickly to ~980 Hz
    body = osc(f, m2) * env(m2, .0015, .045) + .4 * osc(2.02 * f, m2) * env(m2, .0012, .022)
    body += .2 * osc(3.1 * f, m2) * env(m2, .001, .01)
    x[k:] += body * .9 + nburst(r, m2, (2500, 7000), .0006, .0025) * .25
    x[k:] += filt(r.standard_normal(m2), 'bandpass', [1500, 5000]) * env(m2, .004, .04) * .08
    return fade(room_er(x, r, .6), .001, .03)


def fx_read(r):
    """Double tick 'read': two tiny marimba taps (E6 -> A6), soft."""
    n = ns(.16); x = np.zeros(n)
    for k0, f, g in ((0, 1318.5, .85), (ns(.062), 1760.0, 1.0)):
        m = n - k0
        y = modal(r, m, [(f, 1, .02), (f * 3.93, .22, .006), (f * 2.0, .1, .01)], contact_ms=.3, noise_amt=.25)
        y += nburst(r, m, (3000, 9000), .0002, .0012) * .25
        x[k0:] += y * g
    return fade(x, .0005, .03)


def keystroke(r):
    n = ns(.07); x = np.zeros(n)
    x += nburst(r, n, (2200, 7500), .0008, .003) * .3
    x += modal(r, n, [(r.uniform(420, 520), .6, .02), (r.uniform(1050, 1350), .6, .016),
                      (r.uniform(2300, 2900), .35, .009)], contact_ms=.5, noise_amt=.3)
    x = room_er(x, r, .8, 6000)
    k = ns(r.uniform(.03, .045))
    x[k:] += nburst(r, n - k, (2500, 8000), .0002, .0015) * .25
    return x


TYPING_BED = .6                      # key-bed share of the typing texture (mix_vo.py raises it under the voice)


def fx_typing(r, d=.9):
    n = ns(d + .1); x = np.zeros(n); t = .0
    while t < d - .03:
        y = keystroke(r) * r.uniform(.5, 1.0); i = ns(t); j = min(n, i + len(y)); x[i:j] += y[:j - i]
        t += r.uniform(.035, .075) + (r.uniform(.04, .08) if r.random() < .05 else 0)
    bed = filt(r.standard_normal(n), 'bandpass', [900, 5000]) * (.5 + .5 * uniform_filter1d(r.random(n), ns(.02)))
    x += bed * np.sqrt(np.mean(x ** 2)) * TYPING_BED * np.minimum(1, np.minimum(tt(n), tt(n)[::-1]) / .03)
    return fade(x, .001, .02)


def fx_clock(r):
    """Woody clock tick: 2-5 kHz noise burst + resonant wooden body (820 Hz / 1.9k / 3.1k), gone in < 80 ms."""
    n = ns(.085)
    x = nburst(r, n, (2000, 5500), .0006, .003) * .45
    x += modal(r, n, [(820, 1, .016), (1930, .65, .01), (3150, .4, .006), (4400, .15, .0035)],
               contact_ms=.3, noise_amt=.35, jit=.006)
    return fade(filt(room_er(x, r, 1.0, 5000), 'highpass', 300, 2), .0003, .02)


def fx_tick(r):
    """Stopwatch digit tick: lighter, higher wood tick."""
    n = ns(.06)
    x = nburst(r, n, (4000, 9500), .0004, .0015) * .3
    x += modal(r, n, [(2350, 1, .013), (3720, .5, .009), (5600, .25, .005), (1450, .35, .012)], contact_ms=.15, noise_amt=.3, jit=.008)
    return fade(room_er(x, r, 1.0, 7000), .0003, .012)


def fx_swstop(r):
    """Stopwatch stop button: crisp mechanical clack (press + latch), no ringing tail, < 120 ms."""
    n = ns(.11); x = np.zeros(n)
    x += nburst(r, n, (1500, 7500), .0006, .0035) * .5
    x += modal(r, n, [(1250, 1, .013), (2650, .65, .008), (4100, .35, .005), (520, .4, .016)],
               contact_ms=.3, noise_amt=.3, jit=.006)
    k = ns(.028); m = n - k
    x[k:] += nburst(r, m, (3000, 9000), .0004, .002) * .35 + modal(r, m, [(3300, .4, .005), (1800, .35, .008)], .2)
    x += modal(r, n, [(940, .45, .026), (1620, .25, .018)], .5, .2)
    for d0, g in ((.046, .45), (.061, .3), (.074, .18)):        # mechanism settles: tk-tk (no ringing tail)
        k = ns(d0); m = n - k
        x[k:] += (modal(r, m, [(2900, 1, .004), (4300, .5, .003), (1700, .4, .005)], .15, .3) + nburst(r, m, (3000, 9000), .0003, .001) * .3) * g
    return fade(filt(room_er(x, r, 1.0, 6000), 'highpass', 250, 2), .0003, .025)


def wa_note(r, f, n):
    """Marimba / kalimba bar: fundamental + tuned 4th partial + 10th, soft rubber mallet thump."""
    y = modal(r, n, [(f, 1, .14), (f * 3.98, .34, .04), (f * 9.2, .09, .01), (f * 2.0, .1, .06)],
              contact_ms=.55, noise_amt=.12, jit=.002)
    return y + nburst(r, n, (0, 3500), .0005, .004) * .12


def fx_wa(r):
    """Hero 'answered' motif: warm two-note marimba D5 -> A5 (587 / 880 Hz) with body."""
    n = ns(.62); x = np.zeros(n)
    x += wa_note(r, 587.3, n) * .85
    k = ns(.085); x[k:] += wa_note(r, 880.0, n - k)
    return fade(x, .0005, .12)


def fx_thock(r):
    """Sticker slap: woody, punchy thock."""
    n = ns(.17)
    x = modal(r, n, [(230, .15, .03), (520, .8, .035), (1050, .75, .025), (1760, .45, .014), (2900, .2, .008)],
              contact_ms=.7, noise_amt=.2)
    x += nburst(r, n, (800, 4000), .001, .01) * .45
    return fade(filt(room_er(x, r, .9, 5000), 'highpass', 180, 4), .0004, .04)


def fx_stamp(r):
    """Rubber stamp: thud + paper slap; punchy, not boomy, nothing below 70 Hz."""
    n = ns(.3)
    x = modal(r, n, [(160, .12, .05), (330, .35, .06), (640, .8, .06), (1150, .65, .04), (1950, .35, .022)],
              contact_ms=1.3, noise_amt=.25)
    x += nburst(r, n, (650, 5000), .002, .055) * .8
    x += nburst(r, n, (1500, 3800), .0015, .009) * .25
    k = ns(.012); m = ns(.09)                                 # the paper crinkles under the rubber
    cr = filt(r.standard_normal(m), 'bandpass', [1200, 6000]) * (.5 + uniform_filter1d((r.random(m) < .06) * 1.0, 20) * 3)
    x[k:k + m] += cr * np.exp(-tt(m) / .04) * np.minimum(1, tt(m) / .004) * .22
    return fade(filt(room_er(x, r, .9, 5000), 'highpass', 130, 4), .0005, .06)


def fx_slam(r):
    """Smash-cut hit: crack + mid crunch + wooden body + controlled low punch; tail <= 250 ms."""
    n = ns(.26); t = tt(n)
    low = osc(60 + 60 * np.exp(-t / .03), n) * env(n, .004, .06) * .12
    body = modal(r, n, [(175, .25, .06), (360, .5, .055), (720, .8, .05), (1300, .65, .035), (2300, .35, .02)],
                 contact_ms=1.1, noise_amt=.3)
    x = low + body + nburst(r, n, (2000, 9000), .001, .008) * .35 + nburst(r, n, (700, 4500), .002, .065) * .7
    return fade(filt(room_er(x, r, .8, 5000), 'highpass', 70, 4), .0005, .07)


def fx_pop(r, idx=2):
    """UI bubble pop, pitch from a pentatonic scale index."""
    f0 = POP_SCALE[int(idx) % len(POP_SCALE)]
    n = ns(.12); t = tt(n)
    f = f0 * (1 - .32 * np.exp(-t / .008))
    x = osc(f, n) * env(n, .0009, .026) + .3 * osc(2.01 * f, n) * env(n, .0008, .012)
    x += nburst(r, n, (1500, 6000), .0003, .002) * .3
    return fade(x, .0005, .02)


def fx_tap(r):
    """Finger tap on glass: soft fleshy thud + faint glass ring."""
    n = ns(.08)
    n = ns(.11)
    x = modal(r, n, [(300, .3, .024), (560, 1, .032), (1180, .65, .022)], contact_ms=1.0, noise_amt=.2)
    x += modal(r, n, [(2900, .4, .024), (4350, .25, .016), (6100, .12, .009)], contact_ms=.15, noise_amt=.1)
    x += nburst(r, n, (2000, 6500), .0006, .002) * .18
    return fade(filt(room_er(x, r, 1.0, 5000), 'highpass', 200, 4), .0004, .02)


def air_sweep(r, d, f0, f1, peak=.5, bw=.55, air=.15, p0=-.6, p1=.6, curve=1.0, body=None):
    """Whoosh family: noise through a moving band + air layer, stereo motion."""
    n = ns(d); u = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** (u ** curve)
    amp = np.where(u < peak, (u / peak) ** 2.4, ((1 - u) / (1 - peak)) ** 2.6)
    y = swept_noise(r, n, fc, bw) * amp
    y += swept_noise(r, n, fc * 2.1, bw * .8) * amp ** 1.5 * .35
    y += filt(r.standard_normal(n), 'bandpass', [3500, 10000]) * amp ** 2 * air * 2
    if body is not None:
        y += filt(r.standard_normal(n), 'bandpass', body) * amp ** 2.2 * .6
    return pan_moving(fade(y, .003, .01), p0, p1)


def fx_whoosh(r, d=.38, peak=.32):
    """Transition whoosh (its length / peak are fitted to the hits around it by render_cue)."""
    return air_sweep(r, d, 350, 4200, peak, p0=-.7, p1=.7, curve=.85)


def fx_swoosh(r):
    """The lime slash wipe: tighter, brighter, right-to-left."""
    return air_sweep(r, .42, 700, 6000, .42, bw=.45, air=.22, p0=.8, p1=-.8, curve=.8)


def fx_swipe(r, d=.32, peak=.35, flick=False):
    if flick:
        return air_sweep(r, .14, 700, 4600, .32, air=.14, p0=.3, p1=-.3)
    return air_sweep(r, max(.1, min(d, .5)), 550, 4200, peak, air=.12, p0=.35, p1=-.35)


def fx_whooshBig(r):
    return air_sweep(r, .85, 220, 3800, .68, bw=.65, air=.2, p0=-.9, p1=.9, body=(250, 900))


def fx_ff(r, d=.8):
    """Fast-forward tape scrub: sped-up chipmunk babble (formant-filtered harmonic source) + motor whirr."""
    n = ns(d); u = np.linspace(0, 1, n); t = tt(n)
    wob = uniform_filter1d(r.standard_normal(n), ns(.04)) * 30
    f = (260 * 2.6 ** u) * (1 + .06 * wob / (np.abs(wob).max() + 1e-9))
    src = np.zeros(n)
    for k in range(1, 14):
        src += np.where(k * f < 7000, 1.0 / k, 0) * osc(k * f, n, r.uniform(0, 6))
    fa = np.cumsum(r.standard_normal(64)); fb = np.cumsum(r.standard_normal(64))
    fa = 600 + 250 * (fa - fa.min()) / (np.ptp(fa) + 1e-9); fb = 1400 + 900 * (fb - fb.min()) / (np.ptp(fb) + 1e-9)
    gi = np.linspace(0, d, 64)

    def g(fr, tm):
        c1 = np.interp(tm, gi, fa) * (1 + .8 * np.interp(tm, [0, d], [0, 1]))
        c2 = np.interp(tm, gi, fb) * (1 + .5 * np.interp(tm, [0, d], [0, 1]))
        return np.exp(-.5 * (np.log2(np.maximum(fr, 20) / c1) / .35) ** 2) + .7 * np.exp(-.5 * (np.log2(np.maximum(fr, 20) / c2) / .3) ** 2)
    y = stft_filter(src, g)
    syl = .55 + .45 * np.abs(np.sin(np.pi * np.cumsum(13 + 9 * u) / SR))
    y = y / (np.std(y) + 1e-9) * syl
    y += filt(r.standard_normal(n), 'bandpass', [1800, 4200]) * .25 * (.6 + .4 * np.sin(2 * np.pi * 31 * t))
    e = np.minimum(1, u * 10) * np.minimum(1, (1 - u) * 14)
    return fade(y * e, .002, .01)


def fx_impact(r):
    """Cinematic hit: crack + metallic mid body (phone) + controlled boom (HP 40 Hz), ~1 s tail."""
    n = ns(1.15); t = tt(n)
    boom = osc(45 + 38 * np.exp(-t / .05), n) * env(n, .01, .2) * .14
    punch = modal(r, n, [(105, .35, .09), (180, .3, .06)], contact_ms=3.0, noise_amt=.1)
    mid = modal(r, n, [(415, .7, .13), (770, .8, .115), (1230, .75, .1), (1860, .6, .085), (2640, .4, .055),
                       (3700, .25, .035)], contact_ms=.9, noise_amt=.3)
    k = ns(.0012)
    crack = np.zeros(n); crack[k:] = nburst(r, n - k, (1800, 9000), .001, .014)
    crunch = nburst(r, n, (600, 4000), .0015, .08)
    tail = swept_noise(r, n, 2400 * (300 / 2400) ** np.linspace(0, 1, n) ** .5, .9) * env(n, .008, .25) * .15
    x = boom + punch * .9 + mid * .9 + crack * .45 + crunch * .55 + tail
    return fade(filt(x, 'highpass', 50, 4), .0005, .25)


def coin_hit(r, n, f=None, body=True, tau_scale=1.0):
    """One coin: free-plate modal partials (1, 1.73, 2.33, 3.91, 4.11 x f) + 300-800 Hz body knock."""
    f = r.uniform(2050, 2900) if f is None else f
    ts = tau_scale * r.uniform(.8, 1.2)
    x = modal(r, n, [(f, 1, .2 * ts), (f * 1.73, .7, .15 * ts), (f * 2.33, .5, .1 * ts), (f * 3.91, .28, .05 * ts),
                     (f * 4.11, .22, .04 * ts)], contact_ms=.12, noise_amt=.3, jit=.01)
    if body:
        x += modal(r, n, [(r.uniform(330, 480), .9, .018), (r.uniform(620, 800), .6, .012)], contact_ms=.7, noise_amt=.2)
    return x + nburst(r, n, (3000, 9500), .0002, .0018) * .35


def fx_coin(r):
    n = ns(.6)
    return fade(coin_hit(r, n), .0003, .15)


def fx_coinFar(r):
    """Pix coin chime, small and distant: soft coin 'cling' + a second, higher partial strike, dulled."""
    n = ns(.75); x = coin_hit(r, n, 2350, body=False, tau_scale=1.3)
    k = ns(.07); x[k:] += coin_hit(r, n - k, 3136, body=False, tau_scale=1.2) * .8
    x = filt(x, 'lowpass', 5000) * np.minimum(1, tt(n) / .03)       # distance softens the attack
    return fade(x, .001, .2)


def fx_coins(r, d=1.2):
    """Coins pouring: dense randomized coin hits with level/pitch/pan scatter + a little shuffle."""
    n = ns(d + .45); out = np.zeros((2, n)); t = .0
    while t < d:
        u = t / d
        dens = 55 * min(1, u / .12 + .15) * min(1, (1 - u) / .25 + .1)
        m = ns(.35); y = coin_hit(r, m, tau_scale=r.uniform(.35, .8), body=r.random() < .5)
        g = np.exp(r.normal(0, .45)) * .45
        place(out, fade(y, .0002, .05), i0=ns(t), g=g, p=r.uniform(-.6, .6))
        t += r.exponential(1 / max(dens, 5))
    sh = filt(r.standard_normal(n), 'bandpass', [2000, 7000]) * .06
    sh *= np.interp(np.arange(n), [0, ns(.1), ns(d), n - 1], [0, 1, 1, 0])
    return out + pan2(sh, 0)


def fx_snip(r):
    """Scissors snip: two metallic blade scrapes each closing with a small click."""
    n = ns(.16); x = np.zeros(n)
    for k0, g in ((0, 1.0), (ns(.06), .75)):
        m = ns(.035); u = np.linspace(0, 1, m)
        grain = uniform_filter1d((r.random(m) < .08).astype(float) * r.uniform(.3, 1, m), 12)
        scr = filt(r.standard_normal(m), 'bandpass', [2500, 9000]) * (.4 + 2.5 * grain) * u ** 1.5
        scr += modal(r, m, [(4200, .3, .02), (5900, .2, .015), (3100, .25, .02)], .1, .3) * u
        x[k0:k0 + m] += scr * g * .5
        k1 = k0 + m; mm = n - k1
        x[k1:] += (modal(r, mm, [(1650, 1, .006), (2950, .6, .004), (4800, .35, .003)], .2, .3)
                   + nburst(r, mm, (3000, 9000), .0002, .0012) * .4) * g
    return fade(room_er(x, r, .7, 7000), .0005, .02)


def fx_cells(r, d=.8):
    """Calendar cells filling one by one: 26 rising wood ticks over d."""
    n = ns(d + .08); x = np.zeros(n)
    for k in range(26):
        f = 1050 * (2.7 ** (k / 25)); m = ns(.04)
        y = tick_body(r, m, f, .007, .6) + nburst(r, m, (3000, 9000), .0002, .001) * .2
        i = ns(k * d / 26); x[i:i + m] += y * (.75 + .25 * k / 25)
    return fade(x, .0005, .02)


def fx_count(r, d=.3):
    """Digits rolling (rattle ~38/s, slightly rising) ending in a small thock."""
    n = ns(d + .14); x = np.zeros(n); t = .0; k = 0
    while t < d - .06:
        m = ns(.03); f = 1900 * (1 + .25 * t / max(d, 1e-3)) * r.uniform(.97, 1.03)
        y = tick_body(r, m, f, .0045, .5, .15) + nburst(r, m, (3500, 9000), .0002, .0008) * .25
        i = ns(t); x[i:i + m] += y * r.uniform(.6, .9); t += 1 / 38 * r.uniform(.9, 1.1); k += 1
    k = max(0, ns(d - .05)); m = n - k
    x[k:] += modal(r, m, [(620, 1, .012), (1350, .6, .009), (2600, .35, .005)], .5, .25) * 1.1
    return fade(x[:ns(d + .02)], .0005, .015)


def fx_switch(r):
    """Toggle OFF: press + descending release click, crisp, HP 150 Hz, no sub."""
    n = ns(.2); x = np.zeros(n)
    x += nburst(r, n, (1800, 8000), .0006, .0025) * .45
    x += modal(r, n, [(720, .6, .02), (1450, 1, .014), (2900, .6, .009), (4600, .3, .005)], .3, .3, .006)
    x += osc(5200, n) * env(n, .001, .025) * .03                      # tiny spring ting
    k = ns(.075); m = n - k
    x[k:] += (nburst(r, m, (1800, 8000), .0006, .002) * .4
              + modal(r, m, [(560, .5, .017), (1150, .85, .013), (2400, .55, .008), (3800, .3, .005)], .3, .3, .006)) * .8
    x += modal(r, n, [(980, .3, .025)], .5, .2)
    return fade(filt(room_er(x, r, 1.0, 6000), 'highpass', 150, 4), .0003, .03)


def fx_toggleOn(r):
    """Toggle ON: ascending click pair + a small rising FM blip."""
    n = ns(.24); x = np.zeros(n); t = tt(n)
    x += nburst(r, n, (1800, 8000), .0003, .0018) * .45
    x += modal(r, n, [(1250, .9, .009), (2500, .55, .006), (4000, .3, .004)], .3, .3, .006)
    k = ns(.05); m = n - k
    x[k:] += (nburst(r, m, (2000, 9000), .0003, .0015) * .4
              + modal(r, m, [(1600, .8, .008), (3200, .5, .005)], .25, .3, .006)) * .8
    k2 = ns(.035); m2 = n - k2; t2 = tt(m2)
    f = 880 * 1.5 ** np.minimum(1, t2 / .05)
    ix = 1.2 * np.exp(-t2 / .03)
    blip = np.sin(2 * np.pi * np.cumsum(f) / SR + ix * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)) * env(m2, .002, .05)
    x[k2:] += blip * .6
    return fade(filt(room_er(x, r, .8, 6000), 'highpass', 150), .0003, .04)


def fx_patch(r):
    """Sticky patch slap: rubbery pitch-dropping thwop + wet squelch + paper-ish slap. HP 90 Hz."""
    n = ns(.34); t = tt(n)
    f = 230 + 170 * np.exp(-t / .016)
    rub = (.7 * osc(f, n) + .75 * osc(2 * f, n) + .45 * osc(3.02 * f, n) + .25 * osc(4.05 * f, n)) * env(n, .003, .06)
    slap = nburst(r, n, (700, 3600), .0012, .018)
    m = ns(.09); u = np.linspace(0, 1, m)
    sq = swept_noise(r, m, 2300 * (650 / 2300) ** u, .25) * env(m, .003, .03) * (.6 + .4 * uniform_filter1d(r.random(m), 40))
    x = rub * .8 + slap * .7
    k = ns(.008); x[k:k + m] += sq * .35
    x += modal(r, n, [(560, .4, .02), (1100, .25, .012)], 1.0, .2)
    return fade(filt(room_er(x, r, .7, 5000), 'highpass', 150, 4), .0005, .06)


def fx_squeak(r):
    """Rubber squeak: stick-slip pulse train through rubbery formants, jittery pitch 650-950 Hz."""
    n = ns(.2); u = np.linspace(0, 1, n)
    jit = uniform_filter1d(r.standard_normal(n), ns(.012)); jit /= (np.abs(jit).max() + 1e-9)
    f = 700 + 220 * np.sin(np.pi * u) + 60 * jit
    ph = np.cumsum(f) / SR; imp = np.zeros(n); edges = np.nonzero(np.diff(np.floor(ph)) > 0)[0]
    imp[edges] = r.uniform(.6, 1.0, len(edges))
    y = reson(imp, 1300, .004) + .7 * reson(imp, 2600, .003) + .35 * reson(imp, 4100, .002) + .4 * reson(imp, f.mean(), .006)
    e = u ** 1.2 * (1 - u) ** .5; e /= e.max()                 # blooms ~140 ms after the patch lands
    return fade(y * e, .003, .02)


def fx_shimmer(r):
    """Sparkle: scattered tiny high bell grains + airy noise, stereo."""
    n = ns(1.0); out = np.zeros((2, n))
    for k in range(26):
        tk = .13 + .25 * r.random() ** .8; m = n - ns(tk)
        f = r.choice([2637, 3136, 3520, 4186, 4699, 5274, 6272])
        y = modal(r, m, [(f, 1, r.uniform(.04, .12)), (f * 2.76, .25, .02)], .08, .2, .003)
        place(out, y * (1 - .5 * k / 26) * .3, i0=ns(tk), p=r.uniform(-.8, .8))
    air = filt(r.standard_normal(n), 'bandpass', [5000, 11000]) * env(n, .12, .2) * .05
    return out + pan2(air, 0)


def fx_riser(r, d=.9):
    """Riser: rising noise band + rising detuned saw cluster with accelerating tremolo; cut at d."""
    n = ns(d); u = np.linspace(0, 1, n)
    nz = swept_noise(r, n, 400 * 15 ** (u ** 1.2), .6)
    f = 220 * 8 ** (u ** 1.3)
    tone = filt(polyblep_saw(f, n) + polyblep_saw(f * 1.006, n, .3) + .6 * polyblep_saw(f * 1.5, n, .6), 'lowpass', 5000) * .35
    trem = 1 - .3 * (.5 + .5 * np.sin(2 * np.pi * np.cumsum(5 + 22 * u) / SR))
    e = u ** 2.2
    return fade((nz * .55 + tone) * trem * e, .002, .006)


def fx_up(r, d=.9):
    """Liquid level rising: turbulent pour through a rising vessel resonance + rising bubble blips."""
    n = ns(d); u = np.linspace(0, 1, n)
    F = 480 * 4.8 ** u
    pour = swept_noise(r, n, F, .14, extra=lambda f, t: .25 * np.exp(-.5 * (np.log2(np.maximum(f, 20) / 3500) / .6) ** 2))
    pour *= .7 + .3 * uniform_filter1d(r.random(n), ns(.015)) * 2
    x = pour * .5; t = .02
    while t < d - .05:
        m = ns(.05); tl = tt(m); fb = np.interp(t, [0, d], [F[0], F[-1]]) * r.uniform(.95, 1.35)
        b = osc(fb * (1 - .3 * np.exp(-tl / .006)), m) * env(m, .001, .012)
        i = ns(t); x[i:i + m] += b * r.uniform(.25, .6); t += r.uniform(.03, .07)
    e = np.minimum(1, u / .08) * np.minimum(1, (1 - u) / .1) * (.6 + .4 * u)
    return fade(x * e, .003, .01)


def fx_paper(r):
    """Paper slide: grainy friction noise centred ~3 kHz, gentle sweep."""
    n = ns(.38); u = np.linspace(0, 1, n)
    gr = uniform_filter1d((r.random(n) < .02).astype(float) * r.uniform(.2, 1, n), 30); gr /= gr.max() + 1e-9
    y = swept_noise(r, n, 2200 * 1.8 ** u, 1.1) * (.75 + .45 * gr)
    e = np.minimum(1, u / .12) * np.minimum(1, (1 - u) / .35) ** 1.2
    return pan_moving(fade(y * e, .003, .02), -.2, .2)


def fx_marker(r, d=.7):
    """Highlighter strokes: felt tip on paper, one squeaky scrub per highlighted line (~0.24 s each)."""
    n = ns(d); y = np.zeros(n); k = max(1, int(round(d / .24)))
    for j in range(k):
        m = ns(.2); u = np.linspace(0, 1, m)
        z = swept_noise(r, m, 3200 + 900 * u, .8) * np.minimum(1, u / .08) * np.minimum(1, (1 - u) / .25)
        z += .25 * osc(1900 + 250 * np.sin(2 * np.pi * 7 * u), m) * np.minimum(1, u / .05) * (1 - u) ** 2
        i = ns(j * .24); y[i:i + m] += z[:n - i]
    return pan_moving(fade(y, .002, .02), -.3, .3)


def fx_flip(r):
    """Card flip: quick air whip + card snap."""
    n = ns(.2); m = ns(.075); u = np.linspace(0, 1, m)
    x = np.zeros(n)
    x[:m] = swept_noise(r, m, 900 * 5.5 ** u, .5) * u ** 2 * .45
    k = m - ns(.005); mm = n - k
    x[k:] += modal(r, mm, [(1700, 1, .009), (3100, .6, .006), (5200, .3, .004), (900, .4, .012)], .2, .3) \
        + nburst(r, mm, (2500, 9000), .0004, .002) * .35
    return fade(room_er(x, r, .8, 6000), .001, .02)


def fx_chime(r):
    """Payment received 'ka-ching': register clack + bright bell, tail <= 0.5 s."""
    n = ns(.5); x = np.zeros(n)
    for k0, g in ((0, .8), (ns(.028), .6)):
        m = n - k0
        x[k0:] += (nburst(r, m, (1500, 7000), .0003, .002) * .5
                   + modal(r, m, [(820, .6, .01), (1650, .5, .007), (3000, .3, .004)], .3, .3)) * g
    k = ns(.06); m = n - k; f = 2349.3
    bell = modal(r, m, [(f, 1, .13), (f * 2.0, .45, .1), (f * 2.76, .35, .07), (f * 1.5, .3, .12), (f * 4.07, .15, .04)],
                 .15, .2, .002)
    x[k:] += bell * 1.1
    return fade(x, .0005, .1)


def fx_click(r, idx=0):
    """Pipeline node click: crisp transient + kalimba-like pitched body, pentatonic rising by index."""
    f = PENTA_CLICK[int(idx) % len(PENTA_CLICK)]
    n = ns(.2)
    x = nburst(r, n, (2500, 9000), .0002, .0018) * .4
    x += modal(r, n, [(f, 1, .055), (f * 2.0, .25, .03), (f * 5.9, .12, .008), (f * 3.0, .1, .015)], .25, .25, .002)
    return fade(x, .0003, .04)


# name: (generator, level dB (loudest 150 ms phone RMS re reference at v=1), reverb send, uses d as)
FX = {
    'sent': (fx_sent, 0, .08, None), 'read': (fx_read, -4, .06, None), 'typing': (fx_typing, -2, .04, 'dur'),
    'clock': (fx_clock, 0, .05, None), 'tick': (fx_tick, -3, .04, None), 'swstop': (fx_swstop, 1, .05, None),
    'wa': (fx_wa, 2, .1, None), 'thock': (fx_thock, 1, .08, None), 'stamp': (fx_stamp, 2, .12, None),
    'slam': (fx_slam, 3, .1, None), 'pop': (fx_pop, -2, .1, 'idx'), 'tap': (fx_tap, 1, .06, None),
    'swipe': (fx_swipe, -1, .1, 'dur'), 'whoosh': (fx_whoosh, 0, .15, None), 'whooshBig': (fx_whooshBig, 0, .2, None),
    'swoosh': (fx_swoosh, -1, .15, None), 'ff': (fx_ff, -3, .08, 'dur'), 'impact': (fx_impact, 3, .25, None),
    'coinFar': (fx_coinFar, -5, .4, None), 'coin': (fx_coin, -2, .15, None), 'coins': (fx_coins, -3, .12, 'dur'),
    'snip': (fx_snip, -2, .08, None), 'cells': (fx_cells, -3, .06, 'dur'), 'count': (fx_count, -1, .06, 'dur'),
    'switch': (fx_switch, 3, .1, None), 'toggleOn': (fx_toggleOn, 1, .1, None), 'patch': (fx_patch, 2, .1, None),
    'squeak': (fx_squeak, -5, .08, None), 'shimmer': (fx_shimmer, -6, .3, None), 'riser': (fx_riser, -1, .15, 'dur'),
    'up': (fx_up, -3, .12, 'dur'), 'paper': (fx_paper, -3, .1, None), 'flip': (fx_flip, -2, .1, None),
    'chime': (fx_chime, 1, .15, None), 'click': (fx_click, 0, .08, 'idx'), 'marker': (fx_marker, -3, .05, 'dur'),
}
PRE_ROLL = {'sent': .05}      # the bubble pop (not the swish that leads into it) lands on the cue time
LONG = {'marker', 'typing', 'ff', 'coins', 'cells', 'count', 'riser', 'up'}
TEXTURE = {'marker', 'typing', 'coins', 'riser', 'up', 'ff', 'swipe', 'whoosh', 'swoosh', 'whooshBig', 'paper'}
TEX_DUCK_DB = 6.0


# ================================================================== MUSIC: instruments (all return mono or stereo arrays)
def ep_note(r, f, dur, vel):
    """FM electric piano (Rhodes-like): ratio-1 modulator with decaying index + short tine."""
    rel = .3; n = ns(dur + rel); t = tt(n)
    I = (1.4 * vel + .4) * np.exp(-t / .3) + .2
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * f * t + r.uniform(0, 6)))
    y += np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t / .018) * .1 * vel
    amp = np.minimum(1, t / .003) * np.exp(-t / (.7 * (440 / f) ** .3 + .3)) * np.clip((dur + rel - t) / rel, 0, 1)
    return y * amp * vel


def vibes_note(r, f, dur, vel):
    rel = .5; n = ns(dur + rel); t = tt(n)
    y = modal(r, n, [(f, 1, 1.0), (f * 4.0, .2, .12), (f * 10.0, .04, .02)], contact_ms=.6, noise_amt=.04, jit=0)
    trem = 1 - .35 * (.5 + .5 * np.sin(2 * np.pi * 5.2 * t))
    return y * trem * np.clip((dur + rel - t) / rel, 0, 1) * vel


def bass_note(r, f, dur, vel, bright=1.0, fmax=1400, decay=5.0, rel=.03):
    """Additive bass: harmonics up to fmax (so it exists on phones), upper ones decaying faster."""
    n = ns(dur + rel); t = tt(n); y = np.zeros(n)
    for k in range(1, 40):
        if f * k > fmax:
            break
        a = 1.0 / k ** 1.15 * (1 if k == 1 else bright)
        y += a * np.sin(2 * np.pi * f * k * t + r.uniform(0, 6)) * np.exp(-t * (k - 1) * decay)
    amp = np.minimum(1, t / .004) * np.clip((dur + rel - t) / rel, 0, 1)
    return y * amp * vel


def ks_pluck(r, f, dur, vel, t60=.5, bright=.6, pos=.22, nz=.08):
    """Karplus-Strong string, all-pass fractional delay (in tune), triangle 'pluck' initial shape
    (12-15 dB crest instead of 20 dB for a noise burst), brightness by low-passing the shape. Peak = vel."""
    n = ns(dur); P = SR / f - .5
    L = int(np.floor(P - .1)); frac = P - L; c = (1 - frac) / (1 + frac)
    g = 10 ** (-3 / (t60 * f))
    den = np.zeros(L + 3); den[0] = 1; den[1] = c
    den[L] -= g * .5 * c; den[L + 1] -= g * .5 * (1 + c); den[L + 2] -= g * .5
    m = L + 1; k = max(1, int(m * pos)); i = np.arange(m)
    tri = np.where(i < k, i / k, (m - i) / (m - k)); tri -= tri.mean()
    burst = filt(np.concatenate([tri + nz * r.uniform(-1, 1, m), np.zeros(m)]), 'lowpass', min(SR * .45, f * (2 + 10 * bright)))
    exc = np.zeros(n); kk = min(n, m + m // 4); exc[:kk] = burst[:kk]
    y = signal.lfilter([1, c], den, exc)
    return fade(y / (np.abs(y).max() + 1e-12) * vel, .0008, min(.03, dur / 3))


def marimba_note(r, f, vel, dur=.6):
    n = ns(dur)
    y = modal(r, n, [(f, 1, .3 * (500 / f) ** .4), (f * 3.98, .28, .045), (f * 9.2, .06, .01)],
              contact_ms=.7, noise_amt=.08, jit=.002)
    return fade(y * vel, .0005, .06)


def pad_chord(r, notes, dur, vel, cut=1500, att=.3, rel=.5, det=.08, hp=200, trem=0.0):
    n = ns(dur + rel); t = tt(n)
    e = np.minimum(1, t / att) * np.clip((dur + rel - t) / rel, 0, 1)
    if trem:
        e = e * (1 - .45 * (.5 + .5 * np.sin(2 * np.pi * trem * t)))
    out = np.zeros((2, n))
    for m in notes:
        for dc, pn in ((-det, -.6), (0, 0), (det, .6)):
            out += pan2(polyblep_saw(hz(m) * 2 ** (dc / 12), n, r.random()), pn)
    return filt(filt(out, 'lowpass', cut), 'highpass', hp) * e * vel / (len(notes) * 1.7)


def stab_chord(r, notes, vel, dur=.4, cut=2200, tau=.12):
    n = ns(dur); t = tt(n); out = np.zeros((2, n))
    for m in notes:
        for dc, pn in ((-.07, -.5), (.07, .5)):
            out += pan2(polyblep_saw(hz(m) * 2 ** (dc / 12), n, r.random()), pn)
    e_f = env(n, .002, tau * .5); e_s = env(n, .002, tau)
    y = filt(out, 'lowpass', cut) * e_f + filt(out, 'lowpass', 700) * (e_s - e_f * .5)
    return fade(y * vel / len(notes), .0005, .05)


def kick(r, vel, soft=False):
    n = ns(.42); t = tt(n)
    f = 50 + 105 * np.exp(-t / .028)
    y = osc(f, n) * env(n, .003, .12 if soft else .14) * .55
    y += modal(r, n, [(330, .5, .014), (640, .3, .009), (1250, .12, .005)], contact_ms=.6, noise_amt=.2) * (.3 if soft else .45)
    y += nburst(r, n, (1500, 5000), .0006, .003) * (.05 if soft else .14)
    if soft:
        y = filt(y, 'lowpass', 1500)
    return fade(y * vel, .0005, .05)


def surdo(r, vel, muted=False):
    n = ns(.55); t = tt(n); f0 = 64
    y = osc(f0 * (1 + .12 * np.exp(-t / .02)), n) * env(n, .003, .1 if muted else .26)
    y += modal(r, n, [(f0 * 1.59, .4, .08), (f0 * 2.14, .3, .06), (f0 * 2.65, .2, .05), (f0 * 3.5, .14, .03),
                      (f0 * 5.2, .08, .02)], contact_ms=3, noise_amt=.1)
    y += nburst(r, n, (150, 1500), .001, .012) * .3
    return fade(y / (np.abs(y).max() + 1e-12) * vel, .0005, .08)


def clap(r, vel, lo=900, hi=4500):
    n = ns(.32); t = tt(n); e = np.zeros(n)
    for dt in (0, .008, .016):
        e += (t >= dt) * np.exp(-np.maximum(t - dt, 0) / .007) * .8
    e += (t >= .02) * np.exp(-np.maximum(t - .02, 0) / .085) * .8
    y = filt(r.standard_normal(n), 'bandpass', [lo, hi]) * e
    return fade(y / (np.abs(y).max() + 1e-12) * vel * .6, .0003, .03)


def snare(r, vel):
    n = ns(.3)
    y = filt(r.standard_normal(n), 'bandpass', [1500, 8000]) * env(n, .0005, .07) * .7
    y += modal(r, n, [(185, 1, .05), (330, .6, .03)], contact_ms=.8, noise_amt=.1) * .6
    return fade(y / (np.abs(y).max() + 1e-12) * vel, .0003, .03)


def shaker(r, vel):
    n = ns(.08)
    y = filt(r.standard_normal(n), 'bandpass', [2500, 9000]) * env(n, .006, .02)
    return fade(y * vel, .001, .01)


def hat(r, vel, open_=False):
    n = ns(.25 if open_ else .06)
    y = filt(r.standard_normal(n), 'bandpass', [6500, 12000]) * env(n, .0004, .09 if open_ else .014)
    return fade(y / (np.abs(y).max() + 1e-12) * vel, .0003, .01)


def ganza(r, vel):
    """One ganzá stroke: a cloud of bead grains over ~18 ms."""
    n = ns(.07); e = np.zeros(n); t = tt(n)
    for _ in range(7):
        d0 = r.uniform(0, .018)
        e += (t >= d0) * np.exp(-np.maximum(t - d0, 0) / .006) * r.uniform(.3, 1)
    y = filt(r.standard_normal(n), 'bandpass', [3500, 11000]) * e * np.minimum(1, t / .004)
    return fade(y / (np.abs(y).max() + 1e-12) * vel * .5, .0005, .01)


def agogo(r, f, vel):
    n = ns(.4)
    y = modal(r, n, [(f, 1, .14), (f * 2.42, .35, .06), (f * 3.93, .18, .03), (f * 5.6, .08, .012)],
              contact_ms=.15, noise_amt=.2, jit=.002)
    return fade(y / (np.abs(y).max() + 1e-12) * vel, .0003, .05)


def tom(r, f, vel):
    n = ns(.4); t = tt(n)
    y = osc(f * (1 + .25 * np.exp(-t / .015)), n) * env(n, .002, .12)
    y += modal(r, n, [(f * 1.59, .35, .05), (f * 2.14, .2, .035)], 1.5, .1) + nburst(r, n, (300, 3000), .0005, .01) * .25
    return fade(y * vel, .0005, .05)


def drip(r, f_end, vel):
    """Water drop: a bubble resonance whose pitch rises ~1.5x in 15 ms, soft splash, no harsh sine."""
    n = ns(.16); t = tt(n)
    f = f_end * (1 - .34 * np.exp(-t / .014))
    y = (osc(f, n) + .22 * osc(2 * f, n)) * env(n, .004, .05)
    y += modal(r, n, [(f_end * .5, .25, .03)], 1.0, .1)
    y += nburst(r, n, (2500, 7000), .0005, .004) * .08
    return fade(y * vel, .0005, .03)


def cymbal_swell(r, d, vel):
    """Reverse-cymbal style swell ending exactly at the end of the buffer."""
    n = ns(d); u = np.linspace(0, 1, n)
    y = swept_noise(r, n, 2500 * 2.5 ** u, 1.0) * u ** 3
    return y * vel


def strum(r, notes, vel, down=True, t60=.6, bright=.75, dur=.9, spread=.009):
    """Cavaquinho-style strum: strings 6 ms apart (one gesture, not a flam), first string on the grid."""
    n = ns(dur + spread * len(notes)); out = np.zeros((2, n))
    seq = notes if down else notes[::-1]
    for k, m in enumerate(seq):
        y = ks_pluck(r, hz(m), dur, vel * (1 - .08 * k), t60, bright)
        place(out, y, i0=ns(k * spread), p=-.3 + .2 * k)
    return out


# ================================================================== MUSIC: arrangement
class Score:
    STEMS = ('hold', 'bass', 'mid', 'pad', 'drums', 'perc')

    def __init__(self):
        self.st = {k: np.zeros((2, N)) for k in self.STEMS}
        self.send = np.zeros((2, N))

    def add(self, stem, x, t0=None, g=1.0, p=0.0, send=0.0, i0=None):
        place(self.st[stem], x, t0, g, p, i0)
        if send:
            place(self.send, x, t0, g * send, p, i0)


def hold_music(sc):
    """0-4.10 cheesy bossa 'música de espera' on a phone line, tape stop 4.10-4.40, then digital silence."""
    r = np.random.default_rng(101)
    L = ns(4.75); buf = np.zeros((2, L)); hb = .6

    def put(x, t0, g=1.0, p=0.0):
        place(buf, x, t0, g, p)
    chords = [(41, [57, 60, 64, 67]), (38, [60, 64, 65, 69]), (43, [58, 62, 65, 69]), (36, [58, 62, 64, 67])]
    for ci, (root, vo) in enumerate(chords):
        t0 = ci * 2 * hb
        for off, dur, vel in ((0, .55, .8), (1.5 * hb, .45, .65)):
            for k, m in enumerate(vo):
                put(ep_note(r, hz(m), dur, vel * (.85 + .15 * (k == len(vo) - 1))), t0 + off, .22, (k - 1.5) * .2)
        put(bass_note(r, hz(root + 12), .8 * hb, .9, .8, 1800, 3.0, .05), t0, .5)
        put(bass_note(r, hz(root + 19), .4 * hb, .8, .8, 1800, 3.0, .05), t0 + 1.5 * hb, .45)
    for k in range(int(4.8 / (hb / 4))):
        put(shaker(r, (.55, .3, .75, .4)[k % 4]), k * hb / 4, .5, .3)
    mel = [(0, 76, 1), (1, 72, .5), (1.5, 74, .5), (2, 77, 1.5), (3.5, 76, .5), (4, 74, 1), (5, 70, .5), (5.5, 72, .5),
           (6, 76, 1.5), (7.5, 74, .5)]
    for b0, m, d in mel:
        put(vibes_note(r, hz(m), d * hb * .9, .8), b0 * hb, .3, .15)
    # the phone line: mono, wow & flutter, 300-3400 Hz, a little hiss
    x = buf.mean(0); t = tt(L)
    c = t + .0011 * np.sin(2 * np.pi * .9 * t) + .00022 * np.sin(2 * np.pi * 6.5 * t + 1)
    x = np.interp(c, t, x)
    x = filt(filt(x, 'highpass', 300, 4), 'lowpass', 3400, 4)
    x += filt(r.standard_normal(L), 'bandpass', [300, 3400]) * np.sqrt(np.mean(x ** 2)) * 10 ** (-40 / 20)
    # tape stop: speed falls from 1 to 0 over 0.30 s
    n_out = ns(STOP_END); tau = tt(n_out); c = tau.copy()
    k0 = ns(HOLD_END); u = (tau[k0:] - HOLD_END) / (STOP_END - HOLD_END)
    speed = (1 - u) ** 1.6
    c[k0:] = HOLD_END + np.cumsum(speed) / SR
    y = np.interp(c, t, x)
    e = np.ones(n_out); e[k0:] = (1 - u) ** .35
    y = filt(y * e, 'highpass', 25)
    y = fade(y, .002, .03)
    sc.add('hold', pan2(y, 0), 0.0)


def tension(sc):
    """4.70-20.30: D minor ostinato, 100 BPM grid from M0, swell peaking at 20.30 then hard stop."""
    r = np.random.default_rng(201)
    Dm, Bb, Gm, AA = (38, [62, 65, 69]), (46, [62, 65, 70]), (43, [62, 67, 70]), (45, [61, 64, 69])

    def chord(b):
        return Dm if b < 4 else Bb if b < 8 else Gm if b < 10.5 else Dm if b < 20 else Bb if b < 22 else Gm if b < 24 else AA
    tb = lambda b: M0 + b * BT
    for k in range(52):                                     # 8th notes
        b = k / 2; t0 = tb(b); root, tones = chord(b); s = k % 8
        twist = 10.5 <= b < 17.5
        build = 17.5 <= b < 24
        swell = b >= 24
        lvl = .58 if swell else 1.0
        if build:
            lvl = .66 + .2 * (b - 17.5) / 6.5
        if not twist:
            iv = [0, 12, 0, 7, 12, 0, 7, 10 if root == 45 else 12][s]
            sc.add('bass', bass_note(r, hz(root + iv), BT / 2 * .85, .3 * lvl, 2.0, 1400, 2.0), t0)
            seq = [tones[2], tones[0] + 12, tones[1] + 12, tones[0] + 12, tones[2], tones[0] + 12, tones[1] + 12, tones[2] + 12]
            m = seq[s]
            sc.add('mid', ks_pluck(r, hz(m), .35, .22 * lvl, .24, .45), t0, 1, -.25, .15)
            if b >= 5:
                sc.add('mid', marimba_note(r, hz(m), .2 * lvl, .55), t0, 1, .3, .25)
            if swell:                                         # 16ths in the swell
                sc.add('bass', bass_note(r, hz(root + (0 if s % 2 else 12)), BT / 4 * .8, .35, 2.0, 1400, 2.0), t0 + BT / 4)
                sc.add('mid', ks_pluck(r, hz(seq[(s + 3) % 8]), .25, .25, .18, .5), t0 + BT / 4, 1, .25, .15)
        else:
            m = [74, 74, 75, 74][s % 4]                        # pizzicato D5 / Eb5 neighbour: suspense
            sc.add('mid', ks_pluck(r, hz(m), .5, .24, .32, .5), t0, 1, .2 * (1 if s % 2 else -1), .35)
        if k % 2 == 0:                                        # on the beat
            if twist:
                sc.add('drums', kick(r, .5, soft=True), t0)
                sc.add('drums', kick(r, .3, soft=True), t0 + BT / 4)
            elif b >= 18 or b == 5 or (5 < b < 10.5 and b % 2 == 0):
                sc.add('drums', kick(r, .62 * lvl), t0)
            if (b >= 20 and b % 2 == 1) and not swell:
                sc.add('drums', clap(r, .5 * lvl), t0, 1, 0, .3)
        if not twist and (b >= 5 or s % 2 == 1):
            sc.add('perc', hat(r, .22 if s % 2 else .14), t0, 1, .35)
        if (twist or b >= 22) and not swell:
            sc.add('perc', hat(r, .08 if twist else .12), t0 + BT / 4, 1, -.3)
    # mid-register strings doubling the harmony (sustained: phone presence with a low crest factor)
    for b0, b1, ch in ((0, 4, [62, 65, 69]), (4, 8, [62, 65, 70]), (8, 10.5, [62, 67, 70]),
                       (17.5, 20, [62, 65, 69]), (20, 22, [62, 65, 70]), (22, 24, [62, 67, 70])):
        v = .28 if b0 < 4 else .34 if b0 < 10.5 else .32 + .05 * (b0 - 17.5) / 4.5
        sc.add('pad', pad_chord(r, ch, (b1 - b0) * BT, v, 2200, .12 if b0 else .3, .1, .12, 300), tb(b0), 1, 0, .3)
    # pads
    sc.add('pad', pad_chord(r, [50, 57, 62, 65], 2.4, .5, 900, .4, .3), tb(0), 1, 0, .4)
    sc.add('pad', pad_chord(r, [46, 58, 62, 65], 2.4, .5, 1000, .3, .3), tb(4), 1, 0, .4)
    sc.add('pad', pad_chord(r, [43, 55, 62, 67], 1.5, .55, 1100, .2, .1), tb(8), 1, 0, .4)
    sc.add('pad', pad_chord(r, [50, 57, 63, 64, 69], 4.2, .5, 1600, .6, .12, trem=1 / (BT / 4) / 2), tb(10.5), 1, 0, .5)
    sc.add('pad', pad_chord(r, [26, 38], 4.2, .35, 400, .5, .1, hp=30), tb(10.5), 1, 0, 0)
    for b0, ch, cut in ((17.5, [50, 57, 62, 65], 1300), (20, [46, 58, 62, 65], 1700), (22, [43, 55, 62, 67], 2100)):
        d = (20 if b0 == 17.5 else b0 + 2) - b0
        sc.add('pad', pad_chord(r, ch, d * BT, .55 + .1 * (b0 - 17.5) / 4.5, cut, .15, .08), tb(b0), 1, 0, .4)
    # 19.10-20.30 swell on the dominant: crescendo pad, accelerating snare roll, toms, reverse cymbal
    sw_d = SMASH - tb(24); n = ns(sw_d); u = np.linspace(0, 1, n)
    p = pad_chord(r, [45, 57, 61, 64, 69], sw_d, .34, 2600, .05, .01)
    p *= (.45 + .55 * np.clip(tt(p.shape[1]) / sw_d, 0, 1) ** 1.5)
    sc.add('pad', p, tb(24), 1, 0, .3)
    k = 0; t0 = tb(24)
    while t0 < SMASH - 1e-6:
        pr = (t0 - tb(24)) / sw_d
        sc.add('drums', snare(r, .055 + .13 * pr ** 1.4), t0, 1, 0, .2)
        step = BT / 4 if pr < .5 else BT / 8
        k += 1; t0 = tb(24) + round((t0 + step - tb(24)) / (BT / 8)) * (BT / 8)
    for j, f in enumerate((180, 150, 120, 98)):
        sc.add('drums', tom(r, f, .2 + .04 * j), tb(25) + j * BT / 4, 1, -.3 + .2 * j)
    sc.add('perc', pan2(cymbal_swell(r, sw_d, .1), 0), tb(24))
    sc.add('drums', kick(r, .4), tb(24)); sc.add('drums', kick(r, .45), tb(25))


CTA_LVL = 1.0                         # CTA arrangement level (about -6 dB vs the brand groove)


def groove_part(sc, ga=GA):
    """23.086-43.45: drips, hole, riser, Brazilian pop groove (112 BPM), fill, gate, brand drop, CTA, final sting."""
    r = np.random.default_rng(301)
    # drips on the beat A-6B .. A-3B with a low pulse
    for j, m in enumerate((81, 78, 74, 81)):
        t0 = A - (6 - j) * B
        sc.add('mid', drip(r, hz(m), .17), t0, 1, (-.3, .3, -.15, .15)[j], .5)
        sc.add('bass', bass_note(r, hz(38), .22, .28, 1.5, 800, 6.0, .12), t0)
        sc.add('drums', kick(r, .25, soft=True), t0)
    # riser 25.35 -> 26.30: dominant A7sus opening up + 8th/16th build
    rd = A - 25.35; n = ns(rd); u = np.linspace(0, 1, n)
    p = pad_chord(r, [45, 57, 62, 64, 67, 69], rd, 1.0, 6000, .05, .005)
    p = np.vstack([stft_filter(p[c], lambda f, tm: 1 / (1 + (f / (350 * 14 ** np.clip(tm / rd, 0, 1) ** 1.3)) ** 4)) for c in range(2)])
    p *= (.25 + .75 * np.clip(tt(p.shape[1]) / rd, 0, 1) ** 1.6)
    sc.add('pad', p, 25.35, 1, 0, .3)
    for j in range(4):
        sc.add('drums', snare(r, .1 + .1 * j), A - 2 * B + j * B / 4 + B, 1, 0, .2)

    D, G, Bm, AA = (38, [62, 66, 69, 74]), (43, [62, 67, 71, 74]), (35, [62, 66, 71, 74]), (45, [61, 64, 69, 73])

    def groove(t0, bars, lvl=1.0, agog=True, cav=True, cav_cut=None, fill_at=None, perc_lvl=1.0, skip_first=False):
        for bi, ch in enumerate(bars):
            root, tones = ch
            bar0 = t0 + bi * 4 * B
            for b in range(4):
                tb = bar0 + b * B
                if fill_at is not None and tb >= fill_at - 1e-6:
                    break
                if b in (0, 2):
                    sc.add('drums', kick(r, .55 * lvl), tb)
                if b == 1:
                    sc.add('drums', kick(r, .38 * lvl), tb + .75 * B)
                if b in (1, 3):
                    sc.add('drums', surdo(r, .5 * lvl, muted=(b == 1)), tb)
                    sc.add('drums', clap(r, .42 * lvl), tb, 1, 0, .25)
                for s in range(4):
                    sc.add('perc', ganza(r, (.5, .3, .6, 1.0)[s] * .55 * lvl * perc_lvl), tb + s * B / 4, 1, .4)
            # bass: syncopated pattern
            for off, iv, d in ((0, 0, .6), (.75, 0, .22), (1.5, 7, .4), (2, 12, .3), (2.75, 0, .22), (3.5, 7, .4)):
                tn = bar0 + off * B
                if fill_at is not None and tn >= fill_at - 1e-6:
                    continue
                sc.add('bass', bass_note(r, hz(root + iv), d * B, .34 * lvl, 2.0, 1400, 2.0), tn)
            dur = 4 * B if fill_at is None else min(4 * B, fill_at - bar0)
            if dur > 0:
                sc.add('pad', pad_chord(r, [m - 12 for m in tones], dur, .55 * lvl, 1400, .04, .15), bar0, 1, 0, .35)
            if cav:
                for pos, down, v in ((0, 1, 1.0), (3, 0, .6), (6, 1, .8), (8, 0, .7), (10, 1, .85), (13, 0, .6)):
                    ts = bar0 + pos * B / 4
                    if fill_at is not None and ts >= fill_at - 1e-6 or (skip_first and bi == 0 and pos == 0):
                        continue
                    x = strum(r, tones, .17 * v * lvl, bool(down), .45, .7, .5)
                    if cav_cut:
                        x = filt(x, 'lowpass', cav_cut)
                    sc.add('mid', x, ts, 1, 0, .25)
            if agog:
                for pos, hi in ((0, 1), (2, 0), (6, 1), (10, 1), (12, 0)):
                    ts = bar0 + pos * B / 4
                    if fill_at is not None and ts >= fill_at - 1e-6 or (skip_first and bi == 0 and pos == 0):
                        continue
                    sc.add('perc', agogo(r, 1174.7 if hi else 880.0, .16 * lvl), ts, 1, -.35, .2)

    # 26.30 groove: | D | G (fill from beat 6) |, gate from A+8B
    groove(A, [D, G], 1.0, fill_at=FILL_T, skip_first=True)
    for j in range(8):                                        # 2-beat fill on the 16th grid: low toms -> snare
        ts = FILL_T + j * B / 4; v = .3 + .7 * (j / 7) ** 1.3
        if j < 6:
            sc.add('drums', tom(r, (98, 98, 120, 120, 150, 150)[j], v * .8), ts, 1, (-.3, -.3, 0, 0, .3, .3)[j])
        else:
            sc.add('drums', snare(r, v * .7), ts, 1, 0, .2)
        if j % 2 == 0:
            sc.add('bass', bass_note(r, hz(45 + (0, 0, 7, 12)[j // 2]), B / 2 * .8, .5 * v + .2, 1.0, 1300, 4.0), ts)
    # brand drop: stab sample-aligned with the impact cue, then the groove peak (1-4 kHz left for SFX/VO)
    ga_i = ns(ga)                                              # = the impact cue's own sample
    sc.add('pad', stab_chord(r, [50, 54, 57, 62], .22, .5, 1600, .14), i0=ga_i, send=.3)
    groove(ga, [D, G], .95, agog=False, cav_cut=1600, perc_lvl=1.1)
    # CTA: -6 dB, harmonic (pad + plucks + soft kick + bass an octave up), | Bm | G A | -> final sting D
    def cta_bar(bar0, chs):
        for b in range(4):
            tb = bar0 + b * B
            root, tones = chs[min(len(chs) - 1, b // 2)]
            if b in (0, 2):
                sc.add('drums', kick(r, .24 * CTA_LVL, soft=True), tb)
            if b in (1, 3):
                sc.add('drums', clap(r, .11 * CTA_LVL, 700, 3000), tb, 1, 0, .25)
            for s in range(4):
                sc.add('perc', ganza(r, (.5, .3, .6, 1.0)[s] * .17 * CTA_LVL), tb + s * B / 4, 1, .4)
            sc.add('bass', bass_note(r, hz(root), .45 * B, .15 * CTA_LVL, 2.0, 1400, 2.0), tb)
            sc.add('bass', bass_note(r, hz(root + (7 if b % 2 else 12)), .2 * B, .1 * CTA_LVL, 2.0, 1400, 2.0), tb + .75 * B)
            for s in range(2):
                m = tones[(2 * b + s) % 4] + 12
                sc.add('mid', ks_pluck(r, hz(m), .45, .09 * CTA_LVL, .38, .6), tb + s * B / 2, 1, (-.3, .3)[s], .3)
        for k, (root, tones) in enumerate(chs):
            d = 4 * B / len(chs)
            sc.add('pad', pad_chord(r, [m - 12 for m in tones], d, .3 * CTA_LVL, 1500, .06, .12), bar0 + k * d, 1, 0, .4)
    cta_bar(CTA_T, [Bm])
    cta_bar(CTA_T + 4 * B, [G, AA])
    # final sting on FINAL_T: short D major hit that decays out well before END_SIL
    fs = ns(FINAL_T)
    x = strum(r, [62, 66, 69, 74, 78], .15, True, .2, .75, .4, spread=.009)
    sc.add('mid', x, i0=fs, send=.08)
    sc.add('mid', marimba_note(r, hz(81), .17, .3), i0=fs + ns(.045), p=.2, send=.06)
    sc.add('drums', kick(r, .38, soft=True), i0=fs)
    sc.add('bass', bass_note(r, hz(38), .22, .3, 2.0, 1400, 3.0, .06), i0=fs)
    sc.add('pad', stab_chord(r, [50, 54, 57, 62], .22, .35, 1800, .07), i0=fs)


def authority(sc, ga=GA):
    """'O GOOGLE RESPONDE': D major 112 BPM. Intro build under the search (0-8B), results drop at 8B, lift for the
    quote (28B), brand hit on the proof (60B), lighter harmonic CTA (70B), final sting (78B)."""
    r = np.random.default_rng(401)
    D, G, Bm, AA = (38, [62, 66, 69, 74]), (43, [62, 67, 71, 74]), (35, [62, 66, 71, 74]), (45, [61, 64, 69, 73])
    PROG = [D, G, Bm, AA]
    # intro: pulsing plucks rising, soft pad, kick from beat 4, riser into the drop
    for k in range(16):
        t0 = k * B / 2; root, tones = D if k < 8 else AA
        sc.add('mid', ks_pluck(r, hz([tones[0], tones[2], tones[1], tones[3]][k % 4] + (12 if k >= 12 else 0)), .3, .14 + .012 * k, .3, .5), t0, 1, (-.25, .25)[k % 2], .2)
        if k >= 8 and k % 2 == 0:
            sc.add('drums', kick(r, .3 + .04 * (k - 8), soft=True), t0)
        sc.add('perc', hat(r, .08 + .01 * k), t0 + B / 4, 1, .3)
    sc.add('pad', pad_chord(r, [50, 57, 62, 66], 4 * B, .4, 1100, .5, .1), 0.0, 1, 0, .35)
    sc.add('pad', pad_chord(r, [45, 57, 61, 64, 69], 4 * B, .45, 1600, .1, .05), 4 * B, 1, 0, .35)
    for j in range(8):
        sc.add('drums', snare(r, .05 + .025 * j), 6 * B + j * B / 4, 1, 0, .2)

    def bar(bar0, ch, lvl, agog=False, cav=True):
        root, tones = ch
        for b in range(4):
            tb = bar0 + b * B
            if b in (0, 2): sc.add('drums', kick(r, .5 * lvl), tb)
            if b == 1: sc.add('drums', kick(r, .32 * lvl), tb + .75 * B)
            if b in (1, 3):
                sc.add('drums', surdo(r, .42 * lvl, muted=(b == 1)), tb)
                sc.add('drums', clap(r, .36 * lvl), tb, 1, 0, .25)
            for q in range(4):
                sc.add('perc', ganza(r, (.5, .3, .6, 1.0)[q] * .45 * lvl), tb + q * B / 4, 1, .4)
        for off, iv, d in ((0, 0, .6), (.75, 0, .22), (1.5, 7, .4), (2, 12, .3), (2.75, 0, .22), (3.5, 7, .4)):
            sc.add('bass', bass_note(r, hz(root + iv), d * B, .3 * lvl, 2.0, 1400, 2.0), bar0 + off * B)
        sc.add('pad', pad_chord(r, [m - 12 for m in tones], 4 * B, .5 * lvl, 1400, .04, .15), bar0, 1, 0, .35)
        if cav:
            for pos, down, v in ((0, 1, 1.0), (3, 0, .6), (6, 1, .8), (8, 0, .7), (10, 1, .85), (13, 0, .6)):
                sc.add('mid', filt(strum(r, tones, .14 * v * lvl, bool(down), .45, .7, .5), 'lowpass', 2000), bar0 + pos * B / 4, 1, 0, .25)
        if agog:
            for pos, hi in ((0, 1), (2, 0), (6, 1), (10, 1), (12, 0)):
                sc.add('perc', agogo(r, 1174.7 if hi else 880.0, .13 * lvl), bar0 + pos * B / 4, 1, -.35, .2)
    # results drop: stab on 8B, then grooves; the quote section (28B-40B) lifts with agogo
    sc.add('pad', stab_chord(r, [50, 54, 57, 62], .2, .45, 1600, .12), A, send=.3)
    b0 = 8; k = 0
    while b0 < 60:
        lvl = .9 if 28 <= b0 < 40 else .78
        nb = min(4, 60 - b0)
        if nb == 4:
            bar(b0 * B, PROG[k % 4], lvl, agog=(28 <= b0 < 40))
        else:
            for j in range(nb * 4):
                sc.add('drums', snare(r, .08 + .03 * j), b0 * B + j * B / 4, 1, 0, .2)
        b0 += 4; k += 1
    # proof hit (sample-aligned with the impact cue) and full groove
    sc.add('pad', stab_chord(r, [50, 54, 57, 62], .24, .5, 1700, .14), i0=ns(ga), send=.3)
    bar(ga, D, 1.0, agog=True); bar(ga + 4 * B, G, 1.0, agog=True)
    for j in range(8):
        sc.add('drums', tom(r, (98, 98, 120, 120, 150, 150, 180, 180)[j], .3 + .05 * j), ga + 8 * B + j * B / 4, 1, -.3 + .08 * j)
    # CTA: harmonic, lighter
    for bi, ch in enumerate((Bm, G, AA, D)):
        bar0 = CTA_T + bi * 2 * B; root, tones = ch
        for b in range(2):
            tb = bar0 + b * B
            sc.add('drums', kick(r, .24, soft=True), tb)
            for q in range(4):
                sc.add('perc', ganza(r, (.5, .3, .6, 1.0)[q] * .16), tb + q * B / 4, 1, .4)
            sc.add('bass', bass_note(r, hz(root), .45 * B, .16, 2.0, 1400, 2.0), tb)
            for q in range(2):
                sc.add('mid', ks_pluck(r, hz(tones[(2 * b + q) % 4] + 12), .45, .09, .38, .6), tb + q * B / 2, 1, (-.3, .3)[q], .3)
        sc.add('pad', pad_chord(r, [m - 12 for m in tones], 2 * B, .3, 1500, .06, .12), bar0, 1, 0, .4)
    fs = ns(FINAL_T)
    sc.add('mid', strum(r, [62, 66, 69, 74, 78], .15, True, .5, .75, 1.0, spread=.009), i0=fs, send=.12)
    sc.add('mid', marimba_note(r, hz(81), .17, .5), i0=fs + ns(.045), p=.2, send=.08)
    sc.add('drums', kick(r, .38, soft=True), i0=fs)
    sc.add('bass', bass_note(r, hz(38), .6, .3, 2.0, 1400, 3.0, .2), i0=fs)
    sc.add('pad', pad_chord(r, [50, 57, 62, 66], 1.0, .3, 1500, .02, .4), i0=fs, send=.3)


SILENT_MUSIC = [(END_SIL, None)]
MUSIC_GATE = np.ones(N)               # filled by build_music()
SFX_GATE = np.ones(N)                 # the vácuo and the end are digital silence for the effects too
SFX_GATE[ns(END_SIL):] = 0
if os.environ.get('VACUO_SFX', '0') != '1':
    SFX_GATE[ns(STOP_END):ns(M0)] = 0
STEM_GAIN = {'hold': 1.0, 'bass': .4, 'mid': 1.7, 'pad': .76, 'drums': .7, 'perc': .9}


def brand_anchor(cues):
    """The brand drop is sample-aligned with the 'impact' cue nearest to GA (if within 40 ms)."""
    c = [x['t'] for x in cues if x['n'] == 'impact' and abs(x['t'] - GA) < .04]
    return c[0] if c else GA


def build_music(cues, stem_gain=None):
    """Returns the music bus (2, N) before ducking, and the Score (stems) for analysis."""
    sg = dict(STEM_GAIN, **(stem_gain or {}))
    ga = brand_anchor(cues)
    sc = Score(); authority(sc, ga)
    dry = sum(sc.st[k] * sg[k] for k in sc.STEMS)
    wet = convolve_st(sc.send, make_ir(1.5, pre=.02, lp=5200, seed=9)) * .32
    t = tt(N)
    wet *= np.clip((END_SIL - t) / (END_SIL - 42.6), 0, 1)       # reverb return fades with the final sting
    mus = filt(dry + wet, 'highpass', 30)
    g = np.ones(N)
    for a, b in SILENT_MUSIC:
        i0 = ns(a); i1 = N if b is None else ns(b)
        fl = ns(.004) if a not in (HOLE[0], END_SIL) else ns(.03 if a == HOLE[0] else .1)
        g[i0:i1] = 0
        g[i0 - fl:i0] = np.minimum(g[i0 - fl:i0], np.linspace(1, 0, fl))
    MUSIC_GATE[:] = g                                         # re-applied after duck / ride / EQ: silences stay exact
    return mus * g, sc


# ================================================================== PHONE SIMULATION & METERS
def _aweight_sos():
    f1, f2, f3, f4 = 20.598997, 107.65265, 737.86223, 12194.217
    z = [0, 0, 0, 0]; p = [-2 * np.pi * f1] * 2 + [-2 * np.pi * f2, -2 * np.pi * f3] + [-2 * np.pi * f4] * 2
    k = (2 * np.pi * f4) ** 2 * 10 ** (1.9997 / 20)
    zd, pd, kd = signal.bilinear_zpk(z, p, k, SR)
    return signal.zpk2sos(zd, pd, kd)


AW = _aweight_sos()
PHONE_SOS = np.vstack([signal.butter(4, 300, 'highpass', fs=SR, output='sos'),
                       signal.butter(4, 8000, 'lowpass', fs=SR, output='sos'), AW])


def phone(x):
    """Phone speaker simulation: mono fold-down, HP 300 Hz + LP 8 kHz (4th order), A-weighting."""
    m = x.mean(0) if x.ndim == 2 else x
    return signal.sosfilt(PHONE_SOS, m)


def loudest_db(x, win=.15):
    """Loudest `win` RMS (dB) of a mono signal."""
    w = min(ns(win), len(x) - 1)
    c = np.cumsum(np.concatenate([[0], x ** 2]))
    return 10 * np.log10(np.max((c[w:] - c[:-w]) / w) + 1e-20)


METER = pyln.Meter(SR)


def lufs(x):
    v = METER.integrated_loudness(x.T)
    return float(v) if np.isfinite(v) else -99.0


def true_peak_db(x):
    """True peak with 4x oversampling (polyphase FIR)."""
    return float(20 * np.log10(np.max(np.abs(signal.resample_poly(x, 4, 1, axis=-1))) + 1e-12))


# ================================================================== SFX RENDERING
PEAK_CAP_DB = -2.2                   # no single cue may peak above this in the final mix (before the limiter)
PEAK_CAP_HERO = -2.6                 # ... at the four hero instants (limiter GR <= 2 dB there)
SFX_HP_HZ = None                     # set by mix_vo.py: effects high-passed under the voice
G_DB_EST = 0.0                       # master gain estimate (dB) used by the cap; updated by gain_loop
HERO_TIMES = (GA,)        # limiter GR must stay <= 2 dB here (<= 3 dB elsewhere)
REF_DB = -16.0                       # loudest-150 ms phone RMS of a level-0 cue at v = 1 (bus dBFS)
IR_SFX = make_ir(.75, pre=.008, lp=7500, seed=5)
VACUO = (STOP_END, M0)               # 4.40-4.70: total digital silence (the 'vácuo' beat)
VACUO_SFX = os.environ.get('VACUO_SFX', '0') == '1'   # 1 = let a cue that starts inside the vácuo play


def load_cues():
    cues = []
    for i, c in enumerate(CUES_DATA['cues']):
        c = dict(c); c['i'] = i; c['t'] = float(c['t'])
        cues.append(c)
    cues.sort(key=lambda c: (c['t'], c['i']))
    return cues


BLOOM = {'shimmer', 'squeak', 'whoosh', 'swoosh', 'whooshBig'}   # bloom / peak after the hit they start on:
#   measured separately as layers (>= 0 dB) when they start on a higher-priority cue
MERGE_SPAN = {'wa': .13, 'sent': .06}   # the two-note reply motif occupies 130 ms; the sent gesture 60 ms


def classify(cues):
    """hero / normal / layer, plus same-event merges.
    A cue that starts on another, higher-priority cue's event (within -30 ms .. +30 ms, or inside the wa's two-note
    motif) is the same audible event: it is rendered and summed into that cue and measured as part of it.
    Shimmer and squeak are designed to bloom after their hit and are measured on their own (target >= 0 dB)."""
    pr = {n: k for k, n in enumerate(PRIORITY)}
    for c in cues:
        c['cls'] = 'hero' if c['n'] in HERO else 'layer' if c['n'] in SWEET else 'normal'
        c['layer_of'] = None; c['merge_into'] = None
    for c in cues:
        if c['n'] in BLOOM:
            for o in cues:
                if o is not c and abs(o['t'] - c['t']) <= .08 and pr.get(o['n'], 99) < pr.get(c['n'], 99):
                    c['layer_of'] = f"{o['n']}@{o['t']:.3f}"; c['cls'] = 'layer'; break
            continue
        best = None
        for o in cues:
            if o is c or o['n'] in BLOOM or pr.get(o['n'], 99) >= pr.get(c['n'], 99):
                continue
            if o['t'] - LAYER_DT <= c['t'] <= o['t'] + max(LAYER_DT, MERGE_SPAN.get(o['n'], 0)):
                if best is None or pr[o['n']] < pr[best['n']]:
                    best = o
        if best is not None:
            c['merge_into'] = best['i']
    for c in cues:
        c['target'] = TARGET[c['cls']]
        hits = [o for o in cues if o is not c and o['n'] not in TEXTURE and o['n'] not in SWEET and o.get('merge_into') is None]
        gaps = [o['t'] - PRE_ROLL.get(o['n'], 0.0) - c['t'] for o in hits]
        gaps = [g for g in gaps if g > .03]
        c['gap_next'] = min(gaps) if gaps else None
        c['ctx_after'] = any(.02 < c['t'] - o['t'] < .25 for o in hits)
    return cues


def render_cue(c):
    """Dry + reverb contribution of one cue (stereo) and its start sample. Deterministic per cue instance."""
    name = c['n'] if c['n'] in FX else 'tap'
    gen, lvl, send, darg = FX[name]
    r = np.random.default_rng(seed_of(c['n'], c['i'], int(round(c['t'] * 1000))))
    gap = c.get('gap_next')
    if name in ('whoosh', 'swipe') and c.get('merge_into') is None and gap is not None and .04 <= gap <= .3:
        d = float(np.clip(gap + .05, .1, .34))                 # lead-in: peaks ~45 ms before the hit, gone by it
        x = gen(r, d=d, peak=max(.03, gap - .045) / d)
    elif name in ('whoosh', 'swipe') and c.get('merge_into') is None and c.get('ctx_after'):
        x = gen(r, d=.44 if name == 'whoosh' else .36, peak=.55)   # starts in a hit's tail: peaks late
    elif name == 'swipe' and c.get('merge_into') is not None:
        x = gen(r, flick=True)                         # the bubble's flick, part of its sent / reply gesture
    elif darg == 'dur':
        x = gen(r, float(c['d'])) if 'd' in c else gen(r)
    elif darg == 'idx':
        x = gen(r, int(round(c['d'])) if 'd' in c else (0 if name == 'click' else c['i'] % 5))
    else:
        x = gen(r)
    lv = loudest_db(phone(x))
    g = 10 ** ((REF_DB + lvl + c.get('extra_db', 0.0) - lv) / 20) * float(c.get('v', 1.0))
    dry = (pan2(x, c.get('p', 0.0)) if x.ndim == 1 else x) * g
    if SFX_HP_HZ:                                              # dialogue-friendly voicing (mix_vo.py only)
        dry = peq(filt(dry, 'highpass', SFX_HP_HZ, 2), 420, -3.0, 1.0)
    pk = 20 * np.log10(np.abs(dry).max() + 1e-12)
    cap = (PEAK_CAP_HERO if any(abs(c['t'] - h) < .03 for h in HERO_TIMES) else PEAK_CAP_DB) - G_DB_EST
    c['capped_db'] = round(min(0.0, cap - pk), 2)                # level choice, not a clipper: the whole cue is scaled
    dry = dry * 10 ** (c['capped_db'] / 20)
    wet = convolve_st(np.pad(dry, ((0, 0), (0, IR_SFX.shape[1]))), IR_SFX) * send
    out = np.pad(dry, ((0, 0), (0, IR_SFX.shape[1]))) + wet
    i0 = int(round((c['t'] - PRE_ROLL.get(name, 0.0)) * SR))
    # nothing may sound in the vácuo window: tails of earlier cues fade out at its start
    v0, v1 = ns(VACUO[0]), ns(VACUO[1])
    if i0 < v0 < i0 + out.shape[1]:
        k = v0 - i0; f = ns(.006)
        out = out[:, :k].copy(); out[:, max(0, k - f):] *= np.linspace(1, 0, min(f, k))
    elif v0 <= i0 < v1 and not VACUO_SFX:
        out = np.zeros((2, 1)); c['muted'] = 'starts inside the 4.40-4.70 vácuo silence'
    # the whole soundtrack fades out END_SIL-0.1 -> END_SIL (applied per cue so stems and leave-one-out stay exact)
    j = np.arange(i0, i0 + out.shape[1]) / SR
    out = out * np.clip((END_SIL - j) / .1, 0, 1)
    # trim trailing near-silence
    e = np.abs(out).max(0); nz = np.nonzero(e > 1e-6)[0]
    out = out[:, :nz[-1] + 1] if len(nz) else out[:, :1]
    c['dry_len'] = dry.shape[1]
    return i0, out


def build_sfx(cues):
    """Effects bus and per-cue contributions. Merged cues are summed into their host's contribution."""
    bus = np.zeros((2, N)); parts = []; host = {}
    for c in cues:
        c.pop('merged', None)
    rendered = [(c,) + render_cue(c) for c in cues]
    # transitions / textures dip under the hits (a fixed automation lane keyed from the hit cues)
    hits = np.zeros((2, N))
    for c, i0, x in rendered:
        if c['n'] not in TEXTURE:
            place(hits, x, i0=i0)
    key = follower(filt(hits.mean(0), 'bandpass', [400, 8000]), att=.002, rel=.06)
    k = ns(.008); key = np.concatenate([key[k:], np.full(k, key[-1])])
    gtex = 10 ** (-TEX_DUCK_DB * np.clip((20 * np.log10(key + 1e-9) + 36) / 12, 0, 1) / 20)
    for k, (c, i0, x) in enumerate(rendered):
        if c['n'] in TEXTURE and x.shape[1] > 1:
            j0 = max(0, i0); j1 = min(N, i0 + x.shape[1]); g = np.ones(x.shape[1]); g[j0 - i0:j1 - i0] = gtex[j0:j1]
            rendered[k] = (c, i0, x * g)
    for c, i0, x in rendered:
        if c.get('merge_into') is None:
            host[c['i']] = [c, i0, x]
    for c, i0, x in rendered:
        if c.get('merge_into') is not None and c['merge_into'] in host:
            h = host[c['merge_into']]
            a0 = min(h[1], i0); a1 = max(h[1] + h[2].shape[1], i0 + x.shape[1])
            buf = np.zeros((2, a1 - a0)); buf[:, h[1] - a0:h[1] - a0 + h[2].shape[1]] += h[2]
            buf[:, i0 - a0:i0 - a0 + x.shape[1]] += x
            h[1], h[2] = a0, buf
            h[0].setdefault('merged', []).append(f"{c['n']}@{c['t']:.3f}")
            h[0]['dry_len'] = max(h[0].get('dry_len', 0), i0 - a0 + c.get('dry_len', 0))
    for c in cues:
        if c['i'] in host:
            hc, i0, x = host[c['i']]
            if hc.get('merged'):                              # the peak cap holds for the merged event as a whole
                cap = (PEAK_CAP_HERO if any(abs(hc['t'] - h) < .03 for h in HERO_TIMES) else PEAK_CAP_DB) - G_DB_EST
                pk = 20 * np.log10(np.abs(x).max() + 1e-12)
                if pk > cap:
                    x = x * 10 ** ((cap - pk) / 20); hc['capped_db'] = round(hc.get('capped_db', 0) + cap - pk, 2)
            place(bus, x, i0=i0)
            parts.append((hc, i0, x))
    return bus, parts


# ================================================================== DUCKING, LIMITER, MASTER
def follower(x, att=.002, rel=.18, dec=16):
    m = np.abs(x); pad = (-len(m)) % dec
    md = np.pad(m, (0, pad)).reshape(-1, dec).max(1)
    a = np.exp(-dec / (SR * att)); r = np.exp(-dec / (SR * rel)); y = np.empty_like(md); s = 0.0
    for i, v in enumerate(md):
        s = a * s + (1 - a) * v if v > s else r * s + (1 - r) * v
        y[i] = s
    return np.repeat(y, dec)[:len(m)]


DUCK = dict(mid_db=-11.0, all_db=-3.0, thr=-50.0, knee=16.0, look=.010, lo=350, hi=7000)


def duck_amount(sfx):
    """0..1 duck amount keyed from the effects' own 400 Hz-8 kHz band, 5 ms look-ahead, 180 ms release."""
    key = follower(filt(sfx.mean(0), 'bandpass', [400, 8000]), att=.003)
    k = ns(DUCK['look']); key = np.concatenate([key[k:], np.full(k, key[-1])])
    kdb = 20 * np.log10(key + 1e-9)
    return np.clip((kdb - DUCK['thr']) / DUCK['knee'], 0, 1)


_BAND_SOS = {}


def band_zero_phase(x, lo, hi):
    """Zero-phase band split (forward-backward Butterworth): x + (g-1)*band is a clean dip of exactly g in band."""
    key = (lo, hi)
    if key not in _BAND_SOS:
        _BAND_SOS[key] = signal.butter(3, [lo, hi], 'bandpass', fs=SR, output='sos')
    return signal.sosfiltfilt(_BAND_SOS[key], x, axis=-1)


def duck(mus, sfx, amt=None):
    """Music ducked from the SFX: a zero-phase dip of DUCK['mid_db'] over 350 Hz-7 kHz (the phone band)
    and DUCK['all_db'] overall, following the effects' envelope."""
    amt = duck_amount(sfx) if amt is None else amt
    mid = band_zero_phase(mus, DUCK['lo'], DUCK['hi'])
    return (mus + (10 ** (DUCK['mid_db'] * amt / 20) - 1) * mid) * 10 ** (DUCK['all_db'] * amt / 20)


def limiter(x, ceil_db=-3.3, look=.0025, rel=.04):
    """Look-ahead peak limiter, detector on a 4x oversampled signal (true-peak aware).
    Gain never exceeds what each sample needs (min-filter + moving average of the same half-width),
    then an exponential release. Returns (output, gain curve)."""
    n = x.shape[1]; ceil = 10 ** (ceil_db / 20)
    up = np.abs(signal.resample_poly(x, 4, 1, axis=1)).max(0)
    up = np.pad(up, (0, max(0, 4 * n - len(up))))[:4 * n]
    req = np.minimum(1.0, ceil / np.maximum(up.reshape(n, 4).max(1), 1e-12))
    L = max(1, ns(look))
    att = uniform_filter1d(minimum_filter1d(req, 2 * L + 1), 2 * L + 1)
    att = np.minimum(att, req)
    Bk = 16; nb = -(-n // Bk)
    ab = np.pad(att, (0, nb * Bk - n), constant_values=1).reshape(nb, Bk).min(1)
    if ab.min() >= 1:
        return x.copy(), np.ones(n)
    c = 1 - np.exp(-Bk / (SR * rel)); gb = np.empty(nb); g = 1.0
    for k in range(nb):
        g = min(ab[k], g + (1 - g) * c); gb[k] = g
    gs = uniform_filter1d(np.repeat(gb, Bk)[:n], Bk)
    gain = np.minimum(att, gs)
    return x * gain, gain


MASTER_EQ = []          # list of (f0, gain_db, q) static peaking EQ on the whole mix (filled by the spectrum check)


def master_eq(x):
    for f0, gdb, q in MASTER_EQ:
        x = peq(x, f0, gdb, q)
    return x


RIDE = dict(head_db=2.0, sum_db=2.4, hero_db=1.7, half=.04, max_db=6.0)


def music_ride(mus_in, sfx_in, ceil_db):
    """Music level automation (a fader ride, not a clipper), computed once per build from the music and effects as
    they enter the master limiter. The ride is solved per (4x oversampled) sample from the actual waveforms:
    the music alone never needs more than RIDE['head_db'] of limiter GR, and music + effects never more than
    RIDE['sum_db'] (RIDE['hero_db'] at the hero instants). Depth <= RIDE['max_db']; >= 40 ms ramps
    (min-filter + moving average of the same half-width, so the ride never undershoots what is needed)."""
    n = mus_in.shape[1]
    m4 = signal.resample_poly(mus_in, 4, 1, axis=1)[:, :4 * n]; s4 = signal.resample_poly(sfx_in, 4, 1, axis=1)[:, :4 * n]
    lim = np.full(4 * n, 10 ** ((ceil_db + RIDE['sum_db']) / 20))
    for h in HERO_TIMES:
        lim[4 * ns(h):4 * ns(h + HERO_WIN[1])] = 10 ** ((ceil_db + RIDE['hero_db']) / 20)   # from the hit onward
    am = np.maximum(np.abs(m4), 1e-12)
    r_sum = (lim - np.sign(m4) * s4) / am                 # largest r with |m*r + s| <= lim
    r_mus = 10 ** ((ceil_db + RIDE['head_db']) / 20) / am
    req = np.minimum(r_sum, r_mus).min(0)
    req = np.pad(req, (0, max(0, 4 * n - len(req))), constant_values=1)[:4 * n].reshape(n, 4).min(1)
    req = np.clip(req, 10 ** (-RIDE['max_db'] / 20), 1.0)
    if req.min() >= 1:
        return np.ones(n)
    h = ns(RIDE['half'])
    return np.minimum(uniform_filter1d(minimum_filter1d(req, 2 * h + 1), 2 * h + 1), 1.0)


def chain(mus, sfx, G, ceil_db, amt=None, ride=None, off=0):
    """Everything after the buses: music duck automation (+ ride), master EQ, gates, master gain, limiter.
    `off` = sample offset of a window (the gates are sliced to match)."""
    m = duck(mus, sfx, amt)
    if ride is not None:
        m = m * ride
    n = m.shape[1]
    pre = (master_eq(m) * MUSIC_GATE[off:off + n] + master_eq(sfx) * SFX_GATE[off:off + n]) * G
    y, g = limiter(pre, ceil_db)
    return y, g, pre


def master_gain(mus, sfx, target, ceil_db, amt=None):
    """Master gain for the target integrated loudness; returns (G, music ride lane)."""
    amt = duck_amount(sfx) if amt is None else amt
    md = master_eq(duck(mus, sfx, amt)) * MUSIC_GATE; se = master_eq(sfx) * SFX_GATE
    G = 10 ** ((target - lufs(md + se)) / 20); ride = np.ones(N)
    for it in range(8):
        if it < 2:
            ride = music_ride(md * G, se * G, ceil_db)
        y, g, _ = chain(mus, sfx, G, ceil_db, amt, ride); L = lufs(y)
        if abs(L - target) < .02:
            break
        G *= 10 ** ((target - L) / 20)
    return G, ride


# ================================================================== LEAVE-ONE-OUT AUDIBILITY
def loo(parts, sfx, fn, pre=.35, post=.35):
    """Per cue: render the chain with and without it (same master gain), both through the phone simulation.
    SNR = energy(mix - mix_without) / energy(mix_without) over the cue's main window: it starts 10 ms before the
    peak of the cue's own (phone-weighted) envelope, never before its onset, and lasts until 90 % of the cue's energy
    has passed, clamped to 50-150 ms; long cues (typing, coins, ff, riser, ...) use the shortest window holding 80 %
    of their energy (>= 150 ms). snr150 = same with a fixed
    150 ms window. strict = the cue as heard (through the same gains) vs everything else that is heard with it.
    fn(w0, w1, sfx_window, cue_window) -> (output, cue_through_chain, limiter_gain)."""
    rows = []
    for c, i0, x in parts:
        row = {'t': round(c['t'], 3), 'n': c['n'], 'cls': c['cls'], 'target': c['target'],
               'extra_db': round(c.get('extra_db', 0.0), 2), 'capped_db': c.get('capped_db', 0.0)}
        for k in ('layer_of', 'merged'):
            if c.get(k):
                row[k] = c[k]
        if c.get('muted') or x.shape[1] < 2:
            row.update(snr=None, strict=None, muted=c.get('muted', 'empty')); rows.append(row); continue
        m = x.shape[1]
        w0 = max(0, i0 - ns(pre)); w1 = min(N, i0 + m + ns(post))
        a = i0 - w0; b = min(w1 - w0, a + m)
        s_w = sfx[:, w0:w1]; cw = np.zeros_like(s_w); cw[:, a:b] = x[:, :b - a]
        y_w, cue_out, g_w = fn(w0, w1, s_w, cw)
        y_wo, _, g_wo = fn(w0, w1, s_w - cw, None)
        p_w, p_wo = phone(y_w), phone(y_wo); d = p_w - p_wo; cp = phone(cue_out)
        if c['n'] in LONG and 'd' in c:
            t0 = max(0, ns(c['t']) - w0); t1 = min(len(d), t0 + max(ns(float(c['d'])), ns(.15)))
            ce = np.concatenate([[0], np.cumsum(cp[t0:t1] ** 2)]); L = len(ce) - 1; best = (L, 0)
            for wl in range(ns(.15), L + 1, ns(.01)):                # shortest window with 80 % of the energy
                k = int(np.argmax(ce[wl:] - ce[:-wl]))
                if ce[k + wl] - ce[k] >= .8 * ce[-1]:
                    best = (wl, k); break
            a0 = t0 + best[1]; a1 = a0 + best[0]; b1 = a1
        else:
            e = uniform_filter1d(cp ** 2, ns(.005))
            s1 = min(len(d), a + c.get('dry_len', m) + ns(.05))
            pk = a + int(np.argmax(e[a:s1]))
            a0 = max(a, pk - ns(.01))
            ce = np.cumsum(cp[a0:min(len(cp), a0 + ns(.4))] ** 2)
            t90 = int(np.searchsorted(ce, .9 * ce[-1])) if ce[-1] > 0 else ns(.15)
            a1 = min(len(d), a0 + int(np.clip(t90, ns(.05), ns(.15)))); b1 = min(len(d), a0 + ns(.15))
        snr = 10 * np.log10(np.sum(d[a0:a1] ** 2) / (np.sum(p_wo[a0:a1] ** 2) + 1e-20) + 1e-20)
        snr150 = 10 * np.log10(np.sum(d[a0:b1] ** 2) / (np.sum(p_wo[a0:b1] ** 2) + 1e-20) + 1e-20)
        strict = 10 * np.log10(np.sum(cp[a0:a1] ** 2) / (np.sum((p_w - cp)[a0:a1] ** 2) + 1e-20) + 1e-20)
        span = slice(min(a, a0), max(a0 + 1, a1))                 # GR that matters for this cue: onset .. end of its main window
        grw = float(-20 * np.log10(max(g_w[span].min(), 1e-9))); grwo = float(-20 * np.log10(max(g_wo[span].min(), 1e-9)))
        row.update(cue_phone_db=round(float(10 * np.log10(np.mean(cp[a0:a1] ** 2) + 1e-20)), 1),
                   masker_phone_db=round(float(10 * np.log10(np.mean(p_wo[a0:a1] ** 2) + 1e-20)), 1))
        row.update(snr=round(float(snr), 2), snr150=round(float(snr150), 2), strict=round(float(strict), 2),
                   win=[round((w0 + a0) / SR, 3), round((w0 + a1) / SR, 3)], gr_db=round(grw, 2), gr_own_db=round(grw - grwo, 2))
        rows.append(row)
    return rows


def completo_fn(mus, G, ceil_db, amt, ride):
    """The music duck is a mix automation lane computed once from the complete effects envelope: identical in the
    with / without renders, so each cue is measured against the music as it actually plays at that moment."""
    def fn(w0, w1, s, cue):
        y, g, _ = chain(mus[:, w0:w1], s, G, ceil_db, amt[w0:w1], ride[w0:w1], off=w0)
        return y, (None if cue is None else master_eq(cue) * SFX_GATE[w0:w1] * G * g), g
    return fn


def summarize(rows, label):
    ok = [r for r in rows if r['snr'] is not None]
    fails = [r for r in ok if r['snr'] < r['target']]
    by = {k: [r['snr'] for r in ok if r['cls'] == k] for k in ('hero', 'normal', 'layer')}
    print(f'[{label}] leave-one-out phone SNR: ' + ', '.join(f'{k} min {min(v):+.1f} med {np.median(v):+.1f}' for k, v in by.items() if v)
          + f'; fails {len(fails)}/{len(ok)}')
    if fails:
        print('   fails: ' + ', '.join(f"{r['n']}@{r['t']:.2f} {r['snr']:+.1f}<{r['target']:+.0f}" for r in sorted(fails, key=lambda r: r['snr'] - r['target'])))
    return fails


CEIL_DB = -3.2           # limiter ceiling (true-peak detector); final file is verified <= -3.0 dBTP
TARGET_LUFS = -14.0


HERO_WIN = (-.02, .15)                # the hit itself: 20 ms before to 150 ms after each hero instant


def gr_limit(t):
    """Working limits with a little margin under the spec (<= 2 dB at the hero instants, <= 3 dB elsewhere)."""
    return 1.9 if any(h + HERO_WIN[0] - .01 <= t <= h + HERO_WIN[1] for h in HERO_TIMES) else 2.85


def gain_loop(cues, mus, max_iter=5, cap=6.0, step=3.0, margin=.5):
    """Per-cue trims: start at 0 dB; boost only cues below target (+margin), at most `step` dB per pass and `cap` dB
    total, and only while the limiter has headroom at that cue; pull a cue down if it drives the limiter past its
    limit. Leave-one-out is re-measured on the full chain every pass."""
    global G_DB_EST
    for c in cues:
        c.setdefault('extra_db', 0.0)
    for _ in range(4):                                     # converge the peak caps on the master gain first
        sfx, _p = build_sfx(cues); G, _r = master_gain(mus, sfx, TARGET_LUFS, CEIL_DB)
        if abs(20 * np.log10(G) - G_DB_EST) < .2:
            break
        G_DB_EST = round(float(20 * np.log10(G)), 2)
    for it in range(max_iter):
        sfx, parts = build_sfx(cues); amt = duck_amount(sfx)
        G, ride = master_gain(mus, sfx, TARGET_LUFS, CEIL_DB, amt)
        if abs(20 * np.log10(G) - G_DB_EST) > .25:            # peak caps follow the master gain
            G_DB_EST = round(float(20 * np.log10(G)), 2)
            sfx, parts = build_sfx(cues); amt = duck_amount(sfx)
            G, ride = master_gain(mus, sfx, TARGET_LUFS, CEIL_DB, amt)
        rows = loo(parts, sfx, completo_fn(mus, G, CEIL_DB, amt, ride))
        fails = summarize(rows, f'completo pass {it}')
        changed = []
        for r, (c, i0, x) in zip(rows, parts):
            if r['snr'] is None:
                continue
            lim = gr_limit(r['win'][0])                        # the limit where the cue is heard
            if r['gr_db'] > lim and r['gr_own_db'] > .3 and c['extra_db'] > -6:
                c['extra_db'] -= min(3.0, r['gr_db'] - lim + .3); changed.append(c)
            elif r['snr'] < r['target'] + margin:
                inc = min(step, r['target'] + margin - r['snr'] + .3, cap - c['extra_db'], max(0.0, lim - .1 - r['gr_db']))
                if inc > .05:
                    c['extra_db'] += inc; changed.append(c)
        music_gr = [r for r in rows if r['snr'] is not None and r['gr_db'] - r['gr_own_db'] > gr_limit(r['win'][0])]
        if music_gr:
            print('   GR over limit not caused by the cue: ' + ', '.join(f"{r['n']}@{r['t']:.2f} {r['gr_db'] - r['gr_own_db']:.1f}" for r in music_gr))
        if not changed:
            break
        print('   trims: ' + ', '.join(f"{c['n']}@{c['t']:.2f}{c['extra_db']:+.1f}" for c in changed))
    return sfx, parts, G, ride, rows


# ================================================================== ANALYSIS: spectrum, GR, sections
def third_octave(x, lo=250, hi=8000):
    m = x.mean(0) if x.ndim == 2 else x
    f, P = signal.welch(m, SR, nperseg=16384)
    df = f[1] - f[0]; rows = []
    for k in range(-12, 10):
        fc = 1000 * 2 ** (k / 3)
        if fc < lo * .97 or fc > hi * 1.03:
            continue
        sel = (f >= fc * 2 ** (-1 / 6)) & (f < fc * 2 ** (1 / 6))
        rows.append([round(fc, 1), float(10 * np.log10(np.sum(P[sel]) * df + 1e-20))])
    lv = np.array([r[1] for r in rows]); lf = np.log2([r[0] for r in rows])
    fit = np.polyval(np.polyfit(lf, lv, 1), lf)
    out = []
    for k, (fc, l) in enumerate(rows):
        nb = [lv[j] for j in (k - 1, k + 1) if 0 <= j < len(lv)]
        out.append({'fc': fc, 'db': round(l, 2), 'dev_fit': round(float(l - fit[k]), 2), 'dev_local': round(float(l - np.mean(nb)), 2)})
    return out


def ride_list(ride):
    """Contiguous ride regions as [start, end, depth dB]."""
    on = np.concatenate([[0], (ride < .999).astype(np.int8), [0]])
    st = np.nonzero(np.diff(on) == 1)[0]; en = np.nonzero(np.diff(on) == -1)[0]
    return [[round(i / SR, 3), round(j / SR, 3), round(float(-20 * np.log10(ride[i:j].min())), 2)] for i, j in zip(st, en)]


def gr_report(gain):
    gr = -20 * np.log10(np.maximum(gain, 1e-9))
    per_s = [round(float(gr[ns(s):min(N, ns(s + 1))].max()), 2) for s in range(int(np.ceil(TOTAL)))]
    at = {f'{t:.3f}': round(float(gr[ns(t + HERO_WIN[0]):ns(t + HERO_WIN[1])].max()), 2) for t in HERO_TIMES}
    return float(gr.max()), per_s, at


def section_levels(mus_out, sfx_out, mix, mus_raw=None):
    secs = [('intro', 0, A), ('groove', A, D3), ('quote-lift', D3, 40 * B), ('groove2', 40 * B, GA),
            ('proof', GA, CTA_T), ('cta', CTA_T, FINAL_T)]
    out = []
    for nm, a, b in secs:
        s = slice(ns(a), ns(b)); pm = phone(mus_out[:, s]); pt = phone(mix[:, s])
        out.append({'section': nm, 'span': [round(a, 3), round(b, 3)],
                    'music_arrangement_lufs': None if mus_raw is None else round(lufs(mus_raw[:, s]), 1),
                    'music_lufs': round(lufs(mus_out[:, s]), 1),
                    'music_hp300_lufs': round(lufs(filt(mus_out[:, s], 'highpass', 300, 4)), 1),
                    'music_phone_rms_db': round(float(10 * np.log10(np.mean(pm ** 2) + 1e-20)), 1),
                    'mix_phone_rms_db': round(float(10 * np.log10(np.mean(pt ** 2) + 1e-20)), 1)})
    return out


# ================================================================== FILES
def write_wav24(path, x, seed):
    r = np.random.default_rng(seed)
    d = (r.random(x.shape) - r.random(x.shape)) * (x != 0)     # TPDF dither, never inside digital silence
    q = np.clip(np.round(x * 8388607.0 + d), -8388608, 8388607).astype('<i4')
    b = np.ascontiguousarray(q.T).reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(path, 'wb') as w:
        w.setnchannels(x.shape[0]); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b)


def read_wav(path):
    """Any PCM/float WAV -> float (channels, n)."""
    from scipy.io import wavfile
    sr, d = wavfile.read(path)
    if d.dtype.kind == 'i':
        d = d / float(2 ** (8 * d.dtype.itemsize - 1))
    elif d.dtype.kind == 'u':
        d = (d.astype(float) - 128) / 128
    d = np.asarray(d, float)
    return sr, (d[None, :] if d.ndim == 1 else d.T)


def srt_windows(path=SRT_PATH):
    txt = open(path, encoding='utf-8').read()

    def s(x):
        h, m, r = x.split(':'); sec, ms = r.split(',')
        return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
    return [(s(a), s(b)) for a, b in re.findall(r'(\d\d:\d\d:\d\d,\d\d\d) --> (\d\d:\d\d:\d\d,\d\d\d)', txt)]


# ================================================================== BUILD
NARR = dict(music_db=-5.0, presence_db=-3.0, target=-27.0, ceil=-9.35)


def narration_bed(mus, sfx):
    """Bed for a voice-over: music 5 dB down with a static 2.5 kHz presence dip (no time-varying carve, so
    nothing pumps), effects untouched; mastered to -27 LUFS / <= -9 dBTP."""
    mb = peq(duck(mus, sfx) * 10 ** (NARR['music_db'] / 20), 2500, NARR['presence_db'], .8)
    pre = master_eq(mb) * MUSIC_GATE + master_eq(sfx) * SFX_GATE; G = 10 ** ((NARR['target'] - lufs(pre)) / 20)
    for _ in range(5):
        y, g = limiter(pre * G, NARR['ceil']); L = lufs(y)
        if abs(L - NARR['target']) < .02:
            break
        G *= 10 ** ((NARR['target'] - L) / 20)
    return y, g


def design_master_eq(cues, mus, sfx=None, thr=2.2, rounds=6):
    """Gentle corrective master EQ: 1/3-octave peaking cuts on any band that stands > thr dB above both the
    long-term trend (linear fit, 250 Hz-8 kHz) and its neighbours, designed iteratively on the actual mix."""
    if sfx is None:
        sfx, _ = build_sfx(cues)
    base = duck(mus, sfx) + sfx
    for _ in range(rounds):
        spec = third_octave(master_eq(base))
        bumps = [b for b in spec if max(b['dev_fit'], b['dev_local']) > thr]
        if not bumps:
            break
        for b in bumps:
            cut = -(max(b['dev_fit'], b['dev_local']) - 1.0) * .7
            for k, (f0, gdb, q) in enumerate(MASTER_EQ):
                if abs(f0 - b['fc']) < 1:
                    MASTER_EQ[k] = (f0, round(max(-6.0, gdb + cut), 2), q); break
            else:
                MASTER_EQ.append((b['fc'], round(cut, 2), 4.3))
    print('   master EQ: ' + (', '.join(f'{f:.0f} Hz {g:+.1f} dB' for f, g, q in MASTER_EQ) or 'flat'))


def apply_report_trims(cues, path=os.path.join(OUT_DIR, 'audio_report.json')):
    """Reuse the per-cue trims and master EQ of the last audio6 run if the cue list is unchanged."""
    try:
        rep = json.load(open(path))
    except Exception:
        return False
    rc = rep.get('cue_list', [])
    if [(x['n'], round(x['t'], 3)) for x in rc] != [(c['n'], round(c['t'], 3)) for c in cues]:
        return False
    global G_DB_EST
    for c, x in zip(cues, rc):
        c['extra_db'] = x['extra_db']
    MASTER_EQ[:] = [tuple(e) for e in rep.get('master_eq', [])]
    G_DB_EST = rep.get('g_db_est', 0.0)
    return True


def main():
    t_start = time.time()
    os.makedirs(OUT_DIR, exist_ok=True)
    cues = classify(load_cues())
    mus, sc = build_music(cues)
    print(f'music built in {time.time() - t_start:.1f} s; {len(cues)} cues from {CUES_PATH}')
    design_master_eq(cues, mus)
    sfx, parts, G, ride, rows = gain_loop(cues, mus)
    amt = duck_amount(sfx)
    y, gain, pre = chain(mus, sfx, G, CEIL_DB, amt, ride)
    spec = third_octave(y)
    bumps = [b for b in spec if b['dev_local'] > 2.7 or b['dev_fit'] > 2.7]
    if bumps:                                              # rare: a residual bump after the loop's trims
        print('   residual 1/3-octave bumps: ' + ', '.join(f"{b['fc']:.0f} Hz" for b in bumps))
        design_master_eq(cues, mus, sfx)
        sfx, parts, G, ride, rows = gain_loop(cues, mus, max_iter=2)
        amt = duck_amount(sfx)
        y, gain, pre = chain(mus, sfx, G, CEIL_DB, amt, ride); spec = third_octave(y)
    tp = true_peak_db(y)
    if tp > -3.02:
        k = 10 ** ((-3.02 - tp) / 20); y *= k; pre *= k; G *= k
    L1, tp1 = lufs(y), true_peak_db(y)
    gr_max, gr_s, gr_hero = gr_report(gain)
    print(f'mix_completo: {L1:.2f} LUFS, true peak {tp1:.2f} dBTP, limiter max GR {gr_max:.2f} dB; at hero hits {gr_hero}')
    print('   GR per second: ' + ' '.join(f'{v:.1f}' for v in gr_s))
    # stems at the same gain staging: trilha + efeitos == mix before the limiter
    mus_d = duck(mus, sfx, amt) * ride
    trilha = master_eq(mus_d) * MUSIC_GATE * G; efeitos = master_eq(sfx) * SFX_GATE * G
    stem_err = float(np.abs(trilha + efeitos - pre).max())
    narr, gn = narration_bed(mus, sfx)
    L2, tp2 = lufs(narr), true_peak_db(narr)
    print(f'mix_narracao: {L2:.2f} LUFS, true peak {tp2:.2f} dBTP, limiter max GR {-20 * np.log10(gn.min()):.2f} dB')
    stem_scale = min(1.0, .98 / max(np.abs(trilha).max(), np.abs(efeitos).max()))
    if stem_scale < 1:
        print(f'   stems scaled by {20 * np.log10(stem_scale):.2f} dB together (a stem alone would exceed full scale)')
    files = {'trilha.wav': trilha * stem_scale, 'efeitos_sonoros.wav': efeitos * stem_scale, 'mix_completo.wav': y, 'mix_narracao.wav': narr}
    for k, (nm, x) in enumerate(files.items()):
        assert np.abs(x).max() < 1.0, nm
        write_wav24(os.path.join(OUT_DIR, nm), x, 7000 + k)
    rb = {nm: read_wav(os.path.join(OUT_DIR, nm))[1] for nm in files}
    sec = section_levels(trilha, efeitos, y, master_eq(mus) * MUSIC_GATE * G)
    spec_mus = third_octave(trilha)
    report = {
        'build': {'script': 'audio6.py', 'cues': CUES_PATH, 'srt': SRT_PATH,
                  'sample_rate': SR, 'bit_depth': 24, 'length_s': N / SR},
        'mix_completo': {'lufs': round(L1, 2), 'true_peak_dbtp': round(tp1, 2),
                         'readback_lufs': round(lufs(rb['mix_completo.wav']), 2), 'readback_true_peak_dbtp': round(true_peak_db(rb['mix_completo.wav']), 2),
                         'limiter_max_gr_db': round(gr_max, 2), 'limiter_gr_db_per_second': gr_s, 'limiter_gr_db_at_hero_hits': gr_hero,
                         'master_gain_db': round(20 * np.log10(G), 2), 'master_eq': MASTER_EQ, 'clipper': 'none',
                         'music_ride': {'what': 'slow music level automation (>= 40 ms ramps): music alone never needs > 2 dB of limiter GR, music + effects never > 2.6 dB (1.8 dB at hero instants)',
                                        'max_db': round(float(-20 * np.log10(ride.min())), 2),
                                        'seconds_active': round(float(np.mean(ride < .999) * TOTAL), 2),
                                        'rides': ride_list(ride)}},
        'mix_narracao': {'lufs': round(L2, 2), 'true_peak_dbtp': round(tp2, 2), 'readback_lufs': round(lufs(rb['mix_narracao.wav']), 2),
                         'readback_true_peak_dbtp': round(true_peak_db(rb['mix_narracao.wav']), 2),
                         'limiter_max_gr_db': round(float(-20 * np.log10(gn.min())), 2), 'settings': NARR},
        'stems': {'note': 'trilha + efeitos_sonoros = mix_completo before the limiter (same duck, EQ and master gain)',
                  'common_scale_db': round(float(20 * np.log10(stem_scale)), 2),
                  'sum_error_max': stem_err, 'readback_sum_error_max': float(np.abs((rb['trilha.wav'] + rb['efeitos_sonoros.wav']) / stem_scale - pre).max()),
                  'peak_trilha_dbfs': round(float(20 * np.log10(np.abs(trilha).max())), 2),
                  'peak_efeitos_dbfs': round(float(20 * np.log10(np.abs(efeitos).max())), 2)},
        'audibility': {'method': 'leave-one-out: full chain (music duck automation, master EQ, same master gain, limiter; no clipper) with and without the cue; '
                                 'the music duck is a fixed automation lane computed from the complete effects envelope (identical in both renders); '
                                 'phone sim = mono, HP300 + LP8k 4th order, A-weighting; SNR = E(mix - mix_without) / E(mix_without) '
                                 'over the main window of the cue: from 10 ms before its peak (never before its onset) until 90 % of its energy (50-150 ms); long cues: the shortest window holding 80 % of their energy (>= 150 ms). snr150 = fixed 150 ms window. strict = cue alone vs the rest as heard.',
                       'targets_db': {'hero': TARGET['hero'], 'normal': TARGET['normal'], 'layer (sweetener / same-instant layer)': TARGET['layer']},
                       'fails': [r for r in rows if r['snr'] is not None and r['snr'] < r['target']],
                       'min_by_class': {k: min([r['snr'] for r in rows if r['cls'] == k and r['snr'] is not None] or [None]) for k in ('hero', 'normal', 'layer')},
                       'cues': rows},
        'music_sections': sec,
        'spectrum_third_octave_mix': spec, 'spectrum_third_octave_music': spec_mus,
        'timeline': {'tension_grid_M0': M0, 'beat': BT, 'smash_stop': SMASH, 'groove_A': A, 'groove_beat': B,
                     'fill_start': round(FILL_T, 4), 'gate': [round(GATE0, 4), round(brand_anchor(cues), 4)],
                     'brand_anchor_sample': ns(brand_anchor(cues)),
                     'impact_cue_samples': [ns(c['t']) for c in cues if c['n'] == 'impact'],
                     'cta': round(CTA_T, 4), 'final_sting': round(FINAL_T, 4), 'silent_from': END_SIL,
                     'music_silences_max_abs': {f'{a:.3f}-{(b if b else TOTAL):.3f}': float(np.abs(trilha[:, min(N,ns(a)):min(N,ns(b)) if b else N]).max()) if min(N,ns(a)) < (min(N,ns(b)) if b else N) else 0.0
                                                for a, b in [(STOP_END, M0), (SMASH, DRIP0), HOLE, (GATE0, brand_anchor(cues)), (END_SIL, None)]},
                     'mix_abs_max_after_43.45': float(np.abs(y[:, ns(END_SIL):]).max())},
        'muted_cues': [{'t': c['t'], 'n': c['n'], 'why': c['muted']} for c in cues if c.get('muted')],
        'cue_list': [{'n': c['n'], 't': c['t'], 'extra_db': round(c.get('extra_db', 0.0), 3), 'capped_db': c.get('capped_db', 0.0)} for c in cues],
        'master_eq': MASTER_EQ, 'g_db_est': G_DB_EST,
    }
    json.dump(report, open(os.path.join(OUT_DIR, 'audio_report.json'), 'w'), indent=1, ensure_ascii=False)
    print(f'done in {time.time() - t_start:.1f} s -> {OUT_DIR}')


if __name__ == '__main__':
    main()
