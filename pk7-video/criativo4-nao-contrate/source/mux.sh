#!/bin/bash
set -e
C4=/tmp/claude-0/-home-user-Claude-code/035299b2-141f-5d15-8a9c-6a7a88242d8a/scratchpad/c4; A=$C4/audio/out
FF=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())")
m(){ $FF -y -loglevel error -i $1 -i $2 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart $3; }
m $C4/silent.mp4 $A/mix_completo.wav $C4/PK7_nao_contrate_completo.mp4
m $C4/silent.mp4 $A/mix_narracao.wav $C4/PK7_nao_contrate_para_narracao.mp4
m $C4/silent_ad.mp4 $A/mix_completo.wav $C4/PK7_nao_contrate_anuncio_pago.mp4
ls -la $C4/PK7_nao_contrate_*.mp4
