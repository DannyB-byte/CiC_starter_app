export function cacheLoadedAssets(worker: ServiceWorker) {
  const origin = window.location.origin;
  const urls = [...new Set(
    performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === origin)
  )];

  return new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => reject(new Error('Offline setup timed out.')), 10000);
    channel.port1.onmessage = (event: MessageEvent<{ type?: string; message?: string }>) => {
      window.clearTimeout(timeout);
      if (event.data.type === 'CACHE_READY') {
        resolve();
      } else {
        reject(new Error(event.data.message ?? 'The app files could not be cached.'));
      }
      channel.port1.close();
    };
    worker.postMessage({ type: 'CACHE_URLS', urls }, [channel.port2]);
  });
}

