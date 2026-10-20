// Netlify Function: lets the /admin editor publish to the live site and lets the
// live site read the freshest saved content straight from GitHub.
//
// Required environment variables (Netlify → Site configuration → Environment variables):
//   GITHUB_TOKEN    fine-grained token with "Contents: Read and write" on this repo
//   ADMIN_PASSWORD  password the editor asks for before publishing
// Optional:
//   GITHUB_REPO     default "inteerneets/INTEERNEETS"
//   GITHUB_BRANCH   default "main"
//
// Routes (all under /api/*, see netlify.toml):
//   GET  /api/content?name=page-home.json[&fresh=1]  read a content file (public, no password)
//   GET  /api/assets                                  list uploaded images/fonts (public)
//   POST /api/save-page      { page?, content?, pages?, settings? }   (password)
//   POST /api/save-settings  { ...settings }                          (password)
//   POST /api/delete-page    { page }                                 (password)
//   POST /api/upload         { filename, data(base64 dataURL) }       (password)
//
// Content commits carry "[skip ci]" so Netlify does NOT rebuild for every save
// (the live site reads content through GET /api/content, so no rebuild is needed).
// Uploads (images/fonts) are normal commits so Netlify redeploys and serves them.

const REPO = process.env.GITHUB_REPO || 'inteerneets/INTEERNEETS';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const API = `https://api.github.com/repos/${REPO}/contents`;
const CONTENT_NAME = /^(pages|settings|page-[a-z0-9-]+)\.json$/i;
const PAGE_ID = /^[a-z0-9-]{1,40}$/i;

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  body: JSON.stringify(body),
});

function gh(path, opts = {}) {
  return fetch(`${API}/${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'inteerneets-editor',
      ...(opts.headers || {}),
    },
  });
}

async function getSha(path) {
  const existing = await gh(`${path}?ref=${BRANCH}`);
  return existing.ok ? (await existing.json()).sha : undefined;
}

// Create or update a file in the repo (one commit)
async function commitFile(path, base64Content, message) {
  const sha = await getSha(path);
  const res = await gh(path, {
    method: 'PUT',
    body: JSON.stringify({ message, content: base64Content, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function deleteFile(path, message) {
  const sha = await getSha(path);
  if (!sha) return; // already gone
  const res = await gh(path, { method: 'DELETE', body: JSON.stringify({ message, sha, branch: BRANCH }) });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function listDir(dir) {
  const res = await gh(`${dir}?ref=${BRANCH}`);
  if (!res.ok) return [];
  const items = await res.json();
  return Array.isArray(items)
    ? items.filter((f) => f.type === 'file' && !f.name.startsWith('.')).map((f) => `/${dir}/${f.name}`)
    : [];
}

const b64 = (obj) => Buffer.from(JSON.stringify(obj, null, 2)).toString('base64');

exports.handler = async (event) => {
  if (!process.env.GITHUB_TOKEN || !process.env.ADMIN_PASSWORD) {
    return json(500, { success: false, error: 'Server not configured: set GITHUB_TOKEN and ADMIN_PASSWORD in Netlify.' });
  }

  const route = event.path.split('/').filter(Boolean).pop();
  const qs = event.queryStringParameters || {};

  // ── Public read routes ──
  if (event.httpMethod === 'GET' && route === 'assets') {
    const [images, fonts] = await Promise.all([listDir('images/uploads'), listDir('fonts')]);
    return json(200, { images, fonts });
  }

  if (event.httpMethod === 'GET' && route === 'content') {
    const name = String(qs.name || '');
    if (!CONTENT_NAME.test(name)) return json(400, { success: false, error: 'Bad content name' });
    const res = await gh(`content/${name}?ref=${BRANCH}`, { headers: { Accept: 'application/vnd.github.raw+json' } });
    if (!res.ok) return json(res.status === 404 ? 404 : 502, { success: false, error: `GitHub ${res.status}` });
    const text = await res.text();
    // Editor passes fresh=1 (never cached). Visitors get a ~10s CDN cache to protect rate limits.
    const cache = qs.fresh
      ? { 'Cache-Control': 'no-store' }
      : { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' };
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...cache }, body: text };
  }

  if (event.httpMethod !== 'POST') return json(405, { success: false, error: 'Method not allowed' });

  // ── Password-protected write routes ──
  const given = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];
  if (given !== process.env.ADMIN_PASSWORD) return json(401, { success: false, error: 'Wrong password' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { success: false, error: 'Bad JSON' }); }

  try {
    if (route === 'save-page') {
      // Any combination of: one page design, the page list, and site settings (colors etc.)
      if (body.page !== undefined && body.content !== undefined) {
        if (!PAGE_ID.test(body.page)) return json(400, { success: false, error: 'Bad page name' });
        await commitFile(`content/page-${body.page}.json`, b64(body.content), `Editor: update ${body.page} page [skip ci]`);
      }
      if (Array.isArray(body.pages)) {
        await commitFile('content/pages.json', b64({ pages: body.pages }), 'Editor: update page list [skip ci]');
      }
      if (body.settings) {
        await commitFile('content/settings.json', b64(body.settings), 'Editor: update settings [skip ci]');
      }
      return json(200, { success: true });
    }

    if (route === 'save-settings') {
      await commitFile('content/settings.json', b64(body), 'Editor: update settings [skip ci]');
      return json(200, { success: true });
    }

    if (route === 'delete-page') {
      if (!PAGE_ID.test(body.page || '') || body.page === 'home') return json(400, { success: false, error: 'Bad page name' });
      await deleteFile(`content/page-${body.page}.json`, `Editor: delete ${body.page} page [skip ci]`);
      return json(200, { success: true });
    }

    if (route === 'upload') {
      const filename = String(body.filename || body.name || `upload-${Date.now()}`)
        .split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]/g, '_');
      const isFont = /\.(woff2?|ttf|otf)$/i.test(filename);
      const dir = isFont ? 'fonts' : 'images/uploads';
      const data = String(body.data || '');
      const base64 = data.includes(',') ? data.split(',')[1] : data;
      // Normal commit (no [skip ci]) so Netlify redeploys and serves the new file
      await commitFile(`${dir}/${filename}`, base64, `Editor: upload ${filename}`);
      return json(200, { success: true, url: `/${dir}/${filename}` });
    }

    return json(404, { success: false, error: 'Unknown route' });
  } catch (e) {
    return json(500, { success: false, error: e.message });
  }
};
