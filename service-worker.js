
const CACHE="tbop-v14.0.1";
const ASSETS=[
  "./","./index.html","./calendar.html","./membership.html",
  "./login.html","./member-login.html","./officer-login.html",
  "./member-signup.html","./forgot-password.html","./reset-password.html",
  "./member.html","./portal.html","./vault.html",
  "./assets/styles.css","./assets/app.js","./assets/backend.js",
  "./assets/auth.js","./assets/operations.js","./assets/member-self-service.js",
  "./assets/member-profile.js","./assets/approval-center.js",
  "./assets/tbop-logo.png"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{
    const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
  }).catch(()=>caches.match(e.request)));
});
