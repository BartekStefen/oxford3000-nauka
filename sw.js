/* Service worker: aplikacja i słówka offline, nagrania zapisywane przy odsłuchu (z obsługą Range dla Safari). */
const V='s3k-shell-v2', AUDIO='s3k-audio';
const SHELL=['./','index.html','app.css?v=2','app.js?v=2','data.json','manifest.webmanifest','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','icons/favicon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==AUDIO).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  if(url.pathname.includes('/audio/')){ e.respondWith(audio(req)); return; }
  if(req.mode==='navigate'){ e.respondWith(fetch(req).then(r=>{ const c=r.clone(); caches.open(V).then(x=>x.put('./',c)); return r; }).catch(()=>caches.match('./'))); return; }
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(r=>{ if(r.ok){ const c=r.clone(); caches.open(V).then(x=>x.put(req,c)); } return r; }).catch(()=>hit);
    return hit||net;
  }));
});
async function audio(req){
  const c=await caches.open(AUDIO); const key=req.url.split('#')[0];
  let res=await c.match(key);
  if(!res){
    try{ res=await fetch(key); }catch(err){ return new Response('',{status:503}); }
    if(!res.ok) return res;
    try{ await c.put(key,res.clone()); }catch(err){}
  }
  const range=req.headers.get('range');
  const buf=await res.arrayBuffer(); const len=buf.byteLength;
  if(!range) return new Response(buf,{status:200,headers:{'Content-Type':'audio/mpeg','Content-Length':String(len),'Accept-Ranges':'bytes'}});
  const m=/bytes=(\d*)-(\d*)/.exec(range)||[];
  let start,end;
  if(m[1]===''||m[1]===undefined){ const suf=parseInt(m[2]||'0',10); start=Math.max(0,len-suf); end=len-1; }
  else { start=parseInt(m[1],10); end=m[2]?Math.min(parseInt(m[2],10),len-1):len-1; }
  if(start>=len) return new Response('',{status:416,headers:{'Content-Range':`bytes */${len}`}});
  return new Response(buf.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${start}-${end}/${len}`,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});
}
