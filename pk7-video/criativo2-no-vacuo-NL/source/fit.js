const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
for(const V of ['dare','safe','ad']){
await p.goto('http://127.0.0.1:8098/index.html?v='+V);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
const seen=new Map();
for(let t=0;t<43.5;t+=0.1){await p.evaluate(t=>window.render(t),t);
 const r=await p.evaluate(()=>{const out=[];const st=document.getElementById('stage').getBoundingClientRect();
  document.querySelectorAll('#stage *').forEach(el=>{if(!el.childNodes.length)return;const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(!own)return;
   const cs=getComputedStyle(el);let v=true;for(let e=el;e&&e.id!=='stage';e=e.parentElement){const c=getComputedStyle(e);if(c.display==='none'||c.visibility==='hidden'||+c.opacity===0){v=false;break;}}if(!v)return;
   const rg=document.createRange();rg.selectNodeContents(el);const bb=rg.getBoundingClientRect();if(bb.width<2)return;
   // overflow: text wider than its box, or outside stage x [40,1040]
   const eb=el.getBoundingClientRect();
   const over=bb.right>st.left+1040||bb.left<st.left+40||(el.scrollWidth>el.clientWidth+2&&cs.overflow!=='visible');
   out.push({id:el.id||el.className||el.tagName,txt:el.textContent.trim().slice(0,50),L:Math.round(bb.left-st.left),R:Math.round(bb.right-st.left),over});});return out;});
 for(const x of r){const k=x.txt;const o=seen.get(k);if(!o||(x.over&&!o.over)||x.R>o.R)seen.set(k,{...x,t:t.toFixed(1)});}}
console.log('== '+V);for(const [k,x] of seen){if(V!=='dare'&&x.t<38)continue;console.log((x.over?'!! ':'   ')+x.t+' ['+x.L+','+x.R+'] '+x.id+' | '+k);}}
await b.close();})();
