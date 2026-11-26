import { useEffect, useState } from 'react';
export type Page = 'home' | 'diary' | 'tracking' | 'reports' | 'settings';
function currentPage(): Page { return window.location.hash === '#reports' ? 'reports' : window.location.hash === '#settings' ? 'settings' : window.location.hash === '#tracking' ? 'tracking' : window.location.hash === '#diary' ? 'diary' : 'home'; }
export function usePage(): Page {
  const [page, setPage] = useState(currentPage);
  useEffect(() => {
    const update = () => { setPage(currentPage()); window.scrollTo({ top: 0, behavior: 'auto' }); document.getElementById('main-content')?.focus({ preventScroll: true }); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return page;
}
