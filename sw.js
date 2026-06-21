// Fenda Music — Service Worker v8
// Cache-first para shell, network-first para dados do Supabase

const CACHE_NAME = 'fenda-music-v8';

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

// ── Install: pré-cacheia todo o shell ────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        SHELL_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Falha ao cachear:', url, err))
        )
      )
    )
  );
});

// ── Activate: limpa caches antigos ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Supabase: sempre rede, sem cache
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Google Fonts e CDN: cache-first
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'cdn.jsdelivr.net'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // Shell local: cache-first — funciona offline
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        // Retorna cache imediatamente se disponível
        if (cached) {
          // Atualiza em background sem bloquear
          fetch(event.request).then(res => {
            if (res.ok) cache.put(event.request, res.clone());
          }).catch(() => {});
          return cached;
        }
        // Sem cache: busca na rede e cacheia
        return fetch(event.request).then(res => {
          if (res.ok && url.origin === self.location.origin) {
            cache.put(event.request, res.clone());
          }
          return res;
        }).catch(() => {
          // Offline e sem cache: retorna player.html como fallback
          if (event.request.destination === 'document') {
            return cache.match('./player.html') || cache.match('./index.html');
          }
        });
      })
    )
  );
});
