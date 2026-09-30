"""Locução com tempos fixos: cada frase entra num instante do roteiro e o vídeo NÃO muda de ritmo.

uso: python3 voz_fixa.py frases.json pasta_saida voz1.wav [voz2.wav ...]
frases.json = [{"t": 0.2, "ate": 4.0, "texto": "..."}, ...]  (t = onde a frase entra; ate = até quando ela pode ir)
- um arquivo só: acha as frases nas pausas da fala (mesma divisão do alinhar.py);
- um arquivo por frase (na ordem): corta o silêncio das pontas de cada um.
Frase que não cabe na janela é acelerada (até 1,25×, sem mudar o tom, com o atempo do ffmpeg); se nem assim couber, avisa.
Grava pasta_saida/voz.wav e pasta_saida/pedacos.json ([{s, e, t}] para o audio.py).
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np
from alinhar import SR, ler, pausas, nucleos, fronteiras

FFMPEG = os.environ.get('FFMPEG') or ('/root/bin/ffmpeg' if os.path.exists('/root/bin/ffmpeg') else 'ffmpeg')
FOLGA, MAX_ACEL = 0.05, 1.25


def apara(x, faixa_db=40):
    jan = int(0.02 * SR)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(jan) / jan, 'same'))
    db = 20 * np.log10(rms + 1e-9)
    idx = np.flatnonzero(db > db.max() - faixa_db)
    if not len(idx):
        return x
    a, b = max(0, idx[0] - int(0.03 * SR)), min(len(x), idx[-1] + int(0.06 * SR))
    return x[a:b]


def acelera(x, fator):
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav')
        grava(a, x)
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', a, '-af', f'atempo={fator:.4f}', '-ar', str(SR), '-ac', '1', b], check=True)
        return ler(b)


def grava(caminho, x):
    with wave.open(caminho, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def main():
    frases = json.load(open(sys.argv[1]))
    saida, arqs = sys.argv[2], sys.argv[3:]
    if len(arqs) == 1:
        x = ler(arqs[0])
        ini, fim, ps = pausas(x)
        trechos = fronteiras(ini, fim, ps, [f['texto'] for f in frases], nucleos(x))
        partes = [x[int(a * SR):int(b * SR)] for a, b in trechos]
    elif len(arqs) == len(frases):
        partes = [ler(a) for a in arqs]
    else:
        sys.exit(f'são {len(frases)} frases e {len(arqs)} arquivos de voz: mande 1 arquivo com tudo ou 1 por frase')
    blocos, pedacos, pos, avisos = [], [], 0, []
    for k, (f, p) in enumerate(zip(frases, partes)):
        p = apara(p)
        janela = f['ate'] - f['t'] - FOLGA
        d = len(p) / SR
        if d > janela:
            fator = min(MAX_ACEL, d / janela)
            p = acelera(p, fator)
            d2 = len(p) / SR
            msg = f"  frase {k + 1:2d}: {d:.2f} s em {janela:.2f} s → acelerada {fator:.2f}×"
            if d2 > janela + 0.02:
                msg += f' e ainda passa {d2 - janela:.2f} s (fale mais rápido ou encurte: "{f["texto"]}")'
                avisos.append(k)
            print(msg)
        pedacos.append({'s': round(pos / SR, 4), 'e': round((pos + len(p)) / SR, 4), 't': f['t']})
        blocos.append(p); pos += len(p)
    os.makedirs(saida, exist_ok=True)
    grava(os.path.join(saida, 'voz.wav'), np.concatenate(blocos))
    json.dump(pedacos, open(os.path.join(saida, 'pedacos.json'), 'w'), indent=1)
    print(f'✓ locução com tempos fixos: {len(frases)} frases' + (f' ({len(avisos)} não couberam)' if avisos else ''))


if __name__ == '__main__':
    main()
