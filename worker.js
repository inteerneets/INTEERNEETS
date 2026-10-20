// Cloudflare Worker entry (for "Workers + static assets" hosting, e.g. *.workers.dev).
// /api/* is handled by the publishing API; everything else is served from the static files.
// The API logic lives in functions/api/[[route]].js (shared with Cloudflare Pages).
import { onRequest, serveFromGithub } from './functions/api/[[route]].js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return onRequest({ request, env, waitUntil: (p) => ctx.waitUntil(p) });
    }
    if (url.pathname.startsWith('/images/uploads/') || url.pathname.startsWith('/fonts/')) {
      // Static file if it is part of the current deploy; otherwise straight from GitHub (new uploads, instantly)
      const res = await env.ASSETS.fetch(request);
      if (res.status !== 404) return res;
      return serveFromGithub({ request, env, waitUntil: (p) => ctx.waitUntil(p) });
    }
    return env.ASSETS.fetch(request);
  },
};
