// ===================================================================== PK7 creative 4 — engine core
// Deterministic frame renderer: window.render(T) must be a PURE function of T (frames are rendered out of order,
// in parallel workers, and motion-blur sub-frames sample T ± 1/60 s around each frame).
const Q=new URLSearchParams(location.search), VAR=Q.get('v')||'org', EDGE=Q.get('edge')==='1';
const ONLY=(Q.get('acts')||'').split(',').filter(Boolean);
const $=id=>document.getElementById(id);
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), P=(t,a,b)=>cl((t-a)/(b-a));
const eo=t=>1-Math.pow(1-t,3), ei=t=>t*t*t, eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eb=(t,s=1.70158)=>{const c3=s+1;return 1+c3*Math.pow(t-1,3)+s*Math.pow(t-1,2)};   // outBack
const lerp=(a,b,p)=>a+(b-a)*p;
const rnd=i=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};     // deterministic 0..1
const TOTAL=45.6, FPS=30, EPS=1e-6;
const fq=t=>Math.round(t*FPS)/FPS;   // quantize a time to the frame grid

// ---------------------------------------------------------------- registries filled by the acts
const ACTS=[];        // {id,t0,t1,z,html,init(),render(T,TF)}
const TRANS=[];       // slash wipes {t,cw,out,inc}
const BLUR=[];        // motion-blur windows [t0,t1,K] (frames2.js takes the max K of the windows containing a frame)
const CUES=[]; const S=(t,n,v=1,p=0,d)=>CUES.push(Object.assign({t:+(+t).toFixed(3),n,v,p},d!==undefined?{d:+(+d).toFixed(3)}:{}));

// ---------------------------------------------------------------- avatar assets (EDGE=1 swaps in copies whose
// border pixels are pure magenta, so an automated check can prove no hard image edge is ever on screen)
const AVURL=pose=>EDGE?`assets/edge/${pose}.png`:`assets/${pose}.webp`;
const POPURL=pose=>`cut/${pose}-pop.png`;

// ---------------------------------------------------------------- declarative timeline (optional; an element is
// driven EITHER by ev() events OR by an act's render(), never both)
const EV=[]; const ev=(id,t,a,d=.5,o={})=>{EV.push(Object.assign({id,t,a,d},o));};
const TX=[]; const txt=(id,t,s)=>TX.push({id,t,s});
const fsz=el=>{let f=parseFloat(getComputedStyle(el).fontSize);const c=el.firstElementChild;if(c){const g=parseFloat(getComputedStyle(c).fontSize);if(g>f)f=g;}return f;};
const lis=id=>[...document.querySelectorAll(`#${id} .li`)];
const lin=(id,t,d=.42,st=.07)=>{lis(id).forEach((el,i)=>ev(el.id,t+i*st,'maskUp',d,{h:fsz(el)*1.62,fs:fsz(el)}));};
// exits drop downward with the BOTTOM line first, so lines only ever move apart (never onto each other)
const linOut=(id,t,d=.27)=>{const L=lis(id);L.forEach((el,i)=>ev(el.id,t+(L.length-1-i)*.03,'maskOut',d,{h:fsz(el)*1.62,fs:fsz(el)}));};
const linEnd=(id,t,d=.27)=>t+(lis(id).length-1)*.03+.53*d-.04;
let DOCK={dx:0,dy:0,s:1}, SCR={};
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

const PERFRAME={shake:1,stamp:1};
const DISC={hide:(p,s)=>{if(p>=1)s.o=0;},showAt:(p,s)=>{if(p<=0)s.o=0;},showAt2:(p,s)=>{if(p<1)s.o=0;}};
let BYID={};
function apply(id,T,TF){const el=$(id);if(!el)return;const st={o:1,x:0,y:0,s:1,r:0,b:0,sat:1,sx:1};const evs=BYID[id]||[];
 for(const e of evs){if(DISC[e.a])DISC[e.a](P(TF,e.t-EPS,e.t+e.d),st,e);else if(e.a==='maskUp'||e.a==='maskOut')AN[e.a](P(T,e.t,e.t+e.d),st,e,P(TF,e.t,e.t+e.d));else if(PERFRAME[e.a])AN[e.a](P(TF,e.t,e.t+e.d),st,e);else AN[e.a](P(T,e.t,e.t+e.d),st,e);}
 el.style.opacity=st.o;el.style.transform=`translate(${st.x}px,${st.y}px) scale(${st.s}) rotate(${st.r}deg)`+(st.sx!==1?` scaleX(${st.sx})`:'');
 const f=[];if(st.b>.05)f.push(`blur(${st.b}px)`);if(st.sat<.999)f.push(`saturate(${st.sat})`);el.style.filter=f.length?f.join(' '):'none';}
const mmss=s=>{s=Math.max(0,Math.floor(s+1e-6));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const fmt=n=>Math.round(n).toLocaleString('pt-BR');
let TXI={};

// ---------------------------------------------------------------- shared builders
// centred headline line(s) using the line-mask system (split per <br>)
const HL=(id,top,size,html,extra='')=>`<div class="a H hc ml" id="${id}" style="top:${top}px;font-size:${size}px;${extra}">${html}</div>`;
// real Google print card. crop=[sx0,sy0,sx1,sy1] in source px; marks=[[kind,x0,y0,x1,y1],...] in source px,
// kind 'L' = lime highlighter box, 'U' = red 6px underline at y0. Returns {html,s,H,marks:[{id,kind,X,Y,W,Hh}]}
const DOCS={'doc1.jpg':[675,1340],'doc4.jpg':[716,1380]};
function recibo(id,x,y,w,src,crop,marks,o={}){
 const [sx0,sy0,sx1,sy1]=crop, iw=w-52, s=iw/(sx1-sx0), ch=(sy1-sy0)*s, H=80+ch+24+(o.extraH||0);
 const [nw,nh]=DOCS[src]; let m='';const M=[];
 marks.forEach(([k,x0,y0,x1,y1],i)=>{const X=(x0-sx0)*s,Y=(y0-sy0)*s,W=(x1-x0)*s,Hh=(y1-y0)*s,mid=`${id}_m${i}`;M.push({id:mid,kind:k,X,Y,W,Hh});
   m+=k==='L'?`<i class="mk" id="${mid}" style="left:${X}px;top:${Y}px;width:${W}px;height:${Hh}px"></i>`:`<i class="ul" id="${mid}" style="left:${X}px;top:${Y}px;width:${W}px;height:6px"></i>`;});
 const html=`<div class="rec a" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${H}px;${o.style||''}">
  <div class="hd"><span class="gdot"></span>Google · Modo IA<span class="pr"><i></i>PRINT REAL</span></div><div class="dv"></div>
  <div class="crop" style="left:26px;top:80px;width:${iw}px;height:${ch}px"><img src="assets/${src}" style="left:${-sx0*s}px;top:${-sy0*s}px;width:${nw*s}px;height:${nh*s}px">${m}</div></div>`;
 return {html,s,H,bottom:y+H,marks:M};
}
// board (the 4-row checklist object)
function boardRowsHTML(id,rows,{rowH,gap=8,pad=18,font=40,nSize=48,ck=52,state=[]}){
 let r='';rows.forEach((t,i)=>{const st=state[i]||'';const top=pad+i*(rowH+gap);
  const inner=t===null?`<div class="ph"><i style="width:270px"></i><i style="width:120px"></i></div>`:`<div class="t" id="${id}_t${i}" style="font-size:${font}px">${t}</div>`;
  r+=`<div class="brow ${st}" id="${id}_r${i}" style="top:${top}px;height:${rowH}px"><div class="n" style="width:${nSize}px;height:${nSize}px">${i+1}</div>${inner}<div class="ck" id="${id}_c${i}" style="width:${ck}px;height:${ck}px">${st==='x'?'✕':st==='v'?'✓':''}</div></div>`;});
 return r;
}
// T4 occlusion rig. o={id,pose,x,y,w,clip,occ,halo:{x,y,size},tiles,z}. The rig box clips at y=clip, which MUST lie
// inside an opaque occluder whose top edge is at y=occ (and the occluder must sit above the rig in z-order).
const RIGS={};
function rigHTML(o){RIGS[o.id]=o;const u=AVURL(o.pose);
 return `<div class="rig" id="${o.id}" style="height:${o.clip}px;z-index:${o.z||5}">${o.halo?`<div class="halo" id="${o.id}_halo" style="left:${o.halo.x}px;top:${o.halo.y}px;width:${o.halo.size}px;height:${o.halo.size}px"></div>`:''}
  <div class="mover" id="${o.id}_mv"><img class="av avimg" id="${o.id}_img" src="${u}" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.w}px">
  <div class="ao" id="${o.id}_ao" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.w}px;-webkit-mask-image:url(${u});mask-image:url(${u})"></div>${o.tiles||''}</div></div>`;}
// ty >= 0 only (the avatar never rises above its final y); haloK 0..1 scales/fades the halo
function rigSet(id,ty,haloK=1){const o=RIGS[id];if(ty<0)ty=0;
 $(id+'_mv').style.transform=`translateY(${ty}px)`;
 const e=o.occ-(o.y+ty);
 $(id+'_ao').style.background=`linear-gradient(180deg,rgba(4,7,26,0) ${e-170}px,rgba(4,7,26,.38) ${e-60}px,rgba(4,7,26,.78) ${e}px)`;
 const h=$(id+'_halo');if(h){h.style.opacity=cl(haloK);h.style.transform=`scale(${.55+.45*eo(cl(haloK))})`;}}
/* Disc + pop-out params produced by tools/gen_masks.py (cut/params.json) */
const SP={
 "hero-present":{cx:256,cy:300,R:196,pop:[175,50,335,121]},
 "pose-point":{cx:250,cy:296,R:198,pop:[72,38,364,492]},
 "pose-celebrate":{cx:256,cy:304,R:190,pop:[35,49,482,295]},
 "pose-laptop":{cx:256,cy:292,R:200,pop:[169,29,343,112]},
 "head-wow":{cx:256,cy:282,R:208,pop:[166,66,347,95]}
};
const THEMES={
 navy:{band:'#0A0F2C',ring:'#B7E400',text:'#B7E400',d0:'#4A7DFF',d1:'#1E50E6',d2:'#0C2680',ray:'#FFFFFF',rayO:.07},
 lime:{band:'#0A0F2C',ring:'#B7E400',text:'#F4F6FF',d0:'#E4FF5C',d1:'#B7E400',d2:'#7F9F00',ray:'#0A0F2C',rayO:.07},
 blue:{band:'#B7E400',ring:'#0A0F2C',text:'#0A0F2C',d0:'#4A7DFF',d1:'#1E50E6',d2:'#0C2680',ray:'#FFFFFF',rayO:.07}
};
let SEALN=0;
function stickerSVG(pose,theme,ringText,ringAt){
  const n='_stk'+(++SEALN),p=SP[pose],T=THEMES[theme],{cx,cy,R}=p,B=Math.round(R*.2),Ro=R+B,OUT=17,PAD=OUT+10;
  const pb=p.pop||[cx,cy,cx,cy];
  const x0=Math.min(cx-Ro,pb[0])-PAD,y0=Math.min(cy-Ro,pb[1])-PAD,x1=Math.max(cx+Ro,pb[2])+PAD,y1=Math.max(cy+Ro,pb[3])+PAD;
  const vb=[x0,y0,x1-x0,y1-y0];
  // sunburst rays
  let rays='';for(let i=0;i<32;i+=2){const a0=i*Math.PI/16,a1=(i+1)*Math.PI/16;
    rays+=`M${cx} ${cy}L${cx+R*Math.cos(a0)} ${cy+R*Math.sin(a0)}A${R} ${R} 0 0 1 ${cx+R*Math.cos(a1)} ${cy+R*Math.sin(a1)}Z`;}
  // text arc along the bottom of the band (reads left->right, letters upright)
  const ca=(ringAt==null?90:+ringAt),fs=B*.52,rt=R+B/2+fs*.36,A0=(ca+122)*Math.PI/180,A1=(ca-122)*Math.PI/180;
  const arc=`M${cx+rt*Math.cos(A0)} ${cy+rt*Math.sin(A0)}A${rt} ${rt} 0 1 0 ${cx+rt*Math.cos(A1)} ${cy+rt*Math.sin(A1)}`;
  // die-cut outline: smooth dilation (blur + steep alpha ramp) => rounded white border
  const sd=OUT/1.5, sl=64, ic=.5-sl*.0668;
  const svg=`<svg viewBox="${vb.join(' ')}" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <radialGradient id="dg${n}" gradientUnits="userSpaceOnUse" cx="${cx-R*.25}" cy="${cy-R*.45}" r="${R*1.45}">
   <stop offset="0" stop-color="${T.d0}"/><stop offset=".5" stop-color="${T.d1}"/><stop offset="1" stop-color="${T.d2}"/></radialGradient>
  <radialGradient id="vg${n}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${R}">
   <stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
  <mask id="m${n}" maskUnits="userSpaceOnUse" x="-200" y="-200" width="912" height="912">
   <circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff"/>
   <image href="${POPURL(pose)}" width="512" height="512"/>
  </mask>
  <clipPath id="co${n}"><circle cx="${cx}" cy="${cy}" r="${Ro}"/></clipPath>
  <filter id="sh${n}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
   <feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dx="3" dy="9" result="o"/>
   <feFlood flood-color="#020517" flood-opacity=".55"/><feComposite in2="o" operator="in"/></filter>
  <filter id="die${n}" filterUnits="userSpaceOnUse" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" color-interpolation-filters="sRGB">
   <feGaussianBlur in="SourceAlpha" stdDeviation="${sd}" result="b"/>
   <feComponentTransfer in="b" result="sil"><feFuncA type="linear" slope="${sl}" intercept="${ic}"/></feComponentTransfer>
   <feFlood flood-color="#FFFFFF"/><feComposite in2="sil" operator="in" result="white"/>
   <feGaussianBlur in="sil" stdDeviation="2.2" result="sb"/>
   <feComposite in="sil" in2="sb" operator="out" result="rim"/>
   <feFlood flood-color="#C9CFE6"/><feComposite in2="rim" operator="in" result="rimc"/>
   <feMerge><feMergeNode in="white"/><feMergeNode in="rimc"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="sw${n}" filterUnits="userSpaceOnUse" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}">
   <feGaussianBlur in="SourceAlpha" stdDeviation="${sd}"/>
   <feComponentTransfer><feFuncR type="linear" slope="0" intercept="1"/><feFuncG type="linear" slope="0" intercept="1"/><feFuncB type="linear" slope="0" intercept="1"/><feFuncA type="linear" slope="${sl}" intercept="${ic}"/></feComponentTransfer>
  </filter>
  <mask id="gm${n}" maskUnits="userSpaceOnUse" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}"><use href="#body${n}" filter="url(#sw${n})"/></mask>
  <linearGradient id="gl${n}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}">
   <stop offset=".30" stop-color="#fff" stop-opacity="0"/><stop offset=".40" stop-color="#fff" stop-opacity=".20"/>
   <stop offset=".47" stop-color="#fff" stop-opacity="0"/><stop offset=".52" stop-color="#fff" stop-opacity=".08"/><stop offset=".58" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <path id="arc${n}" d="${arc}"/>
 </defs>
 <g filter="url(#die${n})"><g id="body${n}">
  <circle cx="${cx}" cy="${cy}" r="${Ro}" fill="${T.band}"/>
  <text font-family="Space Grotesk" font-weight="700" font-size="${fs}" letter-spacing="${fs*.16}" fill="${T.text}" text-anchor="middle"><textPath href="#arc${n}" startOffset="50%">${ringText||''}</textPath></text>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#dg${n})"/>
  <path d="${rays}" fill="${T.ray}" opacity="${T.rayO}"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#vg${n})"/>
  <circle cx="${cx}" cy="${cy}" r="${R+2}" fill="none" stroke="${T.ring}" stroke-width="5"/>
  <g clip-path="url(#co${n})" opacity=".9"><g filter="url(#sh${n})"><image href="${AVURL(pose)}" width="512" height="512" mask="url(#m${n})"/></g></g>
  <image href="${AVURL(pose)}" width="512" height="512" mask="url(#m${n})"/>
 </g></g>
 <rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="url(#gl${n})" mask="url(#gm${n})"/>
</svg>`;
  return {svg,vb};
}
function mountSeal(el){
  const pose=el.dataset.stk,p=SP[pose],s=+el.dataset.s,{svg,vb}=stickerSVG(pose,el.dataset.theme||'navy',el.dataset.ring,el.dataset.ringAt);
  const ox=(p.cx-vb[0])*s,oy=(p.cy-vb[1])*s;
  el.classList.add('stk');
  Object.assign(el.style,{left:(+el.dataset.x-ox)+'px',top:(+el.dataset.y-oy)+'px',width:vb[2]*s+'px',height:vb[3]*s+'px',zIndex:el.dataset.z||6,transformOrigin:ox+'px '+oy+'px'});
  el.innerHTML=`<div class="rot" style="transform-origin:${ox}px ${oy}px;transform:rotate(${el.dataset.rot||0}deg)">${svg}</div>`;
}


// <div> placeholder that boot() turns into a die-cut seal: o={id,pose,x,y (centre of the disc on stage),s,rot,theme,ring,ringAt,z}
const sealHTML=o=>`<div id="${o.id}" data-stk="${o.pose}" data-theme="${o.theme||'navy'}" data-x="${o.x}" data-y="${o.y}" data-s="${o.s}" data-rot="${o.rot||0}" data-ring="${o.ring||''}" data-ring-at="${o.ringAt==null?90:o.ringAt}" data-z="${o.z||6}"></div>`;


// ---------------------------------------------------------------- boot
function boot(){
 const st=$('stage');
 const acts=ONLY.length?ACTS.filter(a=>ONLY.includes(a.id)):ACTS.slice();
 ACTS.length=0;acts.forEach(a=>ACTS.push(a));
 for(const a of ACTS){const sec=document.createElement('section');sec.className='act'+(a.bg?' bg':'');sec.id=a.id;sec.innerHTML=a.html||'';st.appendChild(sec);a.el=sec;}
 st.insertAdjacentHTML('beforeend','<div id="cur"><div class="s"></div><div class="s2"></div></div><div id="vig"></div><div id="grain"></div><div id="sz"></div>');
 if(Q.get('qa'))document.body.classList.add('qa');
 if(EDGE)document.body.classList.add('edge');
 document.querySelectorAll('.ml').forEach(el=>{el.innerHTML=el.innerHTML.split(/<br\s*\/?>/i).map((h,i)=>`<span class="ln"><span class="li" id="${el.id}_l${i}">${h}</span></span>`).join('');});
 document.querySelectorAll('[data-stk]').forEach(mountSeal);
 for(const a of ACTS)if(a.init)a.init();
 BYID={};EV.forEach(e=>{(BYID[e.id]=BYID[e.id]||[]).push(e);});Object.values(BYID).forEach(a=>a.sort((x,y)=>x.t-y.t));
 TXI={};TX.forEach(x=>{if(!(x.id in TXI))TXI[x.id]=$(x.id).textContent;});
 CUES.sort((a,b)=>a.t-b.t);
 window.CUES=CUES;window.TOTAL=TOTAL;window.BLUR=BLUR;
}
window.render=function(T){
 const TF=fq(T);
 for(const a of ACTS){const on=TF>=a.t0-EPS&&TF<a.t1-EPS;a.el.style.display=on?'block':'none';if(on){a.el.style.clipPath='';a.el.style.zIndex=a.z||1;}}
 const cur=$('cur');cur.style.display='none';
 for(const x of TRANS){const inc=$(x.inc);if(!inc||inc.style.display!=='block')continue;
   if(T>=x.t+x.cw)continue;
   if(T<x.t-x.cw){inc.style.clipPath='inset(0 0 0 100%)';continue;}
   const p=eio(P(T,x.t-x.cw,x.t+x.cw)),Xc=lerp(1300,-560,p),Xt=Xc+150;
   inc.style.clipPath=`polygon(${Xt+204}px 0,1500px 0,1500px 1920px,${Xt-204}px 1920px)`;inc.style.zIndex=9;
   cur.style.display='block';cur.style.transform=`translateX(${Xc}px) skewX(-12deg)`;}
 for(const id in BYID)apply(id,T,TF);
 for(const id in TXI){let s=TXI[id];for(const x of TX)if(x.id===id&&TF>=x.t-EPS)s=x.s;$(id).textContent=s;}
 for(const a of ACTS)if(a.el.style.display==='block'&&a.render)a.render(T,TF);
 $('grain').style.backgroundPosition=`${(Math.round(T*30)*137)%540}px ${(Math.round(T*30)*251)%960}px`;
};
