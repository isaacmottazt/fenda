const CACHE_NAME = 'fenda-music-v7';

const SHELL_ASSETS = [
  './player.html',
  './index.html',
  './reset-password.html',
  './manifest.json',
  './base.css',
  './inicio.css',
  './busca.css',
  './biblioteca.css',
  './perfil.css',
  './login.css',
  './supabase-config.js',
  './search.js',
  './player-core.js',
  './player-ui.js',
  './player-audio-lyrics.js',
  './player-menus-core.js',
  './player-music-actions.js',
  './player-playlists.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(SHELL_ASSETS.map(url => cache.add(url).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Supabase: sempre rede
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request).catch(() => new Response('[]')));
    return;
  }

  // CDN externo: cache first
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname.includes('fonts.g')) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // Arquivos locais: network first
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
