
const CACHE = 'dlr-v1';
const ASSETS = ['/', '/index.html', '/scripts/app.js', '/manifest.webmanifest'];
self.addEventListener('install', (e)=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch', (e)=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return res;}).catch(()=>caches.match('/index.html')))));
