// A2 · 11.17–23.15 — A MÁQUINA DE VENDAS: estratégia e oferta → pixel → remarketing → atendimento com IA → funil e painel
(()=>{
const TOP=[600,782,964,1146,1328],C=TOP.map(y=>y+80),ON=[12.90,14.30,15.70,17.10,18.50],WIN=19.90,Y0=560,YE=1510;
const NODES=[
 {t:'Estratégia e oferta',s:'anúncio certo pra pessoa certa, com motivo pra comprar',
  w:`<div class="c5w c5chips" id="a2_w0"><span id="a2_c00">🎯 público certo</span><span class="lm" id="a2_c01">🔥 oferta clara</span></div>`},
 {t:'Pixel',s:'registra o comportamento: quem viu, clicou e chamou',
  w:`<div class="c5w c5chips" id="a2_w1" style="top:20px"><span id="a2_c10">👁 viu o anúncio</span><span id="a2_c11">👆 clicou</span><span class="lm" id="a2_c12">💬 chamou</span></div>`},
 {t:'Remarketing',s:'aparece de novo pra quem se interessou e não comprou',
  w:`<div class="c5w c5re" id="a2_w2"><svg viewBox="0 0 24 24" id="a2_rot"><path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="#B7E400" stroke-width="2.6" stroke-linecap="round"/><path d="M20 3v5h-5" fill="none" stroke="#B7E400" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>volta pra quem quase comprou</span></div>`},
 {t:'Atendimento com IA',s:'responde em segundos, 24h, e separa curioso de comprador',
  w:`<div class="c5w c5bub" id="a2_w3" style="left:610px;top:52px;font-size:24px">Oi! Posso<br>te ajudar? 😊<small>agora <b>✓✓</b></small></div>`},
 {t:'Funil e painel',s:'do anúncio ao contrato, num número só',
  w:`<svg class="c5w c5spark" id="a2_w4" style="left:590px;top:40px;width:240px" viewBox="0 0 260 96"><path id="a2_sp" d="M6 84 L58 70 L102 76 L150 46 L196 52 L254 12" fill="none" stroke="#B7E400" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><circle id="a2_spd" cx="254" cy="12" r="11" fill="#B7E400"/></svg>`}
];
const vis=(el,on)=>{el.style.visibility=on?'visible':'hidden';};
const popq=(el,t0,T)=>{const q=P(T,t0,t0+.36);vis(el,T>=t0-1e-6);el.style.transform=`scale(${.5+.5*eb(q)})`;};
ACTS.push({id:'A2',t0:11.17,t1:23.15,z:2,bg:true,
html:`
 <div class="a c5kick" id="a2_kick" style="top:240px"><span>A solução:</span></div>
 ${HL('a2_h',320,112,'A MÁQUINA')}
 ${HL('a2_hx',438,112,'<span class="L">DE VENDAS.</span>')}
 ${HL('a2_h2',280,88,'AGORA SIM,')}
 ${HL('a2_h3',380,88,'<span class="L">O TRÁFEGO VENDE.</span>')}
 <div id="a2_all" style="position:absolute;inset:0">
  <div class="c5rail" id="a2_rail" style="top:${Y0}px;height:${YE-Y0}px"></div>
  <div class="c5railf" id="a2_fill" style="top:${Y0}px;height:0"></div>
  ${NODES.map((n,i)=>`<div class="a c5node sm" id="a2_n${i}" style="top:${TOP[i]}px"><div class="no" id="a2_no${i}">${i+1}</div><div class="ti">${n.t}</div><div class="su">${n.s}</div>${n.w}</div>`).join('')}
  <div class="c5dot" id="a2_dot"></div>
 </div>
 <div class="c5glow" id="a2_glow"></div>
 <div class="a c5win" id="a2_win"><div class="ck">✓</div><b class="eq">Tráfego + estrutura</b><span style="font:700 46px 'Space Grotesk';opacity:1;text-transform:uppercase">= venda.</span></div>
`,
init(){
 S(11.18,'whooshBig',.9);
 ev('a2_kick',11.42,'pop',.32); S(11.42,'pop',.7,0,5);
 lin('a2_h',11.70,.36); lin('a2_hx',11.80,.36); ev('a2_h',11.70,'slamIn',.3); S(11.70,'impact',1);
 TOP.forEach((y,i)=>{ev(`a2_n${i}`,12.05+i*.1,'rowIn',.34);S(12.05+i*.1,'swipe',.3,(i%2?.3:-.3),.2);});
 ON.forEach((t,i)=>{S(t-.42,'whoosh',.4,0);S(t,'click',.8,0,i);S(t+.05,'chime',.4);});
 S(ON[0]+.15,'pop',.6,0,3); S(ON[0]+.35,'pop',.6,0,5);
 [0,1,2].forEach(k=>S(ON[1]+.15+k*.2,'pop',.55,.2,2+k*2));
 S(ON[2]+.1,'swoosh',.5);
 S(ON[3]+.18,'plink',.8,0,3);
 S(ON[4]+.10,'up',.6,0,.7);
 ev('a2_kick',WIN-.12,'sout',.25); linOut('a2_h',WIN-.12); linOut('a2_hx',WIN-.12);
 ev('a2_win',WIN,'pop',.42); ev('a2_win',WIN+.42,'hold',1.6,{k:.03}); S(WIN,'slam',1); S(WIN+.08,'sparkle',.8);
 lin('a2_h2',WIN+.28); lin('a2_h3',WIN+.42); S(WIN+.28,'swoosh',.6);
 BLUR.push([11.65,11.85,12],[12.05,12.6,16],[WIN,WIN+.25,16]);
},
render(T,TF){
 const rg=eo(P(T,12.05,12.55));$('a2_rail').style.transform=`scaleY(${rg})`;$('a2_rail').style.transformOrigin='50% 0';
 let y=Y0,show=T>=12.45;
 if(T<ON[0])y=lerp(Y0,C[0],eio(P(T,12.45,ON[0])));
 else{y=C[0];for(let i=1;i<5;i++)if(T>=ON[i]-.45)y=lerp(C[i-1],C[i],eio(P(T,ON[i]-.45,ON[i])));
  if(T>=19.25)y=lerp(C[4],YE,eio(P(T,19.25,19.7)));}
 if(T>=19.7)show=false;
 const d=$('a2_dot');vis(d,show);d.style.top=(y-18)+'px';
 const f=$('a2_fill');f.style.height=Math.max(0,(show||T>=19.7?Math.min(y,YE):Y0)-Y0)+'px';vis(f,T>=12.45);
 for(let i=0;i<5;i++){const on=TF>=ON[i]-1e-6;$(`a2_n${i}`).classList.toggle('on',on);$(`a2_no${i}`).textContent=on?'✓':String(i+1);
  vis($(`a2_w${i}`),on);}
 popq($('a2_c00'),ON[0]+.15,T);popq($('a2_c01'),ON[0]+.35,T);
 [0,1,2].forEach(k=>popq($(`a2_c1${k}`),ON[1]+.15+k*.2,T));
 const w2=$('a2_w2');w2.style.transform=`translateX(${(1-eo(P(T,ON[2]+.05,ON[2]+.45)))*40}px)`;$('a2_rot').style.transform=`rotate(${T>=ON[2]?(T-ON[2])*300:0}deg)`;
 popq($('a2_w3'),ON[3]+.18,T);$('a2_w3').style.transformOrigin='100% 100%';
 const q4=eio(P(T,ON[4]+.1,ON[4]+.9));$('a2_sp').setAttribute('stroke-dashoffset',(1-q4).toFixed(4));vis($('a2_spd'),T>=ON[4]&&q4>.98);
 const dim=eo(P(T,WIN-.05,WIN+.3));$('a2_all').style.opacity=1-.72*dim;$('a2_all').style.filter=dim>.01?`blur(${3*dim}px)`:'none';
 const g=$('a2_glow');g.style.opacity=dim*(.85+.15*Math.sin(T*5));g.style.transform=`scale(${.7+.3*eo(P(T,WIN,WIN+.6))})`;
}});
TRANS.push({t:22.95,cw:.18,out:'A2',inc:'A3'});
})();
