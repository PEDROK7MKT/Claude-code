# PK7 creative 4 — engine API (read fully before coding)

Working dir: `BUILD=/tmp/claude-0/-home-user-Claude-code/035299b2-141f-5d15-8a9c-6a7a88242d8a/scratchpad/c4/build`
Storyboard (the spec): `../storyboard.md`. Keyframe mock with exact layouts/CSS for key moments: `../sb/keyframes.html` (its `F==='…'` blocks; mock images in `../sb/kf/*.png`).
Engine: `core.css`, `core.js` (read them). Your act goes in `acts/<ID>.js` (+ optional `acts/<ID>.css`). Never edit core.* or another act's files; if you need a core change, describe it in your final report instead and work around it locally.

## Act contract
```js
ACTS.push({
  id:'A1', t0:0, t1:17.20, z:1, bg:false,   // visible while fq(T) in [t0,t1). bg:true = opaque background (only needed for a slash-wipe incoming act)
  html: `...`,           // inner HTML of <section class="act" id="A1"> (absolute-positioned children, 1080x1920 stage px)
  init(){ ... },         // runs once after ALL acts' HTML is in the DOM and .ml headlines are split: register ev()/lin()/txt()/S()/BLUR here
  render(T,TF){ ... },   // runs every frame AND every motion-blur sub-frame while the act is visible
});
```
* `render(T,TF)` must be a PURE function of T: no state carried between calls, frames are rendered out of order. Recompute every property you animate from T each call (also reset things to their "off" state when outside their window).
* Continuous motion uses `T`. DISCRETE changes (text swaps, typing characters, flap letter swaps, counters, show/hide pops, colour flips, stamp shakes) use `TF` (= T quantized to the 30 fps grid) so motion-blur sub-frames never blend two discrete states.
* An element is driven EITHER by `ev()` events OR by your `render()`, never both (ev's apply() overwrites transform/opacity/filter).
* All ids must be prefixed with your act id in lowercase (e.g. `a1_...`) — no collisions with other acts.

## Helpers available (from core.js)
* math: `cl(v,a,b) P(t,a,b) eo ei eio eb(t,s) lerp rnd(i) fq(t) mmss fmt`; `$ = getElementById`.
* timeline: `ev(id,t,anim,dur,opts)` with anims in `AN` (fadeUp, pop, sout, stamp, slamIn, rise{dy}, zoomIn, shake{amp}, whipInL/R, whipOutL/R, pulse1, grow (scaleX 0→1, origin left via CSS), hold{k}, settle{k}, rowIn, maskUp/maskOut…); `txt(id,t,string)` frame-quantized text swap.
* headlines: `HL(id,top,size,html,extraStyle)` → centred `.H` uppercase headline; `<br>` splits it into masked lines. `lin(id,t,dur=.42,stagger=.07)` = masked rise-in of each line; `linOut(id,t)` = masked drop-out (bottom line first); `linEnd(id,t)` = time the exit finishes. House rule: two-line headlines in this film are TWO separate single-line HL elements at top 262 and 350 (76 px) unless the storyboard says otherwise.
* print cards: `recibo(id,x,y,w,'doc4.jpg'|'doc1.jpg',[sx0,sy0,sx1,sy1],marks,{style})` → `{html,s,H,bottom,marks:[{id,kind,X,Y,W,Hh}]}`; marks `['L',x0,y0,x1,y1]` lime highlighter / `['U',x0,y0,x1,y1]` red underline (source px). Animate a mark by setting `transform:scaleX(q)` on `$(mark.id)` in render() (origin is left). Coordinates in the storyboard/keyframes were measured on the real prints — reuse them.
* board rows: `boardRowsHTML(id,rows,{rowH,gap,pad,font,nSize,ck,state})` → rows `${id}_r${i}`, texts `${id}_t${i}`, checks `${id}_c${i}`; classes `.brow.x` (red) / `.brow.v` (lime).
* avatar T4 rig: `rigHTML({id,pose,x,y,w,clip,occ,halo:{x,y,size},tiles,z})` + `rigSet(id,ty,haloK)` each render (ty ≥ 0 only — the avatar NEVER rises above its final y; enter by rising from ty>0 to 0 with outCubic, exit by diving down). `clip` = rig overflow bottom; it MUST lie inside an opaque occluder whose top is `occ`, and the occluder element must have a higher z-index than the rig. Tiles inside `tiles` move rigidly with the avatar.
* avatar T3 seal: `sealHTML({id,pose,x,y,s,rot,theme,ring,ringAt,z})` (x,y = disc centre on stage). Animate the outer `$(id)` with transform (origin = disc centre is set by core).
* avatar URLs: always `AVURL(pose)` (never hardcode) — `?edge=1` swaps in magenta-bordered copies for QA.
* sound: `S(t,name,vol=1,pan=0,dur)` — cue vocabulary (use only these names): `typing(dur) tap pop(dur=idx 0-7 pitch) whoosh swoosh swipe(dur) whooshBig impact stamp thock slam paper marker(dur) flip chime click(dur=idx) count(dur) riser(dur) shimmer tick` + new: `heart plink buzz press belt(dur) pages(dur) postit blip spinner(dur) clack crack fall sparkle pen(dur) snap scratch slap sting`. The music (incl. the 11.90–12.20 silence, the 13.50 drop, the 39.00 low-pass and 44.40 sting) is handled by the audio script — only cue SFX. Put each hit exactly on the frame where the visual hits.
* motion blur: `BLUR.push([t0,t1,K])` for fast moves (whips/drops/slams: K 24–48; flaps/quick pops: 8–16). Rendering cost grows with K — only cover the fast parts.
* slash wipe (core): `TRANS.push({t,cw,out:'A2',inc:'A3'})` — incoming act must have `bg:true`.

## Global rules
* Stage 1080x1920, 30 fps. Safe zone: important content inside y 250–1230; below y 1000 nothing beyond x 920; centre axis x 540. Fonts: Space Grotesk 700 uppercase (headlines/chips), Plus Jakarta Sans 600/700 body.
* Entrances use binary opacity (pop/rise/mask/scale), no slow opacity fades for text/cards (glows/halos/flashes may fade).
* No blank frames between beats: something meaningful is always on screen; never let a headline vanish without its replacement arriving within ~3 frames.
* Never let two different headlines overlap in the same frame; exits move lines apart, never onto each other.
* Avatar: no source-image border may EVER be visible (bottom cut line, hero-present's cut hands at x=0/511). `node edgecheck.js` must report 0 failing frames for every frame where an avatar is on screen.
* Honesty: texts exactly as in the storyboard; real prints are never altered (marks overlay only); "exemplo"/"cena ilustrativa" tags ≥ 24 px and visible the whole time their vignette is.

## Tools (run from $BUILD; an http server already serves $BUILD at http://127.0.0.1:8099/ — if it is down: `cd $BUILD && nohup python3 -m http.server 8099 --bind 127.0.0.1 >/dev/null 2>&1 &`)
* `python3 build.py --acts A1 --out dev_A1.html` (you may include neighbours to test a hand-off, e.g. `--acts A1,A2`, but only edit your own files).
* `NODE_PATH=$(npm root -g) node shoot.js dev_A1.html <t0> <t1> <step> <outdir> [qa=1]` → JPGs + page errors; `python3 sheet.py <outdir> <sheet.jpg> [cols] [thumbW]` → contact sheet you can open with the Read tool. Use outdirs under `$BUILD/work_<id>/`.
* `NODE_PATH=$(npm root -g) node edgecheck.js dev_A1.html <t0> <t1> [step]` → avatar border exposure (must be 0).
* Inspect at full res: shoot a single time and Read the JPG; crop with PIL if needed.
