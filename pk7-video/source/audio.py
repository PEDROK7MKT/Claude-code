import numpy as np, wave, os
SR = 48000; DUR = 80.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
OUT = os.path.dirname(os.path.abspath(__file__))

def tt(d): return np.arange(int(SR * d)) / SR
def env(n, a=.005, r=.2):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)); e *= np.exp(-t / max(r, 1e-4)); return e
def lp(x, a):  # one-pole lowpass, a in (0,1)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def add(buf, x, t0, g=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if j <= i: return
    l = np.sqrt((1 - pan) / 2); r = np.sqrt((1 + pan) / 2)
    buf[0, i:j] += x[:j - i] * g * l * 1.41; buf[1, i:j] += x[:j - i] * g * r * 1.41

# ---------- SFX library
def pop(f=900):
    t = tt(.12); fr = f * (1 + 1.5 * np.exp(-t * 60)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(len(t), .001, .035)
def ding(f=1320):
    t = tt(1.0); x = sum(np.sin(2 * np.pi * f * k * t) * (.6 ** (k - 1)) for k in (1, 2, 3)) * env(len(t), .002, .28); return x * .5
def notif():
    a = ding(1568) * .6; b = ding(2093) * .5; x = np.zeros(int(SR * .6)); x[:len(a[:int(SR*.6)])] += a[:int(SR*.6)]
    k = int(SR * .09); x[k:] += b[:len(x) - k]; return x
def click():
    t = tt(.03); return (rng.standard_normal(len(t)) * env(len(t), .0005, .004) + np.sin(2 * np.pi * 3000 * t) * env(len(t), .0005, .006) * .5)
def key():
    t = tt(.05); n = rng.standard_normal(len(t)); n = n - lp(n, .3); return n * env(len(t), .0005, .008) * .8
def whoosh(d=.6, up=True):
    t = tt(d); n = rng.standard_normal(len(t)); sweep = np.linspace(.02, .35, len(t)) if up else np.linspace(.35, .02, len(t))
    y = np.empty_like(n); s = 0.0
    for i in range(len(n)): s += sweep[i] * (n[i] - s); y[i] = s
    sh = np.sin(np.pi * np.linspace(0, 1, len(t))) ** 1.5; return y * sh * 2.2
def impact():
    t = tt(1.6); f = 55 + 90 * np.exp(-t * 18); body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .001, .45)
    n = rng.standard_normal(len(t)); n = lp(n, .08) * env(len(t), .001, .12) * 2.5; return (body + n) * .9
def thud():
    t = tt(.6); f = 70 + 60 * np.exp(-t * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .001, .18)
def buzz():
    t = tt(.35); x = np.sign(np.sin(2 * np.pi * 110 * t)) * .3 + np.sign(np.sin(2 * np.pi * 116 * t)) * .3; return lp(x, .2) * env(len(t), .002, .2)
def riser(d=1.3):
    t = tt(d); f = 200 * (2 ** (np.linspace(0, 2.5, len(t)))); x = np.sin(2 * np.pi * np.cumsum(f) / SR) * .25
    n = rng.standard_normal(len(t)); n = n - lp(n, .2); g = np.linspace(0, 1, len(t)) ** 2; return (x + n * .35) * g
def tick():
    t = tt(.025); return np.sin(2 * np.pi * 2400 * t) * env(len(t), .0005, .006)
def chime():
    out = np.zeros(int(SR * 1.2))
    for k, f in enumerate((1047, 1319, 1568, 2093)):
        d = ding(f) * .5; s = int(k * .07 * SR); out[s:s + len(d)] += d[:len(out) - s]
    return out
def glitch():
    t = tt(.25); x = rng.standard_normal(len(t)) * (np.sin(2 * np.pi * 37 * t) > 0) ; return lp(x, .4) * env(len(t), .001, .12)
def wa_pop():
    return pop(1200) * .8 + np.pad(pop(1700) * .5, (int(SR * .05), 0))[:int(SR * .12)]

sfx = np.zeros((2, N))
# S1
for i in range(4): add(sfx, notif(), .25 + i * .75, .55, pan=-.2 + i * .13); add(sfx, whoosh(.35), .2 + i * .75, .25)
add(sfx, buzz(), 2.55, .5)
add(sfx, whoosh(.5), 3.25, .5); add(sfx, impact(), 4.4, .9); add(sfx, glitch(), 4.42, .5)
# S2
add(sfx, whoosh(.7), 5.85, .6)
add(sfx, thud(), 6.5, .6)
for i in range(8): add(sfx, pop(700 + i * 60), 6.8 + i * .12, .45, pan=-.6 + i * .17)
add(sfx, buzz(), 8.05, .35); add(sfx, buzz(), 8.45, .3)
add(sfx, riser(1.8), 9.2, .35); add(sfx, thud(), 11.2, .9); add(sfx, glitch(), 11.25, .35)
# S3
add(sfx, whoosh(.9, False), 12.9, .8); add(sfx, ding(1760), 13.3, .35); add(sfx, ding(2349), 14.3, .4)
# S4
add(sfx, whoosh(.5), 16.9, .5)
q = 'o que é melhor: ele ou uma agência?'
for i, ch in enumerate(q):
    if ch != ' ': add(sfx, key(), 17.6 + i / 17, .55, pan=rng.uniform(-.3, .3))
add(sfx, click(), 20.05, .9); add(sfx, whoosh(.6), 20.2, .55); add(sfx, ding(1568), 21.4, .45)
add(sfx, whoosh(.6), 24.35, .55); add(sfx, ding(1760), 25.4, .45)
# S5
add(sfx, riser(1.5), 26.8, .6); add(sfx, impact(), 28.3, 1.0); add(sfx, chime(), 28.35, .3)
add(sfx, whoosh(.5), 28.95, .4); add(sfx, whoosh(.6), 29.4, .35)
for i in range(4): add(sfx, pop(900 + i * 120), 30.6 + i * .08, .45)
# S6
B = [0, 4.4, 8.8, 13.2, 17.8]
add(sfx, whoosh(.7), 34.0, .6)
for b in B[1:]: add(sfx, whoosh(.45), 34.2 + b, .45); add(sfx, tick(), 34.25 + b, .6)
for i in range(4): add(sfx, click(), 34.6 + i * .35, .6); add(sfx, pop(500 + i * 90), 34.6 + i * .35, .35)
add(sfx, buzz(), 36.25, .4); add(sfx, ding(1319), 36.6, .35)
for i in range(3):
    for k in range(10): add(sfx, tick(), 39.2 + i * .35 + k * .11, .25)
    add(sfx, ding(1568 + i * 200), 40.4 + i * .35, .25)
for i in range(7): add(sfx, pop(600 + i * 110), 43.6 + i * .28, .5)
add(sfx, chime(), 46.0, .45)
for i in range(4): add(sfx, wa_pop(), 47.9 + i * .9, .6, pan=(-.3 if i % 2 == 0 else .3))
add(sfx, whoosh(.3), 48.45, .4); add(sfx, ding(2093), 48.5, .35)
for k in range(28): add(sfx, tick(), 52.4 + k * .1, .3)
add(sfx, chime(), 55.1, .5)
# S7
add(sfx, whoosh(.8), 57.8, .65); add(sfx, impact(), 58.45, .85)
for k in range(18): add(sfx, tick(), 60.1 + k * .11, .3)
for i in range(3): add(sfx, pop(900 + i * 200), 60.0 + i * .6, .5); add(sfx, ding(1319 + i * 220), 60.05 + i * .6, .3)
# S8
add(sfx, whoosh(.7), 64.85, .55); add(sfx, whoosh(.5), 65.6, .4); add(sfx, ding(1760), 66.4, .45); add(sfx, thud(), 67.4, .5)
# S9
W = 'Realmente achei um marketing que dá resultado e não prejuízo!'.split(' ')
add(sfx, whoosh(.8, False), 69.0, .55)
for i, w in enumerate(W):
    ts = 69.5 + i * .27
    if w.lower().startswith('resultado'): add(sfx, impact(), ts, .7); add(sfx, chime(), ts, .3)
    elif w.lower().startswith('prejuízo'): add(sfx, glitch(), ts, .6); add(sfx, thud(), ts, .6)
    else: add(sfx, pop(800 + i * 40), ts, .3)
# S10
add(sfx, whoosh(.8), 73.4, .6)
for i, ch in enumerate('Pedro R Gomes PK7'):
    if ch != ' ': add(sfx, key(), 74.6 + i / 16, .55, pan=rng.uniform(-.3, .3))
add(sfx, whoosh(.5), 75.9, .4); add(sfx, riser(.8), 76.0, .35)
add(sfx, impact(), 76.8, .8); add(sfx, chime(), 76.85, .45); add(sfx, ding(2637), 77.4, .3)

# ---------- MUSIC (synth)
mus = np.zeros((2, N)); BPM = 112; beat = 60 / BPM
def note(f, d, kind='pad'):
    t = tt(d)
    if kind == 'pad':
        x = sum(np.sin(2 * np.pi * f * dt * t + ph) for dt, ph in ((1, 0), (1.004, 1), (.996, 2), (2.001, .5)))
        a = np.minimum(1, t / .6) * np.minimum(1, (d - t) / .8); return lp(x, .08) * a * .18
    if kind == 'bass':
        x = np.sign(np.sin(2 * np.pi * f * t)) * .5 + np.sin(2 * np.pi * f * t); return lp(x, .05) * env(len(t), .004, d * .6) * .5
    if kind == 'pluck':
        x = sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3, 4)); return x * env(len(t), .002, .18) * .12
def kick():
    t = tt(.4); f = 48 + 110 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .001, .16) * .9
def hat():
    t = tt(.06); n = rng.standard_normal(len(t)); n = n - lp(n, .5); return n * env(len(t), .0005, .015) * .25
def clap():
    t = tt(.2); n = rng.standard_normal(len(t)); n = n - lp(n, .15); e = env(len(t), .001, .06); return n * e * .35
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
# chords (midi roots): tense = Am drone; bright = Am F C G
tense = [(45, 52, 57, 60)]
prog = [(45, 57, 60, 64), (41, 57, 60, 65), (48, 55, 60, 64), (43, 55, 59, 62)]  # Am F C G
bar = beat * 4
def section_pad(t0, t1, chords, g=1.0):
    t = t0; k = 0
    while t < t1:
        ch = chords[k % len(chords)]; d = min(bar * (2 if len(chords) == 1 else 1), t1 - t) + .6
        for m in ch[1:]: add(mus, note(hz(m), d, 'pad'), t, g * .55, pan=rng.uniform(-.4, .4))
        add(mus, note(hz(ch[0]), min(bar, t1 - t), 'bass'), t, g * .5)
        t += bar * (2 if len(chords) == 1 else 1); k += 1
# 0-13: tense drone + heartbeat
section_pad(0, 13.0, tense, .9)
for b in np.arange(0, 13, beat * 2): add(mus, kick(), b, .45); add(mus, kick(), b + .22, .25)
# 13-28: hopeful build (pads only + plucks)
section_pad(13.0, 28.3, prog, .8)
for i, b in enumerate(np.arange(17.0, 28.2, beat / 2)):
    ch = prog[int((b - 13) // bar) % 4]; add(mus, note(hz(ch[1 + i % 3] + 12), .3, 'pluck'), b, .6, pan=.3 if i % 2 else -.3)
# 28.3-69: full groove
section_pad(28.3, 69.0, prog, 1.0)
for b in np.arange(28.3, 69.0, beat):
    add(mus, kick(), b, .8)
    add(mus, hat(), b + beat / 2, .7, pan=.25)
for b in np.arange(28.3 + beat, 69.0, beat * 2): add(mus, clap(), b, .6)
for i, b in enumerate(np.arange(34.2, 69.0, beat / 2)):
    ch = prog[int((b - 28.3) // bar) % 4]; add(mus, note(hz(ch[1 + (i * 2) % 3] + 12), .25, 'pluck'), b, .45, pan=.35 if i % 2 else -.35)
# 69-73.6 breakdown (pads only, swell)
section_pad(69.0, 73.6, [prog[0], prog[2]], .9)
# 73.6-80 finale
section_pad(73.6, 80.0, prog, 1.0)
for b in np.arange(73.6, 79.0, beat): add(mus, kick(), b, .8); add(mus, hat(), b + beat / 2, .7)
fade = np.ones(N); fl = int(SR * 2.5); fade[-fl:] = np.linspace(1, 0, fl); mus *= fade

def norm(x, peak=.89):
    m = np.max(np.abs(x)); return x / m * peak if m > 0 else x
def soft(x): return np.tanh(x * 1.2) / np.tanh(1.2)
def wav(path, x):
    x = np.clip(x, -1, 1); d = (x.T * 32767).astype('<i2')
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(d.tobytes())
musN = norm(mus, .9); sfxN = norm(sfx, .9)
wav(os.path.join(OUT, 'music.wav'), musN * .9)
wav(os.path.join(OUT, 'sfx.wav'), sfxN * .9)
# mix for narration on top: music ducked low, sfx medium
wav(os.path.join(OUT, 'mix_for_voice.wav'), soft(musN * .30 + sfxN * .55))
# standalone mix (no voice): music louder
wav(os.path.join(OUT, 'mix_full.wav'), soft(musN * .55 + sfxN * .6))
print('ok')
