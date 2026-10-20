// Cloudflare Worker entry (for "Workers + static assets" hosting, e.g. *.workers.dev).
// /api/* is handled by the publishing API; everything else is served from the static files.
// The API logic lives in functions/api/[[route]].js (shared with Cloudflare Pages).
import { onRequest } from './functions/api/[[route]].js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return onRequest({ request, env, waitUntil: (p) => ctx.waitUntil(p) });
    }
    return env.ASSETS.fetch(request);
  },
};
