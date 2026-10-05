import numpy as np, sys
from PIL import Image
def lines(img, thr=120, minh=6):
    a=np.asarray(img.convert('L')).astype(int); dark=a<thr
    rows=dark.sum(1)>0
    out=[]; y=0; H=len(rows)
    while y<H:
        if rows[y]:
            y0=y
            while y<H and rows[y]: y+=1
            if y-y0>=minh:
                xs=np.nonzero(dark[y0:y].any(0))[0]; out.append((y0,y,xs.min(),xs.max()))
        y+=1
    return out
if __name__=='__main__':
    im=Image.open(sys.argv[1]); box=tuple(map(int,sys.argv[2:6])) if len(sys.argv)>5 else None
    if box: im=im.crop(box)
    print(im.size)
    for i,l in enumerate(lines(im)): print(i,l)

def words(img, l, thr=120, gap=9):
    a=np.asarray(img.convert('L')).astype(int)[l[0]:l[1]]<thr
    cols=a.any(0); out=[]; x=0; W=len(cols)
    while x<W:
        if cols[x]:
            x0=x; g=0
            while x<W and (cols[x] or g<gap):
                g = 0 if cols[x] else g+1; x+=1
            out.append((x0,x-g))
        else: x+=1
    return out
