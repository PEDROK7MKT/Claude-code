// ---------- timeline helpers
const EV=[]; const ev=(id,t,a,d=.5,o={})=>{EV.push(Object.assign({id,t,a,d},o));};
const TX=[]; const txt=(id,t,s)=>TX.push({id,t,s});
const fsz=el=>{let f=parseFloat(getComputedStyle(el).fontSize);const c=el.firstElementChild;if(c){const g=parseFloat(getComputedStyle(c).fontSize);if(g>f)f=g;}return f;};
const lis=id=>[...document.querySelectorAll(`#${id} .li`)];
const lin=(id,t,d=.42,st=.07)=>{lis(id).forEach((el,i)=>ev(el.id,t+i*st,'maskUp',d,{h:fsz(el)*1.62,fs:fsz(el)}));};
// exits drop downward with the BOTTOM line first, so lines only ever move apart (never onto each other)
const linOut=(id,t,d=.27)=>{const L=lis(id);L.forEach((el,i)=>ev(el.id,t+(L.length-1-i)*.03,'maskOut',d,{h:fsz(el)*1.62,fs:fsz(el)}));};
// frame on which the last (top) line of an exit is cut: the next headline starts right after it
const linEnd=(id,t,d=.27)=>t+(lis(id).length-1)*.03+.53*d-.04;