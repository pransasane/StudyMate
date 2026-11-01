import app from '../server/app.js';

// Let Express handle JSON and multipart payloads itself.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: any, res: any) {
  // Vercel rewrites nested /api/* URLs to this single function and stores
  // the original route in __route. Restore it before Express matches routes.
  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const originalRoute = parsedUrl.searchParams.get('__route');

  if (originalRoute !== null) {
    parsedUrl.searchParams.delete('__route');
    const query = parsedUrl.searchParams.toString();
    const route = originalRoute.replace(/^\/+/, '');
    req.url = `/api/${route}${query ? `?${query}` : ''}`;
  }

  return app(req, res);
}
