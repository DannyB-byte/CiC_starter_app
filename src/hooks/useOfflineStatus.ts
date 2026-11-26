import { useEffect, useState } from 'react';
import { cacheLoadedAssets } from '../services/offline';

export function useOfflineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineError, setOfflineError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    if ('serviceWorker' in navigator) {
      void (async () => {
        await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
        const registration = await navigator.serviceWorker.ready;
        if (!registration.active) throw new Error('The offline worker did not become active.');
        await cacheLoadedAssets(registration.active, controller.signal);
        if (controller.signal.aborted) return;
        setOfflineReady(true);
      })().catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const reason = error instanceof Error ? error.message : 'Unknown service worker error.';
        setOfflineError(reason);

      });
    } else {
      setOfflineError('This browser does not support offline storage.');
    }

    const updateConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      controller.abort();
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  return { online, offlineReady, offlineError };
}
