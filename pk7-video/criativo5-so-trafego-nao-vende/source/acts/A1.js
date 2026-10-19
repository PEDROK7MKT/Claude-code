// A1 · 0.00–11.55 — SÓ TRÁFEGO NÃO VENDE: o anúncio roda e não vende → o balde furado (sem pixel, sem remarketing,
// sem atendimento, sem oferta) → "o problema não é o tráfego, é a falta de estrutura"
(()=>{
const M0=[18430,1248];                       // alcance / cliques (exemplo)
const fmtN=n=>Math.round(n).toLocaleString('pt-BR');
const POUR=3.55, HOLES=[{x:372,y:800,d:-1,l:'Sem pixel',t:4.55,cy:766},{x:708,y:800,d:1,l:'Sem remarketing',t:5.35,cy:766},
 {x:396,y:1040,d:-1,l:'Sem atendimento',t:6.15,cy:1006},{x:684,y:1040,d:1,l:'Sem oferta',t:6.95,cy:1006}];
const NIN=34,NLK=9,BEND=9.20;
const vis=(el,on)=>{el.style.visibility=on?'visible':'hidden';};
ACTS.push({id:'A1',t0:0,t1:12.45,z:1,
html:`
 ${HL('a1_h1',300,132,'SÓ TRÁFEGO')}
 <div class="a c5lost" id="a1_no" style="top:450px"><span class="stamp" style="transform:rotate(-5deg);font-size:104px">NÃO VENDE.</span></div>
 <div class="a c5ad" id="a1_ad" style="left:120px;top:690px;width:840px;height:430px">
   <div class="hd">📣 Campanha · Meta Ads<em>● ativa</em></div>
   <div class="rw" style="top:122px">Pessoas alcançadas<b id="a1_m0">0</b></div>
   <div class="rw" style="top:218px">Cliques no link<b id="a1_m1">0</b></div>
   <div class="rw z" style="top:314px">Vendas<b id="a1_m2">0</b></div>
 </div>
 <div class="a c5tag" id="a1_tag1" style="left:120px;top:1145px">exemplo</div>

 ${HL('a1_k1',250,72,'O ANÚNCIO TRAZ GENTE.')}
 ${HL('a1_k2',345,72,'SÓ QUE ELA <span class="R">VAZA.</span>')}
 <div class="a c5src" id="a1_src" style="top:520px"><span>📣 Anúncio</span></div>
 <div id="a1_bk" style="position:absolute;inset:0">
  <svg style="position:absolute;left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920">
   <defs><clipPath id="a1_bcl"><path d="M360 690 L720 690 L670 1170 L410 1170 Z"/></clipPath></defs>
   <g clip-path="url(#a1_bcl)"><path id="a1_wat" d="" fill="#1E50E6" opacity=".9"/></g>
   <path d="M360 690 L410 1170 L670 1170 L720 690" fill="none" stroke="#0A0F2C" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
   <ellipse cx="540" cy="690" rx="180" ry="24" fill="none" stroke="#0A0F2C" stroke-width="10"/>
   ${HOLES.map((h,i)=>`<circle id="a1_hole${i}" cx="${h.x}" cy="${h.y}" r="17" fill="#FF4D5E" stroke="#0A0F2C" stroke-width="5"/>`).join('')}
  </svg>
  ${[...Array(NIN)].map((_,k)=>`<i class="c5p" id="a1_pi${k}"></i>`).join('')}
  ${HOLES.map((h,i)=>[...Array(NLK)].map((_,j)=>`<i class="c5p r" id="a1_pl${i}_${j}"></i>`).join('')).join('')}
 </div>
 ${HOLES.map((h,i)=>`<div class="a c5chipR" id="a1_lb${i}" style="${h.d<0?`right:${1080-h.x+34}px`:`left:${h.x+34}px`};top:${h.cy}px">✕ ${h.l}</div>`).join('')}
 <div class="a c5cap" id="a1_cap" style="top:1250px"><span>💸 dinheiro vazando</span></div>

 ${HL('a1_s1',560,84,'O PROBLEMA NÃO É')}
 ${HL('a1_s2',665,130,'O TRÁFEGO.')}
 ${HL('a1_s3',880,76,'É A FALTA DE')}
 ${HL('a1_s4',975,130,'<span class="L">ESTRUTURA.</span>')}
`,
init(){
 // S1 · gancho (o frame 0 já mostra SÓ TRÁFEGO)
 ev('a1_h1',0,'slamIn',.36); S(0,'impact',.85);
 ev('a1_no',.32,'stamp',.34); S(.32,'stamp',1);
 ev('a1_ad',.95,'rise',.5,{dy:760}); S(.95,'whoosh',.7);
 ev('a1_tag1',1.3,'pop',.3);
 for(let k=0;k<=42;k++){const t=fq(1.25+k/30),q=eo(k/42);txt('a1_m0',t,fmtN(M0[0]*q));txt('a1_m1',t,fmtN(M0[1]*q));}
 S(1.25,'count',.55,0,1.4);
 [2.75,3.05].forEach(t=>{ev('a1_m2',t,'pulse1',.24);S(t,'buzz',.45);});
 linOut('a1_h1',3.18); ev('a1_no',3.16,'sout',.26); ev('a1_ad',3.18,'whipOutL',.34); ev('a1_tag1',3.18,'hide',.02); S(3.18,'whoosh',.8,-.4);
 BLUR.push([0,.3,12],[.95,1.35,24],[3.18,3.55,32]);
 // S2 · balde furado
 lin('a1_k1',3.36); lin('a1_k2',3.50); S(3.36,'swoosh',.6);
 ev('a1_src',3.45,'pop',.34); S(3.45,'pop',.6,0,2);
 ev('a1_bk',3.40,'rise',.5,{dy:900}); S(3.40,'whoosh',.6,.2);
 HOLES.forEach((h,i)=>{ev(`a1_lb${i}`,h.t,'pop',.34);S(h.t,'pop',.8,h.d*.4,1+i);S(h.t+.02,'crack',.35,h.d*.4);});
 ev('a1_cap',7.90,'stamp',.3); S(7.90,'slam',.7);
 const X=BEND;
 linOut('a1_k1',X); linOut('a1_k2',X); ev('a1_src',X,'sout',.24); ev('a1_bk',X,'whipOutU',.38);
 HOLES.forEach((h,i)=>ev(`a1_lb${i}`,X,'whipOutU',.38)); ev('a1_cap',X,'whipOutU',.38); S(X,'whooshBig',.8);
 BLUR.push([3.40,3.85,24],[X,X+.42,32]);
 // S3 · a virada (só tipografia)
 lin('a1_s1',9.52); lin('a1_s2',9.70,.42); S(9.70,'thock',.8);
 lin('a1_s3',10.60); lin('a1_s4',10.78,.42); S(10.78,'impact',.8);
 linOut('a1_s1',11.76); linOut('a1_s2',11.76); linOut('a1_s3',11.76); linOut('a1_s4',11.76);
},
render(T,TF){
 const on=T>=3.40&&T<BEND+.45;
 // água sempre baixa, com onda
 let d='M300 1180';for(let x=300;x<=780;x+=20)d+=` L${x} ${1102+Math.sin(x*.03+T*5)*7+Math.sin(x*.011-T*3)*5}`;d+=' L780 1180 Z';$('a1_wat').setAttribute('d',d);
 // fluxo que entra
 for(let k=0;k<NIN;k++){const el=$(`a1_pi${k}`),u=(T-POUR)/1.0+k/NIN-1;const show=on&&u>=0;vis(el,show);if(!show)continue;
  const s=u-Math.floor(u),y=600+s*s*500;el.style.left=(540+(rnd(k)-.5)*110-8)+'px';el.style.top=(y-8)+'px';el.style.opacity=y>1090?0:1;}
 // vazamentos
 HOLES.forEach((h,i)=>{const op=T>=h.t;$(`a1_hole${i}`).setAttribute('r',op?17+3*Math.sin(T*12+i):0);
  for(let j=0;j<NLK;j++){const el=$(`a1_pl${i}_${j}`),u=(T-h.t)/.85+j/NLK-1;const show=on&&op&&u>=0;vis(el,show);if(!show)continue;
   const s=u-Math.floor(u);el.style.left=(h.x+h.d*(22+110*s)-7)+'px';el.style.top=(h.y+20*s+520*s*s-7)+'px';el.style.opacity=1-s*.6;}});
}});
TRANS.push({t:12.25,cw:.18,out:'A1',inc:'A2'});
})();
