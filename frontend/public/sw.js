const CACHE='mindmate-shell-v1';
const BASE_URL = new URL('./', self.location).href;
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll([BASE_URL,`${BASE_URL}index.html`,`${BASE_URL}manifest.webmanifest`])))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match(`${BASE_URL}index.html`))));
});
