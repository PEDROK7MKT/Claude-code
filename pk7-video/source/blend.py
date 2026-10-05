import glob, os, re, numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
def one(nm):
    fs = sorted(glob.glob(f'frames/sub/{nm}_*.jpg'))
    acc = None
    for f in fs:
        a = np.asarray(Image.open(f).convert('RGB'), dtype=np.float32)
        acc = a if acc is None else acc + a
    Image.fromarray(np.clip(acc / len(fs) + .5, 0, 255).astype(np.uint8)).save(f'frames/{nm}.jpg', quality=96)
    return nm
if __name__ == '__main__':
    names = sorted({re.sub(r'_\d+\.jpg$', '', os.path.basename(f)) for f in glob.glob('frames/sub/*.jpg')})
    with ProcessPoolExecutor(4) as ex: list(ex.map(one, names))
    print('blended', len(names))
