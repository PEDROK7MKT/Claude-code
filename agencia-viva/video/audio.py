"""Trilha e efeitos do Reels da Viva, sintetizados do zero (sem música de terceiros).

uso: python3 audio.py cues.json saida.wav [--sem-musica] [--voz locucao.wav --pedacos pedacos.json]
pedacos.json = [{"s": 0.0, "e": 3.4, "t": 0.2}, ...]: trecho [s,e] da locução tocado no instante t do vídeo (ver alinhar.py)
cues.json = { "dur": 60.0, "bpm": 120, "drop": 12.0, "calmo": [[a, b]], "fim": 57.0,
              "cues": [{"t": 1.2, "tipo": "whoosh"}, ...] }
"""
import json, sys
import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.002, r=0.2, curva=4.0):
    """ataque linear + decaimento exponencial (em amostras)"""
    x = np.arange(n) / SR
    e = np.exp(-x * curva / max(r, 1e-3))
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def lp_fast(x, fc):
    """passa-baixa 1 polo com fc fixo, vetorizado via FFT (resposta equivalente)"""
    n = len(x)
    f = np.fft.rfftfreq(n * 2, 1 / SR)
    h = 1 / np.sqrt(1 + (f / fc) ** 2)
    X = np.fft.rfft(np.concatenate([x, np.zeros(n)]))
    return np.fft.irfft(X * h)[:n]


def hp_fast(x, fc):
    return x - lp_fast(x, fc)


def bp_fast(x, lo, hi):
    return lp_fast(hp_fast(x, lo), hi)


def ruido(d):
    return rng.standard_normal(int(d * SR))


# ─── instrumentos ───────────────────────────────────────────
def kick(g=1.0):
    t = t_(0.45)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * env(len(t), 0.001, 0.32, 5)
    click = hp_fast(ruido(0.01), 2000) * env(int(0.01 * SR), 0.0005, 0.01) * 0.25
    s[: len(click)] += click
    return s * g


def clap(g=1.0):
    n = ruido(0.25)
    s = bp_fast(n, 900, 4000)
    e = env(len(s), 0.001, 0.12, 5)
    # três batidinhas coladas, como palma
    for k in (0.008, 0.016):
        e[: int(k * SR)] *= 0.6 + 0.4 * np.cos(np.linspace(0, 3 * np.pi, int(k * SR))) ** 2
    return s * e * 0.55 * g


def hat(g=1.0, aberto=False):
    d = 0.18 if aberto else 0.05
    s = hp_fast(ruido(d), 7000)
    return s * env(len(s), 0.0008, d * 0.6, 5) * 0.22 * g


def nota(freq, d, forma='saw', det=0.0):
    t = t_(d)
    out = np.zeros_like(t)
    for dd in ([0.0] if not det else [-det, 0.0, det]):
        f = freq * (1 + dd)
        ph = (t * f) % 1.0
        if forma == 'saw':
            out += 2 * ph - 1
        elif forma == 'sq':
            out += np.sign(np.sin(2 * np.pi * f * t))
        else:
            out += np.sin(2 * np.pi * f * t)
    return out / (3 if det else 1)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


# ─── efeitos ────────────────────────────────────────────────
def fx_impacto():
    t = t_(1.6)
    f = 38 + 60 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, 1.1, 4)
    n = lp_fast(ruido(1.6), 900) * env(len(t), 0.001, 0.5, 5) * 0.8
    return (boom * 1.1 + n) * 0.9


def fx_whoosh(d=0.55, sobe=True):
    n = ruido(d)
    x = np.linspace(0, 1, len(n))
    forma = np.sin(np.pi * x) ** 1.6
    # varredura de filtro em blocos (rápido)
    out = np.zeros_like(n)
    blocos = 24
    for b in range(blocos):
        a, z = b * len(n) // blocos, (b + 1) * len(n) // blocos
        k = b / (blocos - 1)
        fc = 400 + (5000 if sobe else 5000 * (1 - k)) * (k if sobe else 1)
        out[a:z] = bp_fast(n, fc * 0.5, fc * 1.6)[a:z]
    return out * forma * 0.7


def fx_pop():
    t = t_(0.09)
    f = 900 * np.exp(-t * 18) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.06, 5) * 0.55


def fx_ding():
    """notificação: dois toques de sino, suave"""
    out = np.zeros(int(0.9 * SR))
    for k, (m, at) in enumerate(((88, 0.0), (93, 0.11))):
        t = t_(0.9 - at)
        f = mtof(m)
        s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.01 * t) + 0.12 * np.sin(2 * np.pi * f * 3.02 * t))
        s *= env(len(t), 0.001, 0.35, 5)
        i = int(at * SR)
        out[i:i + len(s)] += s * (0.35 if k == 0 else 0.42)
    return out


def fx_vibra():
    """celular vibrando (zumbido grave curto)"""
    t = t_(0.32)
    s = np.sign(np.sin(2 * np.pi * 150 * t)) * 0.5 + np.sin(2 * np.pi * 75 * t)
    s = lp_fast(s, 400) * (np.sin(np.pi * np.linspace(0, 1, len(t))) ** 0.5)
    return s * 0.35


def fx_digita(d=1.0):
    out = np.zeros(int(d * SR))
    tt = 0.0
    while tt < d - 0.03:
        c = hp_fast(ruido(0.012), 3000) * env(int(0.012 * SR), 0.0005, 0.006, 5) * rng.uniform(0.15, 0.3)
        i = int(tt * SR)
        out[i:i + len(c)] += c
        tt += rng.uniform(0.055, 0.12)
    return out


def fx_glitch(d=0.35):
    n = ruido(d)
    s = np.round(np.sign(np.sin(2 * np.pi * rng.uniform(80, 400) * t_(d))) * 3) / 3 * 0.4 + n * 0.25
    corte = (np.floor(np.linspace(0, 12, len(s))) % 2).astype(float)
    return s * (0.4 + 0.6 * corte) * env(len(s), 0.001, d, 2) * 0.55


def fx_erro():
    """buzina grave de 'não deu certo'"""
    out = np.zeros(int(0.7 * SR))
    for at in (0.0, 0.2):
        t = t_(0.17)
        s = np.sign(np.sin(2 * np.pi * 110 * t)) * env(len(t), 0.002, 0.15, 2)
        i = int(at * SR)
        out[i:i + len(s)] += lp_fast(s, 1200) * 0.3
    return out


def fx_carimbo():
    t = t_(0.5)
    f = 70 + 90 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.001, 0.2, 5)
    s += lp_fast(ruido(0.5), 2500) * env(len(t), 0.0005, 0.05, 5) * 0.6
    return s * 0.9


def fx_camera():
    s1 = hp_fast(ruido(0.05), 1500) * env(int(0.05 * SR), 0.0005, 0.03, 5)
    s2 = hp_fast(ruido(0.07), 1000) * env(int(0.07 * SR), 0.0005, 0.05, 5)
    out = np.zeros(int(0.2 * SR))
    out[: len(s1)] += s1 * 0.6
    out[int(0.09 * SR): int(0.09 * SR) + len(s2)] += s2 * 0.5
    return out


def fx_riser(d=2.0):
    t = t_(d)
    f = 200 * (8 ** (t / d))
    tom = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    n = hp_fast(ruido(d), 2500) * 0.35
    forma = (t / d) ** 2
    return (tom + n) * forma * 0.6


def fx_caixa():
    """caixa registradora 'ka-ching' simplificada"""
    out = np.zeros(int(0.8 * SR))
    for m, at in ((96, 0.0), (100, 0.05), (103, 0.1)):
        t = t_(0.7)
        s = np.sin(2 * np.pi * mtof(m) * t) * env(len(t), 0.001, 0.4, 5)
        i = int(at * SR)
        out[i:i + len(s)] += s * 0.25
    out[: int(0.04 * SR)] += hp_fast(ruido(0.04), 3000) * 0.3
    return out


def fx_tique():
    t = t_(0.04)
    return np.sin(2 * np.pi * 2400 * t) * env(len(t), 0.0005, 0.02, 5) * 0.25


FX = {
    'impacto': fx_impacto, 'whoosh': fx_whoosh, 'whoosh_desce': lambda: fx_whoosh(0.5, False), 'pop': fx_pop,
    'ding': fx_ding, 'vibra': fx_vibra, 'digita': fx_digita, 'glitch': fx_glitch, 'erro': fx_erro,
    'carimbo': fx_carimbo, 'camera': fx_camera, 'riser': fx_riser, 'caixa': fx_caixa, 'tique': fx_tique,
}


# ─── música ─────────────────────────────────────────────────
def musica(dur, bpm, drop, calmos, fim):
    L = int((dur + 2) * SR)
    mix = np.zeros(L)
    beat = 60 / bpm
    # Lá menor → Fá → Dó → Sol (i VI III VII), um acorde por compasso
    acordes = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]
    baixos = [45, 41, 48, 43]
    em_calmo = lambda tt: any(a <= tt < b for a, b in calmos)

    def put(sig, tt, g=1.0):
        i = int(tt * SR)
        if i >= L:
            return
        j = min(L, i + len(sig))
        mix[i:j] += sig[: j - i] * g

    n_beats = int(fim / beat)
    for b in range(n_beats):
        tt = b * beat
        comp = b // 4
        ac = acordes[comp % 4]
        antes = tt < drop
        calmo = em_calmo(tt)
        # pad (sempre, mais aberto depois do drop)
        if b % 4 == 0:
            d = beat * 4
            pad = sum(nota(mtof(m), d, 'saw', 0.004) for m in ac) / 3
            pad = lp_fast(pad, 700 if antes or calmo else 1600)
            e = np.minimum(1, np.linspace(0, 6, len(pad))) * np.minimum(1, np.linspace(6, 0, len(pad)))
            put(pad * e, tt, 0.13 if antes else 0.1)
        if antes:
            # tensão: batida de coração + relógio
            if b % 2 == 0:
                put(kick(0.55), tt)
            put(fx_tique(), tt + beat / 2, 0.7)
            continue
        if calmo:
            if b % 4 == 0:
                put(kick(0.5), tt)
            put(hat(0.5), tt + beat / 2)
            continue
        # groove cheio
        put(kick(1.0), tt)
        if b % 2 == 1:
            put(clap(0.9), tt)
        put(hat(0.8), tt + beat / 2)
        if b % 4 == 3:
            put(hat(0.5, True), tt + beat * 0.75)
        # baixo em colcheias com oitava
        bx = mtof(baixos[comp % 4])
        for k, oit in ((0, 1), (0.5, 2)):
            s = nota(bx * oit, beat * 0.45, 'saw')
            s = lp_fast(s, 380) * env(len(s), 0.004, beat * 0.45, 3)
            put(s, tt + k * beat, 0.32)
        # pluck arpejado
        m = ac[(b * 2) % 3] + 12
        for k in (0, 0.5):
            s = nota(mtof(m + (7 if k else 0)), 0.22, 'sq')
            s = lp_fast(s, 2500) * env(len(s), 0.002, 0.18, 5)
            put(s, tt + k * beat, 0.06)
    # final: acorde longo de Lá menor
    t = fim
    pad = sum(nota(mtof(m), 3.0, 'saw', 0.004) for m in (57, 60, 64, 69)) / 4
    pad = lp_fast(pad, 1400) * env(len(pad), 0.01, 2.2, 3)
    put(pad, t, 0.16)
    put(kick(1.1), t)
    return mix


# ─── locução ────────────────────────────────────────────────
def ler_wav(caminho):
    import wave
    with wave.open(caminho) as w:
        assert w.getframerate() == SR and w.getsampwidth() == 2, 'converta pra 48 kHz / 16 bits antes'
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
        return x.reshape(-1, w.getnchannels()).mean(1)


def encaixa_voz(voz_path, pedacos, L):
    """coloca cada pedaço da locução ({s, e} no arquivo, em s) no instante t do vídeo, com micro-fades pra não estalar"""
    voz = ler_wav(voz_path)
    out = np.zeros(L)
    for p in pedacos:
        a, b = int(p['s'] * SR), int(p['e'] * SR)
        pedaco = voz[a:b].copy()
        nf = min(int(0.01 * SR), len(pedaco) // 2)
        if nf:
            pedaco[:nf] *= np.linspace(0, 1, nf); pedaco[-nf:] *= np.linspace(1, 0, nf)
        i = int(p['t'] * SR); j = min(L, i + len(pedaco))
        out[i:j] += pedaco[: j - i]
    return out


def comprime(x, lim=0.92):
    return np.tanh(x / lim) * lim


def main():
    cfg = json.load(open(sys.argv[1]))
    saida = sys.argv[2]
    sem_musica = '--sem-musica' in sys.argv
    dur = cfg['dur']
    L = int((dur + 2) * SR)
    fx = np.zeros(L)
    duck = np.ones(L)
    for c in cfg['cues']:
        f = FX[c['tipo']]
        s = f() * c.get('g', 1.0)
        i = int(c['t'] * SR)
        j = min(L, i + len(s))
        fx[i:j] += s[: j - i]
        if c['tipo'] in ('impacto', 'carimbo'):
            k = min(L, i + int(0.5 * SR))
            duck[i:k] = np.minimum(duck[i:k], 0.45 + 0.55 * np.linspace(0, 1, k - i))
    mus = np.zeros(L) if sem_musica else musica(dur, cfg.get('bpm', 120), cfg['drop'], cfg.get('calmo', []), cfg.get('fim', dur - 3))[:L]
    voz = np.zeros(L)
    if '--voz' in sys.argv:
        voz = encaixa_voz(sys.argv[sys.argv.index('--voz') + 1], json.load(open(sys.argv[sys.argv.index('--pedacos') + 1])), L)
        # trilha abaixa suave embaixo da voz (e efeitos um pouco)
        jan = int(0.25 * SR)
        env_v = np.convolve(np.abs(voz) > 0.01, np.ones(jan) / jan, 'same')
        env_v = np.clip(env_v * 3, 0, 1)
        duck = duck * (1 - 0.62 * env_v)
        fx = fx * (1 - 0.25 * env_v)
        rv = np.sqrt(np.mean(voz[voz != 0] ** 2)) + 1e-9
        voz = voz * (10 ** (-16 / 20) / rv)
    mix = mus * duck * 0.9 + fx * 0.8 + voz * 1.25
    mix = mix[: int(dur * SR)]
    # fade de saída
    nf = int(0.6 * SR)
    mix[-nf:] *= np.linspace(1, 0, nf)
    # nível: RMS alvo ~ -14 dBFS, depois limitador suave
    rms = np.sqrt(np.mean(mix ** 2)) + 1e-9
    mix *= 10 ** (-14 / 20) / rms
    mix = comprime(mix)
    # estéreo: efeitos com leve abertura
    st = np.stack([mix, np.roll(mix, int(0.0006 * SR))], 1)
    pcm = (np.clip(st, -1, 1) * 32767).astype('<i2')
    import wave
    with wave.open(saida, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'✓ áudio {saida} ({dur:.1f}s{", sem música" if sem_musica else ""})')


if __name__ == '__main__':
    main()
