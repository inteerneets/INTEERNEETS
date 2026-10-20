# INTEERNEETS WEB

Studio website: a "Coming Soon" home page, a Shopify-powered shop, and a built-in **dark-mode visual editor** where you drag, layer and style everything.

---

## Quick start (editing)

1. Install [Node.js](https://nodejs.org) (LTS) once.
2. Double-click **`RUN WEBSITE.bat`**.
3. Open:
   - Website: <http://localhost:8000>
   - Editor: <http://localhost:8000/admin/>

> The editor saves to files on your PC (`content/page-home.json`, `content/page-shop.json`, `content/settings.json`, `images/uploads/`, `fonts/`). To publish, push those changes to GitHub — Netlify redeploys automatically.

---

## Editor guide (`/admin/`)

| I want to... | How |
|---|---|
| See the full live site while editing | The canvas **is** the real page (WYSIWYG). **Preview** hides the editing UI. Switch **Home / Shop** with the tabs. Desktop/Tablet/Mobile buttons preview responsive sizes. |
| Add a new text box | **+ Text** (top bar) or drag blocks from the **Blocks** panel (category *Studio*) |
| Add an image | **+ Image**, pick/upload one, it appears on the page |
| Drag things around freely | Turn on **Free Drag**, then drag any element anywhere |
| Layering | Select an element → **Position & Layers** → set `Z-Index` (higher = on top). Use the **Layers** panel to reorder/select. Example: background `z-index 0`, text `10`, image `20`. |
| Change font / color / style per element | Select it → **Typography**: font, size, weight, italic, color, align, spacing, decoration, case |
| Upload images or fonts | **Upload** (top bar): images (png/jpg/webp/svg/gif) and fonts (`.woff .woff2 .ttf .otf`). Uploaded fonts appear in the Font dropdown as `Name (uploaded)`. |
| Change site-wide colors (bg, text, highlight, button) | **Colors** (top bar): pick swatches or a quick scheme, then **Save Colors**. Elements created by the editor use these colors, so changing one updates everything. In the Style panel you can also type `var(--c-highlight)`, `var(--c-text)`, `var(--c-bg)`, `var(--c-button)`. |
| Background color / image | **Background** section of any element (e.g. the full-page section) |
| Save | **Save** or `Ctrl+S` |
| Undo / Redo / Reset | Top bar buttons |

### Site Settings (gear icon)
- **Contact email** (default `inteerneets@gmail.com`)
- **Shopify domain, Storefront token, Product IDs** (one per line)
- **Social links**
- **Site background color** — shown *exactly* as chosen (white = pure `#ffffff`). A dark shading overlay is applied **only** if you tick *Add dark shading overlay*.

---

## Selling (Shopify only — no inquiry forms)

Everything is bought directly through Shopify checkout. Each order creates an order/ticket in your Shopify admin with all customer and shipping info, and you ship it.

1. In Shopify, enable the **Headless / Buy Button** sales channel and create a **Storefront access token**.
2. In the editor: Settings → paste domain (`your-store.myshopify.com`), token, and product IDs.
3. On the Shop page, add **Shopify Products** blocks (or use the existing *Original Works* / *Merchandise* sections). Products from Settings render there on the live site.

## "EMAIL US"

Pricing varies per session, so the home and shop pages have an **EMAIL US** button (`mailto:inteerneets@gmail.com`) that opens the visitor's email app. Change its text, style or address by selecting it in the editor.

## No template flash on refresh

The pages ship as empty shells behind a loading cover and only reveal once your saved design (and settings) are loaded. Files are served uncached locally.

---

## Putting it live (Netlify, free) — and editing the live site

1. Push this folder to your GitHub repo.
2. Netlify → Add new site → Import from GitHub → build command empty, publish directory `.`.
3. **One-time setup so the editor can update the live site** (Netlify → Site configuration → Environment variables):
   - `GITHUB_TOKEN` — create at GitHub → Settings → Developer settings → Fine-grained tokens. Repository: `INTEERNEETS` only. Permission: **Contents → Read and write**.
   - `ADMIN_PASSWORD` — any password you choose (the editor asks for it the first time you Save).
   - Then **Deploys → Trigger deploy** once.
4. Open `https://YOUR-SITE.netlify.app/admin/`, edit, press **Save**. Enter the password when asked. The editor commits your changes to GitHub and Netlify republishes automatically — **live in about 1 minute**. Uploads (images, fonts), Colors and Settings publish the same way.

Locally (`RUN WEBSITE.bat`) Save writes straight to your files with no password; commit & push them if you want them online.

## File map

```
index.html / shop.html   page shells (load saved design from /content)
admin/                   visual editor (GrapesJS, dark theme)
netlify/functions/api.js publishes editor saves/uploads to GitHub (live site)
server.js                local server + save/upload API (port 8000)
content/                 page-home.json, page-shop.json, settings.json
images/uploads/, fonts/  uploaded media
RUN WEBSITE.bat          one-click launcher
```