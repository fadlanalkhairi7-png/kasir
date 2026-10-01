// Kasir Toko - service worker: aplikasi tetap terbuka walau tanpa internet.
const CACHE = 'kasir-toko-v2';
const INTI = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // kiriman ke Google Sheets tidak disentuh
  const url = new URL(req.url);
  const sendiri = url.origin === self.location.origin;
  const font = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sendiri && !font) return;
  // Pakai yang tersimpan dulu (cepat & bisa offline), lalu perbarui diam-diam di belakang.
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const lama = await cache.match(key);
    const baru = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
      return res;
    }).catch(() => lama);
    return lama || baru;
  }));
});
