// Fenda Music — Service Worker v10
const CACHE_NAME = 'fenda-music-v10';

const SHELL_ASSETS = [
  '/player.html',
  '/index.html',
  '/reset-password.html',
  '/manifest.json',
  '/base.css',
  '/inicio.css',
  '/busca.css',
  '/biblioteca.css',
  '/perfil.css',
  '/login.css',
  '/supabase-config.js',
  '/search.js',
  '/player-core.js',
  '/player-ui.js',
  '/player-audio-lyrics.js',
  '/player-menus-core.js',
  '/player-music-actions.js',
  '/player-playlists.js',
];

// Todas as rotas que devem servir player.html
const PLAYER_ROUTES = [
  '/player.html', '/player',
  '/inicio', '/busca', '/biblioteca', '/perfil',
];

// Rotas que servem index.html
const LOGIN_ROUTES = ['/login', '/index.html', '/'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(SHELL_ASSETS.map(url => cache.add(url).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const path = url.pathname;

  // Supabase: sempre rede
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // CDN externo: cache-first
  if (url.hostname === 'cdn.jsdelivr.net' ||
      url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => cached ||
          fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  if (url.origin === self.location.origin) {
    // Rotas do player → serve /player.html
    if (PLAYER_ROUTES.includes(path)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
          cache.match('/player.html').then(cached => {
            if (cached) return cached;
            return fetch('/player.html').then(res => {
              if (res.ok) cache.put('/player.html', res.clone());
              return res;
            });
          })
        )
      );
      return;
    }

    // Rotas de login → serve /index.html
    if (LOGIN_ROUTES.includes(path)) {
      event.respondWith(
        caches.open(CACHE_NAME).then(cache =>
          cache.match('/index.html').then(cached => {
            if (cached) return cached;
            return fetch('/index.html').then(res => {
              if (res.ok) cache.put('/index.html', res.clone());
              return res;
            });
          })
        )
      );
      return;
    }

    // Outros arquivos locais: cache-first com update em background
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) {
            fetch(event.request).then(res => {
              if (res.ok) cache.put(event.request, res.clone());
            }).catch(() => {});
            return cached;
          }
          return fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          }).catch(() => cache.match('/player.html'));
        })
      )
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
