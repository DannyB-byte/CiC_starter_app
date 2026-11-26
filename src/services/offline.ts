export function cacheLoadedAssets(worker: ServiceWorker, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    function cleanup() {
      window.clearTimeout(timeout);
      signal.removeEventListener('abort', abort);
      channel.port1.close();
    }
    function abort() { cleanup(); reject(new Error('Offline setup cancelled.')); }
    const timeout = window.setTimeout(() => { cleanup(); reject(new Error('Offline setup timed out.')); }, 10000);
    if (signal.aborted) { abort(); channel.port2.close(); return; }
    signal.addEventListener('abort', abort, { once: true });
    channel.port1.onmessage = (event: MessageEvent<{ type?: string }>) => {
      cleanup();
      if (event.data?.type === 'CACHE_READY') resolve();
      else reject(new Error('The app files could not be cached.'));
    };
    try { worker.postMessage({ type: 'CACHE_URLS', urls: [] }, [channel.port2]); }
    catch { cleanup(); channel.port2.close(); reject(new Error('Offline worker unavailable.')); }
  });
}
