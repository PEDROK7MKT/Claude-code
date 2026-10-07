// A2 · S08–S11 (16.75–31.85): the three receipts (real Google prints with lime / red marks), Pedro presented with the
// hero-present T4 rig holding the two tiles (S10, the only hero-present), and the Google summary + kinetic
// INCENTIVO / + PERSONALIZAÇÃO (S11). Entry: A1 morphs board rows 1–2 into our first headline (we own it from 17.15).
// Exit: A3 slash-wipes over us at 31.55–31.85 (registered by A3); our last S11 frame simply holds.
(()=>{
const ss=q=>{q=cl(q);return q*q*(3-2*q);};                 // highlighter / pen stroke ease (smoothstep)
const fc=t=>Math.ceil(t*30-1e-6)/30;                       // first frame at/after a continuous event start
const fm=t=>(Math.floor((t-1/60)*30+1e-6)+1)/30;            // first frame showing a stroke that starts at t (strokes lead by half a frame; visible once p>0)
const vis=(e,on)=>{e.style.visibility=on?'visible':'hidden';};

// ------------------------------------------------------------------ the four print cards (marks in source px, from the storyboard)
const C1=recibo('a2_c1',160,462,760,'doc4.jpg',[24,437,700,815],
 [['L',63,446,580,488],                                                                    // lime 1  "Foco em Vendas e Resultados"
  ['U',35,644,511,649],['U',34,688,215,693],['U',443,688,680,693],['U',34,731,170,736],    // red ×4 "métricas de vaidade… / relatórios mensais complexos"
  ['L',236,737,584,776],['L',28,780,131,814]],{style:'z-index:8'});                        // lime 2  "gargalo do seu negócio: / faturar"
const C2=recibo('a2_c2',160,462,760,'doc1.jpg',[20,944,660,1198],
 [['U',65,1029,535,1034],['U',66,1069,336,1074],                                            // red  "o formato tradicional… / pacotes padronizados"
  ['L',59,1077,515,1111],['L',59,1115,228,1152]],{style:'z-index:8'});                     // lime "equipas sob demanda formadas por / especialistas"
const C3=recibo('a2_c3',160,890,760,'doc4.jpg',[24,1022,700,1244],
 [['L',298,1157,541,1196],['L',28,1201,390,1240],                                           // lime "Na PK7, você fala / diretamente com o Pedro"
  ['U',32,1195,285,1200]],{style:'z-index:8'});                                            // red  "júnior ou estagiário"
const C4=recibo('a2_c4',160,470,760,'doc4.jpg',[24,14,700,240],
 [['L',29,152,642,192],['L',28,197,149,236]],{style:'z-index:8'});                         // lime "modelo de incentivo e à personalização do / serviço."
const M1=C1.marks,M2=C2.marks,M3=C3.marks,M4=C4.marks;

const LEG=(id,top)=>`<div class="a legend a2lg" id="${id}" style="top:${top}px"><span><b style="background:var(--loss)"></b>VÍCIOS DAS AGÊNCIAS</span><span><b style="background:var(--lime)"></b>DIFERENCIAL PK7</span></div>`;
const CHIPS=[['TRÁFEGO',336,925,197],['SEO/GEO',553,925,191],['IDENTIDADE VISUAL',224,1005,356],['AUTOMAÇÃO',600,1005,255]];   // storyboard rects (x, y, w): gaps 20, both rows centred on x 540
const IC1='<svg viewBox="0 0 24 24" fill="none" stroke="#0A0F2C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
const IC2='<svg viewBox="0 0 24 24" fill="none" stroke="#0A0F2C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 10h.01M12 10h.01M15 10h.01" stroke-width="3.2"/></svg>';
// tiles ride inside the rig's mover (rigid with the avatar); they cover the cut hands (source cols x=0/511, y 185–263)
const TILES=`<div class="tile" id="a2_tl" style="left:214px;top:556px;width:200px;height:200px"><div class="ic">${IC1}</div><div><b>TRÁFEGO</b><small>META + GOOGLE</small></div></div>
 <div class="tile" id="a2_tr" style="left:666px;top:556px;width:200px;height:200px"><div class="ic">${IC2}</div><div><b>AUTOMAÇÃO</b><small>IA NO WHATSAPP</small></div></div>`;

// ------------------------------------------------------------------ timing (storyboard §5)
const R1=[16.95,17.35];                       // receipt 1 rises (y +520→0, rot 2°→0)
const LIME1=[17.40,17.95],PUL1=17.95,LEG1=18.10,RED1=18.10,RED1D=.17,LIME2=[19.25,19.85],PUL2=19.85;
const PUSH1=[19.85,20.80];
// whip-pan = ONE camera move: both cards ride the same offset X(T) (card 2 sits PAND px to the right of card 1), with a
// velocity-continuous ease (power-4 in to the peak at ~20.975, power-4 out), so the pan never drops speed or shows a gap
const PAN=[20.80,21.35],PANM=.32,PANN=4,PAND=950;
const pan=T=>{const u=P(T,PAN[0],PAN[1]);return PAND*(u<PANM?PANM*Math.pow(u/PANM,PANN):1-(1-PANM)*Math.pow(1-(u-PANM)/(1-PANM),PANN));};
// receipt hand-offs share R1→R2's grammar: the outgoing card whips out LEFT (core whipOutL: -1150·inOutCubic) while the
// incoming one is already rising from below, so every frame holds a card in the safe zone or the outgoing whip smear
// (inOutCubic has the card fully past x 0 ≈60% into the whip, so the rise starts early enough to be ≥50% above y 1230 by then)
const LEG2=21.50,RED2=[21.50,22.20],LIME3=[22.30,23.00],PUL3=23.00,CH0=23.00,CHS=.12,CHD=.17,DROP2=[24.15,24.40];
const R3=[24.20,24.55],RISE=[24.75,25.40],TROT=[25.15,25.55],TROT2=25.1833,PILL=[761/30,25.60],LIME4=[25.60,26.40],PUL5=26.40,
      RED3=[26.80,27.20],PAR=[27.30,28.40],TUP=[28.40,28.50],DIVE=[28.45,862/30],OUT3=[862/30,28.90];  // card 3 whips only once the rig is fully below its clip (DIVE end), so the occluder never slides off a visible rig edge
const R4=[863/30,874/30],R4D=1060,LIME5=[29.40,30.20],INC=30.25,PER=30.55,PUSH4=[30.80,31.85];   // R4 rises while card 3 whips out (same .367 s rise)
// headline swaps: the outgoing lines drop out (bottom first), the new ones mask in as soon as they are gone (0.3 s, 0.08 s apart)
const SW=[20.90,24.30,28.70];

const HTML=`
${HL('a2_h1',262,76,'<span class="L" id="a2_k1">✓</span> QUER <span class="L">VENDA</span>','z-index:20;visibility:hidden')}
${HL('a2_h2',350,76,'<span class="L" id="a2_k2">✓</span> QUER <span class="L">FATURAR</span>','z-index:20;visibility:hidden')}
${HL('a2_h3',262,76,'<span class="L" id="a2_k3">✓</span> QUER TIME','z-index:20')}
${HL('a2_h4',350,76,'<span class="L">SOB MEDIDA</span>','z-index:20')}
${HL('a2_h5',262,76,'<span class="L" id="a2_k5">✓</span> QUER FALAR','z-index:20')}
${HL('a2_h6',350,76,'<span class="L">COM O PEDRO</span>','z-index:20')}
${HL('a2_h7',262,76,'O RESUMO DA','z-index:20')}
${HL('a2_h8',350,76,'<span class="L">IA DO GOOGLE:</span>','z-index:20')}
<div class="a2gl" id="a2_gl" style="z-index:19;display:none"></div>
<div class="a2w" id="a2_g1" style="z-index:8;transform-origin:540px 712px;display:none">${C1.html}${LEG('a2_lg1',Math.round(C1.bottom)+18)}</div>
<div class="a2w" id="a2_g2" style="z-index:8;display:none">${C2.html}${LEG('a2_lg2',Math.round(C2.bottom)+18)}
 ${CHIPS.map(([t,x,y,w],i)=>`<div class="chip a2chip" id="a2_ch${i}" style="left:${x}px;top:${y}px;width:${w}px">${t}</div>`).join('')}</div>
<div class="a2w" id="a2_g3" style="display:none">
 ${rigHTML({id:'a2_rig',pose:'hero-present',x:260,y:402,w:560,clip:945,occ:870,halo:{x:240,y:340,size:600},tiles:TILES,z:5})}
 <div class="a2w" id="a2_c3w" style="z-index:8;transform-origin:540px 1058px">${C3.html}<div class="a2pill cap" id="a2_pill" style="z-index:9">PEDRO R GOMES · FUNDADOR DA PK7</div></div>
</div>
<div class="a2w" id="a2_g4" style="z-index:8;transform-origin:540px 760px;display:none">
 <div class="a2w" id="a2_kc1" style="z-index:9;clip-path:inset(811px 0 0 0)"><div class="a2kt H" id="a2_inc" style="top:850px;font-size:110px;line-height:110px"><span class="L">INCENTIVO</span></div></div>
 <div class="a2w" id="a2_kc2" style="z-index:9;clip-path:inset(964px 0 0 0)"><div class="a2kt H" id="a2_per" style="top:980px;font-size:72px;line-height:72px">+ PERSONALIZAÇÃO</div></div>
 <div class="a2w" style="z-index:8">${C4.html}</div>
</div>`;

// ------------------------------------------------------------------ helpers
function mark(m,q){const e=$(m.id);vis(e,q>0);e.style.transform=`scaleX(${ss(q)})`;}
// strokes lead by half a frame so their first pixels land on the cue frame (a start on the grid would otherwise show p=0)
const ML=1/60,PM=(T,a,b)=>P(T,a-ML,b-ML);
// sequential sweep over several marks, time split by mark width (one continuous gesture line after line)
function sweep(ms,t0,t1,T){const tot=ms.reduce((a,m)=>a+m.W,0);let t=t0;for(const m of ms){const d=(t1-t0)*m.W/tot;mark(m,PM(T,t,t+d));t+=d;}}
// ✓ pulse 1→1.2 (2 frames) →1; inline-block only while pulsing (A1's hand-off markup is inline). The lime glow is a
// separate radial blob (a2_gl, z 19, outside the .ln line mask so it is never clipped); the glyph keeps only a tight
// ≤8 px text-shadow that fits inside the mask's .14em side padding. Pulses never overlap, so one glow element is shared.
function pulse(id,t,T,TF){const e=$(id),on=TF>=fq(t)-EPS&&TF<t+.42;
 if(!on){e.style.display='';e.style.transform='';e.style.textShadow='';return false;}
 const d=Math.max(0,T-t),k=d<.06?eo(d/.06):1-eo(cl((d-.06)/.34)),s=1+.2*k;
 e.style.display='inline-block';e.style.transform=`scale(${s})`;e.style.textShadow=`0 0 ${(8*k).toFixed(2)}px rgba(183,228,0,${(.7*k).toFixed(3)})`;
 // glyph centre in stage px from layout offsets (transform-independent)
 let x=e.offsetWidth/2,y=e.offsetHeight/2,n=e;while(n&&n.id!=='A2'){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}
 const g=$('a2_gl');g.style.display='block';g.style.left=(x-GLR).toFixed(1)+'px';g.style.top=(y-GLR).toFixed(1)+'px';
 g.style.opacity=(.95*k).toFixed(3);g.style.transform=`scale(${(.75+.25*k).toFixed(4)})`;return true;}
const GLR=78;   // glow radius (px)
// pop 0→1.1→1 (binary visibility)
function popS(p){if(p<=0)return 0;return p<.6?1.1*eo(p/.6):1.1-.1*eio((p-.6)/.4);}
function legend(id,t,T,TF){const e=$(id),on=TF>=fq(t)-EPS;vis(e,on);const p=P(T,t,t+.22);
 e.style.transform=on&&p<1?`scale(${(.6+.4*eb(p,2)).toFixed(4)})`:'none';}

ACTS.push({id:'A2',t0:16.75,t1:31.85,z:2,bg:false,html:HTML,
 init(){
  // ---- headline swaps (masked line rise/drop, bottom line out first)
  const ids=[['a2_h1','a2_h2'],['a2_h3','a2_h4'],['a2_h5','a2_h6'],['a2_h7','a2_h8']];
  SW.forEach((t,k)=>{const [o1,o2]=ids[k],[n1,n2]=ids[k+1];
   linOut(o2,t,.2);linOut(o1,t+.03,.2);const tin=linEnd(o1,t+.03,.2);
   lin(n1,tin,.3);lin(n2,tin+.08,.3);});

  // ---- SFX (on the frames where the visuals hit)
  S(fc(R1[0]),'whoosh',.7,.2);                                  // receipt 1 rises
  S(fm(LIME1[0]),'marker',.8,0,LIME1[1]-LIME1[0]);              // lime 1
  S(fc(PUL1),'tick',.7);                                        // ✓ line 1 pulse
  for(let i=0;i<4;i++)S(fm(RED1+RED1D*i),'pen',.85,-.15+.1*i,RED1D);   // 4 red underlines
  S(fm(LIME2[0]),'marker',.8,0,LIME2[1]-LIME2[0]);              // lime 2
  S(fc(PUL2),'tick',.7);                                        // ✓ line 2 pulse
  S(fc(PAN[0]),'whoosh',.95,-.3);                              // whip-pan to receipt 2
  {const w=M2.slice(0,2),tot=w[0].W+w[1].W,d0=(RED2[1]-RED2[0])*w[0].W/tot;
   S(fm(RED2[0]),'pen',.85,0,d0);S(fm(RED2[0]+d0),'pen',.75,0,RED2[1]-RED2[0]-d0);}   // red (2 strokes)
  S(fm(LIME3[0]),'marker',.8,0,LIME3[1]-LIME3[0]);              // lime
  // (no tick on the 23.00 ✓ pulse: chip 1's snap lands on the same frame and carries the beat)
  for(let i=0;i<4;i++)S(fq(CH0+CHS*i),'snap',.8,[-.25,.25,-.2,.2][i],i);   // 4 chips snap in, rising pitch
  S(fc(DROP2[0]),'whoosh',.95,-.3);                            // everything whips out left (like the PAN)
  S(fc(R3[0]),'swoosh',.4,.2);                                  // receipt 3 rises
  S(fc(RISE[0]),'whoosh',.8);                                   // Pedro rises
  S(fc(TROT[0]),'click',.6,-.4,1);S(fc(TROT2),'click',.6,.4,3); // the two tiles open
  S(PILL[0],'slap',.8);                                         // name pill slaps onto the card edge
  S(fm(LIME4[0]),'marker',.8,0,LIME4[1]-LIME4[0]);              // lime
  S(fc(PUL5),'tick',.55);                                       // ✓ pulse
  S(fm(RED3[0]),'pen',.85,0,RED3[1]-RED3[0]);                   // red
  S(fc(DIVE[0]),'swipe',.45,0,.3);                              // Pedro dives
  S(fc(R4[0]),'swipe',.6,.2,.3);                                // receipt 4 swish
  S(fm(LIME5[0]),'marker',.85,0,LIME5[1]-LIME5[0]);             // long lime swipe
  S(fc(INC),'thock',.7);S(fc(PER),'thock',.55);                 // 2 soft low hits on the words

  // ---- motion blur on the fast moves
  BLUR.push([16.95,17.36,16],[17.95,18.05,8],[18.10,18.33,8],[20.80,21.36,32],[21.36,21.42,12],[21.50,21.73,8],
   [23.0,23.55,8],[24.15,24.42,32],[24.42,24.78,24],[24.78,25.42,16],[25.42,25.62,8],
   [28.40,28.73,24],[28.73,28.92,32],[28.92,29.22,24],[29.22,29.26,12],[30.23,30.6,16],[30.53,30.9,16]);
 },
 render(T,TF){
  // ---------------- headlines: first pair is A1's morph target — ours from 17.15 (A1 hides at the same frame)
  const h12=TF>=17.15-EPS;$('a2_h1').style.visibility=h12?'visible':'hidden';$('a2_h2').style.visibility=h12?'visible':'hidden';
  const gOn=[pulse('a2_k1',PUL1,T,TF),pulse('a2_k2',PUL2,T,TF),pulse('a2_k3',PUL3,T,TF),pulse('a2_k5',PUL5,T,TF)].some(Boolean);
  if(!gOn)$('a2_gl').style.display='none';

  // ---------------- S08 · receipt 1
  const g1=$('a2_g1'),on1=TF>=fq(R1[0])-EPS&&TF<PAN[1]-EPS;g1.style.display=on1?'block':'none';
  if(on1){
   const p=P(T,R1[0],R1[1]),q=eo(p);
   $('a2_c1').style.transform=p<1?`translateY(${(520*(1-q)).toFixed(2)}px) rotate(${(2*(1-q)).toFixed(3)}deg)`:'none';
   const k=1+.03*eio(P(T,PUSH1[0],PUSH1[1])),dx=-pan(T);
   g1.style.transform=k===1&&dx===0?'none':`translate(${dx.toFixed(2)}px,0) scale(${k.toFixed(5)})`;
   mark(M1[0],PM(T,LIME1[0],LIME1[1]));
   for(let i=0;i<4;i++)mark(M1[1+i],PM(T,RED1+RED1D*i,RED1+RED1D*(i+1)));
   sweep(M1.slice(5,7),LIME2[0],LIME2[1],T);
   legend('a2_lg1',LEG1,T,TF);
  }

  // ---------------- S09 · receipt 2 + chips
  const g2=$('a2_g2'),on2=TF>=fq(PAN[0])-EPS&&TF<DROP2[1]-EPS;g2.style.display=on2?'block':'none';
  if(on2){
   const dx=PAND-pan(T),wx=-1150*eio(P(T,DROP2[0],DROP2[1]));   // card + legend + chips whip out left together
   $('a2_c2').style.transform=dx>0?`translateX(${dx.toFixed(2)}px)`:'none';
   g2.style.transform=wx<0?`translateX(${wx.toFixed(2)}px)`:'none';
   sweep(M2.slice(0,2),RED2[0],RED2[1],T);
   sweep(M2.slice(2,4),LIME3[0],LIME3[1],T);
   legend('a2_lg2',LEG2,T,TF);
   for(let i=0;i<4;i++){const e=$('a2_ch'+i),t=fq(CH0+CHS*i),s=popS(P(T,t-1/30,t-1/30+CHD));vis(e,TF>=t-EPS);e.style.transform=`scale(${s.toFixed(4)})`;}
  }

  // ---------------- S10 · receipt 3 + Pedro (hero-present T4 rig, tiles cover the cut hands)
  const g3=$('a2_g3'),on3=TF>=R3[0]-EPS&&TF<OUT3[1]-EPS;g3.style.display=on3?'block':'none';
  if(on3){
   const p=P(T,R3[0],R3[1]),q=eo(p),dy=700*(1-q),wx=-1150*eio(P(T,OUT3[0],OUT3[1])),rot=2*(1-q);   // rise, then whip out left
   $('a2_c3w').style.transform=dy>0||rot>0||wx<0?`translate(${wx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`:'none';
   // name pill: slaps onto the card's top edge 1.25 → 1 (outBack, tiny undershoot)
   const pl=$('a2_pill'),pOn=TF>=PILL[0]-EPS;vis(pl,pOn);
   const pp=P(T,PILL[0],PILL[1]);pl.style.transform=pOn&&pp<1?`scale(${(1.25-.25*eb(pp,1.6)).toFixed(4)})`:'none';
   sweep(M3.slice(0,2),LIME4[0],LIME4[1],T);
   mark(M3[2],PM(T,RED3[0],RED3[1]));
   // rig: rise (outCubic, no overshoot) → breathing (ty 0…+6, only downward) → dive (inCubic)
   const rg=$('a2_rig'),rOn=TF>=fq(RISE[0])-EPS&&TF<DIVE[1]+.05;rg.style.display=rOn?'block':'none';
   if(rOn){
    const br=t=>3*(1-Math.cos(2*Math.PI*Math.max(0,t-RISE[1])/1.5));
    let ty,hk;
    if(T<RISE[1]){const r=P(T,RISE[0],RISE[1]);ty=560*(1-eo(r));hk=eo(r);}
    else if(T<DIVE[0]){ty=br(T);hk=1;}
    else{const b=br(DIVE[0]);ty=b+(560-b)*ei(P(T,DIVE[0],DIVE[1]));hk=1-eo(P(T,DIVE[0],DIVE[0]+.25));}
    rigSet('a2_rig',ty,hk);
    // tiles: upright while crossing the card edge, then open to ∓5° (outBack 2.6); micro-parallax; upright again before the dive
    const up=1-eio(P(T,TUP[0],TUP[1]));
    const rl=-5*eb(P(T,TROT[0],TROT[1]),2.6)*up,rr=5*eb(P(T,TROT2,TROT[1]),2.6)*up;
    const pe=Math.sin(Math.PI*P(T,PAR[0],PAR[1])),ph=2*Math.PI*(T-PAR[0])/1.1;
    const lx=2.5*pe*Math.sin(ph),ly=2*pe*Math.sin(ph*.5+1),rx=-2.5*pe*Math.sin(ph+.8),ry=2*pe*Math.sin(ph*.5+2.2);
    $('a2_tl').style.transform=`translate(${lx.toFixed(2)}px,${ly.toFixed(2)}px) rotate(${rl.toFixed(3)}deg)`;
    $('a2_tr').style.transform=`translate(${rx.toFixed(2)}px,${ry.toFixed(2)}px) rotate(${rr.toFixed(3)}deg)`;
   }
  }

  // ---------------- S11 · Google summary + kinetic INCENTIVO / + PERSONALIZAÇÃO (holds until A3's slash covers it)
  const g4=$('a2_g4'),on4=TF>=fq(R4[0])-EPS;g4.style.display=on4?'block':'none';
  if(on4){
   const p=P(T,R4[0],R4[1]),q=eo(p);
   $('a2_c4').style.transform=p<1?`translateY(${(R4D*(1-q)).toFixed(2)}px) rotate(${(2*(1-q)).toFixed(3)}deg)`:'none';
   sweep(M4,LIME5[0],LIME5[1],T);
   const k=1+.015*eio(P(T,PUSH4[0],PUSH4[1]));g4.style.transform=k>1?`scale(${k.toFixed(5)})`:'none';
   // the words slide down out from behind the card's bottom edge / from under INCENTIVO (clip-path masks)
   const i0=fc(INC)-1/30,p0=fc(PER)-1/30,a=P(T,i0,i0+.36),b=P(T,p0,p0+.36),ie=$('a2_inc'),pe=$('a2_per');
   vis(ie,TF>=fc(INC)-EPS);vis(pe,TF>=fc(PER)-EPS);
   ie.style.transform=`translateY(${(-175*(1-eb(a,1.5))).toFixed(2)}px)`;
   pe.style.transform=`translateY(${(-110*(1-eb(b,1.5))).toFixed(2)}px)`;
  }
 }
});
})();
