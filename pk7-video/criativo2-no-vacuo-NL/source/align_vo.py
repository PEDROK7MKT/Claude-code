import re, json, numpy as np, subprocess
from scipy.io import wavfile
sr,x=wavfile.read('vo_raw.wav'); x=x.astype(float)/32768
h=int(.01*sr); e=np.array([np.sqrt((x[i:i+h]**2).mean()) for i in range(0,len(x)-h,h)])
edb=20*np.log10(e+1e-9); sil=edb<edb.max()-38
P=[];i=0
while i<len(sil):
    if sil[i]:
        j=i
        while j<len(sil) and sil[j]: j+=1
        if (j-i)*.01>=.12: P.append((i*.01,j*.01))
        i=j
    else: i+=1
sp0=next(k*.01 for k in range(len(sil)) if not sil[k]); sp1=max(k*.01 for k in range(len(sil)) if not sil[k])+.01
P=[p for p in P if p[0]>sp0+.2 and p[1]<sp1-.2]
srt=open('legendas_narracao_v2.srt').read().strip().split('\n\n')
W=[];T=[]
for b in srt:
    l=b.split('\n'); a,c=l[1].split(' --> ')
    f=lambda s:int(s[:2])*3600+int(s[3:5])*60+float(s[6:].replace(',','.'))
    W.append((f(a),f(c))); T.append(' '.join(l[2:]))
n=len(T); ch=np.array([len(re.sub(r'[^\wÀ-ú]','',t))+4 for t in T],float)
# DP over pause choices
B=[sp0]+[(a+b)/2 for a,b in P]+[sp1]; m=len(B)
spd=(sp1-sp0-sum(b-a for a,b in P)*0.6)/ch.sum()
INF=1e9; D=np.full((n+1,m),INF); bk=np.zeros((n+1,m),int); D[0,0]=0
for k in range(1,n+1):
    for j in range(1,m):
        for i in range(j):
            if D[k-1,i]>=INF: continue
            d=B[j]-B[i]; c=D[k-1,i]+np.log(d/(ch[k-1]*spd))**2
            if c<D[k,j]: D[k,j]=c; bk[k,j]=i
j=m-1; cut=[j]
for k in range(n,0,-1): j=bk[k,j]; cut.append(j)
cut=cut[::-1]
segs=[]
for k in range(n):
    a=B[cut[k]]; b=B[cut[k+1]]
    # trim to speech
    ia=int(a/.01); ib=int(b/.01)
    while ia<ib and sil[ia]: ia+=1
    while ib>ia and sil[ib-1]: ib-=1
    segs.append((max(0,ia*.01-.04), ib*.01+.06))
out=np.zeros(int(43.5*sr)); plan=[]; prev=0
for k,(a,b) in enumerate(segs):
    s0=max(W[k][0],prev+.06); nxt=W[k+1][0] if k+1<n else 43.42
    room=nxt-s0-.06; dur=b-a; tempo=1.0
    if dur>room: tempo=min(1.15,dur/room)
    seg=x[int(a*sr):int(b*sr)]
    # compress long internal breaths (>0.22 s) to 0.16 s
    ia,ib=int(a/.01),int(b/.01); keep=[]; q=ia
    while q<ib:
        if sil[q]:
            r=q
            while r<ib and sil[r]: r+=1
            if (r-q)*.01>.22 and q>ia+5 and r<ib-5:
                mid=(q+r)//2; keep.append((q,q+8)); keep.append((r-8,r)); q=r; continue
            keep.append((q,r)); q=r
        else:
            r=q
            while r<ib and not sil[r]: r+=1
            keep.append((q,r)); q=r
    parts=[x[max(int(a*sr),u*h):min(int(b*sr),v*h)] for u,v in keep]
    pre=x[int(a*sr):ia*h]; post=x[ib*h:int(b*sr)]
    seg=np.concatenate([pre]+parts+[post]); dur=len(seg)/sr
    if dur>room: tempo=min(1.15,dur/room)
    else: tempo=1.0
    if tempo>1.001:
        wavfile.write('_s.wav',sr,(seg*32767).astype(np.int16))
        FF=subprocess.check_output(['python3','-c','import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).decode().strip()
        subprocess.run([FF,'-y','-loglevel','error','-i','_s.wav','-filter:a',f'atempo={tempo:.4f}','_t.wav'],check=True)
        _,seg=wavfile.read('_t.wav'); seg=seg.astype(float)/32768
    fade=int(.01*sr); seg=seg.copy(); seg[:fade]*=np.linspace(0,1,fade); seg[-fade:]*=np.linspace(1,0,fade)
    i0=int(s0*sr); seg=seg[:len(out)-i0]; out[i0:i0+len(seg)]+=seg
    prev=s0+len(seg)/sr
    plan.append(dict(k=k+1,text=T[k],src=[round(a,2),round(b,2)],at=s0,tempo=round(tempo,3),end=round(s0+len(seg)/sr,2),next=nxt))
wavfile.write('voz_alinhada.wav',sr,(np.clip(out,-1,1)*32767).astype(np.int16))
for p in plan: print(p)
json.dump(plan,open('voz_plan.json','w'),ensure_ascii=False,indent=1)
