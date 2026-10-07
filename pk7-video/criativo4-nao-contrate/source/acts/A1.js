// A1 · S01–S07 (0.00–17.15): hook, the 4 disqualifiers with the docked board, split-flap turn, Pedro rises behind
// the board (cover 15.6 s) and the hand-off: board rows 1–2 morph into A2's two headline lines (last A1 frame 17.133).
(()=>{
const NAVY='#0A0F2C',LIME='#B7E400',LIGHT='#F4F6FF';
const hx=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mix=(a,b,q)=>{q=cl(q);const A=hx(a),B=hx(b);return `rgb(${A.map((v,i)=>Math.round(v+(B[i]-v)*q)).join(',')})`;};
const vis=(el,on)=>{el.style.visibility=on?'visible':'hidden';};
const V=(id,on)=>vis($(id),on);
const DS=(el,on,d='block')=>{el.style.display=on?d:'none';};   // containers: display (a hidden parent must also hide explicitly-visible children)
const OLD=['QUER CURTIDA','QUER RELATÓRIO BONITO','QUER PACOTE PRONTO','ACEITA ESTAGIÁRIO'];
const NEW=['QUER VENDA','QUER FATURAR','QUER TIME SOB MEDIDA','QUER FALAR COM O PEDRO'];
const TY=[4.40,6.60,8.80,11.00],TYD=.30,XT=[4.80,7.00,9.20,11.40];   // typing start / ✕ (all on the frame grid)
const FL0=12.25,FLS=.18,FLD=.12,FSt=i=>FL0+FLS*i,LAND=i=>FSt(i)+3*FLD;  // flaps: 3 flips of .12 s per row; lands 12.61/12.79/12.97/13.15
const ROWIN=[.45,.57,.69,.81];
// ✓ pulses: cue on the first frame at/after the beat; the 0.09 s pulse window starts 0.02 s before that frame so the cue frame
// already shows it, and every pulse is over before the next rest frame (15.6 = cover = rest frame for all 4 rows)
const PULSE=[15.25,15.50,15.75,16.00].map(t=>Math.ceil(t*30-1e-6)/30),PLD=.09;
const HITS=[7.95,8.35,8.75].map(fq),BSP=200;   // press hits snapped to the frame grid (7.967/8.367/8.767) · box spacing
const HEARTS=[...Array(12)].map((_,k)=>3.5+1.45*Math.sqrt(k/11));      // accelerating spawns 3.50 → 4.95
const SCR='ABCDEFGHIJKLMNOPQRSTUVWXYZÁÇ';
const scr=(i,k)=>[...NEW[i]].map((ch,j)=>ch===' '?' ':SCR[Math.floor(rnd(i*97+k*41+j*7+3)*SCR.length)]).join('');
// flap scrambles: measured with the real font; any scramble wider than its target is re-rolled (the widest target,
// row 4, already sits exactly 24 px from the hinge pin, so "≤ target" guarantees the 24 px clearance)
let FLT=null;
function flt(){
 if(FLT&&FLT.ok)return FLT;
 const ok=!!(document.fonts&&document.fonts.check('700 42px "Space Grotesk"'));
 const c=document.createElement('canvas').getContext('2d');c.font='700 42px "Space Grotesk"';const w=s=>c.measureText(s).width;
 const R=[0,1,2,3].map(i=>{const tw=w(NEW[i]);
  const pick=(k,not)=>{for(let a=0;a<60;a++){const s=scr(i,k+a*13);if(w(s)<=tw&&s!==not)return s;}return NEW[i];};
  const s1=pick(1);return [OLD[i],s1,pick(2,s1),NEW[i]];});
 R.ok=ok;FLT=R;return R;}
// board states (B0 empty · B1 dock · B2 centre/flap · B3 footer) — rows are vertically centred in the frame
const BS=[{x:160,y:724,w:760,h:496,rh:109,gap:8,n:56,ck:60,f:40},{x:160,y:888,w:760,h:334,rh:70,gap:6,n:44,ck:48,f:40},
          {x:160,y:540,w:760,h:534,rh:116,gap:10,n:52,ck:56,f:42},{x:160,y:780,w:760,h:444,rh:96,gap:8,n:52,ck:56,f:42}];
const gl=(a,b,q)=>{const o={};for(const k in a)o[k]=a[k]+(b[k]-a[k])*q;return o;};
const bgeo=T=>gl(gl(gl(BS[0],BS[1],eio(P(T,2.80,3.10))),BS[2],eb(P(T,11.90,12.25),1.2)),BS[3],eo(P(T,14.20,14.55)));
const rowRect=(g,i)=>{const pad=(g.h-4*g.rh-3*g.gap)/2;return {x:g.x+18,y:g.y+pad+i*(g.rh+g.gap),w:g.w-36,h:g.rh};};

// ------------------------------------------------------------------ markup helpers
const HEART=(c,s)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path fill="${c}" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
const PERSON=`<svg viewBox="0 0 110 110"><circle cx="55" cy="44" r="19" fill="#3E4B8C"/><path d="M18 108c3-24 18-36 37-36s34 12 37 36z" fill="#3E4B8C"/></svg>`;
const FOLDER=`<svg viewBox="0 0 58 48"><path d="M3 9a5 5 0 0 1 5-5h13l5 6h24a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z" fill="#E5B730"/><rect x="11" y="13" width="34" height="22" rx="3" fill="#fff"/><path d="M16 20h22M16 26h16" stroke="#9AA3CC" stroke-width="3" stroke-linecap="round"/><path d="M3 18h52v21a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z" fill="#FFD24D"/></svg>`;
const CRACK='52,-2 48,20 56,38 46,57 54,77 50,102';
const halfClip=side=>side==='l'?`polygon(-5% -5%,52% -5%,48% 20%,56% 38%,46% 57%,54% 77%,50% 105%,-5% 105%)`:`polygon(52% -5%,105% -5%,105% 105%,50% 105%,54% 77%,46% 57%,56% 38%,48% 20%)`;

const rowHTML=i=>`<div class="a1row" id="a1_r${i}" style="z-index:11">
 <div class="a1lay a1base" id="a1_b${i}"><div class="a1n" id="a1_n${i}">${i+1}</div>
  <div class="a1slot"><div class="a1ph" id="a1_ph${i}"><i style="width:274px"></i><i style="width:122px"></i></div>
   <div class="a1t a1H" id="a1_tw${i}"><span id="a1_t${i}"></span><i class="a1car" id="a1_car${i}"></i></div>
   <div class="a1fl" id="a1_fl${i}">
    <div class="a1fh a1top" id="a1_fbt${i}"><span></span></div><div class="a1fh a1bot" id="a1_fbb${i}"><span></span></div>
    <div class="a1fh a1top" id="a1_ffa${i}"><span></span><i class="a1fsh"></i></div><div class="a1fh a1bot" id="a1_ffb${i}"><span></span><i class="a1fsh"></i></div>
    <i class="a1split"></i><i class="a1pin" style="left:-5px"></i><i class="a1pin" style="right:-5px"></i></div></div>
  <div class="a1ck" id="a1_c${i}"><span id="a1_cx${i}">✕</span></div></div>
 <i class="a1fx" id="a1_fx${i}"></i>
 <div class="a1lay a1vl" id="a1_vl${i}"><div class="a1n" id="a1_vn${i}">${i+1}</div><div class="a1t a1H" id="a1_vt${i}">${NEW[i]}</div><div class="a1ck" id="a1_vk${i}"><span id="a1_vc${i}">✓</span></div></div>
 ${i<2?HL(`a1_mn${i+1}`,i?350:262,76,`<span style="display:inline-block;visibility:hidden">✓</span> QUER <span>${i?'FATURAR':'VENDA'}</span>`,'color:#0A0F2C;transform-origin:0 0;display:none'):''}
</div>`;   // a1_mn1/2 = navy copy of the morph line, clipped by the lime pill during the hand-off wipe

const PAGES=[ // S03 report pages (no numbers anywhere)
 `<i class="a1gb" style="left:24px;top:22px;width:170px;height:14px"></i><i class="a1gb" style="left:24px;top:44px;width:110px;height:10px;opacity:.7"></i>
  <svg style="position:absolute;left:34px;top:74px" width="180" height="180" viewBox="0 0 180 180"><g transform="rotate(-90 90 90)" fill="none" stroke-width="30">
   <circle cx="90" cy="90" r="62" stroke="#1E50E6" stroke-dasharray="175 400"/><circle cx="90" cy="90" r="62" stroke="#B7E400" stroke-dasharray="0 179 118 400"/><circle cx="90" cy="90" r="62" stroke="#8FB0FF" stroke-dasharray="0 301 88 400"/></g></svg>
  <div style="position:absolute;left:250px;top:96px;display:flex;flex-direction:column;gap:20px">${['#1E50E6','#B7E400','#8FB0FF'].map((c,k)=>`<div style="display:flex;align-items:center;gap:12px"><i style="width:18px;height:18px;border-radius:5px;background:${c}"></i><i class="a1gb" style="position:static;display:block;width:${[150,120,96][k]}px;height:12px"></i></div>`).join('')}</div>`,
 `<i class="a1gb" style="left:24px;top:22px;width:150px;height:14px"></i><i class="a1gb" style="left:24px;top:44px;width:96px;height:10px;opacity:.7"></i>
  <i style="position:absolute;left:60px;right:60px;top:262px;height:3px;background:#DDE3F0"></i>
  ${[[96,70],[196,118],[296,170]].map(([x,h],k)=>`<i class="a1bar3" id="a1_bar${k}" style="position:absolute;left:${x}px;bottom:46px;width:66px;height:${h}px;border-radius:10px 10px 4px 4px;background:linear-gradient(180deg,#B7E400,#1E50E6);transform-origin:50% 100%"></i>`).join('')}
  <svg style="position:absolute;left:300px;top:60px" width="70" height="40" viewBox="0 0 70 40"><path d="M4 34 L30 18 L44 26 L64 6" fill="none" stroke="#B7E400" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 5h15v15" fill="none" stroke="#B7E400" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 `<i class="a1gb" style="left:24px;top:22px;width:180px;height:14px"></i><i class="a1gb" style="left:24px;top:44px;width:120px;height:10px;opacity:.7"></i>
  <svg style="position:absolute;left:20px;top:70px" width="440" height="200" viewBox="0 0 440 200"><defs><linearGradient id="a1sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B7E400" stop-opacity=".55"/><stop offset="1" stop-color="#B7E400" stop-opacity="0"/></linearGradient></defs>
   <path d="M10 170 C60 160 80 120 120 128 S180 150 210 110 S270 60 300 76 S370 40 420 18 L420 196 L10 196z" fill="url(#a1sg)"/>
   <path id="a1_spl" d="M10 170 C60 160 80 120 120 128 S180 150 210 110 S270 60 300 76 S370 40 420 18" fill="none" stroke="#1E50E6" stroke-width="6" stroke-linecap="round" pathLength="100" stroke-dasharray="100 100"/>
   <circle cx="420" cy="18" r="9" fill="#B7E400" stroke="#1E50E6" stroke-width="4"/></svg>`,
 `<div class="a1kpi">alcance <b>↑</b> · impressões <b>↑</b> · engajamento <b>↑</b></div>
  <svg style="position:absolute;left:24px;top:70px" width="270" height="150" viewBox="0 0 270 150"><path d="M8 136 C70 128 90 92 140 84 S220 30 262 12" fill="none" stroke="#1E50E6" stroke-width="7" stroke-linecap="round"/><path d="M8 136 C70 128 90 92 140 84 S220 30 262 12 L262 146 L8 146z" fill="#1E50E6" opacity=".09"/></svg>
  <div style="position:absolute;left:24px;top:236px;display:flex;gap:10px">${[0,1,2].map(k=>`<i style="display:block;width:44px;height:12px;border-radius:6px;background:${['#1E50E6','#B7E400','#8FB0FF'][k]}"></i>`).join('')}</div>`
];

const BOXN=['BARBEARIA','CLÍNICA','RESTAURANTE'];
const V3=fq(5.133),V4=fq(7.333),V5=fq(9.533);   // S03/S04/S05 enter on the frame the outgoing vignette is cut (no empty focus-stage frames)

const HTML=`
<div id="a1_rep" class="a1w" style="visibility:hidden;z-index:0">
 <div class="a1rl a1H" style="top:318px;height:144px;font-size:112px;gap:24px"><span class="a1stp" id="a1_x0s">NÃO</span><span class="a1ib" id="a1_x0c">CONTRATE</span></div>
 <div class="a1rc a1H" style="top:478px;font-size:150px"><span class="a1ib" id="a1_x0a">A PK7</span><span class="a1ib" id="a1_x0d">.</span></div>
 <div class="a1rc a1H" style="top:652px;font-size:46px"><span class="a1ib" id="a1_x0e">…</span><span class="a1ib" id="a1_x0v">SE VOCÊ</span> <span class="a1ib" id="a1_x0f">FOR</span> <span class="a1ib" id="a1_x0u">UM DESSES 4:</span></div>
 <div class="a1rl a1H" style="top:252px;height:86px;font-size:64px;gap:16px"><span class="a1stp" id="a1_x1s">NÃO</span><span><span class="a1ib" id="a1_x1c">CONTRATE</span> <span class="a1ib" id="a1_x1a">A PK7</span></span></div>
 <div class="a1rc a1H" style="top:352px;font-size:64px"><span class="a1ib" id="a1_x1v">SE VOCÊ</span><span class="a1ib" id="a1_x1t">…</span></div>
 <div class="a1rc a1H" style="top:263px;font-size:64px"><span class="a1ib" id="a1_x2c">CONTRATE</span> <span class="a1ib" id="a1_x2a">A PK7</span></div>
 <div class="a1rc a1H" style="top:262px;font-size:76px"><span class="a1ib" id="a1_x3c">CONTRATE</span> <span class="a1ib" id="a1_x3a">A PK7</span></div>
 <div class="a1rc a1H" style="top:350px;font-size:76px"><span class="a1ib" id="a1_x3v">SE VOCÊ</span><span class="a1ib" id="a1_x3t">…</span></div>
 ${HL('a1_xm1',262,76,'<span class="L">✓</span> <span id="a1_xm1q">QUER</span> <span class="L" id="a1_xm1w">VENDA</span>')}
 ${HL('a1_xm2',350,76,'<span class="L">✓</span> <span id="a1_xm2q">QUER</span> <span class="L" id="a1_xm2w">FATURAR</span>')}
</div>
<div class="a1w" id="a1_world">
 <div class="a1flash" id="a1_flash" style="z-index:2"></div>
 <div class="a1w" id="a1_vgs" style="z-index:4">
  <div class="a1vg" id="a1_vg1" style="left:290px;top:450px;width:500px;height:410px">
   <div class="a1post"><i class="a1pav"></i><i class="a1pbar" style="left:76px;top:17px;width:150px;height:12px"></i><i class="a1pbar" style="left:76px;top:38px;width:96px;height:10px;opacity:.6"></i>
    <i class="a1pdots"><b></b><b></b><b></b></i>
    <div class="a1pimg"><div class="a1H" style="font-size:44px;color:#fff;text-shadow:0 6px 22px rgba(10,15,44,.35)">PROMO DE HOJE!</div></div>
    <div class="a1pact">${HEART('#FF4D5E',36)}<span class="a1H" style="font-size:26px">CURTIDAS ↑↑↑</span></div>
    <div class="a1tag" id="a1_tag1" style="left:22px;top:372px">exemplo</div></div>
   <div class="a1caixa"><span>caixa</span><i></i></div>
   <div class="a1bigh" id="a1_bigh">${HEART('#FFFFFF',200)}</div>
   ${HEARTS.map((_,k)=>`<i class="a1ht" id="a1_ht${k}">${HEART(['#FF4D5E','#FF7A88','#FF4D5E','#FFB3BC'][k%4],[40,32,46,30,38,44,34,42,30,40,36,46][k])}</i>`).join('')}
  </div>
  <div class="a1vg" id="a1_vg2" style="left:300px;top:460px;width:480px;height:380px">
   <div class="a1pdf"><div class="a1pdfh"><span class="a1H" style="font-size:28px">RELATÓRIO MENSAL <span class="a1emo">✨</span></span></div>
    <div class="a1pages">${PAGES.map((h,j)=>`<div class="a1pg" id="a1_pg${j}" style="z-index:${4-j}">${h}<i class="a1pgsh" id="a1_pgs${j}"></i></div>`).join('')}</div>
    <div class="a1tag a1tagd" id="a1_tag2" style="left:18px;top:330px">exemplo</div></div>
   <div class="a1seal" id="a1_seal"><span class="a1emo">✨</span><span class="a1H" style="font-size:26px">LINDO!</span><i class="a1glint" id="a1_glint"></i></div>
   <div class="a1postit" id="a1_postit">…e as vendas?</div>
  </div>
  <div class="a1w a1vg" id="a1_vg3">
   <div class="a1cap3"><div id="a1_cap3">mesma caixa pra todo mundo</div></div>
   <div class="a1belt" id="a1_belt"></div>
   ${BOXN.map((n,k)=>`<div class="a1box" id="a1_bx${k}"><div class="a1boxb"><i class="a1bflap"></i><i class="a1btape"></i><div class="a1blbl a1H">${n}</div><div class="a1bstp a1H" id="a1_bst${k}">PADRÃO</div></div></div>`).join('')}
   <div class="a1w" id="a1_press"><i class="a1beam"></i><i class="a1rod" id="a1_rod"></i><div class="a1head" id="a1_head"><b></b><i></i></div>
    ${[0,1,2,3].map(k=>`<i class="a1imp" id="a1_imp${k}"></i>`).join('')}</div>
   <div class="a1tag" id="a1_tag3" style="left:170px;top:836px">exemplo</div>
  </div>
  <div class="a1vg" id="a1_vg4" style="left:200px;top:450px;width:680px;height:410px">
   <div class="a1tr"><div class="a1trh"><div class="a1tra">A</div><div style="font:700 30px 'Plus Jakarta Sans'">Agência · atendimento</div></div>
    <div class="tagc" style="right:28px;top:34px">cena ilustrativa</div>
    <div class="a1trc" style="left:30px;width:240px"><div class="a1face">${PERSON}</div><div class="cap" style="font-size:26px;margin-top:10px;color:#C5CEF0">VENDEDOR</div><div class="a1sig" id="a1_sig">contrato assinado ✓</div></div>
    <svg class="a1arr" id="a1_arr" style="left:250px;top:160px" width="195" height="40"><path d="M5 20 H182" stroke="#8A93B8" stroke-width="5" stroke-dasharray="14 10"/><path d="M172 6 L190 20 L172 34" fill="none" stroke="#8A93B8" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="a1trc" style="left:420px;width:230px"><div class="a1face" id="a1_face2" style="border-color:var(--loss)">${PERSON}</div><div class="cap" style="font-size:26px;margin-top:10px">ESTAGIÁRIO</div><div class="cap a1trn">EM TREINAMENTO</div></div>
    <div class="a1fold" id="a1_fold">${FOLDER}</div>
    <div class="a1trx" id="a1_trx">transferindo seu atendimento…<i class="a1spin" id="a1_spin"></i></div>
    <div class="a1trbar" id="a1_trbar"><i id="a1_trfill"></i></div></div>
  </div>
 </div>
 ${rigHTML({id:'a1_rig',pose:'pose-celebrate',x:306,y:415,w:468,clip:868,occ:780,halo:{x:250,y:330,size:580},z:5})}
 <div class="a1w" id="a1_spks" style="z-index:6">${[...Array(16)].map((_,k)=>`<i class="a1spk" id="a1_sp${k}"></i>`).join('')}</div>
 <div class="a1w" style="z-index:7;height:0"><div id="a1_pillw" style="position:absolute;left:0;width:1080px;top:250px;display:flex;justify-content:center"><div class="a1pill a1H" id="a1_pill">⚠ AVISO HONESTO</div></div></div>
 <div class="a1w" id="a1_g3" style="z-index:7">
  <div class="a1p a1H" id="a1_pe" style="font-size:46px">…</div><div class="a1p a1H" id="a1_pf" style="font-size:46px">FOR</div><div class="a1p a1H" id="a1_pu" style="font-size:46px;color:var(--lime)">UM DESSES 4:</div></div>
 <div class="a1w" id="a1_g1" style="z-index:7">
  <div class="a1p" id="a1_ps" style="font-size:112px"><div class="a1rot" id="a1_psr"><div class="a1stp a1H" id="a1_psf">NÃO</div>
   <div class="a1stp a1H a1half" id="a1_psl" style="clip-path:${halfClip('l')};transform-origin:25% 50%">NÃO</div><div class="a1stp a1H a1half" id="a1_psR" style="clip-path:${halfClip('r')};transform-origin:75% 50%">NÃO</div>
   <svg class="a1crack" id="a1_crk" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline id="a1_crkp" points="${CRACK}" pathLength="100" stroke-dasharray="100 100"/><polyline points="56,38 70,30 78,34" pathLength="100" stroke-dasharray="100 100" id="a1_crkb"/></svg></div></div>
  <div class="a1p a1H" id="a1_pc" style="font-size:112px">CONTRATE</div>
  <div class="a1p a1H" id="a1_pa" style="font-size:150px">A PK7</div><div class="a1p a1H" id="a1_pd" style="font-size:150px;color:var(--lime)">.</div></div>
 <div class="a1w" id="a1_g2" style="z-index:7"><div class="a1p a1H" id="a1_pv" style="font-size:76px">SE VOCÊ</div><div class="a1p a1H" id="a1_pt" style="font-size:76px">…</div></div>
 <div class="board" id="a1_bd" style="z-index:10"></div>
 ${[0,1,2,3].map(rowHTML).join('')}
 ${HL('a1_m1',262,76,'<span class="L" id="a1_m1k" style="display:inline-block">✓</span> QUER <span class="L" id="a1_m1w">VENDA</span>','z-index:12;transform-origin:0 0;display:none')}
 ${HL('a1_m2',350,76,'<span class="L" id="a1_m2k" style="display:inline-block">✓</span> QUER <span class="L" id="a1_m2w">FATURAR</span>','z-index:12;transform-origin:0 0;display:none')}
</div>`;

// ------------------------------------------------------------------ measurement of the hidden replicas (layout only)
let MM=null;
function meas(){
 if(MM&&MM.ok)return MM;
 const sr=$('stage').getBoundingClientRect(),g=id=>{const r=$(id).getBoundingClientRect();return {x:r.left-sr.left,y:r.top-sr.top,w:r.width,h:r.height};};
 const M={};['0s','0c','0a','0d','0e','0v','0f','0u','1s','1c','1a','1v','1t','2c','2a','3c','3a','3v','3t'].forEach(k=>M[k]=g('a1_x'+k));
 M.q1=g('a1_xm1q');M.w1=g('a1_xm1w');M.l1=g('a1_xm1_l0');M.q2=g('a1_xm2q');M.w2=g('a1_xm2w');M.l2=g('a1_xm2_l0');
 M.ok=!!(document.fonts&&document.fonts.status==='loaded'&&[...document.fonts].some(f=>/Space Grotesk/.test(f.family)&&f.status==='loaded'));
 MM=M;return M;}
const put=(id,p,on=true,extra='')=>{const e=$(id);e.style.display=on?'block':'none';if(on)e.style.transform=`translate(${p.x}px,${p.y}px) scale(${p.s})${extra}`;};
const L3=(a,b,q)=>({x:lerp(a.x,b.x,q),y:lerp(a.y,b.y,q),s:lerp(a.s,b.s,q)});

// ------------------------------------------------------------------ headline (S01 → S07), built from word pieces
function heads(T,TF){
 const M=meas(),F=(k,fs,b)=>({x:M[k].x,y:M[k].y,s:fs/b});
 const kk=1+.03*eio(P(T,1,2.8))*(1-eio(P(T,2.8,3.1)));                 // type push-in 1.00→1.03 about stage (540,508), the headline block centre
 const gT=kk===1?'none':`translate(540px,508px) scale(${kk}) translate(-540px,-508px)`;   // g1–g3 are full-stage boxes with transform-origin 0 0 (A1.css)
 for(const id of ['a1_g1','a1_g2','a1_g3'])$(id).style.transform=gT;
 $('a1_pillw').style.transform=kk===1?'none':`translate(540px,258px) scale(${kk}) translate(-540px,-258px)`;   // pill under the same push (its local origin = stage (0,250))
 // dock: NÃO CONTRATE shrinks into place. "A PK7" shrinks to 64 px first (2.92), runs right under CONTRATE and past its slot
 // (outBack x), rises into line 1 (2.86–3.00) with ≥16 px clear of CONTRATE, then settles back left into the slot (3.07).
 // Its size and baseline are final (≤2 px) before it is ever closer than 16 px to CONTRATE. "SE VOCÊ" rises after.
 const qd1=eio(P(T,2.80,3.00)),pa=P(T,2.80,3.07),qd2=eio(pa),qdv=eio(P(T,2.90,3.10)),qg=eio(P(T,13.35,13.60)),qh=eio(P(T,13.70,14.10));
 const LA=(a,b)=>({x:lerp(a.x,b.x,eb(pa,1.8)),y:lerp(a.y,b.y,eio(P(T,2.86,3.00))),s:lerp(a.s,b.s,eo(P(T,2.80,2.92)))});
 // masks: subtitle rise-in (.25–.55), dock drop-out of "… FOR UM DESSES 4:", final drop-out 16.75 (bottom line first)
 const H46=46*1.62,H76=76*1.62;
 const rise=(1-eo(P(T,.25,.55)))*H46,riseHid=(1-eo(P(TF,.25,.55)))*H46>46*.98;
 const dk=eio(P(T,2.80,3.07))*H46,dkHid=eio(P(TF,2.80,3.07))*H46>46*.95;
 const o2=eio(P(T,16.75,17.02))*H76,o2h=eio(P(TF,16.75,17.02))*H76>76*.95;
 const o1=eio(P(T,16.78,17.05))*H76,o1h=eio(P(TF,16.78,17.05))*H76>76*.95;
 const band46=`inset(${652-46*.3}px 0 ${1920-(698+46*.24)}px 0)`;
 $('a1_g3').style.display=TF<3.1?'block':'none';
 $('a1_g3').style.clipPath=band46;
 $('a1_g2').style.clipPath=T<.6?band46:T>=16.75?`inset(${350-76*.3}px 0 ${1920-(426+76*.24)}px 0)`:'none';
 $('a1_g1').style.clipPath=T>=16.75?`inset(${262-76*.3}px 0 ${1920-(338+76*.24)}px 0)`:'none';
 // CONTRATE / A PK7 / dot
 const c=L3(L3(L3(F('0c',112,112),F('1c',64,112),qd1),F('2c',64,112),qg),F('3c',76,112),qh);c.y+=o1;
 const a=L3(L3(LA(F('0a',150,150),F('1a',64,150)),F('2a',64,150),qg),F('3a',76,150),qh);a.y+=o1;
 put('a1_pc',c,!o1h);$('a1_pc').style.color=mix(LIGHT,LIME,qg);
 put('a1_pa',a,!o1h);$('a1_pa').style.color=qg>0?mix(LIGHT,LIME,qg):mix(LIME,LIGHT,qd2);
 const a0=F('0a',150,150),d0=F('0d',150,150),dm=1-eio(P(T,2.80,2.93)),ds=a.s/a0.s;
 put('a1_pd',{x:a.x+(d0.x-a0.x)*ds,y:a.y+(d0.y-a0.y)*ds+150*a.s*(1-dm)*.8,s:a.s*dm},dm>.01);
 // SE VOCÊ + trailing ellipsis
 const v1=F('1v',64,76),v=L3(L3(F('0v',46,76),v1,qdv),F('3v',76,76),qh);v.y+=rise+o2;
 const vOn=!riseHid&&!o2h;put('a1_pv',v,vOn);
 const vcol=qg>0?mix(LIME,LIGHT,qg):mix(LIGHT,LIME,qdv);$('a1_pv').style.color=vcol;
 const t1=F('1t',64,76),tm=eb(P(T,3.04,3.16)),tr=v.s/v1.s;
 put('a1_pt',{x:v.x+(t1.x-v1.x)*tr,y:v.y+(t1.y-v1.y)*tr+76*v.s*(1-tm)*.5,s:v.s*tm},vOn&&TF>=3.04-EPS&&tm>.01);
 $('a1_pt').style.color=mix(LIME,LIGHT,qg);
 // "…" FOR "UM DESSES 4:" (masked rise-in, masked drop-out at the dock)
 for(const k of ['e','f','u']){const p=F('0'+k,46,46);p.y+=rise+dk;put('a1_p'+k,p,!riseHid&&!dkHid);}
 // pill
 const pm=1-eio(P(T,2.80,2.92));const pl=$('a1_pill');pl.style.visibility=pm>.01?'visible':'hidden';pl.style.transform=`scale(${pm})`;
 // NÃO stamp: settle 1.10→1 (0–.25), dock to 64 px, crack 13.20, two halves fall behind the board 13.25–13.85
 const s=L3(F('0s',112,112),F('1s',64,112),qd1),sw=M['0s'].w,sh=M['0s'].h;
 const sm=1.1-.1*eo(P(T,0,.25));
 let st={x:s.x-(sm-1)*sw*s.s/2,y:s.y-(sm-1)*sh*s.s/2,s:s.s*sm};
 const cracked=TF>=13.20-EPS,tf=Math.max(0,T-13.25);
 if(cracked){const fi=Math.round((TF-13.2)*30);if(fi<3)st.x+=[3,-3,2][fi];
  st.y+=-240*tf+.5*10800*tf*tf;}
 put('a1_ps',st,TF<13.86&&!o1h);
 V('a1_psf',!cracked);V('a1_psl',cracked);V('a1_psR',cracked);V('a1_crk',cracked&&tf<.05);
 if(cracked){const cp=P(T,13.20,13.24),sep=1.5+3*P(T,13.2,13.25);
  $('a1_crkp').style.strokeDashoffset=100*(1-cp);$('a1_crkb').style.strokeDashoffset=100*(1-P(T,13.21,13.25));
  const u=tf/.6;
  $('a1_psl').style.transform=`translate(${-sep-30*tf}px,${-40*tf}px) rotate(${18*u}deg)`;      // halves stay inside the board's
  $('a1_psR').style.transform=`translate(${sep+50*tf}px,${60*tf*tf}px) rotate(${32*u}deg)`;}     // silhouette while passing behind it
}

// ------------------------------------------------------------------ morph targets: rows 1–2 → A2 headline lines
function morph(T,TF,i){
 const el=$('a1_m'+(i+1));
 if(TF<16.75-EPS){el.style.display='none';return null;}
 el.style.display='block';
 const M=meas(),t0=16.75+i/30,t1=17.10,q=eio(P(T,t0,t1));      // both lines land at 17.10: frame 514 (+ its blur sub-samples) is exactly A2's layout
 const g=BS[3],r=rowRect(g,i),Xr=r.x+20+g.n+16,Yr=r.y+r.h/2,s0=42/76;
 const Q=M['q'+(i+1)],W=M['w'+(i+1)],LN=M['l'+(i+1)],top=i?350:262,Yc=LN.y+LN.h/2;
 const s=lerp(s0,1,q),cx=lerp(Xr,Q.x,q),cy=lerp(Yr,Yc,q);
 const wc=q>=1?'transform':'auto';el.style.willChange=wc;$(`a1_m${i+1}_l0`).style.willChange=wc;   // final frame = A2's layer setup (pixel-identical hand-off)
 const tr=`translate(${cx-s*Q.x}px,${cy-top-s*(Yc-top)}px) scale(${s})`;
 el.style.transform=q>=1?'none':tr;
 // final colours throughout (QUER white, last word lime): this line sits UNDER the lime pill, whose own navy copy of the
 // text (a1_mn*) is clipped by the pill — so every text pixel is either navy-on-lime or white/lime-on-navy, never a blend
 el.style.color='';$(`a1_m${i+1}w`).style.color='';
 const kp=P(T,HW+i/30,HW+i/30+.15),k=$(`a1_m${i+1}k`);   // ✓ pops as the wipe uncovers the line's left end
 k.style.transform=q>=1?'':`scale(${eb(kp,2.2)})`;k.style.display=q>=1?'inline':'inline-block';k.style.visibility=kp>0?'visible':'hidden';
 return {x:cx,y:cy-38*s,w:(W.x+W.w-Q.x)*s,h:76*s,s,tr};
}
const HW=16.90;   // hand-off: lime pill wipes off left→right 16.90–17.00 (line 2 one frame later)

// ------------------------------------------------------------------ board + rows
function setFlapText(id,s){const e=$(id).firstElementChild;if(e.textContent!==s)e.textContent=s;}
function board(T,TF,MB){
 const g=bgeo(T);
 const ent=T<.95?60*(1-eo(P(T,.40,.95))):0;
 let sx=0;const fi=Math.round((TF-11.5)*30);if(fi>=0&&fi<6)sx=[6,-6,5,-4,3,-1][fi];   // board shake 11.50 (per frame)
 const drop=800*ei(P(T,16.75,16.95));
 const bd=$('a1_bd');
 bd.style.left=(g.x+sx)+'px';bd.style.top=(g.y+ent+drop)+'px';bd.style.width=g.w+'px';bd.style.height=g.h+'px';
 bd.style.opacity=cl((T-.40)/.12);vis(bd,T>=.40&&TF<16.96);
 for(let i=0;i<4;i++){
  const el=$('a1_r'+i),r=rowRect(g,i);
  let x=r.x+sx,y=r.y+ent,w=r.w,h=r.h;if(i>=2)y+=drop;
  const on=TF>=fq(ROWIN[i])-EPS&&!(i>=2&&TF>=16.96);
  const sc=T<1.2?.9+.1*eb(P(T,ROWIN[i],ROWIN[i]+.22)):1;
  el.style.setProperty('--n',g.n+'px');el.style.setProperty('--ck',g.ck+'px');el.style.setProperty('--f',g.f+'px');el.style.setProperty('--fh',(g.rh-36)+'px');
  // ---- hand-off: the lime row hugs the flying text (a pill), then the pill is wiped off left→right in 3 frames.
  // The row sits above the morph line during the hand-off and carries a navy copy of it, so text inside the pill is
  // navy-on-lime and text the wipe has uncovered is the final white/lime-on-navy (no colour or opacity blends).
  let rowOn=on;
  const mb=MB[i];
  if(mb){const qa=eo(P(T,16.76,16.90)),px=18*mb.s,py=12*mb.s;
   x=lerp(r.x,mb.x-px,qa);y=lerp(r.y,mb.y-py,qa);w=lerp(r.w,mb.w+2*px,qa);h=lerp(r.h,mb.h+2*py,qa);
   const wq=P(T,HW+i/30,HW+i/30+.10),wp=wq*wq*(3-2*wq),cut=w*wp;x+=cut;w-=cut;rowOn=wp<1;}
  el.style.zIndex=mb?13:11;
  if(i<2){const mn=$('a1_mn'+(i+1));DS(mn,!!mb&&rowOn);if(mb&&rowOn)mn.style.transform=`translate(${-x}px,${-y}px) ${mb.tr}`;}
  el.style.left=x+'px';el.style.top=y+'px';el.style.width=w+'px';el.style.height=h+'px';
  el.style.transform=sc!==1?`scale(${sc})`:'none';DS(el,rowOn);
  // ---- base layer: placeholder → typing → ✕ → flap
  const land=LAND(i),baseOn=TF<land+.1-EPS;
  const B=$('a1_b'+i);DS(B,baseOn,'flex');
  const typed=TF>=TY[i]-EPS,crossed=TF>=XT[i]-EPS,flOn=TF>=12.20-EPS;
  V('a1_ph'+i,!typed);
  const n=typed?Math.min(OLD[i].length,Math.floor((TF-TY[i]+EPS)/TYD*OLD[i].length)+1):0;
  const tt=$('a1_t'+i),ts=OLD[i].slice(0,n);if(tt.textContent!==ts)tt.textContent=ts;
  DS($('a1_tw'+i),typed&&TF<12.30-EPS);V('a1_car'+i,typed&&!crossed);
  B.classList.toggle('a1x',crossed);
  // ✕ stamp; on the landing frame the box turns navy with a lime ✓ (pop), before the lime flood reaches it
  const landed=TF>=land-EPS,cx=$('a1_cx'+i),vp=P(T,land,land+.12);vis(cx,crossed);
  $('a1_c'+i).classList.toggle('a1ok',landed);const cs=landed?'✓':'✕';if(cx.textContent!==cs)cx.textContent=cs;
  if(landed)cx.style.transform=`scale(${eb(vp,2.4)})`;
  else if(crossed){const p=P(TF,XT[i],XT[i]+5/30);cx.style.transform=`scale(${1.6-.6*eo(p)})`;}
  // tile "1" blinks lime at 2.2 and 2.6
  if(i===0){const bl=Math.max(...[2.2,2.6].map(t=>T<t?0:T<t+.05?P(T,t,t+.05):1-P(T,t+.05,t+.28)));const nn=$('a1_n0');
   nn.style.background=bl>0?`rgba(183,228,0,${bl})`:'';nn.style.color=bl>0?mix(LIGHT,NAVY,bl):'';nn.style.borderColor=bl>0?mix('#5A6390',LIME,bl):'';}
  // red flash on the row at its ✕ (+ all rows at 11.40)
  let fx=crossed?.55*(1-eo(P(T,XT[i],XT[i]+.35))):0;if(T>=11.4)fx=Math.max(fx,.4*(1-eo(P(T,11.4,11.75))));
  $('a1_fx'+i).style.opacity=baseOn?fx:0;
  // split-flap
  const fl=$('a1_fl'+i);DS(fl,flOn&&baseOn);
  if(flOn&&baseOn){const op=50*(1-eo(P(T,12.20,12.30)));fl.style.clipPath=op>.01?`inset(${op}% -20px ${op}% -20px)`:'none';
   const s0=FSt(i),FT=flt()[i];let cur,nxt,u=-1;
   if(T<s0)cur=nxt=FT[0];else if(T>=s0+3*FLD)cur=nxt=FT[3];
   else{const k=Math.min(2,Math.floor((T-s0)/FLD));u=(T-s0-k*FLD)/FLD;cur=FT[k];nxt=FT[k+1];}
   setFlapText('a1_fbt'+i,nxt);setFlapText('a1_fbb'+i,cur);setFlapText('a1_ffa'+i,cur);setFlapText('a1_ffb'+i,nxt);
   const fa=$('a1_ffa'+i),fb=$('a1_ffb'+i);
   vis(fa,u>=0&&u<.5);vis(fb,u>=.5);
   if(u>=0&&u<.5){const a=ei(u/.5);fa.style.transform=`rotateX(${-90*a}deg)`;fa.lastElementChild.style.opacity=.55*a;}
   if(u>=.5){const a=1-eo((u-.5)/.5);fb.style.transform=`rotateX(${90*a}deg)`;fb.lastElementChild.style.opacity=.45*a;}}
  // ---- lime ✓ layer: left→right flood on landing, ✓ pop, S07 pulses + shine, hand-off
  const vl=$('a1_vl'+i);
  if(TF<land-EPS)vl.style.clipPath='inset(0 100% 0 0)';
  else{const p=eo(P(T,land,land+.10));vl.style.clipPath=p>=1?'none':`inset(0 ${(1-p)*100}% 0 0)`;}
  const vc=$('a1_vc'+i);vc.style.transform=`scale(${T<land?0:eb(vp,2.4)})`;
  // S07 ✓ pulse (0.09 s): the ✓ box swells, its ✓ brightens and the row's lime brightens (background only — text stays navy)
  const vk=$('a1_vk'+i),pp=P(T,PULSE[i]-.02,PULSE[i]-.02+PLD),pk=pp>0&&pp<1&&!mb?Math.sin(Math.PI*pp):0;
  const tk=mb?Math.pow(1-P(T,16.75,16.90),3):1,tkF=mb?Math.pow(1-P(TF,16.75,16.90),3):1;   // outCubic shrink over 4–5 frames
  // hand-off: tile and ✓ box hold their rest position on stage while they shrink, so the contracting pill sweeps over them
  // (riding its fast-moving ends would smear a dark streak across the lime under the motion blur)
  const vn=$('a1_vn'+i);let dk=0,dn=0;
  if(mb){dk=r.x+r.w-20-g.ck-(x+vk.offsetLeft);dn=r.x+20-(x+vn.offsetLeft);}
  vk.style.transform=`${dk?`translateX(${dk}px) `:''}scale(${(1+.22*pk)*tk})`;vn.style.transform=tk<1?`translateX(${dn}px) scale(${tk})`:'none';
  vk.style.visibility=vn.style.visibility=tkF>.05?'':'hidden';   // no specks once they are tiny (restored = inherited)
  vc.style.color=pk>0?mix(LIME,'#E9FF7A',pk):'';vk.style.boxShadow=pk>0?`0 0 ${16*pk}px ${5*pk}px rgba(236,255,140,${.9*pk})`:'';
  vl.style.backgroundColor=pk>0?mix(LIME,'#D4FF2E',pk):'';
  V('a1_vt'+i,!mb);
 }
}

// ------------------------------------------------------------------ vignettes S02–S05
// local x offset that keeps a tag (corner lx,ly rel. to the card centre, height h) ≥12 px inside the left frame edge
const stick=(cx,tx,rot,lx,ly,h)=>{const th=rot*Math.PI/180,c=Math.cos(th),s=Math.sin(th);return Math.max(0,(12-(cx+tx+Math.min(lx*c-ly*s,lx*c-(ly+h)*s)))/c);};
function showVG(id,on,tx,ty,rot,sc=1,op=1){const e=$(id);DS(e,on);if(!on)return;e.style.transform=`translate(${tx}px,${ty}px) rotate(${rot}deg) scale(${sc})`;e.style.opacity=op;}
function vg(T,TF){
 $('a1_vgs').style.clipPath='inset(0 0 1032px 0)';   // vignettes live above the docked board: they rise from behind its top edge (y 888)
 // Leftward exits (honesty tags ≥24 px on screen whenever their vignette is): a card's tag is held ≥12 px inside the
 // frame edge (it slides along its card), and the card is cut on the first frame the tag would no longer fit on it.
 // S02 · post (3.00–5.20)
 {const ex=t=>{const qi=eb(P(t,3.0,3.3),1.3),qo=eio(P(t,5.0,5.2));return [820*(1-qi)-800*qo,3+9*(1-qi)-11*qo];};
  const [tx,rot]=ex(T),[txF,rotF]=ex(TF);
  const on=TF>=3.0-EPS&&TF<5.2-EPS&&stick(540,txF,rotF,-228,167,27)<=230;   // tag (85 px) still clear of the "caixa" block
  showVG('a1_vg1',on,tx,0,rot);
  if(on){$('a1_tag1').style.transform=`translateX(${stick(540,tx,rot,-228,167,27)}px)`;const bh=$('a1_bigh'),p=P(T,3.45,3.70),o=P(T,3.95,4.083);
   const s=p<.6?1.3*eo(p/.6):1.3-.3*eio((p-.6)/.4);
   const so=o<.3?1+.12*eo(o/.3):1.12*(1-Math.pow((o-.3)/.7,2));     // binary pop-out 1→1.12→0, opacity held at 1
   vis(bh,TF>=3.45-EPS&&TF<4.1-EPS&&so>.01);bh.style.transform=`scale(${s*so})`;bh.style.opacity=1;
   HEARTS.forEach((t,k)=>{const e=$('a1_ht'+k),p=P(T,t,t+.9);const hon=TF>=fq(t)-EPS&&p<1;vis(e,hon);if(!hon)return;
    const x=448+44*rnd(k+5)+16*Math.sin(p*6+k),y=318-300*eo(p),s=.4+.6*eb(P(T,t,t+.16));
    e.style.transform=`translate(${x}px,${y}px) rotate(${(rnd(k+9)-.5)*30}deg) scale(${s})`;e.style.opacity=p<.7?1:1-(p-.7)/.3;});}}
 // S03 · report (5.133–7.333)
 {const pi=P(T,V3,V3+.3),qi=eo(pi),qo=eio(P(T,7.2,7.4)),qoF=eio(P(TF,7.2,7.4));   // short rise + overshoot-down pop (1.08→1): tag ≥24 px from the first frame
  const on=TF>=V3-EPS&&TF<7.4-EPS&&stick(540,-900*qoF,-3-8*qoF,-222,140,34)<=160;   // tag (123 px) still clear of the post-it
  showVG('a1_vg2',on,-900*qo,40*(1-qi),-3+6*(1-qi)-8*qo,1.08-.08*eo(P(T,V3,V3+.22)));
  if(on){$('a1_tag2').style.transform=`translateX(${stick(540,-900*qo,-3-8*qo,-222,140,34)}px)`;
   [0,1,2].forEach(j=>{const p=P(T,5.55+.2*j,5.75+.2*j),pg=$('a1_pg'+j);vis(pg,p<1);pg.style.transform=`rotateY(${-180*eio(p)}deg)`;$('a1_pgs'+j).style.opacity=Math.sin(Math.PI*Math.min(p*2,1))*.8;});
   vis($('a1_pg3'),true);
   [0,1,2].forEach(k=>{$('a1_bar'+k).style.transform=`scaleY(${.08+.92*eb(P(T,5.58+.05*k,5.86+.05*k),1.4)})`;});
   $('a1_spl').style.strokeDashoffset=100*(1-eio(P(T,5.78,6.02)));
   const se=$('a1_seal'),sp=P(T,6.05,6.27);vis(se,TF>=6.05-EPS);se.style.transform=`rotate(${13+8*(1-eo(sp))}deg) scale(${eb(sp,2.6)})`;
   $('a1_glint').style.transform=`translateX(${-60+260*eio(P(T,6.15,6.55))}px) skewX(-20deg)`;
   const po=$('a1_postit'),pq=P(TF,6.30,6.30+4/30);vis(po,TF>=6.30-EPS);po.style.transform=`rotate(${-5-6*(1-eo(pq))}deg) scale(${1.32-.32*eo(pq)})`;}}
 // S04 · conveyor (7.333–9.533)
 {const on=TF>=V4-EPS&&TF<V5-EPS;   // cut once the last box has left (only a belt end would remain)
  const qo=eio(P(T,9.4,9.6)),bin=1300*(1-eo(P(T,V4-1/60,V4-1/60+.22)));   // belt/press slide in from the opening of the cut frame's shutter, so 7.333 already shows the belt entering
  // tag (103 px wide): rides in with the belt, pinned ≥12 px inside the right edge (x ≤965) so it is fully visible from the
  // first S04 frame, travels to x 170; leaves last (held ≥12 px inside the left edge)
  showVG('a1_vg3',on,-1300*qo,0,0);$('a1_tag3').style.transform=`translateX(${Math.min(bin,965-170)+Math.max(0,12-(170-1300*qo))}px)`;
  if(on){
   const cp=P(T,7.36,7.66),cap=$('a1_cap3');cap.style.transform=`translateY(${(1-eo(cp))*54}px)`;vis(cap,(1-eo(P(TF,7.36,7.66)))*54<24);
   // indexing conveyor: boxes (spacing 200) step in and stop under the press; the belt chevrons move with the boxes
   const O=640*eio(P(T,7.38,7.82))+BSP*eio(P(T,8.05,8.29))+BSP*eio(P(T,8.45,8.69));
   const belt=$('a1_belt');belt.style.transform=`translateX(${bin}px)`;belt.style.backgroundPosition=`${O%40}px 0`;
   // press: 0.12 s downstroke ending ON the hit frame with the head bottom (584+56) on the box top (640); the head then
   // rides the squashing box down for one more frame (2 contact frames) and returns in 0.15 s
   const sqf=H=>1-.07*Math.sin(Math.PI*P(T,H,H+.14));          // box squash starts on the contact frame
   let ty=0;HITS.forEach(H=>{const t1=H+1/30;
    if(T>=H-.12&&T<H)ty=56*ei(P(T,H-.12,H));
    else if(T>=H&&T<=t1)ty=56+150*(1-sqf(H));
    else if(T>t1&&T<t1+.15)ty=(56+150*.07*Math.sin(Math.PI*(1/30)/.14))*(1-eo(P(T,t1,t1+.15)));});
   $('a1_press').style.transform=`translateX(${bin}px)`;vis($('a1_tag3'),true);
   $('a1_head').style.transform=`translateY(${ty}px)`;$('a1_rod').style.height=(18+ty)+'px';
   [0,1,2].forEach(k=>{const cxk=-100-BSP*k+O,b=$('a1_bx'+k),H=HITS[k];
    const sq=sqf(H);
    b.style.transform=`translateX(${cxk-85}px) scaleY(${sq}) scaleX(${2-sq})`;
    const st=$('a1_bst'+k),hp=P(TF,H,H+4/30);vis(st,TF>=H-EPS);st.style.transform=`translateX(-50%) rotate(-6deg) scale(${1.4-.4*eo(hp)})`;});
   const hitOn=HITS.find(H=>TF>=H-EPS&&TF<H+.1-EPS);
   [0,1,2,3].forEach(k=>{const e=$('a1_imp'+k);vis(e,!!hitOn);if(!hitOn)return;const p=P(TF,hitOn,hitOn+.1),side=k<2?-1:1,ang=side<0?[200,160][k%2]:[-20,20][k%2];
    const x=side<0?462:618,y=634+(k%2?6:-6);e.style.transform=`translate(${x}px,${y}px) rotate(${ang}deg) translateX(${6+18*eo(p)}px) scaleX(${1-.6*p})`;});}}
 // S05 · transfer (9.533–11.90)
 {const on=TF>=V5-EPS&&TF<11.833-EPS;    // from 11.833 the right-hand tag is off-frame: only 30 px of empty card padding would remain
  const pi=P(T,V5,V5+.3),qo=eio(P(T,11.7,11.9));               // rise + overshoot-down pop (1.08→1), no fade: tag ≥24 px throughout
  showVG('a1_vg4',on,-1000*qo,40*(1-eo(pi)),0,1.08-.08*eo(P(T,V5,V5+.22)),1);
  if(on){
   const sg=$('a1_sig'),sp=P(T,10.0,10.2);vis(sg,TF>=10.0-EPS);sg.style.transform=`scale(${eb(sp,2.4)})`;
   $('a1_arr').style.clipPath=`inset(0 ${(1-eo(P(T,10.25,10.55)))*100}% 0 0)`;
   const fo=$('a1_fold'),fq2=eio(P(T,10.30,10.70)),fon=TF>=10.30-EPS&&T<10.80;vis(fo,fon);
   if(fon){const x=lerp(150,535,fq2),y=175-46*Math.sin(Math.PI*fq2),s=Math.min(eb(P(T,10.30,10.40)),1)*(1+.18*Math.sin(Math.PI*fq2))*(1-eio(P(T,10.70,10.80)));
    fo.style.transform=`translate(${x}px,${y}px) rotate(${-8+16*fq2}deg) scale(${s})`;}
   $('a1_face2').style.transform=`scale(${1+.08*Math.sin(Math.PI*P(T,10.70,10.86))})`;
   const tx=$('a1_trx');vis(tx,TF>=10.70-EPS);tx.style.transform=`translateY(${12*(1-eo(P(T,10.70,10.85)))}px)`;
   vis($('a1_trbar'),TF>=10.70-EPS);$('a1_trfill').style.width=(68*eo(P(T,10.74,11.35)))+'%';
   $('a1_spin').style.transform=`rotate(${(T-10.7)*420}deg)`;}}
}

// ------------------------------------------------------------------ Pedro (T4 rig behind the board), sparks, flash
function pedro(T,TF){
 const on=TF>=14.55-EPS&&TF<16.75-EPS;$('a1_rig').style.display=on?'block':'none';
 if(on){let ty,hk;
  if(T<15.15){const p=P(T,14.55,15.15);ty=440*(1-eo(p));hk=eo(p);}
  else if(T<16.45){ty=3*(1-Math.cos(2*Math.PI*(T-15.15)/.5));hk=1;}
  else{const b=3*(1-Math.cos(2*Math.PI*1.3/.5));ty=b+(460-b)*ei(P(T,16.45,16.75));hk=1-eo(P(T,16.45,16.70));}
  rigSet('a1_rig',ty,hk);}
 // lime sparks at both fists (15.00)
 for(let k=0;k<16;k++){const f=k>>3,j=k&7,t0=15,p=P(T,t0,t0+.38),e=$('a1_sp'+k);
  const sOn=T>=t0&&p<1;vis(e,sOn);if(!sOn)continue;
  const ang=j*45-67.5+(rnd(k+31)-.5)*16,up=Math.max(0,-Math.sin(ang*Math.PI/180));       // no streak points straight up (headline above)
  const cx=f?708:375,cy=506,r=(20+(52+26*rnd(k+57))*eo(p))*(1-.25*up),len=(1-p)*.9+.15;
  e.style.transform=`translate(${cx}px,${cy}px) rotate(${ang}deg) translateX(${r}px) scaleX(${len})`;e.style.opacity=p<.55?1:1-(p-.55)/.45;}
 const fp=P(T,13.5,13.8),fl=$('a1_flash');
 fl.style.opacity=fp<=0||fp>=1?0:fp<.2?.6*(fp/.2):.6*(1-eo((fp-.2)/.8));fl.style.transform=`scale(${.8+.3*eo(fp)})`;
}

ACTS.push({id:'A1',t0:0,t1:17.20,z:1,bg:false,html:HTML,
 init(){
  // ---- SFX (cue frames = the frames where the visuals hit; fc = first frame at/after a continuous event start)
  const fc=t=>Math.ceil(t*30-1e-6)/30;
  S(0,'stamp',1);S(0,'impact',.8);
  S(fq(.25),'typing',.5,0,.3);
  ROWIN.forEach((t,i)=>S(fq(t),'click',.65,0,i));
  S(fq(2.2),'tick',.35);S(fq(2.6),'tick',.35);
  S(2.80,'swoosh',.55);
  S(3.0,'swoosh',.8,.35);S(fq(3.40),'tap',.55);S(fq(3.45),'tap',.7);S(fq(3.45),'heart',1);
  HEARTS.forEach((t,k)=>S(fq(t),'plink',.3+.03*k,.35+.3*rnd(k+5)));
  S(TY[0],'typing',.9,0,TYD);S(XT[0],'buzz',1);S(XT[0],'thock',.55);
  S(5.0,'whoosh',.7,-.35);
  S(V3,'paper',.9);S(fq(5.55),'pages',.9,0,.6);S(fq(6.05),'shimmer',.8,.3);S(fq(6.05),'pop',.55,.3,5);S(6.30,'postit',1,.2);
  S(TY[1],'typing',.9,0,TYD);S(XT[1],'buzz',1);S(XT[1],'thock',.55);
  S(7.2,'whoosh',.7,-.35);
  S(V4,'swoosh',.6,.35);[[7.38,.44],[8.05,.24],[8.45,.24]].forEach(([t,d])=>S(fc(t),'belt',.6,0,d));HITS.forEach(H=>S(H,'press',1));   // belt hum only while it moves
  S(TY[2],'typing',.9,0,TYD);S(XT[2],'buzz',1);S(XT[2],'thock',.55);
  S(9.4,'whoosh',.7,-.35);
  S(V5,'swoosh',.45);S(10.0,'pop',.55,-.25,3);S(fq(10.30),'swipe',.45,0,.4);S(10.7,'blip',.85);S(10.7,'spinner',.4,0,1.0);
  S(TY[3],'typing',.9,0,TYD);S(XT[3],'buzz',1);S(XT[3],'thock',.6);S(11.5,'slam',.5);
  S(11.7,'whoosh',.6,-.35);
  // S06: one Solari clack per flip (when the falling half lands), riser to the drop, ding on the 4th ✓, crack + fall
  for(let i=0;i<4;i++)for(let k=1;k<=3;k++)S(fc(FSt(i)+k*FLD),'clack',k===3?.8:.6,-.3+.2*i);
  S(fq(FL0),'riser',.7,0,1.25);
  S(fc(LAND(3)),'chime',1);
  S(13.2,'crack',1);S(fq(13.25),'fall',.9);
  // S07
  S(14.2,'swoosh',.45);S(fq(14.55),'whoosh',.8);
  S(15.0,'sparkle',.9,-.4);S(15.0,'sparkle',.8,.4);
  PULSE.forEach(t=>S(t,'tick',.7));
  S(fc(16.45),'swoosh',.45);S(fc(16.75),'swipe',.7,0,.35);
  // ---- motion blur windows
  BLUR.push([0,.26,8],[2.80,3.12,24],[3.0,3.32,32],[3.45,3.72,12],[3.94,4.11,8],[4.8,4.97,8],[5.0,5.52,32],[5.55,6.17,12],[6.05,6.44,12],[7.0,7.17,8],
   [7.2,7.68,32],[7.68,8.96,16],[9.2,9.37,8],[9.4,9.92,32],[10.0,10.8,8],[11.4,11.72,12],[11.7,12.3,24],[12.3,13.2,12],[13.2,13.9,24],
   [13.9,14.12,8],[14.2,14.56,16],[14.56,15.16,16],[15.0,15.42,8],[16.45,17.15,32]);
 },
 render(T,TF){
  const w=$('a1_world');
  if(TF>=17.15-EPS){w.style.display='none';return;}     // from 17.15 A2 owns the (identical) headline
  w.style.display='block';
  let cx=0,cy=0;const fi=Math.round(TF*30);if(fi<8){const d=6*(1-fi/8);cx=d*Math.sin(fi*2.4+.6);cy=d*.6*Math.cos(fi*1.7);}   // camera shake on the stamp
  w.style.transform=fi<8?`translate(${cx}px,${cy}px)`:'none';
  heads(T,TF);
  const MB=[morph(T,TF,0),morph(T,TF,1),null,null];
  board(T,TF,MB);
  vg(T,TF);
  pedro(T,TF);
 }
});
})();

// integrator: hero hit for the music drop (lime flash at 13.50)
S(13.5,'impact',.9);
