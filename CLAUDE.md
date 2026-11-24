# INTEERNEETS — Master Architecture & Codebase Guide for Claude Code

> **To Claude Code / Any AI Agent:** Read this document BEFORE modifying any code in this repository.  
> This project has subtle interactions between GrapesJS, custom canvas scaling, iframe event handling, and a headless Shopify integration. Breaking any of the rules below will break the live site or the editor.

---

## 1. Quick Directory & Repo Overview

- **Live URL:** `https://inteerneets.inteerneets.workers.dev` (transitioning to `inteerneets.com`)
- **Active Working Copy:** `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB`  
  *(All edits must be made here first, tested, then copied to the git repo!)*
- **Git Repo:** `C:\Users\xxx\Documents\GitHub\INTEERNEETS` (branch `main`)
- **Git Binary:** `$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe`
- **Admin Panel:** `/admin/` (Password: `KM4fNVpb6DFK2e25PAF8`)

---

## 2. Why Your Widget Couldn't Move (And How Dragging Works in this Editor)

### The Problem
When you added the custom widget box, it could not be dragged when held. There are two specific reasons why this happens in this codebase:

1. **The Iframe Mouse-Event Trap:**
   When someone pastes an `<iframe>` (YouTube, SoundCloud, Spotify, or custom widget) inside a container on the canvas, **the iframe intercepts all browser pointer events (`mousedown`, `mousemove`, `mouseup`)**. GrapesJS's canvas listeners never receive the click, so GrapesJS cannot initiate a drag or selection!
   - **The Fix:** In editor mode, all children inside an embed/widget container MUST have `pointer-events: none !important;` so clicks pass through to the outer draggable box:
     ```css
     /* In editor canvas */
     .custom-widget-block * { pointer-events: none !important; }
     ```
     On the live site (`index.html`), `pointer-events` is normal (`auto`).

2. **GrapesJS Drag Mode (Free Drag vs Flow):**
   - By default, GrapesJS is in flow drag mode (`editor.setDragMode('')`).
   - For an absolutely positioned element (`position: absolute; left: 80px; top: 80px`), dragging the body of the element only works if:
     a) **Free Drag** mode is active (toggled via `#btn-freedrag`, which runs `editor.setDragMode('absolute')`), **OR**
     b) The element has a **Move** handle in its toolbar (`q-move`), **OR**
     c) The component is configured with `draggable: true` and the drag mode is explicitly set.
   - In addition, whenever GrapesJS reloads or a component is selected, resizable handles MUST be re-applied via `editor.on('component:selected')` and `editor.on('component:add')`. Functions are NOT saved into JSON!

---

## 3. The 3 Core Systems of the Codebase

### System A: The Live Engine (`index.html` + `glass-scroll.js`)
- **Desktop/Tablet Mode (Screen Width >= 820px):**
  - Uses `fitStage()`. Every page has a reference width and height (`refW` x `refH`, default 1275x808) saved in `content/page-<id>.json`.
  - The entire page canvas is mathematically scaled via CSS `transform: scale(...)` to fit the browser viewport perfectly without horizontal scrollbars.
  - **Rule:** Never use standard viewport units like `100vw` or `100vh` in saved page CSS; the engine rewrites them to stage units (`unitFix`).
- **Mobile Stack Mode (Screen Width < 820px):**
  - Switches to `stackMode` (`stackEnter()` / `stackMeasure()`).
  - Absolute elements are stripped of fixed coordinates and stacked vertically in visual top-to-bottom order so the site scrolls naturally on smartphones.
- **Glass Scrollbar (`glass-scroll.js`):**
  - A custom see-through scrollbar overlay attached to `window` and to the product page modal.

### System B: The Page Editor (`admin/index.html`, `admin/editor.js`, `admin/editor.css`)
- Built on top of **GrapesJS v0.21.13**.
- **Crucial Hook Pattern:** `ensureExtraTools(c)` is chained across the file:
  ```javascript
  (function addYourTool() {
    const prev = ensureExtraTools;
    ensureExtraTools = function(c) {
      prev(c);
      // add your custom buttons to c.get('toolbar')
    };
  })();
  ```
  Every custom element (SoundCloud player, picture, text, button) registers its toolbar buttons (like "Size ✎", "Center", "Link") through this hook.
- **Saving Pages:**
  - `savePage(pageId)` extracts HTML and CSS via `editor.getHtml()` and `editor.getCss()`.
  - Sends a POST request to `/api/save-page` which commits the JSON directly to the GitHub repository with a `[skip ci]` commit message.

### System C: Headless Shopify Integration (`shopify-shop.js`)
- Connects directly to the Shopify Storefront API (`2024-10`) via GraphQL using `shopify_domain` and `shopify_storefront_token` from `content/settings.json`.
- **Why it is custom:**
  - Standard Shopify Buy Button widgets look clunky and have fixed styling.
  - `shopify-shop.js` hides Shopify's default product markup and injects a custom, high-end design:
    - Custom typography and layout (`.pg-name`, `.pg-price`, `.pg-desc`).
    - Custom color swatch picker that swaps product images (`varPick()`).
    - Custom dropdown replacement (`enhanceSelects()`).
    - Custom cart button that sits flush against the left screen edge.
- **Data Flow:**
  - `fetchShopData()` queries products and caches them in `window.__ishCache`.
  - `addProduct()` renders the product modal overlay.
  - When options (sizes, colors) change, `varPick()` in `shopify-shop.js` receives the change event.

---

## 4. File-by-File Responsibility Map

| File | Lines | Primary Responsibility |
|---|---|---|
| `index.html` | ~600 | Live website frontend, page loader, stage scaling (`fitStage`), mobile stack switcher, product modal launcher. |
| `admin/editor.js` | ~3300 | GrapesJS initialization, custom component types, drag/resize handlers, color panels, shop panel, save/publish routines. |
| `admin/index.html` | ~260 | Editor top toolbar buttons (`+ Text`, `+ Image`, `+ Playlist`, `</> Widget`), floating side panels for Colors, Button styles, and Picture size. |
| `shopify-shop.js` | ~900 | Storefront GraphQL API client, custom product card grid, category filter tree, product detail overlay, cart styling. |
| `soundcloud-player.js` | ~300 | Glassmorphic SoundCloud playlist player widget. Handles both live widget rendering and editor placeholder. |
| `worker.js` / `functions/api/[[route]].js` | ~280 | Cloudflare Worker backend. Handles `/api/save-page`, `/api/save-settings`, `/api/upload`, rate-limiting, and password authentication. |
| `content/settings.json` | JSON | Global site configuration: Shopify tokens, site colors, custom fonts, hidden products, categories. |
| `content/page-*.json` | JSON | Page designs (Home, Shop, Product template, etc.) containing the saved HTML and CSS. |

---

## 5. Strict Rules for Modifying this Codebase

1. **Always Work in the Desktop Folder First:**
   `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB` is the primary working directory. Only after validating changes should you copy files over to `C:\Users\xxx\Documents\GitHub\INTEERNEETS`.
2. **Always Bump Cache-Busting Version Strings:**
   Browsers aggressively cache JavaScript. When editing `shopify-shop.js`, `editor.js`, or `soundcloud-player.js`, you **MUST** bump the query version string `?v=...` in both `index.html` and `admin/index.html` (e.g. `?v=20261124a` -> `?v=20261124b`).
3. **Never Break `pointer-events` in Editor Canvas:**
   Any interactive component (widgets, players, iframes, SVGs) placed on the editor canvas MUST have `pointer-events: none` on its children while inside `.gjs-frame` / editor mode. Otherwise, users cannot select or drag the element!
4. **Never Overwrite User Customizations in `content/`:**
   Do not overwrite `content/page-*.json` or `content/settings.json` with mock data during tests.
5. **Preserve `ensureExtraTools` Chain:**
   When adding a toolbar option to GrapesJS components, always wrap `ensureExtraTools` in an IIFE using the established pattern so you don't overwrite other tools.
