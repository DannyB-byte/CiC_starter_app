const CACHE_NAME = 'chemo-in-comfort-v4';
const PRECACHE = ['./', './index.html'];
const allowed = new Set(PRECACHE.map(path => new URL(path, self.registration.scope).href));
const shell = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(
    [...allowed].map(url => new Request(url, { cache: 'reload', redirect: 'error' }))
  )));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('chemo-in-comfort-') && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'CACHE_URLS') return;
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const ready = (await Promise.all([...allowed].map(url => cache.match(url)))).every(Boolean);
      event.ports[0]?.postMessage({ type: ready ? 'CACHE_READY' : 'CACHE_ERROR' });
    } catch {
      event.ports[0]?.postMessage({ type: 'CACHE_ERROR' });
    }
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);

  if (url.origin !== scope.origin) return;
  if (!url.pathname.startsWith(scope.pathname)) return;

  url.hash = '';

  const isShellNavigation =
    request.mode === 'navigate' &&
    url.search === '' &&
    (
      url.pathname === scope.pathname ||
      url.pathname === new URL(shell).pathname
    );

  if (!isShellNavigation && !allowed.has(url.href)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    if (isShellNavigation) {
      const cachedShell = await cache.match(shell);
      return cachedShell || fetch(request);
    }

    const cached = await cache.match(url.href);
    return cached || fetch(request);
  })());
});
