# Fonte do vídeo PK7

- `index.html`: animação 1080×1920 controlada por `window.render(t)` (t em segundos, 0–80). Usa `fonts/` e `a/` (prints, logos e personagens do pk7.com.br).
- `frames.js`: renderiza os quadros a 30fps com Playwright (`node frames.js 0 2400`).
- `audio.py`: sintetiza a trilha e os efeitos (numpy) → `music.wav`, `sfx.wav`, `mix_full.wav`, `mix_for_voice.wav`.
- Montagem: `ffmpeg -framerate 30 -i frames/f%05d.jpg -i mix_full.wav -c:v libx264 -crf 14 -pix_fmt yuv420p -c:a aac out.mp4`
