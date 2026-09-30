"""Alinha a locução (um arquivo só, sem pausas longas entre frases) com as cenas do Reels.

1. acha as frases: escolhe, entre as pausas da fala, as fronteiras que melhor batem com o tamanho
   esperado de cada frase (proporcional às sílabas), por programação dinâmica;
2. estica as cenas que precisam de mais tempo pra caber a sua frase (cortes no tempo da música);
3. grava alinhamento.json: para cada cena, tempo original [a,b], tempo novo [A,B] e o pedaço da voz.

uso: python3 alinhar.py voz.wav cenas.json alinhamento.json [--tempo 1.0]
cenas.json = [{"a": 0, "b": 4, "texto": "..."}, ...]  (uma frase por cena, na ordem)
"""
import json, re, sys, wave
import numpy as np

SR = 48000
VOG = re.compile(r'[aeiouáéíóúâêôãõàü]+', re.I)


def ler(caminho):
    with wave.open(caminho) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
        return x.reshape(-1, w.getnchannels()).mean(1)


def silabas(t):
    return max(1, len(VOG.findall(t)))


def pausas(x, min_pausa=0.12, faixa_db=35):
    jan = int(0.02 * SR)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(jan) / jan, 'same'))
    db = 20 * np.log10(rms + 1e-9)
    fala = db > db.max() - faixa_db
    idx = np.flatnonzero(fala)
    ini, fim = idx[0] / SR, idx[-1] / SR
    ps, i, n = [], 0, len(fala)
    while i < n:
        if not fala[i]:
            j = i
            while j < n and not fala[j]:
                j += 1
            if (j - i) / SR >= min_pausa and i / SR > ini and j / SR < fim:
                ps.append((i / SR, j / SR))
            i = j
        else:
            i += 1
    return ini, fim, ps


def nucleos(x):
    """sílabas faladas: picos de energia na faixa da voz (300–2500 Hz)"""
    n = len(x); f = np.fft.rfftfreq(n, 1 / SR); X = np.fft.rfft(x); X[(f < 300) | (f > 2500)] = 0
    y = np.fft.irfft(X, n)
    jan = int(0.03 * SR); env = np.sqrt(np.convolve(y ** 2, np.ones(jan) / jan, 'same'))
    hop = int(0.01 * SR); e = env[::hop]; edb = 20 * np.log10(e + 1e-9)
    from numpy.lib.stride_tricks import sliding_window_view as jv
    w = 7; loc = e == jv(np.pad(e, (w, w)), 2 * w + 1).max(1)
    w2 = 12; pad = np.pad(e, (w2, w2), constant_values=e.max())
    viz = np.array([max(pad[i:i + w2].min(), pad[i + w2 + 1:i + 2 * w2 + 1].min()) for i in range(len(e))])
    return np.flatnonzero(loc & (edb > edb.max() - 30) & (e / np.maximum(viz, 1e-9) > 1.5)) * hop / SR


def fronteiras(ini, fim, ps, textos, nuc=None):
    """escolhe len(textos)-1 pausas (em ordem) que melhor dividem a fala conforme as sílabas"""
    s = np.array([silabas(t) for t in textos], float)
    if nuc is not None and len(nuc) > len(textos) * 2:
        # posição esperada de cada fronteira contada em sílabas FALADAS (desconta pausas e mudanças de ritmo)
        idx = np.cumsum(s)[:-1] / s.sum() * len(nuc)
        alvo = np.interp(idx, np.arange(len(nuc)) + 0.5, np.r_[(nuc[:-1] + nuc[1:]) / 2, nuc[-1]])
    else:
        alvo = ini + (fim - ini) * np.cumsum(s)[:-1] / s.sum()
    K, P = len(alvo), len(ps)
    meio = [(a + b) / 2 for a, b in ps]
    dur = [b - a for a, b in ps]
    INF = 1e18
    # custo[k][p]: fronteira k na pausa p
    C = np.full((K, P), INF); ant = np.zeros((K, P), int)
    custo = lambda k, p: (meio[p] - alvo[k]) ** 2 - 0.9 * np.log(dur[p] / 0.12)
    for p in range(P):
        C[0, p] = custo(0, p)
    for k in range(1, K):
        melhor, arg = INF, -1
        for p in range(P):
            if p - 1 >= 0 and C[k - 1, p - 1] < melhor:
                melhor, arg = C[k - 1, p - 1], p - 1
            if arg >= 0:
                C[k, p] = melhor + custo(k, p); ant[k, p] = arg
    p = int(np.argmin(C[K - 1])); esc = [p]
    for k in range(K - 1, 0, -1):
        p = ant[k, p]; esc.append(p)
    esc = esc[::-1]
    cortes = [ini] + [meio[p] for p in esc] + [fim]
    trechos = []
    for k in range(len(textos)):
        a = cortes[k] if k == 0 else ps[esc[k - 1]][1]
        b = cortes[k + 1] if k == len(textos) - 1 else ps[esc[k]][0]
        trechos.append((a, b))
    return trechos


def main():
    voz_arq, cenas_arq, saida = sys.argv[1:4]
    x = ler(voz_arq)
    cenas = json.load(open(cenas_arq))
    ini, fim, ps = pausas(x)
    trechos = fronteiras(ini, fim, ps, [c['texto'] for c in cenas], nucleos(x))
    # a voz corre contínua (com as pausas naturais dela); cada cena começa um pouco antes da sua frase.
    # Cena curta demais (< 60% do tempo original) ganha um respiro: a frase seguinte espera.
    V0, antes, fator_min, cauda = 0.2, 0.25, 0.6, 1.5
    cortes = [0.0] + [(trechos[k][1] + trechos[k + 1][0]) / 2 for k in range(len(trechos) - 1)] + [len(x) / SR]
    atraso, novo = 0.0, []
    inicio_cena = lambda k, atr: 0.0 if k == 0 else V0 + atr + trechos[k][0] - antes
    for k, c in enumerate(cenas):
        A = inicio_cena(k, atraso)
        if k + 1 < len(cenas):
            B = inicio_cena(k + 1, atraso)
            minimo = fator_min * (c['b'] - c['a'])
            if B - A < minimo:
                atraso += minimo - (B - A); B = A + minimo
        else:
            B = V0 + atraso + trechos[k][1] + cauda
        seg = [cortes[k], cortes[k + 1]]
        novo.append({'a': c['a'], 'b': c['b'], 'A': round(A, 3), 'B': round(B, 3), 'voz': [round(seg[0], 3), round(seg[1], 3)],
                     't': round(V0 + (atraso if k == 0 else atraso_ant) + seg[0], 3) if False else None, 'texto': c['texto']})
        atraso_ant = atraso
    # onde cada pedaço de voz entra: acompanha os atrasos acumulados
    atraso = 0.0
    for k, n in enumerate(novo):
        if k > 0:
            # atraso que valeu pra início desta cena
            atraso = n['A'] - (V0 + trechos[k][0] - antes)
        n['t'] = round(V0 + atraso + n['voz'][0], 3)
    T = novo[-1]['B']
    json.dump({'dur': round(T, 3), 'cenas': novo}, open(saida, 'w'), ensure_ascii=False, indent=1)
    print(f'fala {fim - ini:.1f} s · vídeo passa de {cenas[-1]["b"]:.1f} para {T:.1f} s')
    for k, n in enumerate(novo):
        est = (n['B'] - n['A']) / (n['b'] - n['a'])
        d = trechos[k][1] - trechos[k][0]
        print(f"  {k + 1:2d} {n['A']:5.1f}–{n['B']:5.1f} (x{est:.2f})  fala {d:4.2f}s  {silabas(n['texto']) / d:4.1f} síl/s  {n['texto'][:44]}")


if __name__ == '__main__':
    main()
