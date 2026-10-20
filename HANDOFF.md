# INTEERNEETS WEB — Handoff

Location: `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB` (mirrored to the git clone `C:\Users\xxx\Documents\GitHub\INTEERNEETS`; the user commits/pushes with GitHub Desktop).
The `.html` files in `C:\Users\xxx\Desktop\INTEERNEETS\` are the user's personal shortcuts — never read, edit or delete them.

## Status: everything requested is done and tested locally
| Item | State |
|---|---|
| Save → site doesn't update bug | Fixed (see below) |
| `server.js` / `api.js` `body.settings` additions (made by Gemini) | Reviewed, correct, kept. Colors/settings now save together with the page |
| "View Site" button in admin top bar | Done (`#btn-view`) |
| Hover names on all icons | Done |
| Shopify IDs box | Resizable multi-line textarea |
| Ctrl-snapping in Free Drag (edges, centers, siblings, 10px grid, red guides) | Done, verified |
| New pages from the editor (`+ Page`, rename by double-click, delete ×) | Done |
| One scrolling site, top tabs + scroll, crossfading backgrounds | Done |
| Font previews in dropdowns + font/size/color in the text toolbar | Done |
| Per-page Background panel (color / picture / mode / tile / overlay, with recommended image size note) | Done |
| Custom Error (404) page, edited in the editor | Done (new) |
| Folder cleanup | Done — old `css/`, `js/`, `content/home.json`, `shop.json`, `admin/config.yml` removed |
| README | Rewritten |

## Why saves used to not show on the site (fixed)
1. Content files were served from the Netlify CDN and only changed after a rebuild. Now the site/editor read `GET /api/content?name=...` (live from GitHub); content commits use `[skip ci]` so no rebuild is needed. `/content/*` also has `no-cache` in `netlify.toml`.
2. The Save button only saved one page. `saveAll()` now saves all edited pages + page list + `settings.json` (theme colors) in one go.
3. Text being typed wasn't flushed. `flushEditing()` runs before every snapshot.
(Earlier in the session an assistant edited `server.js` and `api.js` while stopped; that change was reviewed and is correct.)

## Architecture
- `index.html` – public site. Reads `pages.json`, builds one section per page with CSS scoped to `#pg-<id>`, background layers crossfade, nav highlights on scroll. `shop.html` redirects to `/#shop`.
- `404.html` – error page. Netlify serves it automatically for unknown URLs; `server.js` does too locally (only for extensionless/.html URLs — missing `.json`/assets stay plain 404 because the editor relies on that). Its design comes from `content/page-404.json`; falls back to a default 404 if never saved.
- `admin/` – GrapesJS editor. Tabs: pages from `pages.json` + a dashed **⚠ Error Page** tab (id `404`, not in the menu, not deletable, id reserved).
- `content/` – `pages.json`, `page-<id>.json` (`{projectData, html, css, bg}`), `settings.json`.
- `functions/api/[[route]].js` - Cloudflare Pages Function, routes: `content`, `assets`, `save-page`, `save-settings`, `delete-page`, `upload`. Needs env vars `GITHUB_TOKEN`, `ADMIN_PASSWORD`. `_routes.json` limits it to `/api/*`; `_headers` sets no-cache on `/content/*`. `netlify/functions/api.js` + `netlify.toml` = identical API for Netlify (fallback only).
- `server.js` + `RUN WEBSITE.bat` – local server on :8000.

## Test notes
Headless Edge (puppeteer-core) tests live in the Antigravity scratch folder (`brain/<id>/scratch/test.js`, `t404.js`) — they run on a copy of the site, never the real one. Careful: the snap guide layer lives in the *editor canvas iframe* (`editor.Canvas.getDocument()`), not the first child frame.

## Known / to do on first deploy
- `content/page-shop.json` doesn't exist yet → Shop shows the placeholder and the console logs one 404. Open the Shop tab in `/admin/`, design it, Save.
- Hosting moved from Netlify to Cloudflare Pages because Netlify paused production deploys (out of credits; deploys showed "Skipped"). Setup steps are in README. The function logic was unit-tested with a mocked GitHub API but not against real Cloudflare - after the first deploy: open /admin/, edit, Save, reload the main site, visit a bogus URL to see the Error page.
- Files use CRLF line endings; when scripting edits normalise `\r\n` first.
