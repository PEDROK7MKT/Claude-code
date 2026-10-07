#!/bin/bash
# full render of creative 4: org variant (all frames, motion blur), ad variant (CTA tail), blend, encode, mux
set -e
C4=/tmp/claude-0/-home-user-Claude-code/035299b2-141f-5d15-8a9c-6a7a88242d8a/scratchpad/c4
B=$C4/build; cd $B
export NODE_PATH=$(npm root -g)
curl -s -o /dev/null http://127.0.0.1:8099/core.css || (nohup python3 -m http.server 8099 --bind 127.0.0.1 >/dev/null 2>&1 &); sleep 1
python3 build.py --acts A1,A2,A3 --out index.html
rm -rf frames frames_ad; mkdir -p frames/sub frames_ad/sub
NF=1368
# interleaved chunks so the heavy blur windows spread across workers
python3 -c "
n=$NF;step=24
for s in range(0,n,step): print(s,min(n,s+step))" | xargs -P 4 -n 2 sh -c 'VAR=org OUT=frames node frames2.js $0 $1'
OUT=frames python3 blend.py
python3 -c "
for s in range(1260,1368,27): print(s,min(1368,s+27))" | xargs -P 4 -n 2 sh -c 'VAR=ad OUT=frames_ad node frames2.js $0 $1'
OUT=frames_ad python3 blend.py
N=$(ls frames/f*.jpg | wc -l); echo "org frames $N"; [ "$N" = "$NF" ]
rm -rf seq_ad; mkdir seq_ad
for i in $(seq 0 $((NF-1))); do n=$(printf %05d $i); if [ $i -ge 1260 ]; then ln -s ../frames_ad/f$n.jpg seq_ad/f$n.jpg; else ln -s ../frames/f$n.jpg seq_ad/f$n.jpg; fi; done
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -loglevel error -framerate 30 -i frames/f%05d.jpg -c:v libx264 -crf 15 -tune animation -preset slow -pix_fmt yuv420p -movflags +faststart $C4/silent.mp4 &
$FF -y -loglevel error -framerate 30 -i seq_ad/f%05d.jpg -c:v libx264 -crf 15 -tune animation -preset slow -pix_fmt yuv420p -movflags +faststart $C4/silent_ad.mp4 &
wait
echo RENDERDONE
