/** Build an API path under the Vite base (e.g. /storyweaver/api/login). */
export function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}api/${normalized}`;
}
