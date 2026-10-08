'use strict';
/* Słówka 3000 – nauka angielskiego PL→EN (Oxford 3000, A1–B2). Całość działa lokalnie w przeglądarce. */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAY=864e5, KEY='slowka3000:v1';
const ICON={
  spk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  stats:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 20V11M12 20V4M19 20v-6"/></svg>',
  shuf:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  undo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
  opts:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>'
};

/* ---------- dane ---------- */
let LEVELS=[], W=[], BYID={}, BYLEVEL=[], EN_IDX={};
/* ---------- stan / zapis ---------- */
function fill(s){
  s=s||{}; s.p=s.p||{}; s.days=s.days||{}; s.tot=s.tot||{a:0,ok:0}; s.best=s.best||0; s.fis=s.fis||{};
  s.set=Object.assign({auto:true,dir:'pl-en',theme:'auto',rate:1,learnN:7,writeN:20,fisN:20},s.set||{}); return s;
}
function load(){ try{ const s=JSON.parse(localStorage.getItem(KEY)); if(s&&s.p) return fill(s);}catch(e){} return fill({}); }
let S=load();
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){ toast('Nie udało się zapisać postępów'); } }
function P(id){ return S.p[id]||(S.p[id]={s:0}); }
function st(id){ const p=S.p[id]; return p?p.s:0; }
function isHard(id){ const p=S.p[id]; return !!(p&&p.h); }
function dkey(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function streak(){
  const now=new Date(); let d=new Date(now.getFullYear(),now.getMonth(),now.getDate()); let n=0;
  if(!S.days[dkey(d)]) d=new Date(d.getFullYear(),d.getMonth(),d.getDate()-1);
  while(S.days[dkey(d)]){ n++; d=new Date(d.getFullYear(),d.getMonth(),d.getDate()-1); }
  return n;
}
function record(ok){ const k=dkey(new Date()); S.days[k]=(S.days[k]||0)+1; S.tot.a++; if(ok) S.tot.ok++; const s=streak(); if(s>S.best) S.best=s; }
/* efekty odpowiedzi; kind: mc | type | flash | test */
function markOk(id,kind,firstTry=true){
  const p=P(id); p.r=(p.r||0)+1; p.t=Date.now();
  if(kind==='type'){
    if(p.h&&!firstTry){ if(p.s<1) p.s=1; }            /* poprawione dopiero po błędzie w tej rundzie → wraca w kolejnych rundach */
    else { if(p.s<2){ p.s=2; p.iv=1; p.due=Date.now()+DAY; } p.h=0; p.cc=0; } }
  else if(p.s<1) p.s=1;
  record(true); save();
}
function markBad(id){ const p=P(id); p.w=(p.w||0)+1; p.h=1; p.cc=0; p.t=Date.now(); if(p.s===2) p.s=1; p.iv=0; p.due=Date.now(); record(false); save(); }
function srsOk(id){ const p=P(id); p.iv=Math.min(180,Math.max(1,Math.round((p.iv||1)*2.5))); p.due=Date.now()+p.iv*DAY; save(); }
function dueIds(){ const now=Date.now(); return W.filter(w=>{ const p=S.p[w.id]; return p&&(p.h||(p.s===2&&p.due&&p.due<=now)); })
  .sort((a,b)=>{ const pa=S.p[a.id],pb=S.p[b.id]; return (pb.h?1:0)-(pa.h?1:0)||(pa.due||0)-(pb.due||0); }).map(w=>w.id); }
function levelStats(l){ let m=0,f=0,h=0; for(const w of BYLEVEL[l]){ const s=st(w.id); if(s===2)m++; else if(s===1)f++; if(isHard(w.id))h++; } return {m,f,h,n:BYLEVEL[l].length}; }
function snapP(id){ return S.p[id]?JSON.parse(JSON.stringify(S.p[id])):null; }
function restoreP(id,snap,tot,days){ if(snap) S.p[id]=snap; else delete S.p[id]; S.tot=tot; S.days=days; }

/* ---------- audio (iOS: odtwarzanie po dotknięciu, jeden element <audio>) ---------- */
const AU=new Audio(); AU.preload='auto'; let auUnlocked=false, auBtn=null;
try{ if(navigator.audioSession) navigator.audioSession.type='playback'; }catch(e){}
function unlockAudio(){ if(auUnlocked) return; auUnlocked=true; try{ AU.src=window.SILENT_MP3; AU.muted=false; const p=AU.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
document.addEventListener('touchend',unlockAudio,{capture:true,passive:true});
document.addEventListener('click',unlockAudio,{capture:true});
function play(file,btn){
  if(!file) return;
  try{
    AU.pause(); AU.src='audio/'+file; AU.defaultPlaybackRate=S.set.rate; AU.playbackRate=S.set.rate;
    if(auBtn) auBtn.classList.remove('playing'); auBtn=btn||null; if(auBtn) auBtn.classList.add('playing');
    const p=AU.play(); if(p&&p.catch) p.catch(e=>{ if(e&&e.name==='NotAllowedError') toast('Stuknij 🔊, aby odtworzyć'); });
  }catch(e){}
}
AU.addEventListener('ended',()=>{ if(auBtn){ auBtn.classList.remove('playing'); auBtn=null; } });
AU.addEventListener('error',()=>{ if(auBtn){ auBtn.classList.remove('playing'); auBtn=null; } if(AU.src.indexOf('audio/')>-1 && !navigator.onLine) toast('Brak internetu – to nagranie nie jest zapisane offline'); });
function audBtn(file,sm){ return file?`<button class="aud${sm?' sm':''}" data-au="${esc(file)}" aria-label="Odtwórz wymowę">${ICON.spk}</button>`:''; }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-au]'); if(b){ e.stopPropagation(); e.preventDefault(); play(b.dataset.au,b); } },true);

/* ---------- pomocnicze ---------- */
function toast(t){ const el=$('#toast'); el.textContent=t; el.classList.add('on'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('on'),2200); }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pl2en(){ return S.set.dir!=='en-pl'; }
function applyTheme(){ const t=S.set.theme; if(t==='auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme',t); }
const LV_EMO=['🌱','🌿','🌳','🏔️','🚀','🏆'];
/* nagłówek z zawsze widocznym przyciskiem Wstecz (back=null → brak, ''=ekran główny) */
function backBtn(target){ return `<button class="bk" data-back="${esc(target)}" aria-label="Wstecz">${ICON.back}<span>Wstecz</span></button>`; }
function topBar(title,back,right){ return `<div class="top">${back!=null?backBtn(back):'<span></span>'}<h2>${title}</h2><div class="tr">${right||''}</div></div>`; }
function closeTop(title,back,right){ return topBar(title,back||'',right); }
document.addEventListener('click',e=>{
  const k=e.target.closest('[data-back]'); if(k){ e.preventDefault(); goBack(k.dataset.back); return; }
  const r=e.target.closest('[data-rep]'); if(r){ e.preventDefault(); goReplace(r.dataset.rep); return; }
  const b=e.target.closest('[data-go]'); if(b){ e.preventDefault(); go(b.dataset.go); } });
/* historia: każdy ekran ma własny wpis (#hash → pushState), więc działa gest „przesuń wstecz” w Safari i przycisk Wstecz */
const NAV=[]; let navReplace=false;
function curHash(){ return location.hash.replace(/^#\/?/,''); }
function navSync(){ const h=curHash();
  if(navReplace){ navReplace=false; if(NAV.length) NAV[NAV.length-1]=h; else NAV.push(h); return; }
  if(NAV.length>=2&&NAV[NAV.length-2]===h) NAV.pop(); else if(NAV[NAV.length-1]!==h) NAV.push(h); }
function go(h){ if(curHash()===h) route(); else location.hash=h; }
function goReplace(h){ if(curHash()===h){ route(); return; } navReplace=true; location.replace('#'+h); }
function goBack(target){ if(NAV.length>=2&&NAV[NAV.length-2]===target) history.back(); else goReplace(target); }
function bar(s){ const m=s.m/s.n*100, f=s.f/s.n*100; return `<div class="bar"><i class="m" style="width:${m}%"></i><i class="f" style="width:${f}%"></i></div>`; }
/* Polskie warianty tłumaczenia */
function plVariants(pl){ return pl.replace(/\([^)]*\)/g,'').split(/[,;\/]/).map(x=>normPL(x)).filter(Boolean); }
function normPL(s){ return s.normalize('NFC').toLowerCase().replace(/\([^)]*\)/g,'').replace(/\s+/g,' ').trim().replace(/^[\s.,!?;:"'„”-]+|[\s.,!?;:"'„”-]+$/g,'').trim(); }
function noDia(s){ return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/Ł/g,'L'); }
function normEN(s){ return s.normalize('NFC').toLowerCase().replace(/[’‘`´]/g,"'").replace(/\s+/g,' ').trim().replace(/^[\s.,!?;:"“”]+|[\s.,!?;:"“”]+$/g,'').trim(); }

/* sprawdzanie odpowiedzi: {ok, note} */
function check(input,w){
  if(pl2en()){
    const a=normEN(input), b=normEN(w.w); if(!a) return {ok:false};
    if(a===b) return {ok:true};
    const s=a.replace(/^(to|a|an|the) /,''); if(s===b) return {ok:true,note:`Dobrze. Wystarczy samo „${w.w}”.`};
    if(a.replace(/[-\s']/g,'')===b.replace(/[-\s']/g,'')) return {ok:true,note:`Dobrze, ale zwróć uwagę na zapis: „${w.w}”.`};
    const mine=plVariants(w.pl);
    for(const cand of [a,s]){ for(const o of (EN_IDX[cand]||[])){ if(o.id===w.id) continue; const ov=plVariants(o.pl); if(ov.some(x=>mine.includes(x))) return {ok:true,note:`Też dobrze! Tutaj chodziło jednak o „${w.w}”.`}; } }
    return {ok:false};
  } else {
    const a=normPL(input); if(!a) return {ok:false}; const vs=plVariants(w.pl); const full=normPL(w.pl);
    const same=(EN_IDX[normEN(w.w)]||[]).filter(o=>o.id!==w.id); for(const o of same) vs.push(...plVariants(o.pl));
    if(vs.includes(a)||a===full) return {ok:true};
    if(vs.some(v=>noDia(v)===noDia(a))) return {ok:true,note:'Dobrze, ale uważaj na polskie znaki: '+w.pl};
    const s=a.replace(/ się$/,''); if(vs.some(v=>v.replace(/ się$/,'')===s)) return {ok:true,note:'Prawie: '+w.pl};
    return {ok:false};
  }
}
function answerOf(w){ return pl2en()?w.w:w.pl; }
function promptOf(w){ return pl2en()?w.pl:w.w; }
/* diff LCS: zaznacza błędne (del) i brakujące (ins) znaki */
function diffHTML(a,b){
  a=a.trim(); const A=[...a], B=[...b]; const n=A.length,m=B.length;
  const L=Array.from({length:n+1},()=>new Int16Array(m+1));
  const eq=(x,y)=>x.toLowerCase()===y.toLowerCase();
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--) L[i][j]=eq(A[i],B[j])?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
  let i=0,j=0,out='';
  const push=(t,c)=>{ out+= t==='='?esc(c): t==='-'?`<del>${esc(c)}</del>`:`<ins>${esc(c)}</ins>`; };
  while(i<n&&j<m){ if(eq(A[i],B[j])){ push('=',B[j]); i++; j++; } else if(L[i+1][j]>=L[i][j+1]){ push('-',A[i]); i++; } else { push('+',B[j]); j++; } }
  while(i<n){ push('-',A[i]); i++; } while(j<m){ push('+',B[j]); j++; }
  return out.replace(/<\/del><del>/g,'').replace(/<\/ins><ins>/g,'');
}
/* szczegóły słówka (tył karty / po odpowiedzi) */
function detail(w,opt){
  opt=opt||{};
  return `<div class="det">
    <div class="en">${esc(w.w)} ${audBtn(w.wa)}</div>
    <div class="ipa">${esc(w.i)}</div>
    <div class="meta">${esc(w.p)} · ${esc(w.c)}${opt.pl?` · <b>${esc(w.pl)}</b>`:''}</div>
    ${w.ex?`<div class="ex"><span>${esc(w.ex)}</span>${audBtn(w.ea,1)}</div><div class="ep">${esc(w.ep)}</div>`:''}
  </div>`;
}
function distractors(w,n){
  const pool=BYLEVEL[w.l]; const same=pool.filter(o=>o.p===w.p), out=[]; const seen=new Set([normEN(w.w),w.pl]);
  const mine=plVariants(w.pl);
  const tryAdd=o=>{ if(out.length>=n) return; const k1=normEN(o.w); if(seen.has(k1)||seen.has(o.pl)) return; if(plVariants(o.pl).some(x=>mine.includes(x))) return; seen.add(k1); seen.add(o.pl); out.push(o); };
  for(const o of shuffle(same).slice(0,40)) tryAdd(o);
  for(const o of shuffle(pool).slice(0,60)) tryAdd(o);
  for(const o of shuffle(W).slice(0,60)) tryAdd(o);
  return out;
}

/* ---------- ekrany ---------- */
const app=()=>$('#app');
let cleanup=null;
function route(){
  if(cleanup){ try{cleanup();}catch(e){} cleanup=null; }
  navSync(); closeSheet(); document.onkeydown=null; window.scrollTo(0,0);
  const h=location.hash.replace(/^#\/?/,''); const [r,a,b]=h.split('/');
  if(r==='s'&&PICK_DEF[a]&&b!==undefined&&!isNaN(+b)&&LEVELS[+b]) return scrSetup(a,+b);
  const l=a!==undefined&&a!==''&&!isNaN(+a)?+a:null;
  if(r==='l'&&l!==null) return scrLevel(l);
  if(r==='fis'&&l!==null) return scrFis(l);
  if(r==='learn'&&l!==null) return scrLearn(l);
  if(r==='rev') return scrLearn('rev');
  if(r==='write'&&l!==null) return scrWrite(l);
  if(r==='test'&&l!==null) return scrTest(l);
  if(r==='list') return scrList(l);
  if(r==='stats') return scrStats();
  if(r==='set') return scrSettings();
  scrHome();
}
window.addEventListener('hashchange',route);

function scrHome(){
  const due=dueIds().length; const mast=Object.values(S.p).filter(p=>p.s===2).length;
  const today=S.days[dkey(new Date())]||0;
  let h=`<div class="top home"><h1>Słówka 3000</h1><button class="ib" data-go="stats" aria-label="Statystyki">${ICON.stats}</button><button class="ib" data-go="set" aria-label="Ustawienia">${ICON.gear}</button></div>
  <div class="chips"><span class="chip">🔥 <b>${streak()}</b> ${dniTxt(streak())} z rzędu</span><span class="chip">✅ <b>${mast}</b> / ${W.length} opanowanych</span><span class="chip">📝 dziś: <b>${today}</b></span></div>`;
  if(!isStandalone()&&isIOS()&&!S.set.hideA2HS) h+=`<div class="banner">📲 <b>Dodaj do ekranu głównego:</b> w Safari stuknij <b>Udostępnij</b> (kwadrat ze strzałką) → <b>Do ekranu początkowego</b>. Wtedy aplikacja działa jak zwykła apka, a postępy nie znikną. <button class="lnk" id="hideA2">Ukryj</button></div>`;
  h+=`<button class="tile" data-go="rev"><div class="row"><span style="font-size:26px">🔁</span><span class="t">Powtórki i trudne słówka</span><span class="badge ${due?'n':''}">${due}</span></div><div class="s">${due?'Słówka, które sprawiły ci trudność albo czas je powtórzyć.':'Na razie nic do powtórki. Ucz się nowych słówek!'}</div></button>`;
  h+=`<div class="sec">Poziomy – od najłatwiejszego</div>`;
  LEVELS.forEach((L,i)=>{ const s=levelStats(i); const pct=Math.round(s.m/s.n*100);
    h+=`<button class="tile" data-go="l/${i}"><div class="row"><span style="font-size:24px">${LV_EMO[i]}</span><span class="t">${i+1}. ${esc(L.name)}</span><span class="badge">${pct}%</span></div>${bar(s)}<div class="s">${s.m} opanowanych · ${s.f} w trakcie · ${s.n} słówek</div></button>`; });
  h+=`<div class="center small muted" style="margin-top:8px">Słówka z listy Oxford 3000 (A1–B2), polskie tłumaczenia i przykłady. Wymowa: brytyjski głos syntetyczny.</div>`;
  app().innerHTML=h;
  const hb=$('#hideA2'); if(hb) hb.onclick=e=>{ e.stopPropagation(); S.set.hideA2HS=1; save(); scrHome(); };
}
function dniTxt(n){ return n===1?'dzień':'dni'; }
function isIOS(){ return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1); }
function isStandalone(){ return window.navigator.standalone===true||matchMedia('(display-mode: standalone)').matches; }

function scrLevel(l){
  if(!LEVELS[l]) return go('');
  const s=levelStats(l), L=LEVELS[l];
  app().innerHTML=`${topBar(`${LV_EMO[l]} ${esc(L.name)}`,'',`<button class="ib" data-go="list/${l}" aria-label="Lista słówek">☰</button>`)}
  <div class="tile" style="cursor:default">${bar(s)}<div class="s">✅ ${s.m} opanowanych · 🟧 ${s.f} w trakcie · ⬜ ${s.n-s.m-s.f} nowych${s.h?` · ❗ ${s.h} trudnych`:''}</div></div>
  <div class="modes">
    <button class="mode" data-go="s/fis/${l}"><span class="e">🃏</span><span class="t">Fiszki</span><span class="s">Obracaj karty, przesuwaj: umiem / nie umiem</span></button>
    <button class="mode" data-go="s/learn/${l}"><span class="e">🎯</span><span class="t">Nauka</span><span class="s">Wybór odpowiedzi, potem wpisywanie – aż opanujesz</span></button>
    <button class="mode" data-go="s/write/${l}"><span class="e">⌨️</span><span class="t">Pisanie</span><span class="s">Wpisuj angielskie słowa, sprawdzanie błędów</span></button>
    <button class="mode" data-go="s/test/${l}"><span class="e">📝</span><span class="t">Test</span><span class="s">Sprawdź się – wynik na końcu</span></button>
    <button class="mode" data-go="list/${l}"><span class="e">📚</span><span class="t">Lista słówek</span><span class="s">Przeglądaj, szukaj, słuchaj</span></button>
    <button class="mode" data-go="rev"><span class="e">🔁</span><span class="t">Powtórki</span><span class="s">Trudne i zaległe słówka</span></button>
  </div>`;
}

/* ---------- FISZKI ---------- */
function scrFis(l){
  if(!LEVELS[l]) return go('');
  let F=S.fis[l];
  if(!F||!F.ids||!F.ids.length){ goReplace('s/fis/'+l); return; }
  if(F.i>=F.ids.length) return fisEnd(l);
  const w=BYID[F.ids[F.i]]; let flipped=false;
  const front=pl2en()?`<div class="big">${esc(w.pl)}</div><div class="pos">${esc(w.pp)}</div>`:`<div class="big">${esc(w.w)}</div><div class="pos">${esc(w.i)}</div><div style="margin-top:14px">${audBtn(w.wa)}</div>`;
  const back=pl2en()?detail(w):`<div class="big">${esc(w.pl)}</div><div class="pos">${esc(w.pp)}</div>${w.ex?`<div class="det"><div class="ex"><span>${esc(w.ex)}</span>${audBtn(w.ea,1)}</div><div class="ep">${esc(w.ep)}</div></div>`:''}`;
  app().innerHTML=`${closeTop(`${F.i+1} / ${F.ids.length}`,`l/${l}`,`<button class="ib" id="fopt" aria-label="Opcje">${ICON.opts}</button>`)}
  <div class="pbar"><i style="width:${F.i/F.ids.length*100}%"></i></div>
  <div class="fcount"><span class="b">✕ ${F.u.length}</span><span class="g">${F.k.length} ✓</span></div>
  <div class="stage"><div class="swipe" id="sw"><div class="flip" id="fl">
    <div class="face front"><span class="lab">${pl2en()?'polski':'angielski'}</span>${front}</div>
    <div class="face back"><span class="lab">${pl2en()?'angielski':'polski'}</span>${back}</div></div>
    <div class="stamp l" id="stl">NIE UMIEM</div><div class="stamp r" id="str">UMIEM</div></div></div>
  <div class="fbtns"><button class="btn bad" id="fno">✕ Nie umiem</button><button class="round" id="fundo" aria-label="Cofnij" ${F.hist&&F.hist.length?'':'disabled style="opacity:.4"'}>${ICON.undo}</button><button class="btn good" id="fyes">Umiem ✓</button></div>
  <div class="hint">Stuknij kartę, by ją obrócić · przesuń w prawo = umiem, w lewo = nie umiem</div>`;
  const sw=$('#sw'), fl=$('#fl');
  const flip=()=>{ flipped=!flipped; fl.classList.toggle('on',flipped); if(flipped&&S.set.auto&&pl2en()) play(w.wa); };
  if(!pl2en()&&S.set.auto&&F.autoNext) play(w.wa);
  const answer=(ok)=>{
    if(answer.done) return; answer.done=true;
    F.hist=F.hist||[]; F.hist.push({id:w.id,ok,snap:snapP(w.id),tot:{...S.tot},days:{...S.days}}); if(F.hist.length>30) F.hist.shift();
    if(ok){ F.k.push(w.id); markOk(w.id,'flash'); } else { F.u.push(w.id); markBad(w.id); }
    if(F.pass){ const ps=passSeen('fis',l); if(!ps.includes(w.id)) ps.push(w.id); }
    F.i++; F.autoNext=true; save();
    sw.classList.add('anim'); sw.style.transform=`translateX(${ok?130:-130}%) rotate(${ok?18:-18}deg)`; sw.style.opacity='0';
    setTimeout(()=>scrFis(l),260);
  };
  // gesty
  let x0=0,y0=0,dx=0,drag=false,t0=0,pid=null;
  sw.addEventListener('pointerdown',e=>{ if(e.target.closest('[data-au]')) return; pid=e.pointerId; try{ sw.setPointerCapture(pid); }catch(_){} x0=e.clientX; y0=e.clientY; dx=0; drag=true; t0=Date.now(); sw.classList.remove('anim'); });
  sw.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==pid) return; dx=e.clientX-x0; const dy=e.clientY-y0; if(Math.abs(dx)<Math.abs(dy)&&Math.abs(dx)<10) return;
    sw.style.transform=`translateX(${dx}px) rotate(${dx/20}deg)`; $('#str').style.opacity=Math.max(0,Math.min(1,dx/90)); $('#stl').style.opacity=Math.max(0,Math.min(1,-dx/90)); });
  const end=e=>{ if(!drag) return; drag=false; const adx=Math.abs(dx);
    if(adx>90){ answer(dx>0); return; }
    sw.classList.add('anim'); sw.style.transform=''; $('#str').style.opacity=0; $('#stl').style.opacity=0;
    if(adx<8&&Date.now()-t0<600&&e.type==='pointerup') flip(); };
  sw.addEventListener('pointerup',end); sw.addEventListener('pointercancel',end);
  $('#fyes').onclick=()=>answer(true); $('#fno').onclick=()=>answer(false);
  $('#fundo').onclick=()=>{ const hh=F.hist&&F.hist.pop(); if(!hh) return; restoreP(hh.id,hh.snap,hh.tot,hh.days); if(F.pass){ const ps=passSeen('fis',l), k=ps.lastIndexOf(hh.id); if(k>-1) ps.splice(k,1); } F.i=Math.max(0,F.i-1); (hh.ok?F.k:F.u).pop(); F.autoNext=false; save(); scrFis(l); };
  $('#fopt').onclick=()=>fisMenu(l);
  document.onkeydown=e=>{ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); flip(); } else if(e.key==='ArrowRight') answer(true); else if(e.key==='ArrowLeft') answer(false); };
}
function fisMenu(l){
  openSheet(`<div><h3 style="margin:0 0 10px">Fiszki – opcje</h3>
    <button class="btn sec2" id="fshuf">${ICON.shuf.replace('<svg','<svg width="20" height="20"')} Przetasuj pozostałe karty</button>
    <button class="btn sec2" id="fnew">Nowa sesja – wybierz słówka</button>
    <button class="btn ghost" id="fclose">Wróć do kart</button></div>`);
  $('#fclose').onclick=closeSheet;
  $('#fnew').onclick=()=>{ closeSheet(); goReplace('s/fis/'+l); };
  $('#fshuf').onclick=()=>{ const F2=S.fis[l]; const rest=shuffle(F2.ids.slice(F2.i)); F2.ids=F2.ids.slice(0,F2.i).concat(rest); F2.hist=[]; save(); closeSheet(); scrFis(l); toast('Przetasowano'); };
}
function openSheet(html){ closeSheet(); const d=document.createElement('div'); d.className='sheet'; d.id='sheet'; d.innerHTML=html; d.onclick=e=>{ if(e.target===d) closeSheet(); }; document.body.appendChild(d); }
function closeSheet(){ const s=$('#sheet'); if(s) s.remove(); }
function fisEnd(l){
  const F=S.fis[l]; const k=F.k.length,u=[...new Set(F.u)];
  app().innerHTML=`${closeTop('Fiszki',`l/${l}`)}
  <div class="confetti">${u.length?'💪':'🎉'}</div><div class="res">${k} / ${F.ids.length}</div><div class="center muted">kart oznaczonych jako „umiem”</div>
  ${F.pass?`<button class="btn" id="fnext">Następne karty (${S.set.fisN})</button>`:''}
  ${u.length?`<button class="btn ${F.pass?'sec2':''}" id="fu">Ucz się nieumianych (${u.length})</button>`:''}
  <button class="btn sec2" data-rep="s/learn/${l}">🎯 Przejdź do trybu Nauka</button>
  <button class="btn sec2" id="fre">Ustawienia sesji</button>
  <button class="btn ghost" data-back="l/${l}">Wróć do poziomu</button>`;
  if(u.length) $('#fu').onclick=()=>{ S.fis[l]={ids:shuffle(u),i:0,k:[],u:[],opt:F.opt,hist:[],pass:false}; save(); scrFis(l); };
  $('#fre').onclick=()=>{ delete S.fis[l]; save(); goReplace('s/fis/'+l); };
  const fn=$('#fnext'); if(fn) fn.onclick=()=>{ if(!startFis(l,F.opt,1)) toast('Brak kolejnych kart'); else scrFis(l); };
}

/* ---------- NAUKA (jak Learn: wybór → wpisywanie → opanowane) ---------- */
let LS=null;
let LP=null;
function scrLearn(l,fresh=true){
  const rev=l==='rev';
  if(!rev&&!LEVELS[l]) return go('');
  let ids;
  if(rev){ ids=dueIds().slice(0,15); if(!ids.length){ app().innerHTML=`${closeTop('Powtórki','')}<div class="confetti">🌟</div><h3 class="center">Nie masz nic do powtórki</h3><p class="center muted">Słówka, w których się pomylisz albo które opanujesz, wrócą tu do powtórki po 1, 3, 7… dniach.</p><button class="btn" data-go="">Wróć</button>`; return; } }
  else {
    if(fresh||!LP||LP.l!==l){ const o=getPick('learn'); LP={l,o,rounds:o.r==='norm'?0:+o.r,done:0,words:0}; }
    const R=buildRound('learn',l,LP.o,S.set.learnN); ids=R.ids;
    if(R.reset) toast('Przerobiłeś wszystkie słówka – nowe przejście od początku');
    if(!ids.length){
      const allM=BYLEVEL[l].every(w=>st(w.id)===2);
      app().innerHTML=`${closeTop('Nauka',`l/${l}`)}<div class="confetti">🏆</div><h3 class="center">${allM?'Opanowałeś cały poziom!':'Brak słówek w tym wyborze'}</h3><p class="center muted">${allM?'Teraz rób powtórki i testy, żeby nie zapomnieć.':'Zmień ustawienia sesji.'}</p><button class="btn" data-rep="s/learn/${l}">Ustawienia sesji</button><button class="btn sec2" data-go="rev">🔁 Powtórki</button><button class="btn sec2" data-rep="s/test/${l}">📝 Test</button>`; LP=null; return; }
  }
  LS={l,rev,ids,stg:{},q:shuffle(ids),first:{},bad:new Set(),title:rev?'Powtórki':'Nauka'};
  ids.forEach(id=>LS.stg[id]=rev?1:Math.min(st(id),1));
  learnNext();
}
function learnProgress(){ const n=LS.ids.length; let s=0; for(const id of LS.ids) s+=Math.min(2,LS.stg[id]); return s/(2*n); }
function learnNext(){
  if(!LS.q.length) return learnEnd();
  const id=LS.q[0], w=BYID[id], mc=LS.stg[id]===0;
  const back=LS.rev?'':`l/${LS.l}`;
  const head=`${closeTop(LS.title,back,`<span class="small muted" style="width:44px;text-align:right">${LS.ids.length-LS.q.length}/${LS.ids.length}</span>`)}<div class="pbar"><i style="width:${learnProgress()*100}%"></i></div>`;
  const lab=mc?'Wybierz poprawną odpowiedź':(pl2en()?'Wpisz po angielsku':'Wpisz po polsku');
  const pr=`<div class="qcard"><div class="lab"><span>${lab}</span><span>${isHard(id)?'❗ trudne':''}</span></div><div class="prompt">${esc(promptOf(w))}</div><div class="pos">${pl2en()?esc(w.pp):esc(w.i)+' '}${!pl2en()?audBtn(w.wa,1):''}</div></div>`;
  if(mc){
    const opts=shuffle([w].concat(distractors(w,3)));
    app().innerHTML=head+pr+`<div class="opts">${opts.map((o,i)=>`<button class="opt" data-id="${o.id}"><span class="k">${i+1}</span><span>${esc(answerOf(o))}</span></button>`).join('')}</div>
      <button class="btn ghost" id="dk">Nie wiem</button><div id="fbx"></div>`;
    const pick=(oid)=>{
      if(pick.done) return; pick.done=true; const ok=oid===id;
      $$('.opt').forEach(b=>{ const bid=+b.dataset.id; b.disabled=true; if(bid===id) b.classList.add('ok'); else if(bid===oid) b.classList.add('no'); else b.classList.add('dim'); });
      $('#dk').remove(); learnAnswer(ok,'mc');
    };
    $$('.opt').forEach(b=>b.onclick=()=>pick(+b.dataset.id)); $('#dk').onclick=()=>pick(-1);
    document.onkeydown=e=>{ const n=+e.key; if(n>=1&&n<=4&&!pick.done) pick(+$$('.opt')[n-1].dataset.id); else if(e.key==='Enter'&&pick.done) $('#nx')&&$('#nx').click(); };
  } else {
    app().innerHTML=head+pr+typeBox()+`<div id="fbx"></div>`;
    bindType(w,(ok,typed,res)=>learnAnswer(ok,'type',typed,res));
  }
}
function typeBox(){ return `<form id="tf" autocomplete="off"><input class="tin" id="ti" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="go" placeholder="${pl2en()?'Wpisz angielskie słowo…':'Wpisz polskie tłumaczenie…'}" aria-label="Odpowiedź"><button class="btn" id="tsub" type="submit">Sprawdź</button><button class="btn ghost" id="tdk" type="button">Nie wiem</button></form>`; }
function bindType(w,cb){
  const ti=$('#ti'); let done=false;
  try{ ti.focus({preventScroll:true}); }catch(e){ ti.focus(); }
  const fin=(typed)=>{ if(done) return; done=true; const res=typed?check(typed,w):{ok:false}; ti.readOnly=true; ti.blur(); $('#tsub').remove(); $('#tdk').remove(); cb(res.ok,typed,res); };
  $('#tf').onsubmit=e=>{ e.preventDefault(); const v=ti.value; if(!v.trim()){ ti.focus(); return; } fin(v); };
  $('#tdk').onclick=()=>fin('');
  document.onkeydown=e=>{ if(e.key==='Enter'&&done){ e.preventDefault(); $('#nx')&&$('#nx').click(); } };
}
function feedbackHTML(ok,w,typed,res,canOverride){
  const ans=answerOf(w);
  let h=`<div class="fb ${ok?'ok':'no'}"><div class="h">${ok?pickPraise():(typed?'Jeszcze nie…':'Zapamiętaj:')}</div>`;
  if(!ok&&typed&&typed.trim()) h+=`<div class="small muted">Twoja odpowiedź → poprawka:</div><div class="diff">${diffHTML(typed,ans)}</div>`;
  if(!ok) h+=`<div class="small muted">Poprawna odpowiedź:</div><div style="font-size:22px;font-weight:800">${esc(ans)}</div>`;
  if(res&&res.note) h+=`<div class="note">${esc(res.note)}</div>`;
  h+=`</div><div class="detbox">${detail(w,{pl:!pl2en()||true})}</div>`;
  h+=`<button class="btn" id="nx">Dalej</button>`;
  if(canOverride) h+=`<button class="btn ghost" id="ovr">Miałem rację – zalicz</button>`;
  return h;
}
const PRAISE=['Świetnie!','Dobrze!','Brawo!','Super!','Tak jest!','Idealnie!'];
function pickPraise(){ return PRAISE[Math.floor(Math.random()*PRAISE.length)]; }
function learnAnswer(ok,kind,typed,res){
  const id=LS.q[0], w=BYID[id];
  const snap={p:snapP(id),tot:{...S.tot},days:{...S.days},q:LS.q.slice(),stg:{...LS.stg},first:{...LS.first},bad:new Set(LS.bad)};
  const apply=(ok)=>{
    LS.q.shift();
    const firstTime=!(id in LS.first); if(firstTime) LS.first[id]=ok;
    if(ok){ LS.stg[id]++; markOk(id,kind,!LS.bad.has(id)); if(LS.rev&&firstTime&&LS.stg[id]>=2) srsOk(id);
      if(LS.stg[id]<2) LS.q.splice(Math.min(LS.q.length,3),0,id); }
    else { LS.bad.add(id); LS.stg[id]=Math.max(0,LS.stg[id]-1); markBad(id); LS.q.splice(Math.min(LS.q.length,2),0,id); }
  };
  apply(ok);
  const fbx=$('#fbx'); fbx.innerHTML=feedbackHTML(ok,w,typed,res,!ok&&kind==='type'&&typed&&typed.trim());
  $('.pbar i').style.width=learnProgress()*100+'%';
  if(S.set.auto) play(w.wa);
  $('#nx').onclick=()=>learnNext();
  const ov=$('#ovr'); if(ov) ov.onclick=()=>{ restoreP(id,snap.p,snap.tot,snap.days); LS.q=snap.q; LS.stg=snap.stg; LS.first=snap.first; LS.bad=snap.bad; apply(true); toast('Zaliczone ✓'); learnNext(); };
  setTimeout(()=>{ const nx=$('#nx'); if(nx) nx.scrollIntoView({block:'nearest',behavior:'smooth'}); },50);
}
function learnEnd(){
  const n=LS.ids.length, firstOk=Object.values(LS.first).filter(Boolean).length;
  const back=LS.rev?'':`l/${LS.l}`; let more, sessDone=false;
  if(LS.rev) more=dueIds().length; else { if(LP){ LP.done++; LP.words+=n; } more=LP?availCount('learn',LS.l,LP.o):0; sessDone=!!(LP&&LP.rounds&&LP.done>=LP.rounds); }
  const s=LS.rev?null:levelStats(LS.l);
  app().innerHTML=`${closeTop(LS.title,back)}<div class="confetti">🎉</div>${sessDone?`<h3 class="center" style="margin:4px 0">Sesja ukończona: ${LP.done} ${plural(LP.done,'runda','rundy','rund')}, ${LP.words} słówek</h3>`:''}<div class="res">${n} ${n===1?'słówko':'słówek'}</div>
  <div class="center muted">${LS.rev?'powtórzonych':`w rundzie ${LP?LP.done:1}${LP&&LP.rounds?'/'+LP.rounds:''}`} · za pierwszym razem dobrze: ${firstOk}/${n}</div>
  ${s?`<div class="tile" style="margin-top:16px">${bar(s)}<div class="s">Poziom ${esc(LEVELS[LS.l].name)}: ${s.m}/${s.n} opanowanych</div></div>`:''}
  <div class="detbox" style="text-align:left">${LS.ids.map(id=>{ const w=BYID[id]; return `<div class="wi"><span class="dot ${LS.first[id]?'m':'h'}"></span><div class="x"><div class="a">${esc(w.w)}</div><div class="b">${esc(w.pl)}</div></div>${audBtn(w.wa,1)}</div>`; }).join('')}</div>
  ${more?`<button class="btn" id="again">${LS.rev?`Kolejne powtórki (${more})`:sessDone?'Jeszcze jedna runda':`Następna runda${LP&&LP.rounds?` (${LP.done+1}/${LP.rounds})`:''}`}</button>`:''}
  <button class="btn ghost" data-back="${back}">Zakończ</button>`;
  const a=$('#again'); if(a) a.onclick=()=>{ if(sessDone&&LP) LP.rounds++; scrLearn(LS.rev?'rev':LS.l,false); };
  document.onkeydown=e=>{ if(e.key==='Enter'&&a) a.click(); };
}

/* ---------- PISANIE ---------- */
let WS=null;
let WP=null;
function scrWrite(l,fresh=true){
  if(!LEVELS[l]) return go('');
  if(fresh||!WP||WP.l!==l){ const o=getPick('write'); WP={l,o,rounds:o.r==='norm'?0:+o.r,done:0,words:0}; }
  const R=buildRound('write',l,WP.o,S.set.writeN); const ids=R.ids;
  if(R.reset) toast('Przerobiłeś wszystkie słówka – nowe przejście od początku');
  if(!ids.length){ app().innerHTML=`${closeTop('Pisanie',`l/${l}`)}<div class="confetti">🏆</div><h3 class="center">Brak słówek w tym wyborze</h3><button class="btn" data-rep="s/write/${l}">Ustawienia sesji</button><button class="btn ghost" data-back="l/${l}">Wróć do poziomu</button>`; WP=null; return; }
  WS={l,round:1,q:shuffle(ids),wrong:[],ids,firstOk:{},done:0};
  writeNext();
}
function writeNext(){
  if(!WS.q.length){
    if(WS.wrong.length){ WS.q=shuffle([...new Set(WS.wrong)]); WS.wrong=[]; WS.round++; toast(`Runda ${WS.round}: popraw błędy (${WS.q.length})`); }
    else return writeEnd();
  }
  const id=WS.q[0], w=BYID[id];
  const total=WS.ids.length, prog=Object.keys(WS.firstOk).length;
  app().innerHTML=`${closeTop(`Pisanie${WS.round>1?' · runda '+WS.round:''}`,`l/${WS.l}`,`<span class="small muted" style="width:44px;text-align:right">${Math.min(prog+1,total)}/${total}</span>`)}<div class="pbar"><i style="width:${prog/total*100}%"></i></div>
  <div class="qcard"><div class="lab"><span>${pl2en()?'Wpisz po angielsku':'Wpisz po polsku'}</span><span>${isHard(id)?'❗ trudne':''}</span></div><div class="prompt">${esc(promptOf(w))}</div><div class="pos">${pl2en()?esc(w.pp):esc(w.i)} ${!pl2en()?audBtn(w.wa,1):''}</div></div>${typeBox()}<div id="fbx"></div>`;
  bindType(w,(ok,typed,res)=>{
    const snap={p:snapP(id),tot:{...S.tot},days:{...S.days},fo:{...WS.firstOk},wrong:WS.wrong.slice()};
    const apply=ok=>{ if(!(id in WS.firstOk)) WS.firstOk[id]=ok; if(ok){ markOk(id,'type',WS.firstOk[id]!==false); } else { markBad(id); WS.wrong.push(id); } };
    apply(ok);
    $('#fbx').innerHTML=feedbackHTML(ok,w,typed,res,!ok&&typed&&typed.trim());
    if(S.set.auto) play(w.wa);
    $('#nx').onclick=()=>{ WS.q.shift(); writeNext(); };
    const ov=$('#ovr'); if(ov) ov.onclick=()=>{ restoreP(id,snap.p,snap.tot,snap.days); WS.firstOk=snap.fo; WS.wrong=snap.wrong; apply(true); toast('Zaliczone ✓'); WS.q.shift(); writeNext(); };
    setTimeout(()=>{ const nx=$('#nx'); if(nx) nx.scrollIntoView({block:'nearest',behavior:'smooth'}); },50);
  });
}
function writeEnd(){
  const n=WS.ids.length, ok=Object.values(WS.firstOk).filter(Boolean).length;
  if(WP){ WP.done++; WP.words+=n; } const more=WP?availCount('write',WS.l,WP.o):0, sessDone=!!(WP&&WP.rounds&&WP.done>=WP.rounds);
  app().innerHTML=`${closeTop('Pisanie',`l/${WS.l}`)}<div class="confetti">${ok===n?'🏆':'✍️'}</div><div class="res">${Math.round(ok/n*100)}%</div><div class="center muted">za pierwszym razem dobrze: ${ok}/${n}</div>
  <div class="detbox" style="text-align:left">${WS.ids.map(id=>{ const w=BYID[id]; return `<div class="wi"><span class="dot ${WS.firstOk[id]?'m':'h'}"></span><div class="x"><div class="a">${esc(w.w)}</div><div class="b">${esc(w.pl)}</div></div>${audBtn(w.wa,1)}</div>`; }).join('')}</div>
  ${sessDone?`<h3 class="center">Sesja ukończona: ${WP.done} ${plural(WP.done,'runda','rundy','rund')}, ${WP.words} słówek</h3>`:''}
  ${more?`<button class="btn" id="again">${sessDone?'Jeszcze jedna runda':`Kolejne słówka${WP&&WP.rounds?` (runda ${WP.done+1}/${WP.rounds})`:''}`}</button>`:`<button class="btn" data-rep="s/write/${WS.l}">Ustawienia sesji</button>`}<button class="btn ghost" data-back="l/${WS.l}">Zakończ</button>`;
  const ag=$('#again'); if(ag) ag.onclick=()=>{ if(sessDone&&WP) WP.rounds++; scrWrite(WS.l,false); };
}

/* ---------- TEST ---------- */
let TS=null;
function scrTest(l){
  if(!LEVELS[l]) return go('');
  const o=Object.assign({mc:true,wr:true,tf:true},S.set.test||{});
  const types=['mc','wr','tf'].filter(k=>o[k]); if(!types.length) types.push('mc','wr','tf');
  const ws=pickIds(l,getPick('test'),'test').map(id=>BYID[id]);
  if(!ws.length){ app().innerHTML=`${closeTop('Test',`l/${l}`)}<div class="confetti">🤷</div><h3 class="center">Brak słówek w tym wyborze</h3><button class="btn" data-rep="s/test/${l}">Zmień ustawienia</button>`; return; }
  const qs=ws.map((w,i)=>{ const t=types[i%types.length]; const q={id:w.id,t};
    if(t==='mc') q.opts=shuffle([w].concat(distractors(w,3))).map(x=>x.id);
    if(t==='tf'){ q.truth=Math.random()<.5; q.shown=q.truth?w.id:distractors(w,1)[0].id; }
    return q; });
  TS={l,qs:shuffle(qs),i:0,ans:[]}; testNext();
}

/* ---------- WYBÓR SŁÓWEK PRZED SESJĄ (jak w Quizlecie) ---------- */
const MODE_NAME={fis:'Fiszki',learn:'Nauka',write:'Pisanie',test:'Test'}, MODE_EMO={fis:'🃏',learn:'🎯',write:'⌨️',test:'📝'};
const PICK_DEF={fis:{r:'norm',order:'seq',range:'all'},learn:{r:'norm',order:'seq',range:'all'},write:{r:'norm',order:'seq',range:'all'},test:{n:20,order:'shuf',range:'all'}};
const R_PRESETS=[1,2,3,5,10], WRONG_MAX=2;
function plural(n,a,b,c){ const d=n%10, dd=n%100; return n===1?a:(d>=2&&d<=4&&!(dd>=12&&dd<=14))?b:c; }
function roundSize(mode){ return mode==='learn'?S.set.learnN:mode==='write'?S.set.writeN:S.set.fisN; }
function passSeen(mode,l){ S.seen=S.seen||{}; S.seen[mode]=S.seen[mode]||{}; return S.seen[mode][l]=S.seen[mode][l]||[]; }
/* błędne, jeszcze nieopanowane słówka – najdawniej ćwiczone najpierw */
function wrongWords(l){ return BYLEVEL[l].filter(w=>{ const p=S.p[w.id]; return p&&p.h&&p.s<2; }).sort((a,b)=>(S.p[a.id].t||0)-(S.p[b.id].t||0)); }
/* skąd biorą się nowe słówka dla trybu; usePass = przechodzimy po kolei z zapamiętanym miejscem (bez powtórek) */
function roundBase(mode,l,o){
  if(o.range==='hard') return {base:wrongWords(l).concat(BYLEVEL[l].filter(w=>isHard(w.id)&&st(w.id)===2)),usePass:false,mix:false};
  if(o.range==='seen') return {base:BYLEVEL[l].filter(w=>S.p[w.id]),usePass:true,mix:false};
  if(mode==='fis') return {base:o.range==='todo'?BYLEVEL[l].filter(w=>st(w.id)<2):BYLEVEL[l].slice(),usePass:true,mix:true};
  if(mode==='write'&&o.range==='all') return {base:BYLEVEL[l].filter(w=>!(isHard(w.id)&&st(w.id)<2)),usePass:true,mix:true};
  /* Nauka (Wszystkie/Nieumiane) i Pisanie (Nieumiane): nowe = jeszcze nieopanowane i bez błędów; opanowane nie wracają */
  return {base:BYLEVEL[l].filter(w=>st(w.id)<2&&!isHard(w.id)),usePass:false,mix:true};
}
function availCount(mode,l,o){ const B=roundBase(mode,l,o); const ps=B.usePass?new Set(passSeen(mode,l)):null;
  return (ps&&B.base.every(w=>ps.has(w.id))?B.base.length:B.base.filter(w=>!ps||!ps.has(w.id)).length)+(B.mix?wrongWords(l).length:0); }
/* jedna runda: głównie NOWE słówka (dalej od miejsca, gdzie skończyłeś) + maks. 2 błędne, wmieszane losowo */
function buildRound(mode,l,o,R,exclude){
  exclude=exclude||new Set(); const B=roundBase(mode,l,o); let reset=false;
  const seen=B.usePass?new Set(passSeen(mode,l)):new Set();
  if(B.usePass&&B.base.length&&B.base.every(w=>seen.has(w.id))){ S.seen[mode][l]=[]; seen.clear(); reset=true; }
  let cand=B.base.filter(w=>!seen.has(w.id)&&!exclude.has(w.id));
  if(o.order==='shuf'&&o.range!=='hard') cand=shuffle(cand);
  const wrong=B.mix?wrongWords(l).filter(w=>!exclude.has(w.id)):[];
  let wPart=wrong.slice(0,Math.min(WRONG_MAX,R));
  const fresh=cand.filter(w=>!wPart.includes(w)).slice(0,R-wPart.length);
  if(fresh.length+wPart.length<R) wPart=wrong.slice(0,R-fresh.length);   /* nowe się skończyły → więcej poprawek */
  const ids=fresh.map(w=>w.id);
  for(const w of wPart){ ids.splice(Math.floor(Math.random()*(ids.length+1)),0,w.id); }
  if(B.usePass&&mode!=='fis'){ const ps=passSeen(mode,l); fresh.forEach(w=>{ if(!ps.includes(w.id)) ps.push(w.id); }); }
  save(); return {ids,nNew:fresh.length,nWrong:wPart.length,reset};
}
function startFis(l,o,rounds){
  const ex=new Set(); let ids=[], reset=false;
  for(let r=0;r<rounds;r++){ const R=buildRound('fis',l,o,S.set.fisN,ex); if(R.reset) reset=true; if(!R.ids.length) break; R.ids.forEach(id=>ex.add(id)); ids=ids.concat(R.ids); }
  if(reset) toast('Przejrzałeś wszystkie karty – nowe przejście od początku');
  if(!ids.length) return false;
  S.fis[l]={ids,i:0,k:[],u:[],opt:{order:o.order,range:o.range},hist:[],pass:true}; save(); return true;
}
const N_PRESETS=[10,20,30,50,100];
function getPick(m){ S.set.pick=S.set.pick||{}; return Object.assign({},PICK_DEF[m],S.set.pick[m]||{}); }
function rangeWords(l,range){ return BYLEVEL[l].filter(w=>range==='all'||(range==='todo'&&st(w.id)<2)||(range==='hard'&&isHard(w.id))||(range==='seen'&&!!S.p[w.id])); }
function pickIds(l,o,mode){
  let ws=rangeWords(l,o.range);
  if(o.order==='shuf') ws=shuffle(ws);
  else if(mode==='learn'||mode==='write'){ const a=ws.filter(w=>isHard(w.id)||st(w.id)===1), b=ws.filter(w=>!(isHard(w.id)||st(w.id)===1)); ws=a.concat(b); }
  const n=o.n==='all'?ws.length:Math.max(1,Math.min(parseInt(o.n,10)||ws.length,ws.length));
  return ws.slice(0,n).map(w=>w.id);
}
function scrSetup(mode,l){
  const o=getPick(mode), L=LEVELS[l], F=mode==='fis'?S.fis[l]:null;
  const t=Object.assign({mc:true,wr:true,tf:true},S.set.test||{});
  const cnt=r=>rangeWords(l,r).length;
  const ranges=[['all','Wszystkie'],['todo','Tylko nieumiane'],['hard','Tylko trudne'],['seen','Już ćwiczone']];
  const isT=mode==='test';
  const isPreset=isT?(o.n==='all'||N_PRESETS.includes(+o.n)):(o.r==='norm'||R_PRESETS.includes(+o.r));
  app().innerHTML=`${closeTop(`${MODE_EMO[mode]} ${MODE_NAME[mode]}`,`l/${l}`)}
  <h3 style="margin:4px 0 10px">${LV_EMO[l]} ${esc(L.name)}</h3>
  ${F&&F.ids&&F.ids.length&&F.i<F.ids.length?`<button class="tile" id="pcont"><div class="row"><span style="font-size:22px">▶️</span><span class="t">Kontynuuj poprzednią sesję</span><span class="badge">${F.i+1}/${F.ids.length}</span></div></button>`:''}
  ${isT?`<div class="sec">Ile pytań?</div>
  <div class="nchips" id="pn"><button class="nchip wide" data-v="all">Wszystkie</button>${N_PRESETS.map(n=>`<button class="nchip" data-v="${n}">${n}</button>`).join('')}</div>
  <input class="tin" id="pc" type="number" inputmode="numeric" pattern="[0-9]*" min="1" placeholder="Własna liczba pytań, np. 15" value="${isPreset?'':esc(o.n)}" style="margin-top:10px" aria-label="Własna liczba pytań">`
  :`<div class="sec">Ile rund?</div>
  <div class="nchips" id="pn"><button class="nchip wide" data-v="norm">Normalnie (domyślnie)</button>${R_PRESETS.map(n=>`<button class="nchip" data-v="${n}">${n}</button>`).join('')}</div>
  <input class="tin" id="pc" type="number" inputmode="numeric" pattern="[0-9]*" min="1" placeholder="Własna liczba rund, np. 4" value="${isPreset?'':esc(o.r)}" style="margin-top:10px" aria-label="Własna liczba rund">`}
  <div class="sec">Które słówka?</div>
  <div class="nchips" id="pr">${ranges.map(r=>`<button class="nchip" data-v="${r[0]}">${r[1]} <span class="cnt">${cnt(r[0])}</span></button>`).join('')}</div>
  <div class="sec">Kolejność</div>
  <div class="nchips" id="po"><button class="nchip" data-v="seq">Kolejno (od najłatwiejszych)</button><button class="nchip" data-v="shuf">Losowo</button></div>
  ${mode==='test'?`<div class="sec">Rodzaje pytań</div><div class="set">
   <div class="si"><div class="x">Wybór z 4 odpowiedzi</div><button class="sw ${t.mc?'on':''}" data-k="mc" aria-label="Wybór"></button></div>
   <div class="si"><div class="x">Wpisywanie</div><button class="sw ${t.wr?'on':''}" data-k="wr" aria-label="Wpisywanie"></button></div>
   <div class="si"><div class="x">Prawda / fałsz</div><button class="sw ${t.tf?'on':''}" data-k="tf" aria-label="Prawda fałsz"></button></div></div>
   <p class="muted small">Odpowiedzi poznasz dopiero na końcu – jak na prawdziwym sprawdzianie.</p>`:''}
  <div class="psum" id="psum"></div>
  <button class="btn" id="pgo">${mode==='test'?'Rozpocznij test':'Start'}</button>
  <button class="btn ghost" data-back="l/${l}">Anuluj</button>`;
  const sync=()=>{
    $$('#pn .nchip').forEach(b=>b.classList.toggle('on',String(isT?o.n:o.r)===b.dataset.v));
    $$('#pr .nchip').forEach(b=>b.classList.toggle('on',o.range===b.dataset.v));
    $$('#po .nchip').forEach(b=>b.classList.toggle('on',o.order===b.dataset.v));
    if(isT){ const av=cnt(o.range); const n=o.n==='all'?av:Math.min(parseInt(o.n,10)||0,av);
      $('#psum').innerHTML=av?`Pytań: <b>${n}</b> z ${av} dostępnych słówek`:'Brak słówek w tym wyborze – wybierz inne.'; $('#pgo').disabled=!av||!n; return; }
    const R=roundSize(mode), av=availCount(mode,l,o), wr=wrongWords(l).length, B=roundBase(mode,l,o);
    const word=mode==='fis'?'kart':'słówek';
    let h=o.r==='norm'?`Rundy po <b>${R}</b> ${word}${B.mix?' – głównie nowe + maks. 2 błędne':''}. Po każdej rundzie grasz dalej albo kończysz.`
      :`<b>${o.r}</b> ${plural(+o.r,'runda','rundy','rund')} × ${R} = <b>${o.r*R}</b> ${word}${B.mix?' (w każdej rundzie maks. 2 błędne)':''}`;
    const ps=B.usePass?new Set(passSeen(mode,l)):null, left=B.base.filter(w=>!ps||!ps.has(w.id)).length;
    h+=`<br>${B.usePass?`Zostało w tym przejściu: <b>${left}</b> z ${B.base.length} – zaczniesz tam, gdzie skończyłeś`:`Nowych do nauki: <b>${B.base.length}</b>`}${B.mix?` · błędnych do poprawy: <b>${wr}</b>`:''}`;
    $('#psum').innerHTML=av?h:'Brak słówek w tym wyborze – wybierz inne.'; $('#pgo').disabled=!av;
  };
  $$('#pn .nchip').forEach(b=>b.onclick=()=>{ const v=b.dataset.v; if(isT) o.n=v==='all'?'all':+v; else o.r=v==='norm'?'norm':+v; $('#pc').value=''; sync(); });
  $('#pc').oninput=e=>{ const v=Math.min(parseInt(e.target.value,10)||0,isT?5000:100); if(isT){ if(v>0) o.n=v; else if(!N_PRESETS.includes(+o.n)) o.n='all'; } else { if(v>0) o.r=v; else if(!R_PRESETS.includes(+o.r)) o.r='norm'; } sync(); };
  $$('#pr .nchip').forEach(b=>b.onclick=()=>{ o.range=b.dataset.v; sync(); });
  $$('#po .nchip').forEach(b=>b.onclick=()=>{ o.order=b.dataset.v; sync(); });
  $$('.sw[data-k]').forEach(b=>b.onclick=()=>{ t[b.dataset.k]=!t[b.dataset.k]; b.classList.toggle('on',t[b.dataset.k]); });
  const pc=$('#pcont'); if(pc) pc.onclick=()=>goReplace('fis/'+l);
  $('#pgo').onclick=()=>{
    if(mode==='test'&&!t.mc&&!t.wr&&!t.tf){ toast('Wybierz co najmniej jeden rodzaj pytań'); return; }
    S.set.pick=S.set.pick||{}; S.set.pick[mode]=isT?{n:o.n,order:o.order,range:o.range}:{r:o.r,order:o.order,range:o.range}; if(isT) S.set.test=t; save();
    if(mode==='fis'&&!startFis(l,o,o.r==='norm'?1:+o.r)){ toast('Brak kart w tym wyborze'); return; }
    goReplace(mode+'/'+l);
  };
  sync();
}
function testNext(){
  if(TS.i>=TS.qs.length) return testEnd();
  const q=TS.qs[TS.i], w=BYID[q.id]; const n=TS.qs.length;
  const head=`${closeTop(`Test ${TS.i+1}/${n}`,`l/${TS.l}`)}<div class="pbar"><i style="width:${TS.i/n*100}%"></i></div>`;
  const next=(a)=>{ TS.ans[TS.i]=a; TS.i++; testNext(); };
  if(q.t==='mc'){
    app().innerHTML=head+`<div class="qcard"><div class="lab">Wybierz odpowiedź</div><div class="prompt">${esc(promptOf(w))}</div><div class="pos">${pl2en()?esc(w.pp):esc(w.i)}</div></div><div class="opts">${q.opts.map((id,i)=>`<button class="opt" data-id="${id}"><span class="k">${i+1}</span><span>${esc(answerOf(BYID[id]))}</span></button>`).join('')}</div><button class="btn ghost" id="skip">Nie wiem</button>`;
    $$('.opt').forEach(b=>b.onclick=()=>next(+b.dataset.id)); $('#skip').onclick=()=>next(-1);
    document.onkeydown=e=>{ const k=+e.key; if(k>=1&&k<=4) next(q.opts[k-1]); };
  } else if(q.t==='tf'){
    const o=BYID[q.shown];
    app().innerHTML=head+`<div class="qcard"><div class="lab">Prawda czy fałsz?</div><div class="prompt">${esc(promptOf(w))}</div><div class="pos" style="margin:10px 0">=</div><div class="prompt" style="color:var(--pri2)">${esc(answerOf(o))}</div></div><div class="tf"><button class="btn good" id="tt">Prawda</button><button class="btn bad" id="ff">Fałsz</button></div>`;
    $('#tt').onclick=()=>next(true); $('#ff').onclick=()=>next(false);
  } else {
    app().innerHTML=head+`<div class="qcard"><div class="lab">${pl2en()?'Wpisz po angielsku':'Wpisz po polsku'}</div><div class="prompt">${esc(promptOf(w))}</div><div class="pos">${pl2en()?esc(w.pp):esc(w.i)}</div></div>
    <form id="tf2" autocomplete="off"><input class="tin" id="ti" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="next" placeholder="Twoja odpowiedź…"><button class="btn" type="submit">Dalej</button><button class="btn ghost" type="button" id="skip">Nie wiem</button></form>`;
    const ti=$('#ti'); try{ ti.focus({preventScroll:true}); }catch(e){}
    $('#tf2').onsubmit=e=>{ e.preventDefault(); next(ti.value); }; $('#skip').onclick=()=>next('');
  }
}
function testEnd(){
  let ok=0; const rows=TS.qs.map((q,i)=>{ const w=BYID[q.id], a=TS.ans[i]; let good,yours;
    if(q.t==='mc'){ good=a===q.id; yours=a>=0?answerOf(BYID[a]):'—'; }
    else if(q.t==='tf'){ good=a===q.truth; yours=(a?'Prawda':'Fałsz')+` (${answerOf(BYID[q.shown])})`; }
    else { const r=a?check(a,w):{ok:false}; good=r.ok; yours=a||'—'; }
    if(good){ ok++; markOk(q.id,'test'); } else markBad(q.id);
    return `<div class="ri ${good?'':'no'}"><div style="display:flex;gap:8px;align-items:center"><div style="flex:1"><b>${esc(promptOf(w))}</b> → ${esc(answerOf(w))}</div>${audBtn(w.wa,1)}</div>${good?'':`<div class="small muted">Twoja odpowiedź: ${esc(yours)}</div>`}</div>`; });
  const pct=Math.round(ok/TS.qs.length*100);
  app().innerHTML=`${closeTop('Wynik testu',`l/${TS.l}`)}<div class="confetti">${pct>=90?'🏆':pct>=70?'👏':pct>=50?'🙂':'📚'}</div><div class="res">${pct}%</div><div class="center muted">${ok} z ${TS.qs.length} poprawnie${ok<TS.qs.length?' · błędne słówka trafiły do powtórek':''}</div>
  <div class="sec">Odpowiedzi</div>${rows.join('')}
  <button class="btn" data-rep="s/test/${TS.l}">Nowy test</button>${ok<TS.qs.length?`<button class="btn sec2" data-go="rev">🔁 Powtórz błędy</button>`:''}<button class="btn ghost" data-back="l/${TS.l}">Wróć do poziomu</button>`;
}

/* ---------- LISTA ---------- */
function scrList(l){
  const all=l===null||!LEVELS[l]; const ws=all?W:BYLEVEL[l]; let filt='';
  app().innerHTML=`${topBar(all?'Wszystkie słówka':`Lista: ${esc(LEVELS[l].name)}`,all?'':`l/${l}`)}<input class="search" id="q" type="search" placeholder="Szukaj (polski lub angielski)…" autocorrect="off" autocapitalize="none" spellcheck="false"><div class="small muted" style="margin:-4px 4px 8px">🟩 opanowane · 🟧 w trakcie · 🟥 trudne · stuknij wiersz, by zobaczyć przykład</div><div class="wl" id="wl"></div><div id="more"></div>`;
  let limit=150;
  const draw=()=>{ const f=noDia(filt.toLowerCase()); const arr=f?ws.filter(w=>noDia((w.w+' '+w.pl).toLowerCase()).includes(f)):ws;
    $('#wl').innerHTML=arr.slice(0,limit).map(w=>{ const s=st(w.id); return `<div class="wi" data-wid="${w.id}"><span class="dot ${isHard(w.id)?'h':s===2?'m':s===1?'f':''}"></span><div class="x"><div class="a">${esc(w.w)} <span class="b">${esc(w.i)}</span></div><div class="b">${esc(w.pl)}</div><div class="exr" hidden></div></div>${audBtn(w.wa,1)}</div>`; }).join('')||'<div class="wi muted">Nic nie znaleziono</div>';
    $('#more').innerHTML=arr.length>limit?`<button class="btn sec2" id="mb">Pokaż więcej (${arr.length-limit})</button>`:'';
    const mb=$('#mb'); if(mb) mb.onclick=()=>{ limit+=300; draw(); };
  };
  $('#q').oninput=e=>{ filt=e.target.value.trim(); limit=150; draw(); };
  $('#wl').onclick=e=>{ const r=e.target.closest('[data-wid]'); if(!r) return; const w=BYID[+r.dataset.wid]; const x=$('.exr',r); if(!x) return;
    if(x.hidden){ x.innerHTML=`<div class="small" style="margin-top:6px"><i>${esc(w.ex)}</i> ${audBtn(w.ea,1)}</div><div class="small muted">${esc(w.ep)} · ${esc(w.p)} · ${esc(w.c)}</div>`; x.hidden=false; } else x.hidden=true; };
  draw();
}

/* ---------- STATYSTYKI ---------- */
function scrStats(){
  const ps=Object.values(S.p); const m=ps.filter(p=>p.s===2).length, f=ps.filter(p=>p.s===1).length, h=ps.filter(p=>p.h).length;
  const acc=S.tot.a?Math.round(S.tot.ok/S.tot.a*100):0;
  const now=new Date(); const days=[]; for(let i=6;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i); days.push([['nd','pn','wt','śr','cz','pt','sb'][d.getDay()],S.days[dkey(d)]||0]); }
  const mx=Math.max(10,...days.map(d=>d[1]));
  const hard=W.filter(w=>isHard(w.id));
  app().innerHTML=`${topBar('Statystyki','')}
  <div class="grid2"><div class="stat"><div class="v">🔥 ${streak()}</div><div class="k">dni nauki z rzędu (rekord: ${S.best})</div></div>
  <div class="stat"><div class="v">✅ ${m}</div><div class="k">opanowanych słówek z ${W.length}</div></div>
  <div class="stat"><div class="v">🟧 ${f}</div><div class="k">w trakcie nauki</div></div>
  <div class="stat"><div class="v">🎯 ${acc}%</div><div class="k">trafność (${S.tot.a} odpowiedzi)</div></div></div>
  <div class="sec">Ostatnie 7 dni (odpowiedzi)</div><div class="week">${days.map(d=>`<div><span>${d[1]||''}</span><i style="height:${d[1]/mx*80}%"></i><span>${d[0]}</span></div>`).join('')}</div>
  <div class="sec">Poziomy</div>${LEVELS.map((L,i)=>{ const s=levelStats(i); return `<button class="tile" data-go="l/${i}"><div class="row"><span class="t">${LV_EMO[i]} ${esc(L.name)}</span><span class="s">${s.m}/${s.n}</span></div>${bar(s)}</button>`; }).join('')}
  <div class="sec">Trudne słówka (${h})</div>${hard.length?`<button class="btn" data-go="rev" style="margin-bottom:10px">🔁 Powtórz trudne</button><div class="wl">${hard.slice(0,300).map(w=>`<div class="wi"><span class="dot h"></span><div class="x"><div class="a">${esc(w.w)}</div><div class="b">${esc(w.pl)} · błędy: ${S.p[w.id].w||0}</div></div>${audBtn(w.wa,1)}<button class="ib" data-unh="${w.id}" aria-label="Usuń z trudnych">✕</button></div>`).join('')}</div>`:'<p class="muted">Brak – świetnie!</p>'}`;
  $$('[data-unh]').forEach(b=>b.onclick=()=>{ const p=P(+b.dataset.unh); p.h=0; save(); scrStats(); });
}

/* ---------- USTAWIENIA ---------- */
function scrSettings(){
  const s=S.set;
  app().innerHTML=`${topBar('Ustawienia','')}
  <div class="set">
   <div class="si"><div class="x">Automatyczna wymowa<div class="d">Odtwarzaj angielskie słowo po odkryciu odpowiedzi</div></div><button class="sw ${s.auto?'on':''}" id="sauto" aria-label="Automatyczna wymowa"></button></div>
   <div class="si"><div class="x">Kierunek<div class="d">Co widzisz na pytaniu</div></div><div class="seg" id="sdir"><button data-v="pl-en" class="${s.dir!=='en-pl'?'on':''}">PL → EN</button><button data-v="en-pl" class="${s.dir==='en-pl'?'on':''}">EN → PL</button></div></div>
   <div class="si"><div class="x">Tempo wymowy</div><div class="seg" id="srate">${[[0.75,'wolno'],[1,'normalnie']].map(r=>`<button data-v="${r[0]}" class="${s.rate===r[0]?'on':''}">${r[1]}</button>`).join('')}</div></div>
   <div class="si"><div class="x">Motyw</div><div class="seg" id="sth">${[['auto','auto'],['light','jasny'],['dark','ciemny']].map(r=>`<button data-v="${r[0]}" class="${s.theme===r[0]?'on':''}">${r[1]}</button>`).join('')}</div></div>
   <div class="si"><div class="x">Słówek w rundzie Nauki</div><div class="seg" id="sln">${[5,7,10].map(n=>`<button data-v="${n}" class="${s.learnN===n?'on':''}">${n}</button>`).join('')}</div></div>
   <div class="si"><div class="x">Kart w rundzie Fiszek</div><div class="seg" id="sfn">${[10,20,30].map(n=>`<button data-v="${n}" class="${s.fisN===n?'on':''}">${n}</button>`).join('')}</div></div>
   <div class="si"><div class="x">Słówek w rundzie Pisania</div><div class="seg" id="swn">${[10,20,30].map(n=>`<button data-v="${n}" class="${s.writeN===n?'on':''}">${n}</button>`).join('')}</div></div>
   <div class="si"><div class="x">Test dźwięku</div>${audBtn('w_1557.mp3')}</div>
  </div>
  <div class="sec">Offline (bez internetu)</div>
  <div class="set">${'caches' in window?LEVELS.map((L,i)=>`<div class="si"><div class="x">${LV_EMO[i]} ${esc(L.name)}<div class="d" id="od${i}">Nagrania ok. ${Math.round(BYLEVEL[i].length*0.028)} MB</div></div><button class="btn sec2" style="width:auto;margin:0;min-height:42px" data-dl="${i}">Pobierz</button></div>`).join(''):'<div class="si">Ta przeglądarka nie obsługuje trybu offline.</div>'}</div>
  <div class="small muted" style="margin:0 4px 10px">Słówka i aplikacja działają offline od razu po pierwszym otwarciu. Nagrania zapisują się, gdy je odsłuchasz – albo pobierz cały poziom tutaj.</div>
  <div class="sec">Kopia postępów</div>
  <div class="set"><div class="si"><div class="x">Eksportuj / importuj<div class="d">Przenieś postępy na inne urządzenie lub zrób kopię</div></div><button class="btn sec2" style="width:auto;margin:0;min-height:42px" id="sexp">Otwórz</button></div>
  <div class="si"><div class="x" style="color:var(--bad)">Wyzeruj wszystkie postępy</div><button class="btn bad" style="width:auto;margin:0;min-height:42px" id="sres">Wyzeruj</button></div></div>
  <div class="center small muted" style="margin-top:10px">Słówka 3000 · lista Oxford 3000 (A1–B2) · 3805 kart · postępy zapisywane tylko na tym urządzeniu</div>`;
  const seg=(id,key,num)=>$$('#'+id+' button').forEach(b=>b.onclick=()=>{ s[key]=num?+b.dataset.v:b.dataset.v; save(); $$('#'+id+' button').forEach(x=>x.classList.toggle('on',x===b)); if(key==='theme') applyTheme(); });
  seg('sdir','dir'); seg('srate','rate',1); seg('sth','theme'); seg('sln','learnN',1); seg('swn','writeN',1); seg('sfn','fisN',1);
  $('#sauto').onclick=e=>{ s.auto=!s.auto; save(); e.currentTarget.classList.toggle('on',s.auto); };
  $$('[data-dl]').forEach(b=>b.onclick=()=>downloadLevel(+b.dataset.dl,b));
  $('#sres').onclick=()=>{ if(confirm('Na pewno wyzerować wszystkie postępy? Tego nie da się cofnąć.')){ const set=S.set; S=fill({set}); save(); toast('Wyzerowano'); scrSettings(); } };
  $('#sexp').onclick=()=>{ openSheet(`<div><h3 style="margin:0 0 8px">Kopia postępów</h3><p class="small muted">Skopiuj ten tekst i zachowaj (np. w Notatkach). Aby wczytać, wklej kopię i stuknij „Importuj”.</p><textarea id="ex">${esc(JSON.stringify(S))}</textarea><button class="btn sec2" id="cp">Kopiuj</button><button class="btn" id="im">Importuj z pola powyżej</button><button class="btn ghost" id="cl">Zamknij</button></div>`);
    $('#cl').onclick=closeSheet;
    $('#cp').onclick=async()=>{ const t=$('#ex'); try{ await navigator.clipboard.writeText(t.value); toast('Skopiowano'); }catch(e){ t.select(); document.execCommand('copy'); toast('Skopiowano'); } };
    $('#im').onclick=()=>{ try{ const o=JSON.parse($('#ex').value); if(!o||!o.p) throw 0; S=fill(o); save(); applyTheme(); closeSheet(); toast('Wczytano postępy'); scrSettings(); }catch(e){ toast('To nie jest poprawna kopia postępów'); } }; };
  if('caches' in window) refreshOffline();
}
async function refreshOffline(){
  try{ const c=await caches.open('s3k-audio'); const keys=new Set((await c.keys()).map(r=>r.url));
    LEVELS.forEach((L,i)=>{ const files=levelFiles(i); const n=files.filter(f=>keys.has(new URL('audio/'+f,location.href).href)).length; const el=$('#od'+i); if(el&&n) el.textContent=`Zapisane offline: ${n}/${files.length} nagrań`; });
  }catch(e){}
}
function levelFiles(i){ const a=[]; for(const w of BYLEVEL[i]){ a.push(w.wa); if(w.ea) a.push(w.ea); } return a; }
async function downloadLevel(i,btn){
  if(btn.dataset.busy) return; btn.dataset.busy=1; btn.disabled=true;
  try{ if(navigator.storage&&navigator.storage.persist) navigator.storage.persist(); }catch(e){}
  const c=await caches.open('s3k-audio'); const files=levelFiles(i); let done=0, fail=0; const el=$('#od'+i);
  const have=new Set((await c.keys()).map(r=>r.url));
  const urls=files.map(f=>new URL('audio/'+f,location.href).href).filter(u=>!have.has(u)); done=files.length-urls.length;
  let k=0;
  const worker=async()=>{ while(k<urls.length){ const u=urls[k++]; try{ const r=await fetch(u,{cache:'no-store'}); if(r.ok) await c.put(u,r); else fail++; }catch(e){ fail++; } done++; if(el&&done%10===0) el.textContent=`Pobieranie… ${done}/${files.length}`; } };
  await Promise.all(Array.from({length:6},worker));
  if(el) el.textContent=fail?`Pobrano ${done-fail}/${files.length} (błędy: ${fail} – spróbuj ponownie)`:`Zapisane offline: ${files.length}/${files.length} nagrań ✓`;
  btn.disabled=false; delete btn.dataset.busy; btn.textContent=fail?'Ponów':'Gotowe ✓';
}

/* ---------- start ---------- */
async function init(){
  applyTheme();
  try{
    const r=await fetch('data.json'); const D=await r.json();
    LEVELS=D.levels; W=D.words; W.forEach(w=>{ BYID[w.id]=w; (BYLEVEL[w.l]=BYLEVEL[w.l]||[]).push(w); const k=normEN(w.w); (EN_IDX[k]=EN_IDX[k]||[]).push(w); });
  }catch(e){ app().innerHTML='<div class="loading">Nie udało się wczytać słówek. Sprawdź internet i odśwież stronę.</div>'; return; }
  route();
  if('serviceWorker' in navigator && location.protocol!=='file:'){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
}
init();
