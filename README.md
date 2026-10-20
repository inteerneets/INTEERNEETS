# INTEERNEETS WEB

A studio website with a visual drag-and-drop editor (GrapesJS) at `/admin/`.
The site is **one continuous scrolling page**; each editor tab is a section of it.

## Run locally
Double-click `RUN WEBSITE.bat` (needs Node.js) → site at http://localhost:8000, editor at http://localhost:8000/admin/

## How it works
- `index.html` – public site. Reads `content/pages.json`, renders each page as a section with scoped CSS, crossfades page backgrounds while scrolling, and shows tabs in the top bar. `shop.html` just redirects to `/#shop`.
- `404.html` – the error page (Netlify and the local server show it for unknown addresses).
- `admin/` – the editor (`index.html`, `editor.js`, `editor.css`).
- `content/` – saved data: `pages.json` (page list), `page-<name>.json` (designs), `settings.json` (colors, Shopify, socials, email).
- `server.js` – local dev server with save/upload API.
- `netlify/functions/api.js` – production API. Saving commits to GitHub using `GITHUB_TOKEN`; `ADMIN_PASSWORD` protects it. `GET /api/content?name=...&fresh=1` reads directly from GitHub so the site shows saves without waiting for a rebuild.

## Editor
| Feature | How |
|---|---|
| Save everything (pages, colors, settings) | **Save** button or `Ctrl+S` (active text edits are flushed first) |
| View live site | **View Site** link in the top bar |
| New / rename / delete page | `+ Page`, double-click a tab, delete button on the tab |
| Page background | Dedicated **Background** panel: color or image, cover/contain/stretch/tile, overlay. Recommended image size: 1920×1080 (2560×1440 for best quality) |
| Theme colors | **🎨 Colors** panel (background, text, highlight, button, button text) |
| Fonts | Font dropdowns preview each font; also in the text toolbar when selecting text |
| Free position | Set Position to absolute and drag. **Hold Ctrl while dragging** to snap to page edges/centers, sibling elements and a 10px grid (red guides appear) |
| Error page | The dashed **⚠ Error Page** tab designs what visitors see for any address that doesn't exist (404). Not in the menu, can't be deleted |
| Shopify | Settings → domain, storefront token, product IDs (one per line, resizable box). Use the Shopify Products block |

## Deploy (Netlify)
Netlify env vars: `GITHUB_TOKEN`, `ADMIN_PASSWORD`. Saves commit to GitHub (`[skip ci]` for content), uploads trigger a rebuild.

## Notes
- `.html` shortcut files in the parent `INTEERNEETS` folder are personal shortcuts – leave them alone.
