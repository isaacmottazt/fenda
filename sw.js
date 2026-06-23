// Fenda Music — Service Worker v14
const CACHE_NAME = 'fenda-v15';

const PLAYER_ROUTES = new Set(['/player.html', '/player', '/inicio', '/busca', '/biblioteca', '/perfil']);
const LOGIN_ROUTES  = new Set(['/index.html', '/login', '/']);

const SHELL = [
  '/player.html', '/index.html', '/reset-password.html', '/manifest.json',
  '/base.css', '/inicio.css', '/busca.css', '/biblioteca.css',
  '/perfil.css', '/login.css', '/supabase-config.js', '/search.js',
  '/player-core.js', '/player-ui.js', '/player-audio-lyrics.js',
  '/player-menus-core.js', '/player-music-actions.js', '/player-playlists.js',
  '/player-smart-queue.js',
  '/inicio-extras.js',
];

// Aceita mensagem SKIP_WAITING do cliente
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u).catch(() => {}))))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const path = url.pathname;

  // Supabase: rede direta
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]')));
    return;
  }

  // CDN: cache-first
  if (url.hostname === 'cdn.jsdelivr.net' || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) {
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).then(r => {
        if (r.ok) caches.open(CACHE_NAME).then(cache => cache.put(e.request, r.clone()));
        return r;
      }))
    );
    return;
  }

  if (url.origin === self.location.origin) {
    // Rotas do player → /player.html
    if (PLAYER_ROUTES.has(path)) {
      e.respondWith(
        caches.match('/player.html').then(c => c || fetch('/player.html'))
      );
      return;
    }
    // Rotas de login → /index.html  
    if (LOGIN_ROUTES.has(path)) {
      e.respondWith(
        caches.match('/index.html').then(c => c || fetch('/index.html'))
      );
      return;
    }
    // Demais arquivos: cache-first
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(r => {
          if (r.ok) caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone()));
          return r;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  e.respondWith(fetch(e.request));
});
