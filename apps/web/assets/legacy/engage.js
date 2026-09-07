/* ═══ HARMOS ENGAGE ENGINE v1.1 — lamps · oath · whisper · hunt · secret · mobile ═══ */
(function(){
if(!window.H || !window.gsap) return;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(pointer:coarse)').matches;
const LS = { get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},
             set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)) };
const PAGE = location.pathname.split('/').pop() || 'index.html';

/* ---- audio wake (iOS needs a gesture before sound can exist) ---- */
const wake = () => { try { H.sfx.init();
  if (H.sfx.ctx && H.sfx.ctx.state === 'suspended') H.sfx.ctx.resume(); } catch(e){} };
document.addEventListener('pointerdown', wake, { once:true });

/* ---- styles ---- */
const css = document.createElement('style');
css.textContent = `
.logowrap{display:flex;align-items:center}
.logowrap img{height:34px;width:auto;mix-blend-mode:screen;filter:drop-shadow(0 0 12px rgba(68,237,247,.35))}
@media(max-width:600px){.logowrap img{height:28px}}
#rail{position:fixed;left:clamp(10px,2vw,22px);top:50%;transform:translateY(-50%);z-index:35;display:flex;flex-direction:column;gap:9px;align-items:center;cursor:pointer}
.rl{width:11px;height:11px;border-radius:50%;background:#141824;border:1px solid var(--line);transition:.4s}
.rl.on{background:var(--gold);border-color:var(--gold);box-shadow:0 0 12px var(--glow)}
.rl.sec{border-color:rgba(201,167,255,.35)}
.rl.sec.on{background:#C9A7FF;border-color:#C9A7FF;box-shadow:0 0 12px rgba(201,167,255,.5)}
#railCount{font-family:'Space Grotesk';font-size:10px;letter-spacing:.2em;color:rgba(244,241,232,.4);margin-top:4px}
#whisper{position:fixed;top:78px;right:16px;z-index:45;width:min(250px,72vw);background:rgba(5,7,13,.9);border:1px solid var(--gold);border-radius:16px;padding:14px 16px;backdrop-filter:blur(8px);opacity:0;pointer-events:none}
#whisper h5{font-family:'Space Grotesk';font-size:10px;letter-spacing:.3em;color:var(--gold)}
#whisper p{margin-top:7px;font-size:12.5px;line-height:1.55;color:rgba(244,241,232,.75)}
.driftGhost{position:fixed;left:-70px;z-index:70;font-size:34px;cursor:pointer;filter:drop-shadow(0 0 12px rgba(255,90,95,.6));user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;transition:transform .2s}
.driftGhost:hover{transform:scale(1.2)}
.oath{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.ofill{position:absolute;left:0;top:0;bottom:0;width:0;background:rgba(255,255,255,.35);border-radius:99px;pointer-events:none}
#cero{position:fixed;inset:0;z-index:85;background:rgba(5,7,13,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:20px}
#cero .big{font-size:72px;filter:drop-shadow(0 0 30px var(--glow));animation:flick 1s infinite alternate}
#cero h2{font-family:'Space Grotesk';font-size:clamp(22px,4vw,38px);color:var(--gold);text-shadow:0 0 30px var(--glow)}
#cero p{max-width:420px;color:rgba(244,241,232,.7);font-size:14.5px;line-height:1.6}
#flashGold{position:fixed;inset:0;z-index:84;background:radial-gradient(circle,rgba(245,184,74,.35),transparent 70%);opacity:0;pointer-events:none}
@media(max-width:900px){
  #rail{gap:7px}.rl{width:9px;height:9px}
  #whisper{top:auto;bottom:120px;right:8px;width:min(230px,66vw)}
  .driftGhost{font-size:44px}
}
`;
document.head.appendChild(css);

/* ═══ 1 · THE LANTERN RAIL ═══ */
const CHAPTERS = { "index.html":"The Street","the-squeeze.html":"The Squeeze","the-ghosts.html":"The Ghost Market",
  "the-cast.html":"The People","the-book.html":"The Book","earn.html":"Two Lanes","enterprise.html":"For Giants","the-shops.html":"The Shops" };
const lamps = LS.get('harmos_lamps',{});
if(CHAPTERS[PAGE]) { lamps[PAGE]=true; LS.set('harmos_lamps',lamps); }
const secret = LS.get('harmos_secret',false);
const rail = document.createElement('div'); rail.id='rail'; rail.title='Lamps lit — your walk through the street';
Object.entries(CHAPTERS).forEach(([f,name])=>{ const d=document.createElement('span');
  d.className='rl'+(lamps[f]?' on':''); d.title=name; rail.appendChild(d); });
const sec=document.createElement('span'); sec.className='rl sec'+(secret?' on':'');
sec.title='The Secret Lamp — the street has a hidden verse…'; rail.appendChild(sec);
const count=document.createElement('div'); count.id='railCount';
const litCount=Object.keys(lamps).filter(k=>CHAPTERS[k]).length;
count.textContent=litCount+'/8'; rail.appendChild(count);
rail.addEventListener('click',()=>{ const names=Object.keys(CHAPTERS).filter(k=>lamps[k]).map(k=>CHAPTERS[k]);
  H.toast(`🕯️ Lamps: ${litCount}/8${names.length?' — '+names.join(' · '):''}${secret?' + Secret Lamp ✨':''}`)});
document.body.appendChild(rail);

/* KEEPER ceremony — once, when all 8 are lit */
if(litCount===8 && !LS.get('harmos_keeper',false)){
  setTimeout(()=>{ LS.set('harmos_keeper',true); wake(); H.sfx.chime();
    const o=document.createElement('div'); o.id='cero';
    o.innerHTML=`<div class="big">🕯️</div><h2>KEEPER OF THE STREET</h2>
      <p>You walked every chapter — the street, the lab, the ghosts, the people, the book, both lanes, the giants, all seventy shops. The night knows your name now.</p>
      <button class="btn primary" style="position:relative;overflow:hidden">Return to the street</button>`;
    document.body.appendChild(o);
    o.querySelector('button').onclick=()=>o.remove();
    if(!RM) gsap.from(o.children,{y:30,autoAlpha:0,stagger:.15,duration:.7,ease:'back.out(1.5)'});
  },2500);
}

/* ═══ 2 · THE OATH (press & hold — touch-hardened) ═══ */
const form=document.getElementById('waitlist');
if(form){
  const clone=form.cloneNode(true); form.replaceWith(clone);
  const btn=clone.querySelector('button'), fill=document.createElement('span');
  fill.className='ofill'; btn.classList.add('oath'); btn.prepend(fill);
  let ready=false, hb=null;
  const stopHeart=()=>clearInterval(hb);
  const fire=()=>{ if(clone.requestSubmit) clone.requestSubmit();
    else clone.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})); };
  btn.addEventListener('contextmenu',e=>e.preventDefault());
  btn.addEventListener('selectstart',e=>e.preventDefault());
  btn.addEventListener('pointerdown',e=>{ e.preventDefault(); wake(); ready=false;
    hb=setInterval(()=>H.sfx.tone(72,.13,'sine',.09),650);
    gsap.to(fill,{width:'100%',duration:2.2,ease:'power1.inOut',
      onComplete:()=>{stopHeart();ready=true;fire();}});});
  const bail=()=>{ if(!ready){ stopHeart(); gsap.killTweensOf(fill);
    gsap.to(fill,{width:0,duration:.25}); H.toast('Hold the vow a little longer — lamps need fire.');}};
  btn.addEventListener('pointerup',bail); btn.addEventListener('pointercancel',bail);
  btn.addEventListener('pointerleave',bail);
  clone.addEventListener('submit',e=>{ e.preventDefault();
    if(!ready){ H.toast('Press and HOLD to swear the vow.'); return; }
    const em=clone.querySelector('input');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)){ gsap.fromTo(em,{x:-8},{x:0,duration:.4,ease:'elastic.out(1,.3)'});
      H.toast('🕯️ A lamp needs a real email.'); return; }
    const l=LS.get('harmos_waitlist',[]); if(!l.includes(em.value)){l.push(em.value);LS.set('harmos_waitlist',l);}
    btn.innerHTML='✦ Lamp Lit'; btn.classList.remove('primary'); btn.classList.add('ghosty');
    gsap.fromTo(btn,{scale:.8},{scale:1,duration:.6,ease:'elastic.out(1,.4)'});
    wake(); H.sfx.chime(); H.toast('You swore in light. The street welcomes you. — Harmos');});
}

/* ═══ 3 · THE DAILY WHISPER ═══ */
const WHISPERS=[
 "Nani Noreen once held a wedding's gold for three days. Nobody asked why. Everyone knew.",
 "The Chameleon fears one thing: a room with two honest phones.",
 "A receipt signed in light outlives the paper it never needed.",
 "Mr. Replay has played his last replay. The flash knows.",
 "Distance was the ghost's kingdom. Harmos is the border now.",
 "Aliya's Civic whispered 180,000. The phone listened.",
 "Every lamp you light makes one darkness unemployed.",
 "Dr. Amara never met her four colleagues. That's why you can trust all five.",
 "The padlock guarded doors. The lantern guards deals.",
 "Somewhere in Lahore, a rickshaw driver just earned rent verifying a delivery."];
const today=new Date(), doy=Math.floor((today-new Date(today.getFullYear(),0,0))/864e5);
const key=today.toISOString().slice(0,10);
if(LS.get('harmos_whisper_day','')!==key){
  LS.set('harmos_whisper_day',key);
  setTimeout(()=>{ const w=document.createElement('div'); w.id='whisper';
    w.innerHTML=`<h5>THE STREET WHISPERS</h5><p>${WHISPERS[doy%WHISPERS.length]}</p>`;
    document.body.appendChild(w);
    gsap.timeline().to(w,{opacity:1,x:-8,duration:.6,ease:'back.out(1.5)'})
      .to(w,{opacity:0,x:8,duration:.6,delay:9,onComplete:()=>w.remove()});
  },4000);
}

/* ═══ 4 · GHOST HUNT ═══ */
if(!RM){
  let banished=LS.get('harmos_banished',0);
  function spawnGhost(){
    if(document.hidden) return schedule();
    const g=H.GHOSTS[Math.random()*H.GHOSTS.length|0];
    const el=document.createElement('div'); el.className='driftGhost'; el.textContent=g.ico; el.title=g.n;
    el.style.top=(15+Math.random()*55)+'vh'; document.body.appendChild(el);
    gsap.to(el,{x:innerWidth+160,duration:14+Math.random()*7,ease:'none',onComplete:()=>el.remove()});
    el.addEventListener('click',()=>{ gsap.killTweensOf(el); wake(); H.sfx.buzz();
      gsap.to(el,{scale:0,opacity:0,y:'-=50',duration:.4,onComplete:()=>el.remove()});
      banished++; LS.set('harmos_banished',banished);
      H.toast(banished>=10 ? `🏅 GHOSTBANE — ${banished} ghosts banished. ${g.n} was the latest.` : `🕯️ ${g.n} banished. (${banished}/10 to Ghostbane)`);});
    schedule();
  }
  function schedule(){ setTimeout(spawnGhost,(45+Math.random()*35)*1000); }
  schedule();
}

/* ═══ 5 · THE SECRET LAMP — keyboard "harmos" OR tap the logo 5× (mobile path) ═══ */
function igniteSecret(){
  const already=LS.get('harmos_secret',false); LS.set('harmos_secret',true);
  const secLamp=document.querySelector('.rl.sec'); if(secLamp) secLamp.classList.add('on');
  const f=document.createElement('div'); f.id='flashGold'; document.body.appendChild(f);
  wake(); H.sfx.chime(); setTimeout(()=>H.sfx.chime(),200);
  gsap.fromTo(f,{opacity:0},{opacity:1,duration:.3,yoyo:true,repeat:1,onComplete:()=>f.remove()});
  gsap.fromTo('#rail .rl.on',{scale:1},{scale:1.6,yoyo:true,repeat:3,duration:.14,stagger:.05});
  H.toast(already ? '✨ The Secret Lamp still burns for you.'
    : '🔓 THE SECRET LAMP — you spoke the street\u2019s name. It remembers you now.');
}
let buf='';
document.addEventListener('keydown',e=>{
  if(e.key.length!==1) return; buf=(buf+e.key.toLowerCase()).slice(-6);
  if(buf==='harmos'){ igniteSecret(); buf=''; }
});
let logoTaps=0, logoTimer;
const logoEl=document.querySelector('.logo');
if(logoEl){ logoEl.style.cursor='pointer';
  logoEl.addEventListener('click',()=>{ clearTimeout(logoTimer); logoTaps++;
    logoTimer=setTimeout(()=>logoTaps=0,900);
    if(logoTaps>=5){ logoTaps=0; igniteSecret(); } }); }
})();
