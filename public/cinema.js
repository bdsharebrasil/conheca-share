(()=>{if(window.__cinema)return;window.__cinema=1;
const d=document,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
d.documentElement.classList.add('cin');
const hero=d.querySelector('.hero'),photo=d.querySelector('.hero-photo'),hc=d.querySelector('.hero-content');
const chapters=[...d.querySelectorAll('.chapter')].filter(c=>c!==hero);
chapters.forEach(c=>{if(getComputedStyle(c).backgroundColor==='rgba(0, 0, 0, 0)')c.style.backgroundColor='var(--bg)'});
/* títulos: palavras acendem na rolagem, sem mudar o texto */
const heads=[...d.querySelectorAll('.chapter h2')].filter(h=>!h.closest('.hero,.quiz-section,[class*=portal]')).map(h=>{
 h.setAttribute('aria-label',h.textContent.trim().replace(/\s+/g,' '));const ws=[];
 (function wrap(n){[...n.childNodes].forEach(c=>{
  if(c.nodeType===3){const f=d.createDocumentFragment();c.textContent.split(/(\s+)/).forEach(t=>{if(!t)return;if(/^\s+$/.test(t))f.append(t);else{const s=d.createElement('span');s.setAttribute('aria-hidden','true');s.textContent=t;ws.push(s);f.append(s)}});c.replaceWith(f)}
  else if(c.nodeType===1)wrap(c)})})(h);
 return{h,ws}});
const ring=d.createElement('button');ring.type='button';ring.className='cin-ring';ring.setAttribute('aria-label','Voltar ao topo');
ring.innerHTML='<svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="24"/><circle class="f" cx="28" cy="28" r="24"/></svg><span>0%</span>';d.body.append(ring);
const rf=ring.querySelector('.f'),rt=ring.querySelector('span');ring.onclick=()=>scrollTo({top:0,behavior:reduce?'auto':'smooth'});
function tick(){const vh=innerHeight,y=scrollY;
 if(hero&&!reduce){const p=clamp(y/hero.offsetHeight);hero.style.opacity=clamp(1.05-p*1.8);if(photo)photo.style.transform=`scale(${1+p*.18}) translateY(${p*4}%)`;if(hc){hc.style.opacity=clamp(1-p*1.5);hc.style.transform=`translateY(${-p*60}px)`}}
 if(!reduce)chapters.forEach(c=>{const t=c.getBoundingClientRect().top;let v='';if(t>0&&t<vh){const cut=(1-clamp((vh-t)/(vh*.85)))*Math.min(innerWidth*.08,130);if(cut>.5)v=`polygon(0 ${cut}px,100% 0,100% 100%,0 100%)`}c.style.clipPath=v});
 heads.forEach(({h,ws})=>{const p=reduce?1:clamp((vh*.92-h.getBoundingClientRect().top)/(vh*.4));ws.forEach((w,i)=>{w.style.opacity=.2+.8*clamp(p*(ws.length+1.5)-i)})});
 const tot=clamp(y/Math.max(1,d.documentElement.scrollHeight-vh));rf.style.strokeDashoffset=150.8*(1-tot);rt.textContent=Math.round(tot*100)+'%';ring.classList.toggle('on',y>vh*.4)}
let raf;addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)},{passive:true});addEventListener('resize',tick);tick();
})();
