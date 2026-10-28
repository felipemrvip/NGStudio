/* NG Studio: cache SOMENTE arquivos estáticos. Nunca armazena dados privados do Supabase. */
const CACHE='ng-studio-static-v16-nonzero-colors';
const CORE=['./','./index.html','./assets/app.js','./assets/styles.css','./assets/theme.css','./assets/redesign.css','./assets/studio.css','./assets/brand.svg','./assets/logic.mjs','./assets/print.js','./assets/pdf.js','./assets/supabase.js','./manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()).catch(()=>{}));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ng-studio-static-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 // Network-first: branding and UI updates should never remain stuck on a stale cached version.
 event.respondWith(fetch(request).then(response=>{
  if(response.ok&&response.type==='basic'){
   const saved=response.clone();
   void caches.open(CACHE).then(cache=>cache.put(request,saved)).catch(()=>{});
  }
  return response;
 }).catch(async()=>{
  const cached=await caches.match(request);
  return cached|| (request.mode==='navigate'?await caches.match('./index.html'):Response.error());
 }));
});
