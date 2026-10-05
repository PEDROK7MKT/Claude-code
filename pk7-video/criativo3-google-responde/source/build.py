# Assembles index.html for creative 3 "O GOOGLE RESPONDE" (shared style/engine pieces from creative 2)
style = open('_style.css').read()
helpers = open('_helpers.js').read()
anlib = open('_anlib.js').read()

EXTRA_CSS = r"""
.srch{position:absolute;left:60px;width:880px;height:270px;border-radius:30px;background:#fff;color:#1F1F1F;box-shadow:0 40px 90px -30px rgba(0,0,0,.75);overflow:hidden}
.srch .tabs{position:absolute;left:34px;top:26px;display:flex;gap:40px;font:500 34px 'Plus Jakarta Sans';color:#5F6368;white-space:nowrap}
.srch .tabs b{color:#1F1F1F;font-weight:700;position:relative}.srch .tabs b:after{content:'';position:absolute;left:0;right:0;bottom:-14px;height:5px;border-radius:3px;background:#1F1F1F}
.srch .bar{position:absolute;left:30px;right:30px;top:118px;height:112px;border-radius:999px;background:#F1F3F4;display:flex;align-items:center;padding:0 34px;font:600 44px 'Plus Jakarta Sans';color:#1F1F1F;white-space:nowrap}
.srch .bar .cr{display:inline-block;width:4px;height:52px;background:#1E50E6;margin-left:4px}
.srch .go{position:absolute;right:46px;top:134px;width:80px;height:80px;border-radius:50%;background:#1F1F1F;color:#fff;display:flex;align-items:center;justify-content:center;font:700 40px 'Space Grotesk'}
.pc{position:absolute;left:60px;top:546px;width:876px;border-radius:26px;background:#fff;overflow:hidden;box-shadow:0 50px 110px -40px rgba(0,0,0,.85)}
.pc .ph{height:52px;display:flex;align-items:center;gap:12px;padding:0 24px;background:#F1F3F4;font:700 24px 'Plus Jakarta Sans';color:#5F6368;white-space:nowrap}
.pc .ph i{font-style:normal;color:#1E50E6}
.pc .pb{position:relative;overflow:hidden;background:#fff}
.pc .pb img{position:absolute;display:block}
.mk{position:absolute;background:rgba(206,255,0,.62);mix-blend-mode:multiply;border-radius:6px;transform-origin:0 50%}
.qchip{display:inline-flex;align-items:center;gap:10px;padding:10px 22px;border-radius:999px;background:var(--lime);color:var(--navy);font:700 32px 'Space Grotesk';text-transform:uppercase;white-space:nowrap}
#hud{position:absolute;left:60px;width:880px;top:252px;z-index:41;display:none;justify-content:center;align-items:center;gap:22px}
#hud .dots{display:flex;gap:12px}
#hud .dt{width:40px;height:40px;border-radius:50%;border:3px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font:800 24px 'Space Grotesk';color:transparent}
#hud .dt.on{background:var(--lime);border-color:var(--lime);color:var(--navy)}
.stw{position:absolute;left:60px;width:880px;top:1132px;text-align:center}
.st2{display:inline-block;padding:14px 34px;border-radius:16px;background:var(--lime);color:var(--navy);font:700 56px 'Space Grotesk';text-transform:uppercase;white-space:nowrap;transform:rotate(-2.5deg);box-shadow:0 20px 40px -12px rgba(0,0,0,.7)}
"""

# print crops: (doc, natural w, crop y0, crop h, mark keys)
HL = {"doc1": {"w": 675, "h": 1340, "name": [[23, 345, 618, 36], [22, 385, 512, 37]], "modelo": [[59, 950, 570, 39], [59, 991, 482, 40], [60, 1032, 289, 39]]},
      "doc4": {"w": 716, "h": 1380, "vant": [[28, 20, 602, 42], [28, 64, 652, 41], [28, 108, 557, 41], [28, 151, 614, 43], [28, 195, 156, 42]],
               "focoH": [[29, 444, 646, 44], [29, 491, 358, 45]], "foco": [[186, 692, 362, 41], [28, 736, 556, 41], [28, 779, 572, 42], [29, 823, 556, 42], [28, 868, 153, 35]],
               "direto": [[298, 1156, 244, 41], [28, 1200, 373, 41]], "fat": [[186, 692, 362, 41], [28, 736, 556, 41]]}}
BODY = 520
D = [  # id, question (2 lines), doc, y0, croph, mark keys, stamp, section start (beats), length (beats)
    ('d1', 'Quem é esse<br><span class="L">Pedro R Gomes?</span>', 'doc1', 240, 400, ['name'], 'Fundador da PK7', 8, 10, 'resposta real'),
    ('d2', 'É só mais uma<br><span class="L">agência?</span>', 'doc1', 940, 400, ['modelo'], 'Não é agência.', 18, 10, 'resposta real'),
    ('d3', 'Qual a vantagem<br><span class="L">de contratar ele?</span>', 'doc4', 0, 423, ['vant'], 'Feito sob medida.', 28, 12, 'trecho da mesma conversa'),
    ('d4', 'Vai me entregar<br><span class="L">relatório bonito?</span>', 'doc4', 430, 480, ['focoH', 'fat'], 'Foco: faturar.', 40, 10, 'trecho da mesma conversa'),
    ('d5', 'Vou falar com<br><span class="L">estagiário?</span>', 'doc4', 940, 440, ['direto'], 'Direto com o Pedro.', 50, 10, 'trecho da mesma conversa'),
]

def card(sec, doc, y0, ch, keys, tag):
    w = HL[doc]['w']; k = BODY / ch; iw = w * k; left = max(0, (880 - iw) / 2)
    marks = ''; n = 0
    for key in keys:
        for (x, y, ww, hh) in HL[doc][key]:
            marks += f'<div class="mk" id="{sec}_m{n}" style="left:{left + x * k - 4:.1f}px;top:{(y - y0) * k - 3:.1f}px;width:{ww * k + 8:.1f}px;height:{hh * k + 6:.1f}px"></div>'
            n += 1
    html = (f'<div class="pc a" id="{sec}_card"><div class="ph"><i>●</i> Google · Modo IA · {tag}</div>'
            f'<div class="pb" style="height:{BODY}px"><img src="a/{doc}.jpg" style="left:{left:.1f}px;top:{-y0 * k:.1f}px;width:{iw:.1f}px">{marks}</div></div>')
    return html, n

scenes = []; NM = {}
for sec, q, doc, y0, ch, keys, stamp, b0, L, tag in D:
    c, n = card(sec, doc, y0, ch, keys, tag); NM[sec] = n
    scenes.append(f'''<section class="scene" id="{sec}">
  <div class="a H hl ml" id="{sec}_q" style="top:322px;font-size:80px">{q}</div>
  {c}
  <div class="stw a" id="{sec}_st"><span class="st2">{stamp}</span></div>
</section>''')

LOGOS = ['cafe-fafa', 'idc', 'hebreus-barbershop', 'sandubao-goiano', 'top-fachadas', 'luanne-trotta', 'delicias-da-roca']
logos = ''.join(f'<span class="lgc a" id="lg{i}" style="position:absolute;left:{(i % 4) * 162 + (81 if i >= 4 else 0)}px;top:{(i // 4) * 74}px;width:150px;height:64px"><img src="a/{n}.webp" style="max-width:120px;max-height:{58 if n == "delicias-da-roca" else 46}px"></span>' for i, n in enumerate(LOGOS))

BODY_HTML = f'''<div id="stage">
<!-- ===== H · HOOK ===== -->
<section class="scene" id="h">
  <div class="a H hl ml" id="h0a" style="top:264px;font-size:84px">Antes de contratar<br>um gestor<br>de tráfego,</div>
  <div class="a H hl ml" id="h0b" style="top:300px;font-size:120px">Pergunte<br>pro <span class="L">Google.</span></div>
  <div class="srch a" id="s0" style="top:660px">
    <div class="tabs"><b>Modo IA</b><span>Tudo</span><span>Imagens</span><span>Vídeos</span></div>
    <div class="bar"><span id="s0t"></span><span class="cr" id="s0c"></span></div>
    <div class="go a" id="s0g">→</div>
  </div>
  <div class="a" id="s0r" style="left:806px;top:794px;width:80px;height:80px;border-radius:50%;background:rgba(183,228,0,.6);transform-origin:50% 50%"></div>
  <div class="a" id="h0n" style="left:60px;width:880px;top:960px;text-align:center;font:700 36px 'Plus Jakarta Sans';color:#fff">a mesma pesquisa no Modo IA do Google</div>
</section>
{chr(10).join(scenes)}
<!-- ===== P · PROVA ===== -->
<section class="scene" id="p">
  <div class="a H hl ml" id="pq" style="top:264px;font-size:96px">E fora do<br><span class="L">Google?</span></div>
  <div class="a" id="plq" style="left:60px;top:496px;width:400px;padding:14px;background:#15171F;border-radius:20px;box-shadow:0 50px 100px -30px #000,inset 0 0 0 3px #2A2E3D;transform-origin:50% 50%"><img src="a/plaque2.jpg" style="display:block;width:100%;border-radius:6px"></div>
  <div class="a" id="pm" style="left:500px;top:520px;width:440px">
    <span class="qchip" style="font-size:28px">Prêmio Appmax</span>
    <div class="H L" style="font-size:78px;margin-top:16px;white-space:nowrap">R$ 100 mil</div>
    <div style="font:700 32px 'Plus Jakarta Sans';color:rgba(244,246,255,.85);margin-top:8px">faturados como<br>parceiro Appmax</div>
  </div>
  <div class="a H ml" id="pn" style="left:500px;top:850px;font-size:58px;line-height:1.08"><span class="L">+40</span> clientes<br><span class="L">3</span> continentes</div>
  <div class="a" id="lgg" style="left:182px;top:1108px;width:636px;height:140px">{logos}</div>
</section>
<!-- ===== C · CTA ===== -->
<section class="scene" id="c">
  <div class="a H hl ml" id="ca" style="top:264px;font-size:104px">Não acredite<br><span class="L">na gente.</span></div>
  <div class="a H hl ml" id="cb" style="top:264px;font-size:104px">Pesquise<br><span class="L">você mesmo:</span></div>
  <div class="srch a" id="s1" style="top:520px">
    <div class="tabs"><b>Modo IA</b><span>Tudo</span><span>Imagens</span><span>Vídeos</span></div>
    <div class="bar"><span id="s1t"></span><span class="cr" id="s1c"></span></div>
    <div class="go">→</div>
  </div>
  <div class="a" id="cn" style="left:60px;width:880px;top:830px;text-align:center;font:700 40px 'Plus Jakarta Sans';line-height:1.25;color:var(--light)">Depois, fale <span style="color:var(--lime)">direto com o Pedro.</span></div>
  <div class="a" id="btn" style="left:104px;top:910px;width:792px;height:104px;border-radius:999px;background:var(--lime);color:var(--navy);display:flex;align-items:center;justify-content:center;gap:18px;font-family:'Space Grotesk';font-weight:700;font-size:46px;box-shadow:0 26px 60px -20px rgba(183,228,0,.7);transform-origin:50% 50%;white-space:nowrap">💬 Chamar no WhatsApp →</div>
  <div class="a" id="eln" style="left:60px;width:880px;top:1040px;text-align:center;font-size:30px;font-weight:700;color:rgba(244,246,255,.8);white-space:nowrap">WhatsApp no link da bio · pk7.com.br · @pedrok.ads</div>
</section>
<div id="hud"><span class="qchip" id="hudc">Dúvida 1/5</span><span class="dots">{''.join(f'<span class="dt" id="dt{i}">✓</span>' for i in range(5))}</span></div>
<div id="cur"><div class="s"></div><div class="s2"></div></div>
<div id="vig"></div><div id="grain"></div>
</div>'''

def bt(b): return f'{b}*B'

TL = []
TL.append("const DOTT=[];\n")
TL.append("""// ---- HOOK (0-8B): headline at frame 0, the real search is typed, enter
const Q0='pedro R GOMES PK7';S(.62,'typing',.6,0,1.25);
ev('s0r',3.62,'ripple',.35);ev('s0g',3.62,'pulse1',.25);S(3.62,'tap',.9);
linOut('h0a',2.30);lin('h0b',linEnd('h0a',2.30)+.02,.40,.08);S(linEnd('h0a',2.30)+.06,'thock',.8);
""")
trans = {1: ('whipOutL', 'whipInL', 'whoosh', -.5), 2: ('whipOutR', 'whipInR', 'whoosh', .5), 4: ('whipOutL', 'whipInL', 'whoosh', -.5), 5: ('whipOutR', 'whipInR', 'whoosh', .5)}
prev = 'h'
for i, (sec, q, doc, y0, ch, keys, stamp, b0, L, tag) in enumerate(D):
    n = NM[sec]
    t0 = f'({b0}*B)'
    if i + 1 in trans:
        o, inn, snd, pan = trans[i + 1]
        TL.append(f"ev('{prev}',{t0}-.10,'{o}',.20);ev('{sec}',{t0}-.10,'{inn}',.20);S({t0}-.12,'{snd}',.8,{pan});")
    else:
        TL.append(f"S({t0}-.25,'swoosh',1,.5);")
    lq = '-.15' if i == 2 else '-.04'; lc = '+.10' if i == 2 else '+.30'
    TL.append(f"txt('hudc',{t0},'Dúvida {i + 1}/5');lin('{sec}_q',{t0}{lq},.40,.07);S({t0}+.04,'tap',.6);")
    TL.append(f"ev('{sec}_card',{t0}{lc},'rise',.40,{{dy:720}});S({t0}{lc},'paper',.8);")
    per = .24
    TL.append(f"for(let k=0;k<{n};k++){{ev('{sec}_m'+k,{t0}+1.30+k*{per},'grow',{per - .02});}}S({t0}+1.30,'marker',.8,0,{n * per:.2f});")
    stt = f"{t0}+1.30+{n}*{per}+.30"
    TL.append(f"ev('{sec}_st',{stt},'stamp',.3);S({stt},'stamp',1);DOTT[{i}]={stt}+.05;ev('dt{i}',{stt}+.05,'pulse1',.3);S({stt}+.12,'pop',.7,.4,{i + 2});")
    prev = sec
TL.append("""// ---- PROVA (60B): hard cut on the hit
S(60*B,'impact',.9);S(60*B,'shimmer',.5);ev('pq',60*B,'slamIn',.16);
ev('plq',60*B+.10,'rise',.42,{dy:700});S(60*B+.30,'whoosh',.5,-.4);
ev('pm',60*B+.70,'pop',.30);S(60*B+.72,'pop',.8,.3,4);
lin('pn',60*B+1.60,.40,.08);S(60*B+1.62,'count',.8,.3,.3);
for(let i=0;i<7;i++)ev('lg'+i,60*B+2.40+i*.05,'pop',.25);S(60*B+2.40,'swipe',.4);
S(70*B-.25,'swoosh',1,.5);
// ---- CTA (70B)
lin('ca',70*B-.15,.40,.08);
ev('s1',70*B+.05,'rise',.36,{dy:520});S(70*B+.05,'whoosh',.5);
const Q1='Pedro R Gomes PK7';S(70*B+.75,'typing',.6,0,1.2);
linOut('ca',70*B+2.05);lin('cb',linEnd('ca',70*B+2.05)+.02,.40,.08);S(linEnd('ca',70*B+2.05)+.06,'tap',.6);
ev('cn',70*B+2.35,'fadeUp',.3);
ev('btn',70*B+2.70,'rise',.35,{dy:240});S(70*B+2.70,'whoosh',.5);S(70*B+3.05,'sent',.8);ev('btn',70*B+3.10,'pulse',2.2);
ev('eln',70*B+2.95,'fadeUp',.3);
""")
TIMELINE = '\n'.join(TL)

SCRIPT = r"""
const Q=new URLSearchParams(location.search), VAR=Q.get('v')||'org';   // org | ad
const $=id=>document.getElementById(id);
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), P=(t,a,b)=>cl((t-a)/(b-a));
const eo=t=>1-Math.pow(1-t,3), eio=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eb=t=>{const c1=1.5,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)};
const lerp=(a,b,p)=>a+(b-a)*p;
const B=60/112, TOTAL=43.2, EPS=1e-6;
// scene ranges [id,start,end,z] on the 112 BPM grid
const SC=[['h',0,8*B+.12,2],['d1',8*B-.12,18*B+.12,3],['d2',18*B-.12,28*B,2],['d3',28*B-.45,40*B+.12,4],['d4',40*B-.12,50*B+.12,2],['d5',50*B-.12,60*B,3],['p',60*B,70*B,2],['c',70*B-.45,TOTAL+1,4]];
const CW=.45;
const TR=[{t:28*B,out:'d2',inc:'d3'},{t:70*B,out:'p',inc:'c'}];
const CUES=[]; const S=(t,n,v=1,p=0,d)=>CUES.push(Object.assign({t:+(+t).toFixed(3),n,v,p},d!==undefined?{d:+(+d).toFixed(3)}:{}));
(function(){
 document.querySelectorAll('.ml').forEach(el=>{el.innerHTML=el.innerHTML.split(/<br\s*\/?>/i).map((h,i)=>`<span class="ln"><span class="li" id="${el.id}_l${i}">${h}</span></span>`).join('');});
 if(VAR==='ad'){const b=$('btn');b.style.background='transparent';b.style.border='4px solid var(--lime)';b.style.color='var(--lime)';b.style.boxShadow='none';b.textContent='👇 Toque em “Enviar mensagem”';$('eln').textContent='pk7.com.br · @pedrok.ads';}
})();
""" + helpers + "\n" + TIMELINE + "\nCUES.sort((a,b)=>a.t-b.t);\n" + anlib.replace("let SCR={};", "let SCR={};") + r"""
let CAM={};
const typed=(q,t0,t1,T)=>q.slice(0,Math.round(q.length*cl((T-t0)/(t1-t0))));
window.render=function(T){
 const TF=Math.round(T*30)/30;
 CAM={};
 for(const s of SC)$(s[0]).style.display='none';
 for(const [id,a,b,z] of SC){const el=$(id);if(TF>=a-EPS&&TF<b-EPS){el.style.display='block';el.style.zIndex=z;el.style.clipPath='';CAM[id]=1+.015*cl((T-a)/(b-a));}}
 for(const [id] of SC)if(!BYID[id]&&$(id).style.display==='block')$(id).style.transform=`scale(${CAM[id]})`;
 const cur=$('cur');cur.style.display='none';
 for(const x of TR){if(T>=x.t+CW)continue;if(T<x.t-CW){if($(x.inc).style.display==='block')$(x.inc).style.clipPath='inset(0 0 0 100%)';continue;}const p=eio(P(T,x.t-CW,x.t+CW)),Xc=lerp(1300,-560,p),Xt=Xc+150;
   $(x.inc).style.clipPath=`polygon(${Xt+204}px 0,1500px 0,1500px 1920px,${Xt-204}px 1920px)`;$(x.inc).style.zIndex=9;
   cur.style.display='block';cur.style.transform=`translateX(${Xc}px) skewX(-12deg)`;}
 for(const id in BYID)apply(id,T,TF);
 for(const id in TXI){let s=TXI[id];for(const x of TX)if(x.id===id&&TF>=x.t-EPS)s=x.s;$(id).textContent=s;}
 // search bars: typed per frame, blinking caret
 $('s0t').textContent=typed('pedro R GOMES PK7',.62,1.85,TF);$('s0c').style.opacity=(Math.floor(TF*2.2)%2===0||TF<1.95)?1:0;
 $('s1t').textContent=typed('Pedro R Gomes PK7',70*B+.75,70*B+1.90,TF);$('s1c').style.opacity=(Math.floor(TF*2.2)%2===0||TF<70*B+2)?1:0;
 // HUD across the five doubts
 for(let i=0;i<5;i++)$('dt'+i).classList.toggle('on',TF>=DOTT[i]-EPS);
 const hud=$('hud');hud.style.display=(TF>=8*B-EPS&&TF<60*B-EPS)?'flex':'none';
 $('grain').style.backgroundPosition=`${(Math.round(T*30)*137)%540}px ${(Math.round(T*30)*251)%960}px`;
};
window.CUES=CUES; window.TOTAL=TOTAL;
window.render(0);
"""
html = ('<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">\n<link rel="stylesheet" href="fonts/fonts.css">\n<style>\n'
        + style + EXTRA_CSS + '</style></head>\n<body>' + BODY_HTML + '\n<script>' + SCRIPT + '</script>\n</body></html>\n')
open('index.html', 'w').write(html)
print('ok', len(html))
