import { useEffect, useState } from 'react';

export type Route = 'home' | 'user' | 'designer';

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (path === 'user') return 'user';
  if (path === 'designer') return 'designer';
  return 'home';
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

export function navigate(route: Route): void {
  window.location.hash = route === 'home' ? '#/' : `#/${route}`;
}
