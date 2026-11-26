const CACHE_NAME = 'chemo-in-comfort-v4';
const APP_ROOT = self.registration.scope;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([APP_ROOT, new URL('index.html', APP_ROOT).href]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('chemo-in-comfort-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_URLS' || !Array.isArray(event.data.urls)) return;

  const urls = event.data.urls.filter((url) => {
    try {
      return new URL(url, self.location.origin).origin === self.location.origin;
    } catch {
      return false;
    }
  });
  const cacheAssets = caches.open(CACHE_NAME)
    .then(async (cache) => {
      for (const url of urls) {
        try {
          await cache.add(url);
        } catch (error) {
          throw new Error(
            `Failed to cache ${url}: ${error.name}: ${error.message}`
          );
        }
      }
    })
    .then(() => event.ports[0]?.postMessage({ type: 'CACHE_READY' }))
    .catch((error) => {
      console.error('Unable to cache app files for offline use.', error);
      event.ports[0]?.postMessage({ type: 'CACHE_ERROR', message: String(error) });
    });

  event.waitUntil(cacheAssets);
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    if (request.destination !== 'document') {
      const cachedAsset = await caches.match(request, { ignoreVary: true });
      if (cachedAsset) return cachedAsset;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request, { ignoreVary: true });
      if (cached) return cached;
      if (request.mode === 'navigate') {
        const appShell = await caches.match(new URL('index.html', APP_ROOT).href);
        if (appShell) return appShell;
      }
      return Response.error();
    }
  })());
});

