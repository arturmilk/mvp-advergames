// Service worker: funciona offline depois da 1ª visita e deixa a 2ª abertura bem mais rápida.
// - imagens/fontes (assets/): cache primeiro (abre na hora, sem esperar a rede); confere a versão nova em segundo plano
// - HTML/JS/JSON: rede primeiro (um push no GitHub Pages aparece na próxima abertura), cache se estiver sem internet
// - three.js da cdnjs (versão fixa, nunca muda): cache primeiro
// Ao trocar CACHE, os caches antigos deste jogo são apagados (os dos outros jogos ficam).
const PREFIX = 'rover-happy-hour-v', CACHE = PREFIX + '2';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith(PREFIX)).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
const put = (req, r) => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); } return r; };
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  if (u.origin !== location.origin) {
    if (u.hostname === 'cdnjs.cloudflare.com') e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r))));
    return; // Apps Script e o resto: sempre direto na rede
  }
  if (/\/assets\/.+\.(webp|png|jpe?g|gif|svg|woff2?)$/i.test(u.pathname)) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => put(req, r));
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    }));
    return;
  }
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => put(req, r)).catch(() => caches.match(req)));
});
