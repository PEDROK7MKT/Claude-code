// A3 · S12–S13 (31.55–45.60): PROVA, NÃO PROMESSA (Appmax plaque polaroid + R$ 100 MIL column, the separate HOJE
// +R$ 500 MIL card counting from 0, the whip-scroll to +40 / 3 continentes / 7 logos), then the hard cut to the CTA:
// AINDA TÁ AQUI? → the 4 red lines → ENTÃO VOCÊ NÃO É / NENHUM DOS 4. → lime slash cuts the lines → T3 seal (pose-point)
// slap-on → Google quote sticker → unsent suggested message → WhatsApp button → footer → hold to 45.6.
// Entry: core slash wipe (registered here) reveals us right-to-left over A2 during 31.55–31.85.
(()=>{
const vis=(e,on)=>{e.style.visibility=on?'visible':'hidden';};
const DS=(e,on,d='block')=>{e.style.display=on?d:'none';};
const fc=t=>Math.ceil(t*30-1e-6)/30;                 // first frame at/after a continuous start
const at=(TF,t)=>TF>=fc(t)-EPS;                       // discrete "has started" (frame grid)
const popS=p=>p<=0?0:(p<.6?1.1*eo(p/.6):1.1-.1*eio((p-.6)/.4));   // 0 → 1.1 → 1
const f2=v=>(+v).toFixed(2),f4=v=>(+v).toFixed(4);
const AD=VAR==='ad';
const setMask=(e,m)=>{e.style.maskImage=m;e.style.webkitMaskImage=m;};

// ------------------------------------------------------------------ timing (storyboard §5, S12–S13)
const H1=31.68,H2=31.75;                              // PROVA, / NÃO PROMESSA. — already rising as the slash uncovers them (spec 31.85)
const POL0=31.95,POLHIT=32+5/30,POL1=32.35;            // polaroid drop (31.95–32.35), contact on frame 965
const FOTO=32.40,MARCO=32.45,BIG=32.55,CAPT=32.70,PUSH=[32.75,36.95];
const CARD=[34.40,34.70],CNT=[34.70,35.70],LIME500=35.70;
const SCR=[37.00,37.30],DSC=700;                      // beats 1+2 whip up under the headline, +40 rides in with them
const C40=[37.05,37.60],CONT=37.50,PINS=[37.65,37.75,37.85],LG0=37.90,LGS=.08,LCAP=37.92;   // caption rises with the logos (spec 38.50)
const CUT=39.00;                                      // hard cut (scratch)
const ROW0=39.20,ROWS=.12,ROWD=.14;                   // 4 red lines slam in from the left
const SWAP=40.18,E1=40.25,E2=40.27;                   // AINDA TÁ AQUI? → ENTÃO VOCÊ NÃO É / NENHUM DOS 4.
const SL=[41.05,41.20],SLT=[41.15,41.32],G=14000,FALLEND=41.95;
// each row splits on the first moment the slash head (eo along (170,460)→(910,830)) has cleared its bottom edge:
// 41.063 / 41.080 / 41.103 / 41.155 → split frames 41.067 / 41.100 / 41.133 / 41.167
const TS=[0,1,2,3].map(i=>SL[0]+(SL[1]-SL[0])*(1-Math.cbrt(1-(90+90*i)/370)));
// gravity onset bottom row first (41.155 / 41.155 / 41.165 / 41.175): the halves slide apart along the cut, then the stack
// drops with heavier lower rows, so rows only ever move apart (0 px² overlap between rows in every frame, work_a3/fix/sim.js)
const TG=[0,1,2,3].map(i=>Math.max(TS[i],41.145+.01*(3-i)));
const SEAL0=41.55,HIT=41.70,SET1=42.00,HAND=HIT+4/30,FLOAT0=42.00;
const QT=[42.05,42+5/30,42.30],MK=[42.32,42.62];
const FLD=42.20,TYP=42.40,CPS=.035,BTN=42.50,FOOT=42.70,BR=43.40,SHINE=[43.50,44.00],RIP=44.20,STING=44.40;

const OLD=['QUER CURTIDA','QUER RELATÓRIO BONITO','QUER PACOTE PRONTO','ACEITA ESTAGIÁRIO'];
const MSG=Array.from('Oi Pedro, não sou nenhum dos 4 😄');
const LOGOS=['cafe-fafa','idc','hebreus-barbershop','sandubao-goiano','top-fachadas','luanne-trotta','delicias-da-roca'];
const CONTS=['AMÉRICA DO SUL','AMÉRICA DO NORTE','EUROPA'];
// slash (170,460)→(910,830): in each row's local px the cut is x = 30+180i+2y
const SLA=Math.atan2(370,740),SLL=Math.hypot(740,370);
const cutX=(i,y)=>30+180*i+2*y;
const PIECE=[0,1,2,3].map(i=>{const a=cutX(i,-40),b=cutX(i,120),a0=cutX(i,0),b0=cutX(i,80),mid=(a0+b0)/2;
 return {L:`polygon(-40px -40px,${a}px -40px,${b}px 120px,-40px 120px)`,R:`polygon(${a}px -40px,800px -40px,800px 120px,${b}px 120px)`,
         oL:`${f2(mid/2)}px 40px`,oR:`${f2((mid+760)/2)}px 40px`,mid,
         pc:[{o:[mid/2,40],poly:[[0,0],[a0,0],[b0,80],[0,80]]},{o:[(mid+760)/2,40],poly:[[a0,0],[760,0],[760,80],[b0,80]]}]};});
// halves: horizontal spread ±250 px/s + a 260–340 px/s kick along the cut normal (left half down-left, right half up-right;
// vertical part halved so the top row never rises into the headline) → ≥73 px perpendicular gap after 4 frames.
// Spin: left CCW, right CW, |ω| ≤ 12°/s for halves > 400 px. Gravity per row G·(.85+.1i): lower rows fall faster.
const KICK=[0,1,2,3].map(i=>[-1,1].map(sg=>{const k=260+80*rnd(i*13+sg*7+3),len=sg<0?PIECE[i].mid:760-PIECE[i].mid;
 return {vx:sg*(250+k/Math.sqrt(5))+(rnd(i*31+sg*5+11)-.5)*40,vy:-sg*k/Math.sqrt(5),w:sg*(4800+800*rnd(i*17+sg*3+29))/len,g:G*(.85+.1*i)*(.98+.04*rnd(i*23+sg*11+7))};}));
const halfAt=(i,s,T)=>{const kk=KICK[i][s],tt=Math.max(0,T-TS[i]),tg=Math.max(0,T-TG[i]);return {x:kk.vx*tt,y:kk.vy*tt+.5*kk.g*tg*tg,r:kk.w*tt};};
const halfTop=(i,s,T)=>{const h=halfAt(i,s,T),pc=PIECE[i].pc[s],th=h.r*Math.PI/180,c=Math.cos(th),sn=Math.sin(th);
 return 470+90*i+h.y+Math.min(...pc.poly.map(([x,y])=>pc.o[1]+sn*(x-pc.o[0])+c*(y-pc.o[1])));};
const SHARDS=[...Array(18)].map((_,k)=>{const i=k%4,yl=8+64*rnd(k*7+1),x=160+cutX(i,yl),y=470+90*i+yl,r=rnd(k*11+5);
 return {i,x,y,vx:(rnd(k*5+2)-.5)*560,vy:-120-380*rnd(k*3+9),w:(rnd(k*9+4)-.5)*1400,sz:6+9*rnd(k*13+6),
         c:r<.45?'#FF4D5E':r<.8?'#B7E400':'#F4F6FF',tri:rnd(k*19+8)<.5};});

// ------------------------------------------------------------------ markup
const rowInner=i=>`<div class="n">${i+1}</div><div class="t">${OLD[i]}</div><div class="ck">✕</div>`;
// WhatsApp mark: filled bubble-with-tail, handset knocked out (evenodd) so the lime button shows through; bold SVG arrow (5 px = label stem)
const WA=`<svg width="50" height="50" viewBox="0 0 24 24"><path fill="#0A0F2C" fill-rule="evenodd" d="M20.464 3.488A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413ZM17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z"/></svg>`;
const ARW=`<svg width="38" height="30" viewBox="0 0 38 30"><path d="M3 15H33M22 4l11 11-11 11" fill="none" stroke="#0A0F2C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BTN_HTML=AD?`<div class="btn a3btn a3out" id="a3_btn"><span class="a3emo">👇</span>TOQUE EM “ENVIAR MENSAGEM”</div>`
                 :`<div class="btn a3btn" id="a3_btn">${WA}CHAMAR NO WHATSAPP${ARW}</div>`;
const FOOT_TXT='pk7.com.br · @pedrok.ads';

const HTML=`
<div class="a3w" id="a3_s12" style="display:none">
 ${HL('a3_h1',262,90,'PROVA,','z-index:20')}
 ${HL('a3_h2',364,90,'<span class="L">NÃO PROMESSA.</span>','z-index:20')}
 <div class="a3w" id="a3_ca" style="z-index:6"><div class="a3w" id="a3_g1"><div class="a3w" id="a3_b1" style="transform-origin:540px 740px">
  <div class="a3pol" id="a3_pol"><img src="assets/plaque2.jpg" alt=""></div>
  <div class="a3foto cap" id="a3_foto">FOTO REAL</div>
  <div class="a3marco cap" id="a3_marco">1º MARCO</div>
  <div class="a3big H L" id="a3_big">R$ 100 MIL</div>
  <div class="a3capt a ml" id="a3_capt">faturados como<br>parceiro Appmax</div></div>
  <div class="a3card" id="a3_card"><div class="a3crow"><span class="a3hoje cap">HOJE</span><span class="a3ecom">em e-commerce próprio</span></div>
   <div class="a3num H" id="a3_num">+R$ <span id="a3_nv">0</span> MIL</div><i class="a3cfl" id="a3_cfl"></i></div>
  <i class="a3cring" id="a3_cring"></i>
 </div></div>
 <div class="a3w" id="a3_cb" style="z-index:6"><div class="a3w" id="a3_g40">
  <div class="a3r40"><span class="a3cnt H L" id="a3_cnt"><span class="a3gh">+40</span><span id="a3_n40">+0</span></span><div class="a3cl H">CLIENTES<br>ATENDIDOS</div></div>
 </div></div>
 ${HL('a3_c3',690,48,'3 CONTINENTES','z-index:7')}
 <div class="a3pins" style="z-index:7">${CONTS.map((t,k)=>`<span class="a3pin cap" id="a3_p${k}"><i><b id="a3_pr${k}"></b></i>${t}</span>`).join('')}</div>
 <div class="a3lr" style="top:820px;z-index:7">${LOGOS.slice(0,4).map((l,k)=>`<span class="lgc" id="a3_l${k}"><img src="assets/${l}.webp" alt=""></span>`).join('')}</div>
 <div class="a3lr" style="top:914px;z-index:7">${LOGOS.slice(4).map((l,k)=>`<span class="lgc" id="a3_l${k+4}"><img src="assets/${l}.webp" alt=""></span>`).join('')}</div>
 <div class="a hc ml a3lc" id="a3_lc" style="top:1006px;z-index:7">alguns clientes atendidos · logos reais</div>
</div>
<div class="a3w" id="a3_s13" style="display:none">
 ${HL('a3_q',262,100,'AINDA TÁ <span class="L">AQUI?</span>','z-index:20;transform-origin:540px 50px')}
 ${HL('a3_e1',262,64,'ENTÃO VOCÊ NÃO É','z-index:20')}
 ${HL('a3_e2',340,100,'<span class="L">NENHUM DOS 4.</span>','z-index:20')}
 ${[0,1,2,3].map(i=>`<div class="a3row" id="a3_r${i}" style="top:${470+90*i}px;z-index:${10+i}">${rowInner(i)}<i class="fx" id="a3_rf${i}"></i></div>
  <div class="a3half" id="a3_ra${i}" style="top:${470+90*i}px;z-index:${10+i};transform-origin:${PIECE[i].oL};display:none"><div class="a3row a3in" style="clip-path:${PIECE[i].L}">${rowInner(i)}</div></div>
  <div class="a3half" id="a3_rb${i}" style="top:${470+90*i}px;z-index:${10+i};transform-origin:${PIECE[i].oR};display:none"><div class="a3row a3in" style="clip-path:${PIECE[i].R}">${rowInner(i)}</div></div>`).join('')}
 ${SHARDS.map((d,k)=>`<i class="a3d" id="a3_d${k}" style="width:${f2(d.sz)}px;height:${f2(d.sz*(d.tri?1:.62))}px;background:${d.c};${d.tri?'clip-path:polygon(50% 0,100% 100%,0 100%)':'border-radius:2px'};z-index:14;display:none"></i>`).join('')}
 <div class="a3sl" id="a3_sl" style="z-index:15;display:none"></div>
 <div class="a3glow" id="a3_glow" style="z-index:5"></div>
 ${sealHTML({id:'a3_seal',pose:'pose-point',x:540,y:700,s:.86,rot:-3,theme:'navy',ring:'PEDRO R GOMES • PEDROK ADS',ringAt:40,z:9})}
 <div class="a3qt" id="a3_qt" style="z-index:14"><div class="a3qh"><span class="gdot"></span>IA do Google</div>
  <div class="a3qx">“Na PK7, você fala <b id="a3_qb">diretamente com o Pedro</b>”</div></div>
 <div class="a3lbl cap" id="a3_lbl" style="z-index:11">SUGESTÃO DE MENSAGEM</div>
 <div class="a3fld" id="a3_fld" style="z-index:11"><span id="a3_ftx"></span><i class="a3cur" id="a3_cur"></i>
  <span class="a3snd"><svg width="26" height="26" viewBox="0 0 24 24"><path d="M3 20l18-8L3 4v6l12 2-12 2z" fill="#fff"/></svg></span></div>
 <i class="a3rip" id="a3_rip" style="z-index:10"></i>
 ${BTN_HTML.replace('id="a3_btn"','id="a3_btn" style="z-index:11"')}
 <div class="a hc ml a3ft" id="a3_ft" style="top:1152px;z-index:11">${FOOT_TXT}</div>
</div>`;

// ------------------------------------------------------------------ seal extras (hand pop-out layer + shine), injected into the core seal SVG
const HAND_PATH='M84 318L150 312L196 340L206 392L192 432L180 462L172 494L96 496L62 470L60 410L70 352Z',HPX=120,HPY=488;
function sealExtras(){
 const svg=$('a3_seal').querySelector('svg'),body=svg.querySelector('g[id^="body_stk"]'),n=body.id.slice(4),vb=svg.viewBox.baseVal,
       cx=SP['pose-point'].cx,cy=SP['pose-point'].cy;
 svg.querySelector('defs').insertAdjacentHTML('beforeend',
  `<filter id="a3_hb" filterUnits="userSpaceOnUse" x="20" y="270" width="230" height="270"><feGaussianBlur stdDeviation="3"/></filter>
   <mask id="a3_hm" maskUnits="userSpaceOnUse" x="20" y="270" width="230" height="270"><path d="${HAND_PATH}" fill="#fff" filter="url(#a3_hb)"/></mask>
   <linearGradient id="a3_shg" gradientUnits="userSpaceOnUse" x1="${cx-260}" y1="${cy-260}" x2="${cx+260}" y2="${cy+260}">
    <stop offset=".44" stop-color="#fff" stop-opacity="0"/><stop offset=".485" stop-color="#fff" stop-opacity=".14"/><stop offset=".5" stop-color="#fff" stop-opacity=".34"/><stop offset=".515" stop-color="#fff" stop-opacity=".14"/><stop offset=".56" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
 // the hand + sleeve, re-drawn on top with the SAME disc/pop mask (so it never shows more of the source than the base does),
 // scaled about the sleeve end for the 1.06 → 1 pop; identical to the base while k = 1
 body.insertAdjacentHTML('beforeend',`<g id="a3_hand"><g mask="url(#a3_hm)"><image href="${AVURL('pose-point')}" width="512" height="512" mask="url(#m${n})"/></g></g>`);
 svg.insertAdjacentHTML('beforeend',`<rect id="a3_shr" x="${vb.x}" y="${vb.y}" width="${vb.width}" height="${vb.height}" fill="url(#a3_shg)" mask="url(#gm${n})" style="display:none"/>`);
}

ACTS.push({id:'A3',t0:31.55,t1:46.6,z:3,bg:true,html:HTML,
 init(){
  TRANS.push({t:31.70,cw:.15,out:'A2',inc:'A3'});
  sealExtras();
  // warm the image cache/decoder for everything that first appears mid-act
  ['assets/plaque2.jpg',AVURL('pose-point'),POPURL('pose-point'),...LOGOS.map(l=>`assets/${l}.webp`)].forEach(u=>{const im=new Image();im.src=u;if(im.decode)im.decode().catch(()=>{});});

  // ---- headlines (masked line rise 0.3 s, 0.08 s apart)
  lin('a3_h1',H1,.3);lin('a3_h2',H2,.3);
  lin('a3_capt',CAPT,.3,.07);
  lin('a3_c3',CONT,.3);
  lin('a3_lc',LCAP,.25);
  linOut('a3_q',SWAP,.2);lin('a3_e1',E1,.25);lin('a3_e2',E2,.23);              // both lines land by 40.50
  lin('a3_ft',FOOT,.3);

  // ---- SFX (each on the frame where the visual hits)
  S(fq(31.55),'whooshBig',.75,-.2);                             // the lime/blue slash wipe
  S(fc(POL0),'swoosh',.35,-.3);S(POLHIT,'slap',.85,-.25);       // polaroid "thwap"
  S(fc(FOTO),'stamp',.7,-.35);                                  // FOTO REAL chip
  S(fc(MARCO),'tap',.45,.3);S(fc(BIG),'thock',.75,.3);          // 1º MARCO · R$ 100 MIL punch
  S(fc(CARD[0]),'swoosh',.55);                                  // HOJE card rises
  S(fc(CNT[0]),'count',.55,0,CNT[1]-CNT[0]);S(fc(LIME500),'chime',.9);   // soft digital ticks + ding at +R$ 500 MIL
  S(fc(SCR[0]),'whoosh',.75);                                   // whip-scroll to beat 3
  S(fc(C40[0]),'count',.45,0,C40[1]-C40[0]);S(fc(C40[1]),'tick',.5);
  S(fc(CONT),'tap',.4);
  PINS.forEach((t,k)=>S(fc(t),'pop',.5,[-.3,0,.3][k],2+k));    // 3 pin pops
  LOGOS.forEach((_,k)=>S(fc(LG0+LGS*k),'pop',.42,-.3+.1*k,k));  // 7 bubbly logo pops (rising pitch)
  S(CUT,'scratch',.8);                                          // hard cut "hã?" (music also low-passes here)
  for(let i=0;i<4;i++)S(fc(ROW0+ROWS*i+ROWD),'thock',.75,-.2+.13*i);   // the 4 line hits
  S(fc(SWAP),'swoosh',.3);
  S(fc(SL[0]),'swoosh',.95,.1);S(fc(TS[0]),'crack',.45);S(fc(TG[3]),'fall',.8);   // slash · first row cracks · the stack drops
  S(HIT,'slap',1);                                              // seal "thup" (groove returns 41.55 in the music)
  S(fc(HAND),'pop',.45,-.3,5);                                  // the pointing hand pops
  S(QT[1],'postit',.75,.35);                                    // quote sticker slaps
  S(fc(MK[0]),'marker',.45,.35,MK[1]-MK[0]);
  S(fc(FLD),'swoosh',.3);
  S(fc(TYP),'typing',.7,0,MSG.length*CPS);                      // keyboard only — never a send sound
  S(fc(BTN),'pop',.55,0,3);
  S(fc(SHINE[0]),'shimmer',.55);
  S(fc(RIP),'click',.45,0,0);

  // ---- motion blur on the fast moves
  // 1st window = the A2→A3 slash wipe (bar moves ≈620 px/frame at its peak → one continuous streak instead of 3 hard bars)
  BLUR.push([31.55,31.86,32],[31.95,32.22,16],[32.40,32.50,8],[32.55,32.66,8],[34.40,34.62,16],[35.70,35.80,8],
   [37.00,37.31,32],[37.65,37.95,8],[37.90,38.55,8],
   [39.00,39.10,8],[39.20,39.72,24],[40.18,40.40,8],[41.05,41.33,16],[41.15,41.80,24],
   [41.55,41.71,24],[41.71,41.80,8],[41.83,41.93,8],[42.05,42.17,16],[42.20,42.32,8],[42.50,42.70,8]);
 },
 render(T,TF){
  const s12=TF<CUT-EPS;DS($('a3_s12'),s12);DS($('a3_s13'),!s12);
  if(s12)renderS12(T,TF);else renderS13(T,TF);
 }
});

// =================================================================== S12 · PROVA, NÃO PROMESSA
function renderS12(T,TF){
 const S_=DSC*eio(P(T,SCR[0],SCR[1]));
 // beats 1+2: one group (push-in, then whip up under the headline: static clip just below "NÃO PROMESSA.")
 const g1on=TF<SCR[1]-EPS;DS($('a3_ca'),g1on);
 if(g1on){
  const k=1+.012*eio(P(T,PUSH[0],PUSH[1]));
  $('a3_g1').style.transform=S_>0?`translateY(${f2(-S_)}px)`:'none';$('a3_b1').style.transform=`scale(${f4(k)})`;
  // goes under a soft edge just below the headline (466 → 466+60 px feather, widening with the scroll so frame 37.00 is unchanged)
  // (eased ramp: the last few px of the HOJE card's lime border never read as an underline)
  const F=60*cl(S_/60);setMask($('a3_ca'),T>=SCR[0]?`linear-gradient(to bottom,transparent 466px,rgba(0,0,0,.25) ${f2(466+.6*F)}px,#000 ${f2(466+F)}px)`:'none');
  // polaroid drop: 1.15 → .985 (contact) → 1, −10° → −4°, shadow tightening
  const pol=$('a3_pol'),pOn=at(TF,POL0);vis(pol,pOn);
  if(pOn){let s,r,air;
   if(T<POLHIT){const q=Math.pow(P(T,POL0,POLHIT),1.25);s=1.15-.165*q;r=-10+5.7*q;air=1-q;}
   else{const q=eo(P(T,POLHIT,POL1));s=.985+.015*q;r=-4.3+.3*q;air=0;}
   const sh=at(TF,POLHIT)&&TF<POLHIT+.1?(TF<POLHIT+.05?2:-1.5):0;   // 2-frame contact jolt
   pol.style.transform=`translate(${f2(sh-18*air)}px,${f2(46*air)}px) rotate(${f4(r)}deg) scale(${f4(s)})`;
   pol.style.boxShadow=`0 ${f2(40+60*air)}px ${f2(80+50*air)}px -24px rgba(0,0,0,${f2(.85-.3*air)})`;}
  // FOTO REAL chip: stamp 1.35 → 1 with a small decaying wobble (per frame)
  const fo=$('a3_foto'),fOn=at(TF,FOTO);vis(fo,fOn);
  if(fOn){const p=P(T,FOTO,FOTO+.2),s=1.35-.35*eo(p),pf=P(TF,FOTO,FOTO+.2),wx=pf<1?Math.sin(pf*40)*5*(1-pf):0;
   fo.style.transform=`translateX(${f2(wx)}px) rotate(-4deg) scale(${f4(s)})`;}
  // column: 1º MARCO pop · R$ 100 MIL punch 1.3 → 1 · caption masks (lin)
  const mc=$('a3_marco'),mOn=at(TF,MARCO);vis(mc,mOn);
  if(mOn)mc.style.transform=`scale(${f4(.5+.5*eb(P(T,MARCO,MARCO+.24),1.7))})`;
  const bg=$('a3_big'),bOn=at(TF,BIG);vis(bg,bOn);
  if(bOn){const p=P(T,BIG,BIG+.22);bg.style.transform=`scale(${f4(1.3-.3*eo(p))})`;
   const gl=1-eo(P(T,BIG,BIG+.5));bg.style.textShadow=gl>.01?`0 0 ${f2(40*gl)}px rgba(183,228,0,${f2(.7*gl)})`:'none';}
  // HOJE card (separate, below): rises 34.40–34.70, counts +R$ 0 → 500 MIL (outCubic) 34.70–35.70, lime + flash at 35.70
  const cd=$('a3_card'),cOn=at(TF,CARD[0]);vis(cd,cOn);
  const num=$('a3_num'),cfl=$('a3_cfl'),cr=$('a3_cring');
  if(cOn){
   cd.style.transform=`translateY(${f2(240*(1-eo(P(T,CARD[0],CARD[1]))))}px)`;
   $('a3_nv').textContent=Math.round(500*eo(P(TF,CNT[0],CNT[1])));   // one left-aligned run (tabular digits): no gap after R$, MIL steps right only at 9→10 and 99→100
   const lit=at(TF,LIME500);num.style.color=lit?'var(--lime)':'var(--light)';
   if(lit){const d=T-LIME500,a=1-eo(cl(d/.35));
    num.style.transform=`scale(${f4(1+.08*(1-eo(cl(d/.25))))})`;
    num.style.textShadow=a>.01?`0 0 ${f2(36*a)}px rgba(183,228,0,${f2(.8*a)})`:'none';
    cfl.style.opacity=f4(.32*a);
    const rq=eo(cl(d/.5));vis(cr,rq<1);cr.style.opacity=f4(.85*(1-rq));
    cr.style.transform=`scale(${f4(1+8/760*rq)},${f4(1+36/160*rq)})`;}
   else{num.style.transform='none';num.style.textShadow='none';cfl.style.opacity=0;vis(cr,false);}
  }else vis(cr,false);
 }
 // beat 3: +40 row rides the same scroll in from below (clipped under y 1170 while it travels), counts 0 → 40
 const g40on=at(TF,SCR[0]);DS($('a3_cb'),g40on);
 if(g40on){
  $('a3_g40').style.transform=`translateY(${f2(DSC-S_)}px)`;
  setMask($('a3_cb'),T<SCR[1]?'linear-gradient(to bottom,#000 1110px,transparent 1170px)':'none');   // soft edge 1110–1170 while it scrolls in
  $('a3_n40').textContent='+'+Math.round(40*eo(P(TF,C40[0],C40[1])));
  const d=T-C40[1],cn=$('a3_cnt');
  cn.style.transform=at(TF,C40[1])&&d<.3?`scale(${f4(1+.06*(1-eo(cl(d/.3))))})`:'none';
 }
 // 3 continents: pins pop + dot ping
 PINS.forEach((t,k)=>{const e=$('a3_p'+k),on=at(TF,t);vis(e,on);if(!on)return;
  e.style.transform=`scale(${f4(popS(P(T,t,t+.22)))})`;
  const r=$('a3_pr'+k),q=P(T,t,t+.45);r.style.opacity=f4(.9*(1-q));r.style.transform=`scale(${f4(1+2.2*eo(q))})`;});
 // 7 logos pop, 0.08 s apart
 LOGOS.forEach((_,k)=>{const t=LG0+LGS*k,e=$('a3_l'+k),on=at(TF,t);vis(e,on);
  if(on)e.style.transform=`scale(${f4(popS(P(T,t,t+.2)))})`;});
}

// =================================================================== S13 · CTA
function renderS13(T,TF){
 // AINDA TÁ AQUI? — hard cut, snaps 1.2 → 1 with a 3-frame record-scratch jolt
 {const q=$('a3_q'),p=P(T,CUT,CUT+.2),k=Math.round((TF-CUT)*30),jx=[8,-6,3][k]||0;
  q.style.transform=`translateX(${jx}px) scale(${f4(1.2-.2*eo(p))})`;}
 // the 4 red lines: slam in from the left, red flash + jolt on contact; each splits the frame the slash clears it, then falls
 for(let i=0;i<4;i++){
  const t=ROW0+ROWS*i,land=t+ROWD,r=$('a3_r'+i),ra=$('a3_ra'+i),rb=$('a3_rb'+i);
  const whole=at(TF,t)&&!at(TF,TS[i]),split=at(TF,TS[i])&&TF<FALLEND-EPS;
  // each half is hidden only once it was already fully below the stage a frame earlier (never an on-screen pop-out)
  const sh=[0,1].map(s=>split&&halfTop(i,s,TF-1/30)<=1925);
  DS(r,whole,'flex');DS(ra,sh[0]);DS(rb,sh[1]);
  if(whole){const x=-1150*(1-eo(P(T,t,land))),kf=Math.round((TF-fc(land))*30),j=TF>=fc(land)-EPS?([-5,3,-1][kf]||0):0;
   r.style.transform=`translateX(${f2(x+j)}px)`;
   const fa=TF>=fc(land)-EPS?1-eo(P(T,land,land+.22)):0;$('a3_rf'+i).style.opacity=f4(.5*fa);}
  if(split)[ra,rb].forEach((e,s)=>{if(!sh[s])return;const h=halfAt(i,s,T);
   e.style.transform=`translate(${f2(h.x)}px,${f2(h.y)}px) rotate(${f4(h.r)}deg)`;});
 }
 // debris: spawned along the cut when its row splits; each shard is hidden only once it has left the stage
 const shardAt=(d,t)=>{const tt=Math.max(0,t-TS[d.i]);return [d.x+d.vx*tt,d.y+d.vy*tt+.5*9000*tt*tt,d.w*tt];};
 SHARDS.forEach((d,k)=>{const e=$('a3_d'+k),q=shardAt(d,TF-1/30),on=at(TF,TS[d.i])&&TF<FALLEND-EPS&&q[1]<=1950&&q[0]>-40&&q[0]<1120;DS(e,on);if(!on)return;
  const [x,y,w]=shardAt(d,T);e.style.transform=`translate(${f2(x)}px,${f2(y)}px) rotate(${f2(w)}deg)`;});
 // lime slash 41.05–41.20 (head), tail retracts 41.15–41.32
 {const b=eo(P(T,SL[0],SL[1])),a=eio(P(T,SLT[0],SLT[1])),e=$('a3_sl'),on=at(TF,SL[0])&&b-a>.015;DS(e,on);
  if(on){
   e.style.width=f2(Math.max(0,b-a)*SLL+16)+'px';
   e.style.transform=`rotate(${f4(SLA*180/Math.PI)}deg) translateX(${f2(a*SLL-8)}px)`;}}
 // T3 seal (pose-point): slap-on 41.55–42.00 (1.35 → .96 → 1, +14° → −3°, shadow tightening, 3 px jolt), hand pops
 // 4 frames after contact, gentle float (±4 px / ±0.8° per 2 s), sting pulse at 44.40
 const se=$('a3_seal'),sOn=at(TF,SEAL0);vis(se,sOn);
 if(sOn){let s,r,air;
  let dy=0;
  if(T<HIT){const u=Math.pow(P(T,SEAL0,HIT),1.4);s=1.35-.39*u;r=17*(1-u);air=1-u;dy=75*(1-u);}   // accelerates into the hit; die-cut top ≥ y 455
  else{const q=P(T,HIT,SET1);s=.96+.04*eo(q);r=-1.2*Math.sin(Math.PI*cl(q*1.4))*(1-q);air=0;}
  const kf=Math.round((TF-HIT)*30),jx=TF>=HIT-EPS?([3,-3,2,-1.5,1][kf]||0):0,jy=TF>=HIT-EPS?([-2,2,-1,1,0][kf]||0):0;
  const ramp=eio(P(T,FLOAT0,FLOAT0+.8)),ph=2*Math.PI*(T-FLOAT0)/2,fy=4*Math.sin(ph)*ramp,fr=.8*Math.sin(ph+1.2)*ramp-.8*Math.sin(1.2)*ramp;
  const sp=1+.035*Math.sin(Math.PI*P(T,STING,STING+.32));
  se.style.transform=`translate(${f2(jx)}px,${f2(jy+fy+dy)}px) rotate(${f4(r+fr)}deg) scale(${f4(s*sp)})`;
  se.style.filter=`drop-shadow(0 ${f2(5+22*air)}px ${f2(5+26*air)}px rgba(1,4,20,${f2(.45-.2*air)})) drop-shadow(0 ${f2(30+70*air)}px ${f2(38+52*air)}px rgba(1,4,20,${f2(.55-.25*air)}))`;
  const hp=T-HAND,hk=hp<0?1:hp<.07?1+.06*eo(hp/.07):1+.06*(1-eio(cl((hp-.07)/.25)));
  $('a3_hand').setAttribute('transform',hk!==1?`translate(${HPX} ${HPY}) scale(${f4(hk)}) translate(${-HPX} ${-HPY})`:'');
  // shine: linear −210 → +210 (band enters the die-cut on the shimmer cue and crosses it in ~14 frames)
  const sh=$('a3_shr'),shp=P(T,SHINE[0],SHINE[1]),shOn=T>=SHINE[0]&&T<SHINE[1];DS(sh,shOn);
  if(shOn){const d=-210+420*shp;$('a3_shg').setAttribute('gradientTransform',`translate(${f2(d)} ${f2(d)})`);}
 }
 // lime glow behind the seal: contact "thup" and final sting
 {const g=$('a3_glow'),a1=T>=HIT?.42*(1-eo(P(T,HIT,HIT+.45))):0,a2=T>=STING?.5*Math.sin(Math.PI*P(T,STING,STING+.6)):0,a=Math.max(a1,a2);
  g.style.opacity=f4(a);g.style.transform=`scale(${f4(T>=STING?.85+.3*eo(P(T,STING,STING+.6)):.8+.35*eo(P(T,HIT,HIT+.45)))})`;}
 // Google quote sticker: slaps tilted the other way (+6°), then the lime marker sweeps
 {const e=$('a3_qt'),on=at(TF,QT[0]);vis(e,on);
  if(on){let s,r;if(T<QT[1]){const q=P(T,QT[0],QT[1]);s=1.3-.33*q;r=6+12*(1-q);}else{const q=eo(P(T,QT[1],QT[2]));s=.97+.03*q;r=6;}
   const kf=Math.round((TF-QT[1])*30),jx=TF>=QT[1]-EPS?([2,-2,1][kf]||0):0;
   e.style.transform=`translateX(${jx}px) rotate(${f4(r)}deg) scale(${f4(s)})`;
   e.style.boxShadow=T<QT[1]?`0 ${f2(22+40*(1-P(T,QT[0],QT[1])))}px ${f2(34+30*(1-P(T,QT[0],QT[1])))}px -8px rgba(1,4,20,.5)`:'';
   $('a3_qb').style.backgroundSize=`${f2(100*eio(P(T,MK[0],MK[1])))}% 100%`;}}
 // suggested message field (rises), typing 0.035 s/char, cursor; NEVER sent
 {const on=at(TF,FLD),f=$('a3_fld'),lb=$('a3_lbl');vis(f,on);vis(lb,on);
  if(on){const y=50*(1-eo(P(T,FLD,FLD+.25)));f.style.transform=`translateY(${f2(y)}px)`;lb.style.transform=`translateY(${f2(y)}px)`;
   const n=TF<TYP-EPS?0:Math.min(MSG.length,Math.floor((TF-TYP)/CPS+1e-6)+1);$('a3_ftx').textContent=MSG.slice(0,n).join('');
   const typing=n>0&&n<MSG.length,done=n>=MSG.length,t0=done?TYP+MSG.length*CPS:FLD;
   vis($('a3_cur'),typing||Math.floor((TF-t0)*2+1e-6)%2===0);}}
 // WhatsApp button (org) / outline "toque em enviar mensagem" (ad): spring 0.8 → 1.04 → 1, breathing from 43.40, ripple 44.20
 {const b=$('a3_btn'),on=at(TF,BTN);vis(b,on);
  if(on){const p=P(T,BTN,BTN+.36);let s=p<.45?.8+.24*eo(p/.45):1.04-.04*eio((p-.45)/.55);
   if(T>=BR)s*=1+.015*(1-Math.cos(2*Math.PI*(T-BR)/.8));
   if(T>=RIP)s*=1-.025*Math.sin(Math.PI*P(T,RIP,RIP+.2));
   b.style.transform=`scale(${f4(s)})`;}
  const rp=$('a3_rip'),ron=T>=RIP&&T<RIP+.7;vis(rp,ron);
  if(ron){const q=P(T,RIP,RIP+.7),ex=10*eo(q),ey=26*eo(q);
   Object.assign(rp.style,{left:f2(175-ex)+'px',top:f2(1036-ey)+'px',width:f2(730+2*ex)+'px',height:f2(96+2*ey)+'px',opacity:f4(.75*(1-q))});}}
}
})();

// integrator: final lime sting SFX on the visual sting pulse (music sting is aligned to it)
S(44.4,'sting',1);
