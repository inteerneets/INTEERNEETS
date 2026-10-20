const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.ico': 'image/x-icon'
};

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // --- API Routes ---

  // POST /api/save-page  — any of: one page design, the page list, site settings
  if (req.method === 'POST' && pathname === '/api/save-page') {
    try {
      const body = await readBody(req);
      const contentDir = path.join(ROOT, 'content');
      ensureDir(contentDir);
      if (body.page !== undefined && body.content !== undefined) {
        if (!/^[a-z0-9-]{1,40}$/i.test(body.page)) throw new Error('Bad page name');
        fs.writeFileSync(path.join(contentDir, `page-${body.page}.json`), JSON.stringify(body.content, null, 2));
      }
      if (Array.isArray(body.pages)) {
        fs.writeFileSync(path.join(contentDir, 'pages.json'), JSON.stringify({ pages: body.pages }, null, 2));
      }
      if (body.settings) {
        fs.writeFileSync(path.join(contentDir, 'settings.json'), JSON.stringify(body.settings, null, 2));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // POST /api/delete-page
  if (req.method === 'POST' && pathname === '/api/delete-page') {
    try {
      const body = await readBody(req);
      if (!/^[a-z0-9-]{1,40}$/i.test(body.page || '') || body.page === 'home') throw new Error('Bad page name');
      const filePath = path.join(ROOT, 'content', `page-${body.page}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // POST /api/save-settings
  if (req.method === 'POST' && pathname === '/api/save-settings') {
    try {
      const body = await readBody(req);
      const contentDir = path.join(ROOT, 'content');
      ensureDir(contentDir);
      const filePath = path.join(contentDir, 'settings.json');
      fs.writeFileSync(filePath, JSON.stringify(body, null, 2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // POST /api/upload
  if (req.method === 'POST' && pathname === '/api/upload') {
    try {
      const body = await readBody(req);
      const data = body.data;
      // Accept either "filename" or "name"; strip any directory parts / odd chars
      const filename = path.basename(String(body.filename || body.name || 'upload-' + Date.now()))
        .replace(/[^a-zA-Z0-9._-]/g, '_');
      const ext = path.extname(filename).toLowerCase();
      const isFontExt = ['.woff', '.woff2', '.ttf', '.otf'].includes(ext);
      const destDir = isFontExt
        ? path.join(ROOT, 'fonts')
        : path.join(ROOT, 'images', 'uploads');
      ensureDir(destDir);

      // Strip base64 data URL prefix if present
      const base64Data = data.includes(',') ? data.split(',')[1] : data;
      const buffer = Buffer.from(base64Data, 'base64');
      const destPath = path.join(destDir, filename);
      fs.writeFileSync(destPath, buffer);

      const urlPath = isFontExt
        ? `/fonts/${filename}`
        : `/images/uploads/${filename}`;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, url: urlPath }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // GET /api/assets
  if (req.method === 'GET' && pathname === '/api/assets') {
    try {
      const imagesDir = path.join(ROOT, 'images', 'uploads');
      const fontsDir = path.join(ROOT, 'fonts');
      ensureDir(imagesDir);
      ensureDir(fontsDir);

      const images = fs.readdirSync(imagesDir)
        .filter(f => !f.startsWith('.'))
        .map(f => `/images/uploads/${f}`);
      const fonts = fs.readdirSync(fontsDir)
        .filter(f => !f.startsWith('.'))
        .map(f => `/fonts/${f}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images, fonts }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images: [], fonts: [], error: e.message }));
    }
    return;
  }

  // --- Static File Serving ---
  let filePath = path.join(ROOT, decodeURIComponent(pathname));

  // Path traversal prevention
  const resolved = path.resolve(filePath);
  if (!(resolved === ROOT || resolved.startsWith(ROOT + path.sep))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Serve index.html for directory requests
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Unknown page address -> the custom Error page (404.html), like Netlify does.
      // Missing data/asset files keep a plain 404 so the editor can tell they don't exist.
      if (ext === '' || ext === '.html') {
        return fs.readFile(path.join(ROOT, '404.html'), (e2, page) => {
          res.writeHead(404, { 'Content-Type': e2 ? 'text/plain' : 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
          res.end(e2 ? '404 Not Found' : page);
        });
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    // No caching so edits always show immediately
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║       INTEERNEETS WEB - Local Server      ║');
  console.log('  ╠═══════════════════════════════════════════╣');
  console.log(`  ║  Website URL:  http://localhost:${PORT}        ║`);
  console.log(`  ║  Admin URL:    http://localhost:${PORT}/admin  ║`);
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
});
