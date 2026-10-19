#!/bin/bash
set -e
C5=/tmp/claude-0/-home-user-Claude-code/035299b2-141f-5d15-8a9c-6a7a88242d8a/scratchpad/c5
B=$C5/build; cd $B
export NODE_PATH=$(npm root -g) BASE=http://127.0.0.1:8098/
curl -s -o /dev/null http://127.0.0.1:8098/core.css || (nohup python3 -m http.server 8098 --bind 127.0.0.1 >/dev/null 2>&1 &); sleep 1
python3 build.py --acts A1,A2,A3 --out index.html
NODE_PATH=$NODE_PATH node cues.js index.html
rm -rf frames; mkdir -p frames/sub
NF=1080
python3 -c "
n=$NF;step=20
for s in range(0,n,step): print(s,min(n,s+step))" | xargs -P 4 -n 2 sh -c 'VAR=org OUT=frames node frames2.js $0 $1'
OUT=frames python3 blend.py
N=$(ls frames/f*.jpg | wc -l); echo "frames $N"; [ "$N" = "$NF" ]
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
$FF -y -loglevel error -framerate 30 -i frames/f%05d.jpg -c:v libx264 -crf 16 -tune animation -preset slow -pix_fmt yuv420p -movflags +faststart $C5/silent.mp4
echo RENDERDONE
