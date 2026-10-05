#!/usr/bin/env python3
"""PK7 "NO VÁCUO": final mix with the real voice-over.

usage:  python3 mix_vo.py VO.wav OUT.wav        (VO mono/stereo, already time-aligned to the video; any sample rate)
        python3 mix_vo.py --simulate OUT.wav    (speech-shaped test VO on the SRT windows)

Chain (reuses audio6.py's score, effects, per-cue trims, master EQ, gates and limiter):
  * VO: gentle leveler (3:1 on syllable peaks), then normalised to -16 LUFS short-term (median 3 s loudness over
    the speech);
  * music ducked by a sidechain from the actual VO envelope: attack 10 ms, release 250 ms, hold through gaps
    < 0.4 s, depth -9 dB, plus a dynamic presence dip (-4 dB, 1.5-4 kHz, zero-phase band) keyed from the VO's own
    1.5-4 kHz energy; the effects-keyed music duck and the music ride of audio6 stay in place;
  * effects dip only -1 dB under the voice, so they stay audible; under the voice they are voiced for dialogue
    (HP 200 Hz, -3 dB at 420 Hz: energy a phone does not reproduce is not spent on peaks) and each cue may be trimmed
    up (<= +12 dB) by a leave-one-out loop that respects the peak caps and the limiter (<= 3 dB GR);
  * last resort, only where an effect still misses its target: a brief VO tuck (<= 3 dB, the cue's 50-150 ms main
    window, 5 ms in / 60 ms out; never under long textures). Every tuck is listed in OUT.json;
  * master: -14 LUFS integrated, <= -3 dBTP (4x oversampled), look-ahead limiter, no clipper.
Reports (OUT.json): loudness, true peak, limiter GR per second, VO-vs-bed phone SNR per SRT line, and the
leave-one-out phone SNR of every effect against everything else including the VO.
"""
import json, os, sys, time
import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import audio6 as A  # noqa: E402

SR, N = A.SR, A.N
VO_TARGET = -16.0
VO_DUCK = dict(depth_db=-9.0, presence_db=-4.0, lo=1500, hi=4000, att=.010, rel=.25, hold=.4)
SFX_UNDER_VO_DB = -1.0
VO_LEVELER = dict(ratio=3.0, att=.004, rel=.12, below_p90_db=8.0, look=.003)
VO_BOOST_CAP_DB = 12.0
VO_TUCK = dict(hero_db=3.0, short_db=3.0, att=.005, rel=.06, max_window=.15)   # last resort, see vo_tucks()
VO_PEAK_CAP_DB, VO_PEAK_CAP_HERO = -0.6, -1.4   # effects peak caps in this mix (final scale, before the limiter)
TYPING_BED_UNDER_VO = 2.2      # under the voice the keyboard leans on its continuous key-bed
SFX_HP_UNDER_VO = 200.0        # dialogue-friendly voicing of the effects in this mix (HP 200 Hz + -3 dB at 420 Hz)
VO_TARGETS = {'hero': 3.0, 'normal': 0.0, 'layer': 0.0}


# ------------------------------------------------------------------ voice-over
def simulate_vo(wins, seed=11):
    """Speech-shaped test signal: pink-ish noise with a long-term speech spectrum (peak ~400-600 Hz, -6 dB/oct above
    ~1 kHz, light 2-4 kHz presence) and syllabic 4-6 Hz amplitude modulation with phrase pauses, on the SRT windows."""
    r = np.random.default_rng(seed)
    nz = r.standard_normal(N)
    sp = A.filt(nz, 'highpass', 90, 2)
    sp = A.filt(sp, 'lowpass', 900, 1) + .22 * A.filt(nz, 'bandpass', [2000, 4200], 2)
    sp = A.peq(sp, 500, 4.0, .9)
    sp = A.filt(sp, 'lowpass', 7500, 4)
    e = np.zeros(N)
    for a, b in wins:
        t = a + .03
        while t < b - .06:
            if r.random() < .1:                                       # phrase pause
                t += r.uniform(.12, .28); continue
            d = r.uniform(1 / 6.0, 1 / 4.0)                           # 4-6 syllables per second
            n = ns(min(d, b - t)); u = np.arange(n) / max(n - 1, 1)
            seg = np.sin(np.pi * u) ** 1.4 * r.uniform(.5, 1.0)
            i = ns(t); e[i:i + n] = np.maximum(e[i:i + n], seg[:N - i]); t += d
    e = uniform_filter1d(e, ns(.012))
    vo = sp * e
    return np.vstack([vo, vo])


def ns(d):
    return int(round(SR * d))


def load_vo(path):
    sr, x = A.read_wav(path)
    if sr != SR:
        g = np.gcd(int(sr), SR)
        x = signal.resample_poly(x, SR // g, int(sr) // g, axis=1)
    x = np.vstack([x[0], x[0]]) if x.shape[0] == 1 else x[:2]
    out = np.zeros((2, N)); k = min(N, x.shape[1]); out[:, :k] = x[:, :k]
    if x.shape[1] != N:
        print(f'   VO length {x.shape[1] / SR:.2f} s -> padded/trimmed to {TOTAL_S:.2f} s')
    return out


TOTAL_S = N / SR


def short_term(x, win=3.0, hop=.5):
    out = []
    for t0 in np.arange(0, max(TOTAL_S - win, 0) + 1e-9, hop):
        seg = x[:, ns(t0):ns(t0 + win)]
        try:
            v = A.METER.integrated_loudness(seg.T)
        except Exception:
            v = -np.inf
        out.append(v if np.isfinite(v) else -99.0)
    return np.array(out)


def level_vo(vo):
    """Gentle VO leveler (standard broadcast voice processing): 3:1 above a threshold 8 dB under the 90th percentile
    of the active voice envelope, 4 ms attack (3 ms look-ahead), 120 ms release. Returns (vo, max gain reduction dB)."""
    m = vo.mean(0)
    edb = 20 * np.log10(A.follower(m, att=VO_LEVELER['att'], rel=VO_LEVELER['rel']) + 1e-9)
    act = edb[edb > edb.max() - 40]
    thr = np.percentile(act, 90) - VO_LEVELER['below_p90_db']
    gr = np.maximum(0, edb - thr) * (1 - 1 / VO_LEVELER['ratio'])
    k = ns(VO_LEVELER['look']); gr = np.concatenate([gr[k:], np.zeros(k)])
    gr = uniform_filter1d(maximum_filter1d(gr, ns(.004)), ns(.004))
    return vo * 10 ** (-gr / 20), float(gr.max())


def normalise_vo(vo):
    """Median short-term (3 s) loudness over the windows that contain speech -> VO_TARGET."""
    st = short_term(vo)
    act = st[st > st.max() - 15]
    g = 10 ** ((VO_TARGET - np.median(act)) / 20)
    vo = vo * g
    st = short_term(vo)
    return vo, float(np.median(st[st > st.max() - 15])), float(A.lufs(vo))


def vo_keys(vo):
    """VO activity (0..1) for the music duck and the presence-dip amount, from the actual VO envelope."""
    m = A.filt(vo.mean(0), 'highpass', 100, 2)
    env = A.follower(m, att=VO_DUCK['att'], rel=VO_DUCK['rel'])
    edb = 20 * np.log10(env + 1e-9)
    active = (edb > max(edb.max() - 30, -55)).astype(float)
    h = ns(VO_DUCK['hold'])
    active = minimum_filter1d(maximum_filter1d(active, h), h)       # hold through gaps shorter than 0.4 s
    amt = A.follower(active, att=VO_DUCK['att'], rel=VO_DUCK['rel'])  # 10 ms attack, 250 ms release
    pb = A.follower(A.filt(vo.mean(0), 'bandpass', [VO_DUCK['lo'], VO_DUCK['hi']]), att=VO_DUCK['att'], rel=VO_DUCK['rel'])
    pdb = 20 * np.log10(pb + 1e-9)
    amt_p = amt * np.clip((pdb - (pdb.max() - 32)) / 16, 0, 1)
    return np.clip(amt, 0, 1), np.clip(amt_p, 0, 1)


def vo_tucks(rows, amt_vo, prev=None):
    """Last resort, only where an effect still misses its target after the boost loop: a brief VO tuck (<= 3 dB for
    hero cues and short cues, never for long textures) over the cue's main window, 5 ms in / 60 ms out.
    Returns (gain curve, list of tucks)."""
    prev = dict(prev or {})
    for r in rows:
        if r['snr'] is None or r['snr'] >= r['target']:
            continue
        w0, w1 = r['win']
        if r['cls'] != 'hero' and w1 - w0 > VO_TUCK['max_window'] + 1e-3:
            continue
        if amt_vo[ns(w0):ns(w1)].mean() < .5:                # no voice there: nothing to tuck
            continue
        mx = VO_TUCK['hero_db'] if r['cls'] == 'hero' else VO_TUCK['short_db']
        key = (r['n'], r['t'])
        prev[key] = (w0, w1, min(mx, prev.get(key, (0, 0, 0))[2] + r['target'] + .6 - r['snr']))
    g_db = np.zeros(N)
    for (n_, t_), (w0, w1, db) in prev.items():
        a0, a1 = ns(w0 - VO_TUCK['att']), ns(w1)
        seg = np.zeros(N); seg[max(0, a0):a1] = db
        ra = ns(VO_TUCK['att']); rr = ns(VO_TUCK['rel'])
        seg[max(0, a0 - ra):max(0, a0)] = np.linspace(0, db, max(0, a0) - max(0, a0 - ra))
        seg[a1:min(N, a1 + rr)] = np.linspace(db, 0, min(N, a1 + rr) - a1)
        g_db = np.maximum(g_db, seg)
    return 10 ** (-g_db / 20), prev


def music_under_vo(mus_d, amt, amt_p):
    """VO sidechain on the (already effects-ducked) music: broadband depth + dynamic 1.5-4 kHz presence dip."""
    band = A.band_zero_phase(mus_d, VO_DUCK['lo'], VO_DUCK['hi'])
    y = mus_d + (10 ** (VO_DUCK['presence_db'] * amt_p / 20) - 1) * band
    return y * 10 ** (VO_DUCK['depth_db'] * amt / 20)


# ------------------------------------------------------------------ chain
def make_chain(mus, amt_sfx, amt_vo, amt_p, vo, sfx_gain):
    """Returns fn(w0, w1, sfx_window, cue_window) for audio6.loo, plus a full-length renderer."""
    def bed(w0, w1, s):
        m = A.duck(mus[:, w0:w1], None, amt_sfx[w0:w1])
        m = music_under_vo(m, amt_vo[w0:w1], amt_p[w0:w1])
        return m, s * sfx_gain[w0:w1]

    state = {}

    def render(G, ride, w0=0, w1=N, s=None):
        m, se = bed(w0, w1, s)
        pre = (A.master_eq(m * ride[w0:w1]) * A.MUSIC_GATE[w0:w1] + A.master_eq(se) * A.SFX_GATE[w0:w1] + A.master_eq(vo[:, w0:w1])) * G
        y, g = A.limiter(pre, A.CEIL_DB)
        return y, g, pre

    def fn(w0, w1, s, cue):
        y, g, _ = render(state['G'], state['ride'], w0, w1, s)
        return y, (None if cue is None else A.master_eq(cue * sfx_gain[w0:w1]) * A.SFX_GATE[w0:w1] * state['G'] * g), g

    def solve(sfx):
        """Master gain for -14 LUFS and the music ride (music + effects + VO peaks)."""
        m, se = bed(0, N, sfx)
        me = A.master_eq(m) * A.MUSIC_GATE; other = A.master_eq(se) * A.SFX_GATE + A.master_eq(vo)
        G = 10 ** ((A.TARGET_LUFS - A.lufs(me + other)) / 20); ride = np.ones(N)
        for it in range(8):
            if it < 2:
                ride = A.music_ride(me * G, other * G, A.CEIL_DB)
            y, g, _ = render(G, ride, 0, N, sfx); L = A.lufs(y)
            if abs(L - A.TARGET_LUFS) < .02:
                break
            G *= 10 ** ((A.TARGET_LUFS - L) / 20)
        state['G'], state['ride'] = G, ride
        return G, ride
    return fn, render, solve


def main(argv):
    t_start = time.time()
    if len(argv) == 3 and argv[1] == '--simulate':
        out_path, sim = argv[2], True
    elif len(argv) == 3:
        vo_path, out_path, sim = argv[1], argv[2], False
    else:
        print(__doc__); return 2
    wins = A.srt_windows()
    vo = simulate_vo(wins) if sim else load_vo(vo_path)
    vo, vo_lev_gr = level_vo(vo)
    vo, vo_st, vo_int = normalise_vo(vo)
    print(f'VO: median short-term {vo_st:.1f} LUFS (integrated {vo_int:.1f}); {"simulated" if sim else vo_path}')

    cues = A.classify(A.load_cues())
    if not A.apply_report_trims(cues):
        print('   audio_report.json does not match this cue list: running the audio6 gain loop first')
        A.design_master_eq(cues, A.build_music(cues)[0])
        A.gain_loop(cues, A.build_music(cues)[0])
    for c in cues:
        c['target'] = VO_TARGETS[c['cls']]
    mus, _ = A.build_music(cues)
    amt_vo, amt_p = vo_keys(vo)
    sfx_gain = 10 ** (SFX_UNDER_VO_DB * amt_vo / 20)
    for c in cues:
        c['base_extra_db'] = c.get('extra_db', 0.0); c['extra_vo_db'] = 0.0
    A.PEAK_CAP_DB, A.PEAK_CAP_HERO = VO_PEAK_CAP_DB, VO_PEAK_CAP_HERO
    A.SFX_HP_HZ = SFX_HP_UNDER_VO
    A.TYPING_BED = TYPING_BED_UNDER_VO

    # per-cue trims against the voice (boost only, capped, limiter-aware). Intermediate passes re-measure the cues
    # that changed, their neighbours (+-0.6 s) and those still under target; the final measurement covers every cue.
    rows, touched = None, None
    for it in range(6):
        for c in cues:
            c['extra_db'] = c['base_extra_db'] + c['extra_vo_db']
        for _ in range(3 if it == 0 else 1):                   # effect peak caps follow this mix's master gain
            sfx, parts = A.build_sfx(cues); amt_sfx = A.duck_amount(sfx)
            fn, render, solve = make_chain(mus, amt_sfx, amt_vo, amt_p, vo, sfx_gain)
            G, ride = solve(sfx)
            if abs(20 * np.log10(G) - A.G_DB_EST) < .2:
                break
            A.G_DB_EST = round(float(20 * np.log10(G)), 2)
        if rows is None:
            rows = A.loo(parts, sfx, fn)
        else:
            sel = [k for k, (c, _, _) in enumerate(parts)
                   if any(abs(c['t'] - t) < .6 for t in touched) or rows[k]['snr'] is not None and rows[k]['snr'] < rows[k]['target'] + .5]
            for k, row in zip(sel, A.loo([parts[k] for k in sel], sfx, fn)):
                rows[k] = row
        ok = [r for r in rows if r['snr'] is not None]
        fails = [r for r in ok if r['snr'] < r['target']]
        print(f'[VO mix pass {it}] hero min {min(r["snr"] for r in ok if r["cls"] == "hero"):+.1f}, '
              f'all min {min(r["snr"] for r in ok):+.1f}, median {np.median([r["snr"] for r in ok]):+.1f}; fails {len(fails)}/{len(ok)}'
              + ('' if not fails else ': ' + ', '.join(f"{r['n']}@{r['t']:.2f} {r['snr']:+.1f}" for r in fails)))
        touched = []
        for r, (c, i0, x) in zip(rows, parts):
            if r['snr'] is None:
                continue
            lim = A.gr_limit(r['win'][0])
            if r['gr_db'] > lim and r['gr_own_db'] > .3:
                c['extra_vo_db'] -= min(2.0, r['gr_db'] - lim + .3); touched.append(c['t'])
            elif r['snr'] < r['target'] + .5 and c['extra_vo_db'] < VO_BOOST_CAP_DB:
                inc = min(3.0, r['target'] + .8 - r['snr'], VO_BOOST_CAP_DB - c['extra_vo_db'], max(0.0, lim - .1 - r['gr_db']))
                if inc > .05:
                    c['extra_vo_db'] += inc; touched.append(c['t'])
        if not touched:
            break
    if it > 0:                                             # final, complete measurement with the last trims
        for c in cues:
            c['extra_db'] = c['base_extra_db'] + c['extra_vo_db']
        sfx, parts = A.build_sfx(cues); amt_sfx = A.duck_amount(sfx)
        fn, render, solve = make_chain(mus, amt_sfx, amt_vo, amt_p, vo, sfx_gain)
        G, ride = solve(sfx)
        rows = A.loo(parts, sfx, fn)

    vo_raw, tucks = vo, {}
    for it in range(3):                                    # last-resort VO tucks under effects that still miss
        tuck, tucks2 = vo_tucks(rows, amt_vo, tucks)
        if tucks2 == tucks:
            break
        tucks = tucks2; vo = vo_raw * tuck
        fn, render, solve = make_chain(mus, amt_sfx, amt_vo, amt_p, vo, sfx_gain)
        G, ride = solve(sfx)
        rows = A.loo(parts, sfx, fn)
        ok = [r for r in rows if r['snr'] is not None]
        print(f'[VO tuck pass {it}] {len(tucks)} tucks; hero min {min(r["snr"] for r in ok if r["cls"] == "hero"):+.1f}, '
              f'all min {min(r["snr"] for r in ok):+.1f}; fails ' + ', '.join(f"{r['n']}@{r['t']:.2f} {r['snr']:+.1f}" for r in ok if r['snr'] < r['target']))
    y, gain, pre = render(G, ride, 0, N, sfx)
    tp = A.true_peak_db(y)
    if tp > -3.02:
        y *= 10 ** ((-3.02 - tp) / 20)
    L, tp = A.lufs(y), A.true_peak_db(y)
    gr_max, gr_s, gr_hero = A.gr_report(gain)
    print(f'{os.path.basename(out_path)}: {L:.2f} LUFS, true peak {tp:.2f} dBTP, limiter max GR {gr_max:.2f} dB')
    A.write_wav24(out_path, y, 9100)
    if sim:
        A.write_wav24(os.path.splitext(out_path)[0] + '_vo_only.wav', vo / max(1.0, np.abs(vo).max() / .98), 9101)

    # VO over the bed, per SRT line, as a phone hears it
    bed = (A.master_eq(music_under_vo(A.duck(mus, None, amt_sfx), amt_vo, amt_p) * ride) * A.MUSIC_GATE
           + A.master_eq(sfx * sfx_gain) * A.SFX_GATE) * G * gain
    vo_out = A.master_eq(vo) * G * gain
    lines = []
    for a, b in wins:
        sl = slice(ns(a), ns(b)); pv, pb = A.phone(vo_out[:, sl]), A.phone(bed[:, sl])
        lines.append({'span': [a, b], 'vo_over_bed_phone_db': round(float(10 * np.log10(np.sum(pv ** 2) / (np.sum(pb ** 2) + 1e-20))), 1)})
    ok = [r for r in rows if r['snr'] is not None]
    report = {
        'mode': 'simulated VO (speech-shaped noise, 4-6 Hz syllabic AM, on the SRT windows)' if sim else f'VO file {vo_path}',
        'out': out_path,
        'vo': {'median_short_term_lufs': round(vo_st, 2), 'integrated_lufs': round(vo_int, 2),
               'leveler': VO_LEVELER, 'leveler_max_gr_db': round(vo_lev_gr, 2)},
        'master_gain_db': round(float(20 * np.log10(G)), 2),
        'mix': {'lufs': round(L, 2), 'true_peak_dbtp': round(tp, 2), 'limiter_max_gr_db': round(gr_max, 2),
                'limiter_gr_db_per_second': gr_s, 'limiter_gr_db_at_hero_hits': gr_hero,
                'music_ride_max_db': round(float(-20 * np.log10(ride.min())), 2)},
        'ducking': {'music_under_vo': VO_DUCK, 'sfx_under_vo_db': SFX_UNDER_VO_DB},
        'vo_tucks': {'rule': VO_TUCK, 'count': len(tucks), 'total_seconds': round(sum(w1 - w0 + VO_TUCK['att'] + VO_TUCK['rel'] for w0, w1, _ in tucks.values()), 2),
                     'list': [{'cue': f'{n_}@{t_:.3f}', 'span': [round(w0, 3), round(w1, 3)], 'db': -round(db, 2)} for (n_, t_), (w0, w1, db) in sorted(tucks.items(), key=lambda kv: kv[0][1])]},
        'sfx_voicing': {'highpass_hz': SFX_HP_UNDER_VO, 'dip_420hz_db': -3.0, 'typing_bed': TYPING_BED_UNDER_VO, 'peak_cap_dbfs': VO_PEAK_CAP_DB, 'peak_cap_hero_dbfs': VO_PEAK_CAP_HERO, 'max_boost_db': VO_BOOST_CAP_DB},
        'vo_over_bed_per_line': lines,
        'audibility': {'targets_db': VO_TARGETS,
                       'min_by_class': {k: min([r['snr'] for r in ok if r['cls'] == k] or [None]) for k in ('hero', 'normal', 'layer')},
                       'fails': [r for r in ok if r['snr'] < r['target']],
                       'cues': [dict(r, extra_vo_db=round(c.get('extra_vo_db', 0.0), 2)) for r, (c, _, _) in zip(rows, parts)]},
    }
    json.dump(report, open(os.path.splitext(out_path)[0] + '.json', 'w'), indent=1, ensure_ascii=False)
    print(f'per-cue phone SNR vs everything incl. VO: hero min {report["audibility"]["min_by_class"]["hero"]:+.1f}, '
          f'all min {min(r["snr"] for r in ok):+.1f}; VO over bed per line: '
          + ' '.join(f"{x['vo_over_bed_phone_db']:+.0f}" for x in lines))
    print(f'done in {time.time() - t_start:.1f} s')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
