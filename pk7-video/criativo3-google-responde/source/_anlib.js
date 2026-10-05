// ---------- animation library
const AN={
 fadeUp:(p,s)=>{const q=eo(p);if(p<=0)s.o=0;s.y+=(1-q)*50;},
 fadeIn:(p,s)=>{s.o*=p;},
 fadeOut:(p,s)=>{s.o*=1-p;},
 maskUp:(p,s,e,pf)=>{s.y+=(1-eo(p))*e.h;if((1-eo(pf))*e.h>e.fs*.98)s.o=0;},   // rises from below; hidden until the letters (not just accents) are inside
 maskOut:(p,s,e,pf)=>{s.y+=eio(p)*e.h;if(eio(pf)*e.h>e.fs*.95)s.o=0;},  // drops out downward; cut before only accents remain
 pop:(p,s)=>{const q=eb(p);if(p<=0)s.o=0;s.s*=.5+.5*q;},
 sout:(p,s)=>{s.s*=1-eio(p);if(p>=1)s.o=0;},
 stamp:(p,s)=>{const q=eo(p);if(p<=0)s.o=0;s.s*=1.35-.35*q;if(p>0&&p<1)s.x+=Math.sin(p*60)*6*(1-p);},
 slamIn:(p,s)=>{s.s*=1+.18*(1-eo(p));},
 rise:(p,s,e)=>{const q=eo(p);if(p<=0)s.o=0;s.y+=(1-q)*(e.dy||400);},
 riseO:(p,s,e)=>{const q=eo(p);s.y+=(1-q)*(e.dy||400);},
 zoomIn:(p,s)=>{const q=eo(p);s.o*=cl(p*6);s.s*=1.4-.4*q;},
 pkIn:(p,s)=>{s.s*=2.25-.25*eo(p);s.y+=470;},
 pkUp:(p,s)=>{const q=eo(p);s.s*=1-.5*q;s.y-=470*q;},
 shake:(p,s,e)=>{if(p>0&&p<1)s.x+=Math.sin(p*70)*(e.amp||10)*(1-p);},
 desat:(p,s,e)=>{s.sat=1-(1-e.to)*eio(p);},
 dock:(p,s)=>{const q=eio(p);s.x+=q*DOCK.dx;s.y+=q*DOCK.dy;s.s*=1-(1-DOCK.s)*q;},
 settle:(p,s,e)=>{s.s*=1+e.k*(1-eo(p));},
 whipOutR:(p,s)=>{s.x+=eio(p)*1150;}, whipInR:(p,s)=>{s.x-=(1-eio(p))*1150;},
 whipOutL:(p,s)=>{s.x-=eio(p)*1150;}, whipInL:(p,s)=>{s.x+=(1-eio(p))*1150;},
 whipOutU:(p,s)=>{s.y-=eio(p)*1300;if(p>=1)s.o=0;}, whipInU:(p,s)=>{s.y+=(1-eio(p))*1300;},
 ripple:(p,s)=>{s.s*=1+p*5;s.o*=1-p;},
 openFrom:(p,s)=>{const q=eo(p);s.s*=.15+.85*q;},
 zoomTo:(p,s,e)=>{const q=Math.pow(p,2.2);s.s*=1+q*(e.k-1);},
 arc:(p,s,e)=>{const q=eio(p);s.x+=(1-q)*e.dx;s.y+=(1-q)*e.dy-Math.sin(q*Math.PI)*(e.lift===undefined?120:e.lift);s.o*=cl(p*10);s.s*=.6+.4*q;s.r+=(1-q)*40;},
 squash:(p,s)=>{if(p>0&&p<1){const w=Math.sin(p*Math.PI);s.s*=1+.12*w*(1-p);}},
 kmove:(p,s,e)=>{s.x+=eio(p)*e.dx;},
 scroll:(p,s,e)=>{s.y-=eio(p)*(SCR[e.key]||0);},
 pulse:(p,s)=>{if(p>0)s.s*=1+.02*Math.max(0,Math.sin(p*Math.PI*2*2.4));},
 pulse1:(p,s)=>{if(p>0&&p<1)s.s*=1+.12*Math.sin(p*Math.PI);},
 cellOn:(p,s)=>{if(p>0){const q=eb(p);s.s*=.6+.4*q;}},
 rowIn:(p,s)=>{const q=eo(p);s.x+=(1-q)*-60;if(p<=0)s.o=0;},
 hold:(p,s,e)=>{const a=eo(cl(p/.15))*(1-eio(cl((p-.8)/.2)));s.s*=1+e.k*a;},
 grow:(p,s)=>{s.sx=eo(p);},
 zoomTo2:(p,s,e)=>{const q=eio(p);s.s*=1+q*(e.k-1);s.x+=q*e.dx;s.y+=q*e.dy;},
};
// discrete (frame-quantized) animations: evaluated on TF so motion-blur subframes never blend them
const PERFRAME={shake:1,stamp:1};
const DISC={hide:(p,s)=>{if(p>=1)s.o=0;},showAt:(p,s)=>{if(p<=0)s.o=0;},showAt2:(p,s)=>{if(p<1)s.o=0;}};
const BYID={};EV.forEach(e=>{(BYID[e.id]=BYID[e.id]||[]).push(e);});Object.values(BYID).forEach(a=>a.sort((x,y)=>x.t-y.t));
let SCR={};
function apply(id,T,TF){const el=$(id);if(!el)return;const st={o:1,x:0,y:0,s:CAM[id]||1,r:0,b:0,sat:1,sx:1};const evs=BYID[id]||[];
 for(const e of evs){if(DISC[e.a])DISC[e.a](P(TF,e.t-EPS,e.t+e.d),st,e);else if(e.a==='maskUp'||e.a==='maskOut')AN[e.a](P(T,e.t,e.t+e.d),st,e,P(TF,e.t,e.t+e.d));else if(PERFRAME[e.a])AN[e.a](P(TF,e.t,e.t+e.d),st,e);else AN[e.a](P(T,e.t,e.t+e.d),st,e);}
 el.style.opacity=st.o;el.style.transform=`translate(${st.x}px,${st.y}px) scale(${st.s}) rotate(${st.r}deg)`+(st.sx!==1?` scaleX(${st.sx})`:'');
 const f=[];if(st.b>.05)f.push(`blur(${st.b}px)`);if(st.sat<.999)f.push(`saturate(${st.sat})`);el.style.filter=f.length?f.join(' '):'none';}
const mmss=s=>{s=Math.max(0,Math.floor(s+1e-6));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const TXI={};TX.forEach(x=>{if(!(x.id in TXI))TXI[x.id]=$(x.id).textContent;});
const fmt=n=>Math.round(n).toLocaleString('pt-BR');