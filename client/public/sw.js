const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `opostest-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `opostest-dynamic-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  } else if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put('/', networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(getOfflineHTML(), {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return networkResponse;
  }).catch(() => null);

  return cachedResponse || await fetchPromise || new Response('Offline', { status: 503 });
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Sin conexión', offline: true }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

function getOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OposTest Pro - Sin Conexión</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 20px;
    }
    .container { max-width: 400px; }
    .icon { font-size: 64px; margin-bottom: 24px; opacity: 0.8; }
    h1 { font-size: 24px; margin-bottom: 16px; font-weight: 600; }
    p { color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 24px; }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>Sin Conexión</h1>
    <p>No tienes conexión a Internet. Comprueba tu conexión y vuelve a intentarlo.</p>
    <button onclick="location.reload()">Reintentar</button>
  </div>
</body>
</html>`;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
