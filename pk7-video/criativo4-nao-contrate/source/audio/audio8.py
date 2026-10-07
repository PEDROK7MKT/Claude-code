#!/usr/bin/env python3
"""PK7 creative 4 "NÃO CONTRATE A PK7" (45.6 s vertical Reels, pt-BR): score, sound design, mix and master (audio8).

Adapted from the proven video4/audio7.py engine; all of its DSP / measurement / mastering machinery is kept:
  * no tanh / soft clipping anywhere. The only waveform-level non-linearity is the master look-ahead limiter
    (4x oversampled detector, <= 3 dB GR everywhere, <= 2 dB at the four hero instants 0.00 stamp / 13.50 drop /
    41.55 seal slap / 44.40 sting); effects are gain-staged by a per-cue peak cap (a level choice), never clipped;
  * every SFX is synthesised (modal resonators, shaped noise, layered bodies, close early reflections), carries its
    identity in 300 Hz-8 kHz and is seeded per cue instance: re-runs are bit-identical (WAVs and report);
  * audibility is measured LEAVE-ONE-OUT through a phone simulation (mono, HP300 + LP8k 4th order, A-weighting),
    post-limiter, same master gain (see loo()); targets: hero >= 8 dB, normal >= 4 dB, sweetener layers >= 0 dB;
  * the music makes room through fixed automation lanes (zero-phase phone-band duck keyed from the effects, slow
    music ride where music + hits would need more limiter GR); textures dip under the hits;
  * cues that are the same audible event (same instant, lower priority, or the same effect cued twice within 30 ms)
    are rendered as one event and measured as one.
audio8 changes to the machinery (all documented where they live):
  * hero class = the hit cue on each of the four hero instants (HERO_TIMES snaps to the cued hit within 60 ms);
  * BED effects (conveyor belt, loading spinner) duck 10 dB under everything else and are measured as layers (>= 0 dB);
  * per-cue trims: boosts act before the peak cap (so the cap bounds them), cuts act after it (so a cut always lowers
    the cue; in audio7 a cut on a capped cue could be a no-op and the limiter GR rule could not take effect);
  * a 'chime' followed by another hit within 150 ms renders as the short 'ding' only; series effects (plink, snap, pop,
    click) without an index count up along a rapid series;
  * REF_DB -18.5 (2.5 dB under audio7) and a -8 / -2 dB music duck: ~2.5x the cue density of audio7.
audio8 real-cue pass (the built film's 160 cues):
  * cue_edits.json (apply_cue_edits): mix decisions on the cue list kept out of the animation files -- drop a truly
    redundant cue instead of burying it, vol, shift (never a hit); matched by name + nearest time within tol, so a
    +-1 frame retime still matches;
  * one-frame flams: two short hits one video frame apart (or the same effect cued twice) are one event (FRAME_DT);
    a layer cued on its host's very sample is placed 0-8 ms late, whichever gives the lowest summed peak;
  * lead-ins: a sweep that leads INTO the next hit (or foreground texture) .04-.30 s later is fitted to it and
    measured as a layer of it over its own lead-in only (window ends at the hit); a riser builds into the first
    strong hit inside its span; blooms starting up to 120 ms after a higher-priority hit are its layers;
  * sustained hits choked by the next equal-or-higher-priority hit (buzz -> board shake); buzzer tone phase-rotated
    (all-pass: same spectrum, 5 dB less crest); whooshBig shaped for a 0.3 s slash wipe;
  * texture duck keyed from each hit's attack (first 100-150 ms), not its whole tail; the counter rattle is a
    texture; beds dip 10 dB under hits / textures but only 5 dB under air sweeps;
  * a merged event is cut as a whole (GR) but boosted through its host only; the gain loop boosts in up to 2 dB steps
    where the GR is the music ride's working level (the ride makes the room), and the delivered state is re-measured
    after the last pass (the report's audibility rows are the mix as written).

The score (120 BPM grid from t = 0, D minor -> D major):
  0-11.90 ironic sparse pizzicato (oom-pah muted bass + pizz chords, tiptoe pizz line, woodblock, glock winks), the
          last bar (10.0-11.9) turned into muffled phone-line hold music under the call-transfer scene;
  11.90-12.20 digital silence (music AND effects);  12.25-13.15 tension riser on the dominant under the split-flap,
          a soft reverse swell into 13.50;  13.50 DROP: confident D major groove (bars re-phased on the drop), brand
          stab sample-aligned with the cue at 13.50; one layer per receipt: hats 16.80, claps 21.00, synth bass stabs
          24.40, chord stabs 28.80; 31.80-39.00 full groove (proof);  39.00 record-scratch break (the music brakes),
          groove back on the 39.50 downbeat LOW-PASSED until 41.55, where it returns full with a stab sample-aligned
          to the seal slap;  44.40 final D major lime sting (aligned to the sting cue), decays to a clean end, last
          100 ms faded.

Inputs:  env CUES (default ../build/cues.json; prov_cues.json for tests), env SRT (default ./legendas_narracao.srt)
Outputs: out/trilha.wav, efeitos_sonoros.wav (stems at the mix gain staging: trilha + efeitos = mix before the
         limiter), mix_completo.wav (-14 LUFS, <= -3 dBTP), mix_narracao.wav (bed for a VO, -27 LUFS, <= -9 dBTP),
         audio_report.json.  All WAVs: stereo, 48 kHz, 24-bit, exactly TOTAL seconds.
"""
import json, os, re, sys, time, wave, zlib
import numpy as np
from scipy import signal
from scipy.ndimage import minimum_filter1d, maximum_filter1d, uniform_filter1d
import pyloudnorm as pyln

HERE = os.path.dirname(os.path.abspath(__file__))
CUES_PATH = os.environ.get('CUES', os.path.join(HERE, '..', 'build', 'cues.json'))
CUE_EDITS_PATH = os.environ.get('CUE_EDITS', os.path.join(HERE, 'cue_edits.json'))   # see apply_cue_edits()
SRT_PATH = os.environ.get('SRT', os.path.join(HERE, 'legendas_narracao.srt'))
OUT_DIR = os.environ.get('OUT_DIR', os.path.join(HERE, 'out'))

SR = 48000
CUES_DATA = json.load(open(CUES_PATH, encoding='utf-8'))
TOTAL = float(CUES_DATA.get('total', 45.6))
# effects that never mark a visual hit (sweeps, textures, beds, sweeteners): the only cues a 'shift' edit may move
SHIFTABLE = {'marker', 'typing', 'coins', 'riser', 'up', 'ff', 'swipe', 'whoosh', 'swoosh', 'whooshBig', 'paper', 'belt',
             'pages', 'spinner', 'pen', 'fall', 'shimmer', 'squeak', 'sparkle'}


def apply_cue_edits(data, path=CUE_EDITS_PATH):
    """Mix decisions on the animation's cue list, kept OUT of the animation files: cue_edits.json is a list (or
    {"edits": [...]}) of {"n": name, "t": time, "tol": s, "action": "drop" | "vol" | "shift", "value": ..., "why": ...}.
    Each edit applies to the ONE cue of that name nearest to t within tol (default 0.04 s: a +-1 frame retime of the
    animation still matches; the nearest-match rule never lets an edit spill onto a neighbour of the same name).
    drop = the cue is not rendered (a truly redundant cue, rather than burying it); vol = gain change in dB on the
    cue's v; shift = move by value seconds, refused for anything that marks a visual hit. Unmatched edits are
    reported (never guessed). Returns the log."""
    log = []
    try:
        ed = json.load(open(path, encoding='utf-8'))
    except FileNotFoundError:
        return log
    ed = ed.get('edits', []) if isinstance(ed, dict) else ed
    cues = data['cues']
    for i, c in enumerate(cues):
        c.setdefault('_i', i)                    # seeds keep the original cue index: a drop does not re-roll the others
    for e in ed:
        tol = float(e.get('tol', .04)); et = float(e['t'])
        cand = [c for c in cues if c['n'] == e['n'] and abs(float(c['t']) - et) <= tol and not c.get('_edited_drop')]
        rec = {k: e[k] for k in ('n', 't', 'action', 'value', 'why') if k in e}
        if not cand:
            rec['matched'] = None; log.append(rec)
            print(f"   WARNING: cue edit {e['action']} {e['n']}@{et:.3f} (tol {tol}) matches no cue: not applied")
            continue
        c = min(cand, key=lambda x: abs(float(x['t']) - et))
        rec['matched'] = round(float(c['t']), 3)
        if e['action'] == 'drop':
            c['_edited_drop'] = True
        elif e['action'] == 'vol':
            c['v'] = float(c.get('v', 1.0)) * 10 ** (float(e['value']) / 20)
        elif e['action'] == 'shift':
            if c['n'] not in SHIFTABLE:
                rec['refused'] = 'marks a visual hit: never shifted'; log.append(rec); continue
            c['t'] = float(c['t']) + float(e['value'])
        else:
            rec['refused'] = 'unknown action'; log.append(rec); continue
        log.append(rec)
    data['cues'] = [c for c in cues if not c.get('_edited_drop')]
    if log:
        print('   cue edits: ' + ', '.join(f"{x['action']} {x['n']}@{x['t']}" + ('' if x.get('matched') is not None and 'refused' not in x
                                                                               else ' (NOT APPLIED)') for x in log))
    return log


CUE_EDIT_LOG = apply_cue_edits(CUES_DATA)
N = int(round(SR * TOTAL))

# ------------------------------------------------------------------ fixed timeline anchors (scene cuts sit on them)
B = 60 / 120                # 120 BPM, beat grid from t = 0
BT = B
GATE0, GATE1 = 11.90, 12.20  # digital silence (music AND effects): the split-flap turn starts in silence
RISER0, RISER1 = 12.25, 13.15
DROP_T = 13.50              # the drop; post-drop bars are phased on it (13.5 + 2k), still on the 120 BPM grid
BAR0 = DROP_T
HATS_T, CLAP_T, SYNB_T, CHORD_T, FULL_T = 16.80, 21.00, 24.40, 28.80, 31.80   # one layer per receipt
SCRATCH_T = 39.00           # record-scratch break; the groove comes back low-passed on the 39.50 downbeat
LP_BACK = 39.50
SEAL_T = 41.70              # seal slap contact frame: the groove returns full
STING_T = 44.40             # final lime sting
END_SIL = TOTAL             # nothing after the end; the last 100 ms are faded (music and effects)
HOLE = (GATE0, GATE1)
HERO_NOMINAL = (0.0, DROP_T, SEAL_T, STING_T)
HERO_HOSTS = ('stamp', 'impact', 'slam', 'slap', 'sting', 'thock', 'patch', 'press', 'chime', 'whooshBig')

SWEET = {'shimmer', 'squeak'}
BED = {'belt', 'spinner'}      # continuous beds designed to run UNDER hits (conveyor under the presses, spinner under the
#   typing): measured as layers (>= 0 dB over everything heard with them), like the sweeteners
# priority when two cues start within LAYER_DT of each other: the lower one is a deliberate layer (merged)
PRIORITY = ['sting', 'impact', 'slap', 'stamp', 'scratch', 'slam', 'press', 'buzz', 'crack', 'wa', 'swstop', 'switch',
            'patch', 'toggleOn', 'chime', 'sent', 'clock', 'heart', 'postit', 'thock', 'click', 'snap', 'pop', 'plink',
            'coin', 'tick', 'tap', 'clack', 'blip', 'snip', 'read', 'flip', 'paper', 'swoosh', 'whooshBig', 'whoosh',
            'swipe', 'fall', 'coins', 'cells', 'count', 'up', 'ff', 'typing', 'pages', 'pen', 'marker', 'belt',
            'spinner', 'riser', 'coinFar', 'sparkle', 'shimmer', 'squeak']
LAYER_DT = 0.03
FRAME_DT = 1 / 30 + .003    # one video frame (30 fps) + rounding: two short hits one frame apart are one flam (merged)
TARGET = {'hero': 8.0, 'normal': 4.0, 'layer': 0.0}


def _hero_times():
    """The four hero instants, each snapped to the hit cue that lands on it (within 60 ms), else nominal."""
    out = []
    for h in HERO_NOMINAL:
        c = [float(x['t']) for x in CUES_DATA['cues'] if x['n'] in HERO_HOSTS and abs(float(x['t']) - h) < .06]
        out.append(min(c, key=lambda v: abs(v - h)) if c else h)
    return tuple(out)


HERO_TIMES = _hero_times()          # (stamp, drop, seal, sting) as cued


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


def fx_swoosh(r, d=.42, peak=.42):
    """The lime slash wipe: tighter, brighter, right-to-left (fitted as a lead-in when a hit follows closely)."""
    return air_sweep(r, d, 700, 6000, peak, bw=.45, air=.22, p0=.8, p1=-.8, curve=.8)


def fx_swipe(r, d=.32, peak=.35, flick=False):
    if flick:
        return air_sweep(r, .14, 700, 4600, .32, air=.14, p0=.3, p1=-.3)
    return air_sweep(r, max(.1, min(d, .5)), 550, 4200, peak, air=.12, p0=.35, p1=-.35)


def fx_whooshBig(r, d=.55, peak=.4):
    """Big full-frame slash / wipe: deep body, wide pan. audio8: .55 s peaking at 0.22 s (the slash wipe crosses the
    frame in 0.3 s; in audio7 it was a 0.85 s build peaking at 0.58 s, which here landed on the next hit)."""
    return air_sweep(r, d, 220, 3800, peak, bw=.65, air=.2, p0=-.9, p1=.9, body=(250, 900))


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
    """Cinematic hit: crack + metallic mid body (phone) + controlled boom (HP 50 Hz), ~1 s tail.
    (audio8: lighter boom / punch: the music's drop carries the low end, the effect's peak budget goes to the mids.)"""
    n = ns(1.15); t = tt(n)
    boom = osc(45 + 38 * np.exp(-t / .05), n) * env(n, .01, .2) * .08
    punch = modal(r, n, [(105, .35, .09), (180, .3, .06)], contact_ms=3.0, noise_amt=.1) * .55
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


def fx_chime(r, short=False):
    """Payment received 'ka-ching': register clack + bright bell, tail <= 0.5 s.
    short=True (render_cue picks it when another hit follows within 150 ms): the bright 'ding' alone, bell on the
    cue time, gone in ~0.15 s so the next hit is not masked."""
    if short:
        n = ns(.2); f = 2349.3
        x = modal(r, n, [(f, 1, .032), (f * 2.0, .4, .022), (f * 2.76, .3, .015), (f * 1.5, .25, .028)], .15, .2, .002)
        x += nburst(r, n, (2500, 8000), .0002, .0012) * .2
        return fade(x, .0005, .05)
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


# ------------------------------------------------------------------ creative 4 effects
def _rms(x):
    return float(np.sqrt(np.mean(np.asarray(x) ** 2)) + 1e-12)


def _sq(f, n, ph=0.0):
    """Band-limited square (difference of two polyBLEP saws half a period apart)."""
    return polyblep_saw(f, n, ph) - polyblep_saw(f, n, (ph + .5) % 1.0)


def fx_heart(r):
    """Double-tap 'like': two fleshy taps on glass 75 ms apart, a rising 'bloop' as the heart jumps (620 -> 1.08 kHz),
    a soft upward breath of air under it."""
    n = ns(.34); x = np.zeros(n)
    for k0, g in ((0, .55), (ns(.075), .8)):
        m = ns(.06)
        y = modal(r, m, [(520, 1, .012), (1150, .6, .009), (2900, .3, .005)], contact_ms=.8, noise_amt=.2)
        x[k0:k0 + m] += (y + nburst(r, m, (1800, 6000), .0004, .0015) * .2) * g
    k = ns(.085); m = ns(.22); t = tt(m)
    f = 620 * (1 + .75 * (1 - np.exp(-t / .03)))
    x[k:k + m] += (osc(f, m) + .35 * osc(2 * f, m) + .12 * osc(3 * f, m)) * env(m, .003, .05) * .9
    m2 = ns(.2); u = np.linspace(0, 1, m2)
    x[ns(.05):ns(.05) + m2] += swept_noise(r, m2, 900 * 4 ** u, .5) * np.sin(np.pi * u) ** 2 * .12
    return fade(room_er(x, r, .5, 6000), .0005, .04)


PLINK_SCALE = [1174.7, 1396.9, 1568.0, 1760.0, 2093.0, 2349.3, 2793.8, 3136.0, 3520.0]   # D minor pentatonic, rising


def fx_plink(r, idx=0):
    """Like 'plink': tiny bright glass/bell tick, pitch rising with the series index (D minor pentatonic), < 80 ms,
    with a soft sub-octave body so it still has weight on a phone."""
    f = PLINK_SCALE[int(idx) % len(PLINK_SCALE)]
    n = ns(.14)
    x = modal(r, n, [(f, 1, .03), (f * 2.0, .3, .016), (f * 2.76, .18, .01), (f * .5, .3, .018)], contact_ms=.12,
              noise_amt=.2, jit=.002)
    x += nburst(r, n, (3000, 8000), .0002, .001) * .2
    return fade(x, .0003, .03)


def allpass(x, f0, q=.7):
    """RBJ 2nd-order all-pass: phase rotation only (the magnitude spectrum, i.e. the timbre, is untouched)."""
    w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q); cs = np.cos(w)
    return signal.lfilter([1 - al, -2 * cs, 1 + al], [1 + al, -2 * cs, 1 - al], x)


def fx_buzz(r):
    """Red ✕: short 'wrong answer' buzzer (two beating low squares, 110 / 116.5 Hz, whose harmonics live in the
    phone band, 900 Hz nasal peak) on a dull thud; 0.2 s, HP 130 Hz.
    audio8: the buzzer tone goes through three all-pass sections (300 / 700 / 1500 Hz) -- same spectrum, same phone
    loudness, 5 dB less crest (a filtered square's harmonics all peak together), so the peak cap no longer holds the
    buzzer 7-13 dB under its level."""
    n = ns(.3); t = tt(n)
    src = _sq(110.0, n) + .8 * _sq(116.5, n, .37)
    src = peq(filt(filt(src, 'lowpass', 3200, 2), 'highpass', 220, 2), 900, 4.0, .9)
    for f0 in (300.0, 700.0, 1500.0):
        src = allpass(src, f0)
    e = np.minimum(1, t / .004) * np.clip((.2 - t) / .05, 0, 1) ** 1.5 * (1 - .25 * np.minimum(t, .2) / .2)
    x = src / _rms(src[:ns(.15)]) * e * .35
    x += modal(r, n, [(190, .4, .05), (420, .8, .045), (850, .6, .03), (1600, .3, .015)], contact_ms=1.0, noise_amt=.25)
    x += nburst(r, n, (900, 5000), .0008, .01) * .4
    return fade(filt(room_er(x, r, .6, 5000), 'highpass', 130, 4), .0005, .04)


def fx_press(r):
    """Industrial press: heavy steel-on-steel clunk (damped inharmonic plate modes 0.6-4.4 kHz) + controlled thump +
    clank, and a short hydraulic hiss as the ram lifts; ~0.3 s so whatever follows it stays clear. HP 50 Hz."""
    n = ns(.42); t = tt(n)
    thump = osc(55 + 50 * np.exp(-t / .025), n) * env(n, .003, .06) * .07
    body = modal(r, n, [(140, .15, .05), (285, .4, .05), (560, .55, .045)], contact_ms=2.0, noise_amt=.15)
    metal = modal(r, n, [(612, .55, .09), (1033, .7, .075), (1497, .6, .06), (2190, .45, .05), (3080, .3, .035),
                         (4370, .18, .02)], contact_ms=.35, noise_amt=.3, jit=.004)
    clank = nburst(r, n, (1500, 8000), .0006, .006) * .25 + nburst(r, n, (500, 3000), .001, .025) * .3
    x = thump + body * .6 + metal + clank
    k = ns(.14); m = ns(.16); u = np.linspace(0, 1, m)
    x[k:k + m] += filt(r.standard_normal(m), 'bandpass', [2500, 7500]) * np.minimum(1, u / .15) * (1 - u) ** 2 * .05
    return fade(filt(room_er(x, r, 1.0, 6000), 'highpass', 50, 4), .0005, .05)


def fx_belt(r, d=1.9):
    """Conveyor belt: motor hum (100 Hz series, heard through its 300 Hz-2.4 kHz harmonics), roller rattle (~9 /s),
    belt friction (0.7-3 kHz, chevron flutter). Fades in / out."""
    n = ns(max(d, .3)); t = tt(n); u = np.linspace(0, 1, n)
    wob = 1 + .004 * np.sin(2 * np.pi * .7 * t)
    hum = np.zeros(n)
    for k in range(1, 25):
        if 100 * k > 2400:
            break
        hum += (1 / k ** .8) * (1 if k % 2 else .6) * osc(100 * k * wob, n, r.uniform(0, 6))
    hum = filt(hum, 'highpass', 250, 2)
    rat = np.zeros(n); tk = r.uniform(0, .02)
    while tk < len(t) / SR - .03:
        m = ns(.03); i = ns(tk)
        y = modal(r, m, [(r.uniform(900, 1300), 1, .01), (r.uniform(2200, 2900), .5, .006)], .6, .3)
        y += nburst(r, m, (2000, 7000), .0005, .0015) * .25
        rat[i:i + m] += y[:n - i] * r.uniform(.4, 1.0)
        tk += 1 / 9.0 * r.uniform(.85, 1.15)
    fr = filt(r.standard_normal(n), 'bandpass', [700, 3000]) * (.7 + .3 * np.sin(2 * np.pi * 4.5 * t))
    x = hum / _rms(hum) * .7 + rat / _rms(rat) * .45 + fr / _rms(fr) * .4
    e = np.minimum(1, t / .12) * np.minimum(1, (t[-1] - t) / .15)
    return pan_moving(fade(x * e, .003, .02), -.4, .4)


def fx_pages(r, d=.6):
    """Fast page riffle: one air-whip + paper snap per page (~0.15 s each) over a dense riffle of paper grains."""
    d = max(d, .2); n = ns(d + .15); x = np.zeros(n)
    nb = max(2, int(round(d / .15)))
    for j in range(nb):
        i = ns(j * d / nb); m = ns(.12); u = np.linspace(0, 1, m)
        y = swept_noise(r, m, 1200 * 4 ** u, .6) * u ** 1.5 * (1 - u) ** .5 * .5
        sn = modal(r, m, [(r.uniform(1400, 1800), .6, .006), (r.uniform(2800, 3400), .4, .004)], .3, .4)
        sn += nburst(r, m, (2000, 8000), .0003, .002) * .5
        k = ns(.08); y[k:] += sn[:m - k] * .8
        x[i:i + m] += y[:n - i] * r.uniform(.8, 1.0)
    tk = 0.0
    while tk < d:
        m = ns(.015); i = ns(tk)
        x[i:i + m] += nburst(r, m, (1500, 7000), .0003, .002)[:n - i] * r.uniform(.1, .3)
        tk += r.uniform(.012, .03)
    return pan_moving(fade(x, .002, .03), -.3, .3)


def fx_postit(r):
    """Post-it slap: flat paper smack (broad 0.6-4.2 kHz burst, 1.8 ms onset), papery body, a tiny crinkle as it
    sticks."""
    n = ns(.2)
    x = nburst(r, n, (600, 4200), .0018, .016) * .9 + nburst(r, n, (2500, 8000), .0005, .003) * .3
    x += modal(r, n, [(340, .4, .025), (720, .55, .02), (1350, .4, .013), (2400, .2, .008)], contact_ms=1.4, noise_amt=.25)
    k = ns(.025); m = ns(.08)
    cr = filt(r.standard_normal(m), 'bandpass', [1800, 6500]) * uniform_filter1d((r.random(m) < .05) * 1.0, 25) * 3
    x[k:k + m] += cr * np.exp(-tt(m) / .03) * .2
    return fade(filt(room_er(x, r, .8, 6000), 'highpass', 180, 4), .0004, .04)


def fx_blip(r):
    """Call transfer: two-tone soft-square blip, A5 -> E5 ('bee-boop', you are being passed down)."""
    n = ns(.24); x = np.zeros(n)
    for k0, f, d0 in ((0, 880.0, .075), (ns(.095), 659.3, .1)):
        m = ns(d0 + .02); t = tt(m)
        y = osc(f, m) + .3 * osc(3 * f, m) + .12 * osc(5 * f, m)
        x[k0:k0 + m] += y * np.minimum(1, t / .004) * np.clip((d0 + .015 - t) / .015, 0, 1) * .5
    return fade(filt(x, 'lowpass', 6000, 2), .0005, .02)


def fx_spinner(r, d=.8):
    """Loading spinner: soft rounded ticks at 12 /s on two alternating pitches, circling in the stereo field, over a
    faint whir that pulses with them."""
    d = max(d, .2); n = ns(d + .05); out = np.zeros((2, n)); tk = 0.0; k = 0
    while tk < d - .02:
        m = ns(.04); f = (2350.0, 1980.0)[k % 2]
        y = modal(r, m, [(f, 1, .011), (f * 1.9, .25, .006), (f * .5, .3, .008)], 2.0, .2)
        place(out, y * (.75 + .25 * (k % 3 == 0)), i0=ns(tk), p=.5 * np.sin(2 * np.pi * tk * 1.5))
        tk += 1 / 12; k += 1
    t = tt(n)
    wh = filt(r.standard_normal(n), 'bandpass', [1200, 2600]) * (.6 + .4 * np.sin(2 * np.pi * 12 * t))
    out = out / _rms(out) * .5 + pan2(wh / _rms(wh), 0)
    e = np.minimum(1, t / .05) * np.clip((d + .05 - t) / .08, 0, 1)
    return out * e


def fx_clack(r):
    """Split-flap (Solari) flap: hard plastic leaf hitting its stop (bright click + small hollow knock) and a tiny
    rebound 11-16 ms later; < 50 ms so 60 ms-spaced flaps stay separate events."""
    n = ns(.05); f1 = r.uniform(1700, 2000)
    x = nburst(r, n, (2500, 8000), .0004, .0015) * .35
    x += modal(r, n, [(f1, 1, .008), (f1 * 1.83, .6, .005), (f1 * 2.9, .35, .003), (r.uniform(650, 780), .55, .011)],
               contact_ms=.3, noise_amt=.3, jit=.01)
    k = ns(r.uniform(.011, .016)); m = n - k
    x[k:] += modal(r, m, [(f1 * 1.2, .35, .005), (f1 * 2.2, .2, .003)], .2, .3) * r.uniform(.3, .45)
    return fade(filt(x, 'highpass', 300, 2), .0002, .008)


def fx_crack(r):
    """The rubber stamp cracking: brittle snap body + a burst of 4-6 micro-fractures over ~60 ms + a little grit."""
    n = ns(.25); x = np.zeros(n)
    x += modal(r, n, [(780, .7, .018), (1450, .8, .014), (2600, .55, .009), (4100, .3, .005)], contact_ms=.25, noise_amt=.4)
    x += nburst(r, n, (1500, 8000), .0002, .003) * .6
    tk = .008
    for j in range(int(r.integers(4, 7))):
        tk += r.uniform(.006, .018); i = ns(tk); m = n - i
        y = nburst(r, m, (1800, 8000), .0001, .0012) * .5 + modal(r, m, [(r.uniform(1800, 3600), .4, .003)], .1, .3)
        x[i:] += y * r.uniform(.3, .8) * (1 - j * .1)
    k = ns(.05); m = ns(.15)
    gr = filt(r.standard_normal(m), 'bandpass', [2000, 7000]) * uniform_filter1d((r.random(m) < .04) * 1.0, 15) * 4
    x[k:k + m] += gr * np.exp(-tt(m) / .05) * .12
    return fade(filt(room_er(x, r, .7, 6000), 'highpass', 250, 4), .0002, .04)


def fx_fall(r, d=.5):
    """Something falling away: descending air whoosh (3.2 kHz -> 380 Hz) + a faint descending whistle, receding."""
    n = ns(d); u = np.linspace(0, 1, n)
    fc = 3200 * (380 / 3200) ** (u ** .8)
    amp = np.where(u < .25, (u / .25) ** 1.5, ((1 - u) / .75) ** 1.4)
    y = swept_noise(r, n, fc, .5) * amp
    y += filt(r.standard_normal(n), 'bandpass', [3000, 8000]) * amp ** 2 * .15
    y += osc(1700 * (520 / 1700) ** u, n) * amp ** 1.5 * .18
    return pan_moving(fade(y, .003, .02), .1, -.15)


def fx_sparkle(r):
    """Tiny glitter: 8 small high bell grains over 0.16 s (2.3-5.3 kHz) + a breath of air; gone by ~0.3 s."""
    n = ns(.32); out = np.zeros((2, n))
    notes = [2349.3, 2793.8, 3136.0, 3520.0, 4186.0, 4698.6, 5274.0]
    for k in range(8):
        tk = .16 * (k / 8) ** 1.2 + r.uniform(0, .01); m = n - ns(tk)
        f = notes[int(r.integers(0, len(notes)))]
        y = modal(r, m, [(f, 1, r.uniform(.025, .045)), (f * 2.76, .2, .01)], .08, .2, .003)
        place(out, y * (1 - .4 * k / 8) * .35, i0=ns(tk), p=r.uniform(-.7, .7))
    air = filt(r.standard_normal(n), 'bandpass', [4000, 9000]) * env(n, .015, .06) * .04
    return fade(out + pan2(air, 0), .0005, .05)


def fx_pen(r, d=.4):
    """Marker underline: a firm felt-tip stroke, lower and grittier than the highlighter (grainy 1.2-2.6 kHz friction,
    a low squeak), a small tap as the tip lands and a lift-off flick."""
    d = max(d, .08); m = ns(d); n = m + ns(.06); u = np.linspace(0, 1, m)
    gr = uniform_filter1d((r.random(m) < .03).astype(float) * r.uniform(.3, 1, m), 20); gr /= gr.max() + 1e-9
    z = swept_noise(r, m, 1700 + 500 * np.sin(np.pi * u), .7) * (.7 + .6 * gr)
    z += .18 * osc(1150 + 120 * np.sin(2 * np.pi * 5 * u * d), m) * (.5 + .5 * gr)
    z *= np.minimum(1, u * d / .03) * np.minimum(1, (1 - u) * d / .05)
    x = np.zeros(n); x[:m] += z
    k = ns(.03); x[:k] += modal(r, k, [(1300, .5, .006), (2600, .3, .004)], .3, .3)
    k = m - ns(.01); L = min(ns(.04), n - k); x[k:k + L] += nburst(r, L, (2000, 7000), .0005, .006) * .3
    return pan_moving(fade(x, .002, .02), -.25, .25)


SNAP_SCALE = [587.3, 659.3, 740.0, 880.0, 987.8, 1174.7, 1318.5, 1480.0]   # D major pentatonic, rising


def fx_snap(r, idx=0):
    """Chip snapping into place: plastic engage click, seat click 18 ms later with a pitched body rising by index."""
    f = SNAP_SCALE[int(idx) % len(SNAP_SCALE)]
    n = ns(.18); x = np.zeros(n)
    x += nburst(r, n, (2500, 8000), .0002, .0012) * .35 + modal(r, n, [(2600, .5, .004), (4100, .3, .003)], .15, .3)
    k = ns(.018); m = n - k
    x[k:] += nburst(r, m, (2000, 8000), .0002, .0015) * .45
    x[k:] += modal(r, m, [(f, 1, .05), (f * 2.0, .3, .025), (f * 3.0, .12, .012), (f * 5.4, .08, .006)], .25, .2, .002)
    return fade(x, .0003, .03)


def fx_scratch(r):
    """Vinyl record scratch 'huh?': a buzzy vowel 'record' dragged back then forward under the needle (varispeed:
    pitch and formants follow the hand), surface noise moving with it, needle crackle. HP 250 Hz."""
    n = ns(.3); t = tt(n)                       # back stroke 0-90 ms, forward drag 100-210 ms ('huh?'), done by 0.22 s
    spd = np.interp(t, [0, .015, .05, .09, .1, .14, .19, .22, .3], [0, -1.8, -2.6, 0, .4, 2.4, 1.0, 0, 0])
    spd = uniform_filter1d(spd, ns(.006)); a = np.abs(spd)
    src = polyblep_saw(np.maximum(210 * a, 1.0), n) * (a > .05)

    def g(fr, tm):
        s = np.maximum(np.interp(tm, t, a), .05)
        return sum(w * np.exp(-.5 * (np.log2(np.maximum(fr, 20) / (fc * s)) / .3) ** 2)
                   for fc, w in ((700, 1.0), (1150, .8), (2600, .45)))
    y = stft_filter(src, g); y = y / (np.abs(y).max() + 1e-9)
    nz = swept_noise(r, n, np.maximum(400 + 2600 * a, 300), .7) * a / 2.6 * .35
    x = y * np.clip(a / 1.2, 0, 1) ** .7 + nz
    for _ in range(10):
        i = int(r.integers(0, n - ns(.004))); x[i:i + ns(.004)] += nburst(r, ns(.004), (2000, 8000), .0001, .0006) * r.uniform(.1, .3)
    return fade(filt(x, 'highpass', 250, 2), .001, .03)


def fx_slap(r):
    """Sticker slap 'thup': palm-flat smack: pitch-dropping thump (270 -> 160 Hz, carried by its 2nd-4th harmonics),
    mid knock 0.5-2.3 kHz with a soft (1.6 ms) contact, broad smack + vinyl tick. HP 120 Hz, no sub."""
    n = ns(.26); t = tt(n)
    f = 160 + 110 * np.exp(-t / .012)
    thup = (.5 * osc(f, n) + .7 * osc(2 * f, n) + .45 * osc(3.1 * f, n) + .25 * osc(4.2 * f, n)) * env(n, .003, .05)
    knock = modal(r, n, [(480, .8, .035), (910, .75, .026), (1380, .5, .018), (2300, .25, .01)], contact_ms=1.6, noise_amt=.25)
    smack = nburst(r, n, (700, 4500), .0015, .016) * .8 + nburst(r, n, (3000, 8000), .0004, .002) * .25
    x = thup * .35 + knock + smack
    return fade(filt(room_er(x, r, .8, 5500), 'highpass', 120, 4), .0004, .06)


def fx_sting(r):
    """Final lime brand sting: a fast rising D major bell-pluck flourish (D5 F#5 A5 D6, 28 ms apart) landing on a
    bright glassy FM chord, sparkle grains and air; decays within ~1 s."""
    n = ns(1.1); out = np.zeros((2, n))
    for k, m in enumerate((74, 78, 81, 86)):
        f = hz(m); i = ns(k * .028); L = n - i
        y = modal(r, L, [(f, 1, .5 - .08 * k), (f * 2.0, .4, .25), (f * 3.0, .18, .12), (f * 4.2, .1, .05)], .2, .15, .001)
        place(out, y * (.6 + .15 * k), i0=i, p=(-.3, -.1, .1, .3)[k])
    i = ns(.084); L = n - i; t = tt(L)
    for m, p in ((74, -.4), (78, .0), (81, .4), (86, .1)):
        f = hz(m)
        y = np.sin(2 * np.pi * f * t + 1.5 * np.exp(-t / .15) * np.sin(2 * np.pi * 2 * f * t)) * env(L, .003, .35) * .3
        place(out, y, i0=i, p=p)
    for k in range(10):
        tk = .09 + .4 * r.random(); L2 = n - ns(tk)
        f = float(r.choice([2349.3, 2960.0, 3520.0, 4698.6, 5919.9]))
        place(out, modal(r, L2, [(f, 1, .06), (f * 2.76, .2, .015)], .08, .2, .002) * .12, i0=ns(tk), p=r.uniform(-.8, .8))
    out += pan2(filt(r.standard_normal(n), 'bandpass', [4000, 9500]) * env(n, .04, .25) * .05, 0)
    return fade(out, .0005, .15)


# name: (generator, level dB (loudest 150 ms phone RMS re reference at v=1), reverb send, uses d as)
FX = {
    'sent': (fx_sent, 0, .08, None), 'read': (fx_read, -4, .06, None), 'typing': (fx_typing, -2, .04, 'dur'),
    'clock': (fx_clock, 0, .05, None), 'tick': (fx_tick, -2, .04, None), 'swstop': (fx_swstop, 1, .05, None),
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
    # creative 4
    'heart': (fx_heart, 0, .1, None), 'plink': (fx_plink, -4, .12, 'idx'), 'buzz': (fx_buzz, 1, .06, None),
    'press': (fx_press, 2, .12, None), 'belt': (fx_belt, -5, .05, 'dur'), 'pages': (fx_pages, -3, .06, 'dur'),
    'postit': (fx_postit, 0, .08, None), 'blip': (fx_blip, -2, .1, None), 'spinner': (fx_spinner, -4, .05, 'dur'),
    'clack': (fx_clack, -2, .05, None), 'crack': (fx_crack, 2, .1, None), 'fall': (fx_fall, -3, .15, None),
    'sparkle': (fx_sparkle, -4, .25, None), 'pen': (fx_pen, -3, .05, 'dur'), 'snap': (fx_snap, -1, .08, 'idx'),
    'scratch': (fx_scratch, 2, .1, None), 'slap': (fx_slap, 2, .1, None), 'sting': (fx_sting, 2, .3, None),
}
PRE_ROLL = {'sent': .05}      # the bubble pop (not the swish that leads into it) lands on the cue time
LONG = {'marker', 'typing', 'ff', 'coins', 'cells', 'count', 'riser', 'up', 'belt', 'pages', 'spinner', 'pen'}
TEXTURE = {'marker', 'typing', 'coins', 'riser', 'up', 'ff', 'swipe', 'whoosh', 'swoosh', 'whooshBig', 'paper',
           'belt', 'pages', 'spinner', 'pen', 'fall', 'scratch', 'count'}   # textures dip under the hits on top of them
#   (audio8: the counter's digit rattle too -- '3 CONTINENTES' lands on the +40 count)
SWEEPS = {'whoosh', 'swoosh', 'swipe', 'whooshBig', 'riser', 'fall', 'up', 'ff', 'paper'}   # air moves: beds do not
#   duck under them (a conveyor that pumps 10 dB under every passing whoosh is not a bed)
SERIES = {'plink', 'snap', 'pop', 'click'}     # pitched by index: without 'd' the index counts up along a rapid series
TEX_DUCK_DB = 6.0
TEX_DUCK_BY = {}              # per-name texture duck depth (dB) where it differs from TEX_DUCK_DB
KEY_ATTACK = (.10, .15)       # the texture duck hears each hit for its first 100 ms (fading out by 150 ms)
BED_DUCK_DB = 10.0            # beds get fully out of the way: they are heard in the gaps
BED_SWEEP_DUCK_DB = 5.0       # ... but only half way under an air sweep (a conveyor pumping 10 dB under every passing
#   whoosh is no longer a bed; a sweep over an undipped bed is lost): the two share the moment


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
    STEMS = ('hold', 'bass', 'mid', 'pad', 'drums', 'perc', 'synth')

    def __init__(self):
        self.st = {k: np.zeros((2, N)) for k in self.STEMS}
        self.send = np.zeros((2, N))

    def add(self, stem, x, t0=None, g=1.0, p=0.0, send=0.0, i0=None):
        place(self.st[stem], x, t0, g, p, i0)
        if send:
            place(self.send, x, t0, g * send, p, i0)


def pizz(r, f, vel, t60=.22, bright=.45):
    """String pizzicato: short Karplus-Strong pluck (peak = vel) plus a finger 'tk'."""
    y = ks_pluck(r, f, .45, vel, t60, bright, .18, .12)
    k = ns(.01); y[:k] += nburst(r, k, (1500, 5000), .0002, .0012) * vel * .12
    return y


def muted_bass(r, f, vel, dur=.16):
    """Muted upright-bass pizz: short pluck + additive body to 1.4 kHz with a 650 Hz 'thumb' resonance, so the
    line is carried by its harmonics on a phone (peak = vel)."""
    p = ks_pluck(r, f, dur + .25, 1.0, .2, .55, .25, .1)
    b = bass_note(r, f, dur, 1.0, 1.6, 1400, 4.0, .05)
    y = np.zeros(max(len(p), len(b))); y[:len(p)] += p * .5; y[:len(b)] += b / (np.abs(b).max() + 1e-9) * .6
    y = filt(peq(y, 650, 5.0, 1.0), 'highpass', 50, 2)
    return fade(y / (np.abs(y).max() + 1e-12) * vel, .0005, .03)


def synth_bass(r, f, vel, dur=.2):
    """Synth bass stab: detuned saws + square, a fast-decaying 2.6 kHz bite over a 900 Hz body, HP 110 Hz (the
    main bass owns the lows), a 1.1 kHz growl so it reads on a phone."""
    n = ns(dur + .06); t = tt(n)
    x = polyblep_saw(f, n, r.random()) + polyblep_saw(f * 1.006, n, r.random()) + .6 * _sq(f, n, r.random())
    e_f = env(n, .002, .04); e_s = env(n, .002, .1) * np.clip((dur + .06 - t) / .06, 0, 1)
    y = filt(x, 'lowpass', 2600) * e_f * .9 + filt(x, 'lowpass', 900) * e_s * .45
    y = peq(filt(y, 'highpass', 110, 2), 1100, 4.0, 1.2)
    return fade(y / (np.abs(y).max() + 1e-12) * vel, .0005, .03)        # peak = vel whatever the oscillator phases


def phone_line(x, r):
    """Mono hold music through a phone line: wow & flutter, 300-3400 Hz (4th order), a further 2.4 kHz low-pass
    (muffled, 'from the receiver on the desk'), hiss 40 dB down."""
    L = len(x); t = tt(L)
    c = t + .0011 * np.sin(2 * np.pi * .9 * t) + .00022 * np.sin(2 * np.pi * 6.5 * t + 1)
    x = np.interp(c, t, x)
    x = filt(filt(filt(x, 'highpass', 300, 4), 'lowpass', 3400, 4), 'lowpass', 2400, 2)
    return x + filt(r.standard_normal(L), 'bandpass', [300, 3400]) * np.sqrt(np.mean(x ** 2)) * 10 ** (-40 / 20)


INTRO_LVL = 1.4                       # the sparse pizzicato sits ~3 dB up so it reads on a phone between the effects
INTRO_CH = {'Dm': (38, 45, [62, 65, 69]), 'A7': (45, 40, [61, 64, 67]), 'Gm': (43, 38, [62, 67, 70]),
            'Bb': (46, 41, [62, 65, 70])}                  # (bass on beat 1, bass on beat 3, pizz chord)
INTRO_BARS = [('Dm', 'Dm'), ('Dm', 'A7'), ('Gm', 'A7'), ('Dm', 'Dm'), ('Bb', 'A7')]
# tiptoe pizz line (8th index in the bar, midi): kept clear of the UI clicks (0.45-0.81), the double-tap (3.45) and
# the four red ✕ hits (4.80, 7.00, 9.20, 11.40)
INTRO_MEL = [[(4, 62), (5, 65), (6, 69), (7, 68)], [(0, 69), (2, 74), (4, 73), (5, 64)],
             [(1, 67), (2, 70), (5, 64), (7, 61)], [(0, 62), (3, 65), (6, 69)], [(0, 74), (2, 77), (4, 76), (6, 73)]]


def intro(sc, anc):
    """0-11.90: ironic, sparse pizzicato in D minor (120 BPM): oom-pah of muted bass + pizz chords, a tiptoe pizz
    line; a sub hit under the stamp; the last bar becomes muffled phone-line hold music (the call transfer)."""
    r = np.random.default_rng(801); L = INTRO_LVL
    i0 = ns(anc['stamp']); n = ns(.6); t = tt(n)                      # sub hit under the stamp
    sub = osc(38 + 34 * np.exp(-t / .03), n) * env(n, .004, .22)
    sc.add('bass', sub * .5, i0=i0)
    sc.add('bass', muted_bass(r, hz(38), .7, .3), i0=i0)
    for bi, (h1, h2) in enumerate(INTRO_BARS):
        bar0 = bi * 4 * B
        for b in range(4):
            tb = bar0 + b * B; ch = INTRO_CH[h1 if b < 2 else h2]
            if b in (0, 2):
                if bi == 0 and b == 0:
                    continue                                    # the stamp owns the downbeat
                sc.add('bass', muted_bass(r, hz(ch[0] if b == 0 else ch[1]), .9 * L * (1 if b == 0 else .8)), tb)
            else:
                for k, m in enumerate(ch[2]):
                    sc.add('mid', pizz(r, hz(m), .1 * L, .16, .4), tb + .004 * k, 1, (-.35, 0, .35)[k], .15)
        for pos, m in INTRO_MEL[bi]:
            sc.add('mid', pizz(r, hz(m), .26 * L, .26, .5), bar0 + pos * B / 2, 1, .2 if pos % 2 else -.15, .2)
    # bar 5 (10.0-11.90): hold music, one bar of lounge bossa on the line
    t0 = 5 * 4 * B; L = ns(2.6); buf = np.zeros((2, L))
    for off, dur, ch, vel in ((0, .55, [62, 65, 69, 72, 76], .8), (.75, .4, [62, 65, 69, 72, 76], .6),
                              (1.0, .55, [57, 61, 67, 70, 76], .8), (1.75, .15, [57, 61, 67, 70, 76], .6)):
        for k, m in enumerate(ch):
            place(buf, ep_note(r, hz(m), dur, vel), off, .2, (k - 2) * .2)
    place(buf, bass_note(r, hz(50), .7, .9, .8, 1800, 3.0, .05), 0.0, .5)
    place(buf, bass_note(r, hz(45), .7, .9, .8, 1800, 3.0, .05), 1.0, .5)
    for off, m in ((0, 77), (.5, 76), (1.0, 73), (1.5, 70)):
        place(buf, vibes_note(r, hz(m), .4, .8), off, .32, .15)
    for k in range(16):
        place(buf, shaker(r, (.55, .3, .75, .4)[k % 4]), k * B / 4, .45, .3)
    y = fade(phone_line(buf.mean(0), r), .004, .01)
    sc.add('hold', pan2(y, 0), t0)


def riser_part(sc, anc):
    """12.25-13.15 tension riser on the dominant (A sus, tremolo accelerating, filter opening, string glide, noise),
    tonal so the split-flap clacks read through it; then a soft reverse swell into the drop."""
    r = np.random.default_rng(802)
    d = RISER1 - RISER0; n = ns(d); u = np.linspace(0, 1, n)
    p = pad_chord(r, [45, 52, 57, 62, 64], d, 1.0, 6000, .05, .02, hp=150)[:, :n]
    p = np.vstack([stft_filter(p[c], lambda f, tm: 1 / (1 + (f / (350 * 12 ** np.clip(tm / d, 0, 1) ** 1.2)) ** 4))
                   for c in range(2)])
    trem = 1 - .4 * (.5 + .5 * np.sin(2 * np.pi * np.cumsum(6 + 14 * u) / SR))
    p = p * trem * (.2 + .8 * u ** 1.6)
    f = 220 * 2 ** (u ** 1.5)                               # string glide A3 -> A4 with its fifth and octave
    gl = filt(polyblep_saw(f, n) + polyblep_saw(f * 1.5, n, .3) + .6 * polyblep_saw(f * 2.003, n, .6), 'lowpass', 3000)
    gl = filt(gl, 'highpass', 250, 2) * trem
    nz = swept_noise(r, n, 400 * 12 ** (u ** 1.2), .6) * u ** 2.5
    x = p * .9 + pan2(gl * (.15 + .85 * u ** 1.5) * .2, 0) + pan2(nz * .08, 0)
    sc.add('pad', fade(x, .01, .02), RISER0, 1, 0, .2)
    sc.add('drums', kick(r, .28, soft=True), 12.5); sc.add('drums', kick(r, .36, soft=True), 13.0)
    sw0 = RISER1 + .03; sw = anc['drop'] - sw0
    sc.add('perc', pan2(cymbal_swell(r, sw, .06), 0), sw0)


DPROG = [(38, [62, 66, 69, 74]), (43, [62, 67, 71, 74]), (35, [62, 66, 71, 74]), (45, [61, 64, 69, 73])]   # D G Bm A
STRUM = ((0, 1, 1.0), (3, 0, .6), (6, 1, .8), (8, 0, .7), (10, 1, .85), (13, 0, .6))   # 16th positions
BASSLINE = ((0, 0, .6), (.75, 0, .22), (1.5, 7, .4), (2, 12, .3), (2.75, 0, .22), (3.5, 7, .4))   # beat, interval, beats
HOOK = [(0, 81, .9), (2, 78, .6), (3, 81, .7), (5, 83, .8), (6, 81, .6), (8, 78, .8), (10, 76, .6), (11, 74, .7), (14, 76, .7)]
SYNB = (1, 3, 4, 6, 7)        # synth-bass stab 8th positions
CHST = (1, 3, 5, 7)           # chord stabs on the off-beats
GROOVE_LVL = 1.0


def bar_chord(k):
    return DPROG[0] if k == 14 else DPROG[k % 4]               # the seal bar (41.5) goes home to D


def groove(sc, anc, t_lo, t_hi, seed):
    """The confident D major groove, bars phased on the drop (13.5 + 2k s, 120 BPM). Base from the drop: kick,
    syncopated bass, guitar strums, pad, a light lime pluck hook; then one layer per receipt (hats 16.80, claps
    21.00, synth-bass stabs 24.40, chord stabs 28.80); full groove from 31.80 (four-on-the-floor, snare under the
    clap, open hats, ganza, agogo, hook doubled by marimba). Events are kept in [t_lo, t_hi); nothing in the
    39.00-39.50 scratch break; drums and percussion stop 41.25 -> just after the seal slap (stop-time)."""
    r = np.random.default_rng(seed)
    seal, sting = anc['seal'], anc['sting']
    end_dr = sting - .4                                       # drums stop for the pickup into the sting

    def ok(te, kind=''):
        if not (t_lo - 1e-6 <= te < t_hi - 1e-6) or SCRATCH_T - 1e-6 <= te < LP_BACK - 1e-6:
            return False
        if kind == 'dr' and (41.25 - 1e-6 <= te < seal + .15 or te >= end_dr - 1e-6):
            return False
        return te < sting - .1
    on = lambda te, T: te >= T - 1e-6
    for k in range(int((TOTAL - BAR0) / (4 * B)) + 1):
        bar0 = BAR0 + k * 4 * B
        root, tones = bar_chord(k)
        for b in range(4):
            tb = bar0 + b * B
            full = on(tb, FULL_T - .05); lvl = GROOVE_LVL * (1.0 if full else .95)
            if ok(tb, 'dr'):
                if b in (0, 2):
                    sc.add('drums', kick(r, .55 * lvl), tb)
                elif full:
                    sc.add('drums', kick(r, .42 * lvl), tb)
                if b in (1, 3) and on(tb, CLAP_T):
                    sc.add('drums', clap(r, .42 * lvl), tb, 1, 0, .25)
                    if full:
                        sc.add('drums', snare(r, .22 * lvl), tb, 1, 0, .15)
            if b == 1 and ok(tb + .75 * B, 'dr'):
                sc.add('drums', kick(r, .34 * lvl), tb + .75 * B)
            for q in range(4):
                ts = tb + q * B / 4
                if not ok(ts, 'dr'):
                    continue
                if on(ts, HATS_T):
                    sc.add('perc', hat(r, (.2, .09, .28, .11)[q] * lvl), ts, 1, .3)
                    sc.add('perc', shaker(r, (.14, .06, .2, .08)[q] * lvl), ts, 1, -.2)
                if on(ts, FULL_T - .05):
                    sc.add('perc', ganza(r, (.5, .3, .6, 1.0)[q] * .4 * lvl), ts, 1, .4)
                    if q == 2:
                        sc.add('perc', hat(r, .2 * lvl, open_=True), ts, 1, -.3)
        for off, iv, d in BASSLINE:
            tn = bar0 + off * B
            if ok(tn):
                lv = GROOVE_LVL * (1.0 if on(tn, FULL_T - .05) else .95)
                sc.add('bass', bass_note(r, hz(root + iv), d * B, .32 * lv, 2.0, 1400, 2.0), tn)
        for j in SYNB:
            tn = bar0 + j * B / 2
            if ok(tn) and on(tn, SYNB_T):
                sc.add('synth', synth_bass(r, hz(root + (19 if j == 6 else 12)), .4, .16), tn, 1, 0, .05)
        for j in CHST:
            tn = bar0 + j * B / 2
            if ok(tn) and on(tn, CHORD_T):
                sc.add('synth', stab_chord(r, tones, .26, .24, 2400, .06), tn, 1, 0, .15)
        d = min(4 * B, t_hi - bar0, SCRATCH_T - bar0 if bar0 < SCRATCH_T else 4 * B, sting - bar0)
        if ok(bar0) and d > .05:
            pv = .45 * (1.1 if on(bar0, FULL_T - .05) else 1.0)
            sc.add('pad', pad_chord(r, [m - 12 for m in tones], d, pv, 1400, .04, .15), bar0, 1, 0, .35)
        for pos, down, v in STRUM:
            ts = bar0 + pos * B / 4
            if ok(ts):
                x = filt(strum(r, tones, .15 * v, bool(down), .45, .7, .5), 'lowpass', 2600)
                if abs(ts - anc['drop']) > 1e-3:   # the drop's downbeat belongs to the impact + brand stab (+ kick and
                    sc.add('mid', x, ts, 1, 0, .2)  # bass): guitar and hook come in on the next 16th / 8th, so the hit pops
                    # (rendered anyway: the rng sequence -- every later note's humanisation -- stays as it was)
        for pos, m, v in HOOK:
            ts = bar0 + (pos % 8) * B / 2
            if (pos >= 8) != (k % 2 == 1) or not ok(ts):
                continue
            full = on(ts, FULL_T - .05)
            x = ks_pluck(r, hz(m), .4, (.14 if full else .09) * v, .3, .7)
            if abs(ts - anc['drop']) > 1e-3:
                sc.add('mid', x, ts, 1, .25, .25)
            if full:
                sc.add('mid', marimba_note(r, hz(m - 12), .12 * v, .45), ts, 1, -.25, .2)


def middle(sc, anc):
    """12.25-39.00: riser, drop (brand stab sample-aligned with the cue at 13.50), groove building per receipt, full."""
    r = np.random.default_rng(803)
    riser_part(sc, anc)
    i = ns(anc['drop'])
    sc.add('pad', stab_chord(r, [50, 54, 57, 62], .28, .5, 1700, .14), i0=i, send=.25)
    if abs(anc['drop'] - DROP_T) > .002:
        sc.add('drums', kick(r, .5), i0=i)
    groove(sc, anc, DROP_T, SCRATCH_T, 811)
    for j in range(4):                                        # pickup fill into the full groove (S11 -> S12)
        sc.add('drums', snare(r, .1 + .06 * j), 31.0 + j * B / 4, 1, 0, .15)
    sc.add('drums', tom(r, 150, .25), 31.25, 1, .3); sc.add('drums', tom(r, 120, .28), 31.375, 1, -.3)


def finale(sc, anc):
    """39.50-45.60: the groove from the 39.50 downbeat (low-passed later, in build_music), stop-time before the seal,
    stab + kick + bass sample-aligned with the seal slap, groove, pickup, final D major chord under the sting."""
    r = np.random.default_rng(804)
    groove(sc, anc, LP_BACK, TOTAL, 812)
    i = ns(anc['seal'])
    sc.add('pad', stab_chord(r, [50, 54, 57, 62], .42, .45, 1700, .12), i0=i, send=.25)
    sc.add('drums', kick(r, .55), i0=i)
    sc.add('bass', bass_note(r, hz(38), .35, .34, 2.0, 1400, 2.5, .06), i0=i)
    st = anc['sting']
    for j, v in enumerate((.1, .14, .18)):                     # snare pickup on the 16th grid
        tp = 44.0 + j * B / 4
        if tp < st - .1:
            sc.add('drums', snare(r, v), tp, 1, 0, .15)
    i = ns(st)
    sc.add('pad', pad_chord(r, [50, 57, 62, 66], .55, .42, 1900, .01, .45), i0=i, send=.2)
    sc.add('bass', bass_note(r, hz(38), .45, .34, 2.0, 1400, 3.0, .3), i0=i)
    sc.add('drums', kick(r, .42, soft=True), i0=i)
    sc.add('mid', filt(strum(r, [62, 66, 69, 74], .12, True, .5, .6, .9, spread=.008), 'lowpass', 2200), i0=i, send=.15)
    sc.add('pad', stab_chord(r, [50, 54, 57, 62], .28, .4, 1800, .1), i0=i)


def brake(x, t0, d=.18):
    """Record stop under the scratch: from t0 the music decelerates to a halt over d seconds (varispeed), then nothing."""
    i0 = ns(t0); m = ns(d); u = np.arange(m) / m
    pos = i0 + np.cumsum((1 - u) ** 1.6)
    y = np.zeros_like(x); y[:, :i0] = x[:, :i0]
    idx = np.arange(x.shape[1])
    for c in range(2):
        y[c, i0:i0 + m] = np.interp(pos, idx, x[c]) * (1 - u) ** .35
    return y


IR_MUS = make_ir(1.5, pre=.02, lp=5200, seed=9)
WET = .32
LP_HZ, LP_MAKEUP_DB = 1000.0, 1.0        # the muffled groove 39.50 -> seal: zero-phase LP (24 dB/oct), +1 dB
MUSIC_GATE = np.ones(N)               # filled by build_music(): 11.90-12.20 digital silence + last 100 ms fade
SFX_GATE = np.ones(N)                 # 11.90-12.20 digital silence for the effects too
if os.environ.get('VACUO_SFX', '0') != '1':
    SFX_GATE[ns(GATE0):ns(GATE1)] = 0
STEM_GAIN = {'hold': .32, 'bass': .4, 'mid': 1.6, 'pad': .72, 'drums': .7, 'perc': .9, 'synth': .6}


def anchors():
    return dict(zip(('stamp', 'drop', 'seal', 'sting'), HERO_TIMES))


def brand_anchor(cues=None):
    """The drop (brand stab) is sample-aligned with the hit cue at 13.50 (if one lands within 60 ms)."""
    return HERO_TIMES[1]


def build_music(cues=None, stem_gain=None):
    """Returns the music bus (2, N) before ducking, and the Score (stems, summed over the three segments).
    Segments are mixed separately so nothing rings into the silences: A 0-11.90 (cut 4 ms), B 12.25-39.00 (record
    brake), C 39.50-end (low-passed until the seal slap, reverb return fading 45.0-45.5, last 100 ms faded)."""
    sg = dict(STEM_GAIN, **(stem_gain or {}))
    anc = anchors()
    segs = [Score(), Score(), Score()]
    intro(segs[0], anc); middle(segs[1], anc); finale(segs[2], anc)
    t = tt(N)

    def mixdown(sc):
        return sum(sc.st[k] * sg[k] for k in sc.STEMS), convolve_st(sc.send, IR_MUS) * WET
    da, wa = mixdown(segs[0])
    ga = np.clip((GATE0 - t) / .004, 0, 1)
    a = (da + wa) * ga
    db, wb = mixdown(segs[1])
    b = brake(db + wb, SCRATCH_T, .18)
    dc, wc = mixdown(segs[2])
    c = dc + wc * np.clip((45.5 - t) / .5, 0, 1)
    i_s = ns(anc['seal']); k = ns(.012)
    w = np.zeros(N); w[:i_s - k] = 1; w[i_s - k:i_s] = np.linspace(1, 0, k)
    lp = signal.sosfiltfilt(signal.butter(2, LP_HZ, 'lowpass', fs=SR, output='sos'), c, axis=-1)
    c = c * (1 - w) + lp * w * 10 ** (LP_MAKEUP_DB / 20)
    mus = filt(a + b + c, 'highpass', 30)
    g = np.ones(N)
    i0, i1 = ns(GATE0), ns(GATE1); fl = ns(.004)
    g[i0:i1] = 0; g[i0 - fl:i0] = np.minimum(g[i0 - fl:i0], np.linspace(1, 0, fl))
    g *= np.clip((TOTAL - t) / .1, 0, 1)
    MUSIC_GATE[:] = g                                         # re-applied after duck / ride / EQ: silences stay exact
    sc = Score()
    for k2 in sc.STEMS:
        sc.st[k2] = sum(s.st[k2] for s in segs)
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
REF_DB = -18.5                       # loudest-150 ms phone RMS of a level-0 cue at v = 1 (bus dBFS); audio8: 2.5 dB
#   under audio7 (this film has ~2.5x the cue density: the score keeps its place on a phone)
IR_SFX = make_ir(.75, pre=.008, lp=7500, seed=5)
VACUO = (GATE0, GATE1)               # 11.90-12.20: total digital silence (the split-flap turn starts in silence)
VACUO_SFX = os.environ.get('VACUO_SFX', '0') == '1'   # 1 = let a cue that starts inside the silence play


def load_cues():
    cues = []
    unknown = set()
    for i, c in enumerate(CUES_DATA['cues']):
        c = dict(c); c['i'] = c.pop('_i', i); c['t'] = float(c['t'])
        if c['n'] not in FX:
            unknown.add(c['n'])
        cues.append(c)
    if unknown:
        print('   WARNING: unknown cue names rendered as tap: ' + ', '.join(sorted(unknown)))
    cues.sort(key=lambda c: (c['t'], c['i']))
    return cues


BLOOM = {'shimmer', 'squeak', 'whoosh', 'swoosh', 'whooshBig', 'sparkle', 'fall'}   # bloom / peak after the hit they start on:
#   measured separately as layers (>= 0 dB) when they start on a higher-priority cue (from 40 ms before it to
#   BLOOM_DT after it: debris falling 3 frames after the crack that releases it is that crack's bloom)
BLOOM_DT = .12
MERGE_SPAN = {'wa': .13, 'sent': .06}   # the two-note reply motif occupies 130 ms; the sent gesture 60 ms
# sweeps that lead INTO the next hit (it starts .04-.30 s after them): rendered as a lead-in (peak ~45 ms before the
# hit, gone ~50 ms after it) and measured as a layer of that hit, over their own lead-in only (the window ends at the
# hit: from there on the sweep is part of the hit it was cut to).  A riser leads into the hit it ends on.
LEADIN = {'whoosh': .3, 'swipe': .3, 'swoosh': .3, 'whooshBig': .3}
FLAM_OFFS_MS = (0, 2, 4, 6, 8)
CHOKE = {'buzz': .2}    # sustained hits choked by the next hit of equal or higher priority inside their body


def classify(cues):
    """hero / normal / layer, plus same-event merges.
    hero = the hit cue on one of the four hero instants (stamp, drop, seal slap, sting).
    A cue that starts on another, higher-priority cue's event (within one video frame either side -- 30 ms for long
    textures -- or inside a motif's MERGE_SPAN), or the same effect cued twice within one frame, is the same audible
    event (a flam): it is rendered and summed into that cue and measured as part of it. Bloom sweeteners starting on a
    higher-priority hit are measured as layers; so are sweeps that lead into a hit (LEADIN) and a riser that ends on
    one (c['lead_into'] = that hit's onset).
    Pitched series effects (plink, snap, pop, click) without an explicit index count up along a rapid series."""
    pr = {n: k for k, n in enumerate(PRIORITY)}
    for c in cues:
        hero = any(abs(c['t'] - h) <= LAYER_DT for h in HERO_TIMES) and c['n'] not in TEXTURE | SWEET | BLOOM
        c['cls'] = 'hero' if hero else 'layer' if c['n'] in SWEET | BED else 'normal'
        c['layer_of'] = None; c['merge_into'] = None; c['lead_into'] = None; c['choke'] = None
    last = {}
    for c in cues:
        if c['n'] in SERIES:
            p = last.get(c['n'])
            c['series'] = 0 if p is None or c['t'] - p['t'] > .35 else p['series'] + 1
            last[c['n']] = c
    for c in cues:
        if c['n'] in BLOOM:
            twin = [o for o in cues if o is not c and o['n'] == c['n'] and (o['t'], o['i']) < (c['t'], c['i'])
                    and c['t'] - o['t'] <= FRAME_DT]
            if twin:                                          # the same sweetener cued twice: one event
                c['merge_into'] = twin[0]['i']; continue
            for o in sorted(cues, key=lambda o: pr.get(o['n'], 99)):
                if o is not c and o['t'] - .04 <= c['t'] <= o['t'] + BLOOM_DT and pr.get(o['n'], 99) < pr.get(c['n'], 99):
                    c['layer_of'] = f"{o['n']}@{o['t']:.3f}"; c['cls'] = 'layer'; break
            continue
        best = None
        dt = LAYER_DT if c['n'] in LONG else FRAME_DT
        for o in cues:
            if o is c or o['n'] in BLOOM:
                continue
            po, pc = pr.get(o['n'], 99), pr.get(c['n'], 99)
            same = o['n'] == c['n'] and (o['t'], o['i']) < (c['t'], c['i']) and c['t'] - o['t'] <= dt
            if not same and (po >= pc or not o['t'] - dt <= c['t'] <= o['t'] + max(dt, MERGE_SPAN.get(o['n'], 0))):
                continue
            if best is None or po < pr.get(best['n'], 99):
                best = o
        if best is not None:
            c['merge_into'] = best['i']
    byi = {c['i']: c for c in cues}
    for c in cues:                                            # a guest of a guest joins the root host
        hops = 0
        while c['merge_into'] is not None and byi[c['merge_into']]['merge_into'] is not None and hops < 20:
            c['merge_into'] = byi[c['merge_into']]['merge_into']; hops += 1
    for c in cues:
        c['target'] = TARGET[c['cls']]
        hits = [o for o in cues if o is not c and o['n'] not in TEXTURE and o['n'] not in SWEET and o.get('merge_into') is None]
        gaps = [o['t'] - PRE_ROLL.get(o['n'], 0.0) - c['t'] for o in hits]
        gaps = [g for g in gaps if g > .03]
        c['gap_next'] = min(gaps) if gaps else None
        c['ctx_after'] = any(.02 < c['t'] - o['t'] < .25 for o in hits)
    onset = {}                                                # an event starts at its earliest member (guests included)
    for c in cues:
        h = c['i'] if c.get('merge_into') is None else c['merge_into']
        onset[h] = min(onset.get(h, 1e9), c['t'] - PRE_ROLL.get(c['n'], 0.0))
    for c in cues:                                            # lead-ins, chokes
        if c.get('merge_into') is not None or c['cls'] == 'hero':
            continue
        hits = [o for o in cues if o is not c and o['n'] not in TEXTURE | SWEET | BED and o.get('merge_into') is None]
        # what a sweep can lead into: the next hit, or the next foreground texture (a whip-scroll into the counter)
        tgts = [o for o in cues if o is not c and o['n'] not in SWEEPS | SWEET | BED and o.get('merge_into') is None
                and onset[o['i']] - c['t'] > .03]
        host = None
        if c['n'] in LEADIN and c['layer_of'] is None and tgts:
            o = min(tgts, key=lambda o: onset[o['i']])
            if .04 <= onset[o['i']] - c['t'] <= LEADIN[c['n']]:
                host = o
        elif c['n'] == 'riser' and c['layer_of'] is None:
            # a riser builds into the first strong hit (crack or stronger) inside its span, else the hit it ends on;
            # the score's own riser / reverse swell carries anything after that
            end = c['t'] + float(c.get('d', .9))
            strong = [o for o in hits if c['t'] + .3 <= onset[o['i']] <= end + .05 and pr.get(o['n'], 99) <= pr['crack']]
            near = [o for o in hits if end - .15 <= o['t'] <= end + .05]
            host = (min(strong, key=lambda o: onset[o['i']]) if strong else
                    min(near, key=lambda o: (pr.get(o['n'], 99), abs(o['t'] - end))) if near else None)
        if host is not None:
            c['lead_into'] = onset[host['i']]
            c['layer_of'] = f"{host['n']}@{host['t']:.3f} (lead-in)"; c['cls'] = 'layer'; c['target'] = TARGET['layer']
        if c['n'] in CHOKE:
            nxt = [o['t'] - c['t'] for o in hits if .03 < o['t'] - c['t'] < CHOKE[c['n']] and pr.get(o['n'], 99) <= pr.get(c['n'], 99)]
            c['choke'] = min(nxt) if nxt else None
    return cues


def render_cue(c):
    """Dry + reverb contribution of one cue (stereo) and its start sample. Deterministic per cue instance."""
    name = c['n'] if c['n'] in FX else 'tap'
    gen, lvl, send, darg = FX[name]
    r = np.random.default_rng(seed_of(c['n'], c['i'], int(round(c['t'] * 1000))))
    gap = c.get('gap_next')
    lead = c.get('lead_into')
    if name in ('whoosh', 'swipe', 'swoosh', 'whooshBig') and c.get('merge_into') is None and (
            lead is not None or name in ('whoosh', 'swipe') and gap is not None and .04 <= gap <= .3):
        g_ = (lead - c['t']) if lead is not None else gap
        d = float(np.clip(g_ + .05, .1, .34))                  # lead-in: peaks ~45 ms before the hit, gone by it
        x = gen(r, d=d, peak=max(.03, g_ - .045) / d)
    elif name == 'riser' and lead is not None:
        x = gen(r, max(.2, lead - c['t'] - .02))               # rises into the hit and stops one breath (20 ms) before it
    elif name in ('whoosh', 'swipe') and c.get('merge_into') is None and c.get('ctx_after'):
        x = gen(r, d=.44 if name == 'whoosh' else .36, peak=.55)   # starts in a hit's tail: peaks late
    elif name == 'chime' and c.get('merge_into') is None and gap is not None and gap < .15:
        x = gen(r, short=True)                         # a hit follows at once: just the 'ding'
    elif name == 'swipe' and c.get('merge_into') is not None:
        x = gen(r, flick=True)                         # the bubble's flick, part of its sent / reply gesture
    elif darg == 'dur':
        x = gen(r, float(c['d'])) if 'd' in c else gen(r)
    elif darg == 'idx':
        x = gen(r, int(round(c['d'])) if 'd' in c else c.get('series', 0))
    else:
        x = gen(r)
    if c.get('choke'):                                          # choked by the next hit: 12 ms release into its onset
        k = min(x.shape[-1], ns(c['choke'] + .004)); f = ns(.012)
        x = x[..., :k].copy(); x[..., k - f:] *= np.linspace(1, 0, f)
    lv = loudest_db(phone(x))
    xdb = c.get('extra_db', 0.0)       # boosts act before the peak cap (the cap bounds them); cuts act after it, so a
    g = 10 ** ((REF_DB + lvl + max(0.0, xdb) - lv) / 20) * float(c.get('v', 1.0))   # cut always lowers the cue
    dry = (pan2(x, c.get('p', 0.0)) if x.ndim == 1 else x) * g
    if SFX_HP_HZ:                                              # dialogue-friendly voicing (mix_vo.py only)
        dry = peq(filt(dry, 'highpass', SFX_HP_HZ, 2), 420, -3.0, 1.0)
    pk = 20 * np.log10(np.abs(dry).max() + 1e-12)
    cap = (PEAK_CAP_HERO if any(abs(c['t'] - h) < .03 for h in HERO_TIMES) else PEAK_CAP_DB) - G_DB_EST
    c['capped_db'] = round(min(0.0, cap - pk), 2)                # level choice, not a clipper: the whole cue is scaled
    dry = dry * 10 ** ((c['capped_db'] + min(0.0, xdb)) / 20)
    wet = convolve_st(np.pad(dry, ((0, 0), (0, IR_SFX.shape[1]))), IR_SFX) * send
    out = np.pad(dry, ((0, 0), (0, IR_SFX.shape[1]))) + wet
    i0 = int(round((c['t'] - PRE_ROLL.get(name, 0.0)) * SR))
    # nothing may sound in the 11.90-12.20 silence: tails of earlier cues fade out at its start
    v0, v1 = ns(VACUO[0]), ns(VACUO[1])
    if i0 < v0 < i0 + out.shape[1]:
        k = v0 - i0; f = ns(.006)
        out = out[:, :k].copy(); out[:, max(0, k - f):] *= np.linspace(1, 0, min(f, k))
    elif v0 <= i0 < v1 and not VACUO_SFX:
        out = np.zeros((2, 1)); c['muted'] = f'starts inside the {VACUO[0]:.2f}-{VACUO[1]:.2f} digital silence'
    # the whole soundtrack fades out over its last 100 ms (applied per cue so stems and leave-one-out stay exact)
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
    byi = {c['i']: c for c in cues}
    for c in cues:
        c.pop('merged', None)
        if c.get('merge_into') is not None:                   # a merged event is CUT as a whole (limiter GR); a boost
            c['extra_db'] = min(0.0, byi[c['merge_into']].get('extra_db', 0.0))   # lifts the host, its identity, only
    rendered = [(c,) + render_cue(c) for c in cues]
    # transitions / textures dip under the hits (a fixed automation lane keyed from the hit cues). audio8: keyed from
    # each hit's attack only (its first 100 ms, out by 150 ms -- the span its audibility is measured on): a texture
    # comes back up under a ringing tail instead of staying pushed down for the whole 0.3-1 s decay of a press or an
    # impact (the keyboard that starts on the third press, the subtitle typing under the opening stamp)
    hits = np.zeros((2, N))
    for c, i0, x in rendered:
        if c['n'] not in TEXTURE:
            w = np.clip((ns(KEY_ATTACK[1]) - np.arange(x.shape[1])) / max(1, ns(KEY_ATTACK[1] - KEY_ATTACK[0])), 0, 1)
            place(hits, x * w, i0=i0)
    key = follower(filt(hits.mean(0), 'bandpass', [400, 8000]), att=.002, rel=.06)
    k = ns(.008); key = np.concatenate([key[k:], np.full(k, key[-1])])
    kamt = np.clip((20 * np.log10(key + 1e-9) + 36) / 12, 0, 1)
    gtex = 10 ** (-TEX_DUCK_DB * kamt / 20)
    # beds (conveyor, spinner) sit under everything else, textures included (typing over the spinner); 5 dB under sweeps
    oth = np.zeros((2, N))
    sw = np.zeros((2, N))
    for c, i0, x in rendered:
        if c['n'] not in BED:
            place(sw if c['n'] in SWEEPS else oth, x, i0=i0)

    def bed_amt(b):
        kb = follower(filt(b.mean(0), 'bandpass', [400, 8000]), att=.002, rel=.06)
        k = ns(.008); kb = np.concatenate([kb[k:], np.full(k, kb[-1])])
        return np.clip((20 * np.log10(kb + 1e-9) + 36) / 12, 0, 1)
    gbed = 10 ** (-np.maximum(BED_DUCK_DB * bed_amt(oth), BED_SWEEP_DUCK_DB * bed_amt(sw)) / 20)
    for k, (c, i0, x) in enumerate(rendered):
        if (c['n'] in TEXTURE or c['n'] in BED) and x.shape[1] > 1:
            lane = gbed if c['n'] in BED else gtex if c['n'] not in TEX_DUCK_BY else 10 ** (-TEX_DUCK_BY[c['n']] * kamt / 20)
            j0 = max(0, i0); j1 = min(N, i0 + x.shape[1]); g = np.ones(x.shape[1]); g[j0 - i0:j1 - i0] = lane[j0:j1]
            rendered[k] = (c, i0, x * g)
    for c, i0, x in rendered:
        if c.get('merge_into') is None:
            host[c['i']] = [c, i0, x]
    for c, i0, x in rendered:
        if c.get('merge_into') is not None and c['merge_into'] in host:
            h = host[c['merge_into']]
            # a layer cued on the very same sample as its host is placed 0-8 ms late (whichever offset gives the lowest
            # summed peak): same frame, same perceived instant, but the onset transients do not stack into one peak
            # (three sample-aligned mallet onsets summed 4-5 dB over any of them, and the peak cap then held the
            # whole event down)
            best = None
            for off in (FLAM_OFFS_MS if abs(i0 - h[1]) < ns(.004) else (0,)):
                j0 = i0 + ns(off / 1000)
                a0 = min(h[1], j0); a1 = max(h[1] + h[2].shape[1], j0 + x.shape[1])
                buf = np.zeros((2, a1 - a0)); buf[:, h[1] - a0:h[1] - a0 + h[2].shape[1]] += h[2]
                buf[:, j0 - a0:j0 - a0 + x.shape[1]] += x
                pk = float(np.abs(buf).max())
                if best is None or pk < best[0] - 1e-9:
                    best = (pk, j0, a0, buf)
            _, i0, a0, buf = best
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


DUCK = dict(mid_db=-8.0, all_db=-2.0, thr=-50.0, knee=16.0, look=.010, lo=350, hi=7000)   # audio8: -8 / -2 dB (the
#   effects are dense here: a -11 dB duck would keep the score permanently pushed down)


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
        for k in ('layer_of', 'merged', 'lead_into', 'choke'):
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
        E = len(d) if c.get('lead_into') is None else max(a + ns(.02), min(len(d), ns(c['lead_into']) - w0))   # lead-in: up to the hit
        if c['n'] in LONG and 'd' in c:
            t0 = max(0, ns(c['t']) - w0); t1 = min(len(d), E, t0 + max(ns(float(c['d'])), ns(.15)))
            ce = np.concatenate([[0], np.cumsum(cp[t0:t1] ** 2)]); L = len(ce) - 1; best = (L, 0)
            for wl in range(ns(.15), L + 1, ns(.01)):                # shortest window with 80 % of the energy
                k = int(np.argmax(ce[wl:] - ce[:-wl]))
                if ce[k + wl] - ce[k] >= .8 * ce[-1]:
                    best = (wl, k); break
            a0 = t0 + best[1]; a1 = a0 + best[0]; b1 = a1
        else:
            e = uniform_filter1d(cp ** 2, ns(.005))
            s1 = min(len(d), E, a + c.get('dry_len', m) + ns(.05))
            pk = a + int(np.argmax(e[a:s1]))
            a0 = max(a, pk - ns(.01))
            ce = np.cumsum(cp[a0:min(len(cp), E, a0 + ns(.4))] ** 2)
            t90 = int(np.searchsorted(ce, .9 * ce[-1])) if len(ce) and ce[-1] > 0 else ns(.15)
            a1 = min(len(d), E, a0 + int(np.clip(t90, ns(.05), ns(.15)))); b1 = min(len(d), E, a0 + ns(.15))
            if a1 - a0 < ns(.05):                                   # a lead-in's window still spans >= 50 ms
                a0 = max(a, a1 - ns(.05))
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
                room = lim - .1 - r['gr_db']
                if r['gr_db'] <= (RIDE['hero_db'] if lim < 2 else RIDE['sum_db']) + .15:
                    room = max(room, 2.0)          # GR at the music ride's working level: the ride makes the room
                inc = min(step, r['target'] + margin - r['snr'] + .3, cap - c['extra_db'], max(0.0, room))
                if inc > .05:
                    c['extra_db'] += inc; changed.append(c)
        music_gr = [r for r in rows if r['snr'] is not None and r['gr_db'] - r['gr_own_db'] > gr_limit(r['win'][0])]
        if music_gr:
            print('   GR over limit not caused by the cue: ' + ', '.join(f"{r['n']}@{r['t']:.2f} {r['gr_db'] - r['gr_own_db']:.1f}" for r in music_gr))
        if not changed:
            break
        print('   trims: ' + ', '.join(f"{c['n']}@{c['t']:.2f}{c['extra_db']:+.1f}" for c in changed))
    else:                                                  # the last pass changed trims: measure what is delivered
        sfx, parts = build_sfx(cues); amt = duck_amount(sfx)
        G, ride = master_gain(mus, sfx, TARGET_LUFS, CEIL_DB, amt)
        rows = loo(parts, sfx, completo_fn(mus, G, CEIL_DB, amt, ride))
        summarize(rows, 'completo final')
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
    at = {f"{t:.3f}": round(float(gr[max(0, ns(t + HERO_WIN[0])):ns(t + HERO_WIN[1])].max()), 2) for t in HERO_TIMES}
    return float(gr.max()), per_s, at


def section_levels(mus_out, sfx_out, mix, mus_raw=None):
    _, drop, seal, sting = HERO_TIMES
    secs = [('intro pizzicato (S01-S05)', 0, GATE0), ('riser (S06)', RISER0, drop), ('drop groove (S07)', drop, HATS_T),
            ('+hats (S08)', HATS_T, CLAP_T), ('+claps (S09)', CLAP_T, SYNB_T), ('+synth bass (S10)', SYNB_T, CHORD_T),
            ('+chord stabs (S11)', CHORD_T, FULL_T), ('full groove / proof (S12)', FULL_T, SCRATCH_T),
            ('scratch + low-passed groove (S13)', SCRATCH_T, seal), ('groove back (S13)', seal, sting),
            ('sting + decay', sting, TOTAL)]
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
    """Reuse the per-cue trims and master EQ of the last audio8 run if the cue list is unchanged."""
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
        'build': {'script': 'audio8.py', 'cues': CUES_PATH, 'srt': SRT_PATH,
                  'sample_rate': SR, 'bit_depth': 24, 'length_s': N / SR},
        'mix_completo': {'lufs': round(L1, 2), 'true_peak_dbtp': round(tp1, 2),
                         'readback_lufs': round(lufs(rb['mix_completo.wav']), 2), 'readback_true_peak_dbtp': round(true_peak_db(rb['mix_completo.wav']), 2),
                         'limiter_max_gr_db': round(gr_max, 2), 'limiter_gr_db_per_second': gr_s, 'limiter_gr_db_at_hero_hits': gr_hero,
                         'master_gain_db': round(20 * np.log10(G), 2), 'master_eq': MASTER_EQ, 'clipper': 'none',
                         'music_ride': {'what': f"slow music level automation (>= 40 ms ramps): music alone never needs > {RIDE['head_db']} dB of limiter GR, music + effects never > {RIDE['sum_db']} dB ({RIDE['hero_db']} dB at hero instants)",
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
        'timeline': {'bpm': 120, 'beat': B, 'grid_from': 0.0, 'bar_phase_after_drop': BAR0,
                     'hero_times': [round(h, 4) for h in HERO_TIMES],
                     'hero_anchor_samples': {k: ns(v) for k, v in anchors().items()},
                     'hero_cue_samples': {f"{c['n']}@{c['t']:.3f}": ns(c['t']) for c in cues if c['cls'] == 'hero'},
                     'silence': [GATE0, GATE1], 'riser': [RISER0, RISER1],
                     'layers': {'hats': HATS_T, 'claps': CLAP_T, 'synth_bass_stabs': SYNB_T, 'chord_stabs': CHORD_T, 'full_groove': FULL_T},
                     'scratch_break': [SCRATCH_T, LP_BACK], 'low_pass': [LP_BACK, round(HERO_TIMES[2], 4), LP_HZ],
                     'silence_max_abs': {'mix_completo': float(np.abs(y[:, ns(GATE0):ns(GATE1)]).max()),
                                         'trilha': float(np.abs(trilha[:, ns(GATE0):ns(GATE1)]).max()),
                                         'efeitos': float(np.abs(efeitos[:, ns(GATE0):ns(GATE1)]).max()),
                                         'mix_narracao': float(np.abs(narr[:, ns(GATE0):ns(GATE1)]).max())},
                     'last_100ms_max_abs': float(np.abs(y[:, N - ns(.1):]).max()),
                     'last_sample_abs': float(np.abs(y[:, -1]).max()),
                     'mix_peak_db_last_0.5s_before_fade': round(float(20 * np.log10(np.abs(y[:, ns(TOTAL - .6):ns(TOTAL - .1)]).max() + 1e-12)), 1)},
        'muted_cues': [{'t': c['t'], 'n': c['n'], 'why': c['muted']} for c in cues if c.get('muted')],
        'cue_edits': {'file': CUE_EDITS_PATH, 'applied': CUE_EDIT_LOG},
        'cue_list': [{'n': c['n'], 't': c['t'], 'extra_db': round(c.get('extra_db', 0.0), 3), 'capped_db': c.get('capped_db', 0.0)} for c in cues],
        'master_eq': MASTER_EQ, 'g_db_est': G_DB_EST,
    }
    json.dump(report, open(os.path.join(OUT_DIR, 'audio_report.json'), 'w'), indent=1, ensure_ascii=False)
    print(f'done in {time.time() - t_start:.1f} s -> {OUT_DIR}')


if __name__ == '__main__':
    main()
