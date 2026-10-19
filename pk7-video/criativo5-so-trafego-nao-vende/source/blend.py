import glob, os, re, numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
OUT = os.environ.get('OUT', 'frames')
def one(nm):
    fs = sorted(glob.glob(f'{OUT}/sub/{nm}_*.jpg'), key=lambda f: int(re.search(r'_(\d+)\.jpg$', f).group(1))); acc = None; K = len(fs); wsum = 0.0
    for k, f in enumerate(fs):
        w = 1.0 - abs(2.0 * (k + .5) / K - 1.0) + .5 / K   # triangle-weighted shutter
        a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32) * w; acc = a if acc is None else acc + a; wsum += w
    Image.fromarray(np.clip(acc / wsum + .5, 0, 255).astype(np.uint8)).save(f'{OUT}/{nm}.jpg', quality=96)
    return nm
if __name__ == '__main__':
    names = sorted({re.sub(r'_\d+\.jpg$', '', os.path.basename(f)) for f in glob.glob(f'{OUT}/sub/*.jpg')})
    with ProcessPoolExecutor(4) as ex: list(ex.map(one, names))
    print('blended', len(names))
