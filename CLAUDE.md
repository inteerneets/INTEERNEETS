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
  - A custom see-through "glass" scrollbar overlay that fades in while scrolling/hovering and fades out when idle.
  - `glassScroll()` — the whole page. `glassScroll({el})` — a full-screen scroll box (the product overlay).
  - `glassScroll({el, inner:true})` — a box that lives **inside** the page (widgets, playlists, panels); the pill anchors to that element's own right edge instead of the viewport. `host` must be a positioned ancestor.
  - `glassScrollAll(root)` auto-attaches the inner bar to every `[data-glass-scroll]` element and runs automatically on load (and watches for new nodes). This is how any widget gets the glass bar — just add `data-glass-scroll`. The SoundCloud playlist (`.scx-list`) wires it directly in `soundcloud-player.js`.
  - `glass-scroll.js` is loaded on the live site (`index.html`, `404.html`) only, **not** the editor. Widget code must guard on `doc.defaultView.glassScroll` existing.

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
    - Cart button is pinned flush against the LEFT screen edge (bottom:22px, flat side on the edge, outer corners rounded) and the drawer slides from the left. Side comes from `settings.shopify_style.cart_side` (default `left`) in `cartSideCss()` and `injectFrameFonts()` in `shopify-shop.js`. `index.html` must NOT contain cart CSS.
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

6. **Product Page Scrolls, It Never Zoom-to-Fits:**
   `productFit()` in `index.html` scales to screen width only and the overlay scrolls with the glass scrollbar. The product `ResizeObserver` must only re-scale on viewport-width changes (opening the size dropdown changes height only).
7. **Scroll Performance:**
   `blend()` and `update()` use cached section offsets (`cacheSectionOffsets()`, refreshed in `fitAll()`). Do not call `getBoundingClientRect()` per scroll frame.
8. **Widget Block:**
   `.custom-widget-block` is created by the `</> Widget` toolbar button or the Studio "Embed / Widget" block. With a widget selected, the button replaces its code instead of adding a new one.
9. **Image Links:**
   Picture links are stored as `data-link` (plus the parent `<a href>` if the picture is wrapped in one). `index.html` has a global click handler for `[data-link]`.
10. **Cart Button Shape:**
    Flat side flush against the screen edge, no gap. Left by default; `cart_side:'right'` mirrors it. Both `cartSideCss()` and the `border-radius` line in `injectFrameFonts()` read `shopOpts(settings).cart_side`. Never hard-code a side or an offset (`right:16px`, `top:12px` was a regression).
11. **Glass Scrollbar Everywhere:**
   Any scrollable widget or box on the live site should use the glass scrollbar, not the native one — add `data-glass-scroll` (auto-wired) or call `glassScroll({el, inner:true})`. See System A.

12. **Fixed Desktop stage in the editor:** the last block of `admin/editor.js` locks the Desktop canvas to the page's saved stage (refW x refH, default 1275x808) and zooms it with `editor.Canvas.setZoom`. Do not make the canvas width follow the browser window.
13. **Text resize:** `makeTextResizable` uses all 8 handles, scales font-size, strips any fixed `height`, and wraps the drag in `UndoManager.stop()/start()` so Ctrl+Z is one step.
14. **Widget blocks:** no baked-in border/flex in the saved HTML; the dashed outline is editor-only CSS (`injectWidgetEditorCss`). `index.html` forces `border:0; display:block` on `.custom-widget-block` and gives scrolling widgets the glass scrollbar.

15. **Snapping:** in Free Drag mode elements always snap to guides, siblings and the 10px grid (hold Alt to move freely). The snap is re-applied on release (dmode:end) because the editor writes the final unsnapped left/top at mouse-up.
16. **Widget blocks** are absolute like text/pictures (no forced dmode). Cart: flat side on the screen edge, left by default; InteerShop.prewarm() starts loading shop data early so the cart shows sooner.
17. **Cart:** top-right by default (cart_side setting in the Shop panel: right/left). Flat side flush on the screen edge, drawer slides from the same edge with no gap (cartSideCss()). Do not add cart CSS to index.html.
18. **Embed widgets** are the embed-widget component type; the code lives in content (children are cleared by setWidgetCode) so it survives moving/saving. Never put code in children plus content.
19. **Undo:** one drag (move + snap) and one resize are each ONE undo step (UndoManager stop/start). Dropping an element into another block keeps its font size/colour (keepLookOnMove). The Desktop stage is re-centred inside the canvas by place().
20. **Scrolling text:** marquee.js (loaded by index.html and dmin/index.html) animates any element with data-marquee=left|right (+ data-marquee-speed). The editor's text toolbar has a Scroll/Align panel (marquee on/off, direction, speed, left/middle/right alignment). Text resize uses offsetWidth/offsetHeight (page pixels), never getBoundingClientRect (scaled by the editor zoom); side handles only widen the box, corners/top-bottom scale text and box together.
21. **Undo/redo:** selections are NOT undo steps (undoManager.trackSelection:false); drag / resize / widget resize are each one step; leftover gjs-freezed (half-transparent) is cleaned after undo/redo/drag. Free Drag is ON by default on every page and re-applied after each page load (pplyDragMode).
22. **Widgets:** the box height is set when code is added so the embed (> iframe {width:100%;height:100%}) resizes with the box. Widget resizing is custom (makeWidgetResizable): which edges move comes from where the pointer grabbed the box (GrapesJS handle names are unreliable for corners). The toolbar Scroll button sets data-scroll-h + --eh: the box scrolls (glass scrollbar on the live site) over a tall iframe. A cross-origin iframe's own scrollbar cannot be styled.
23. **Cart button (supersedes 10/17):** a compact black button (cart icon + amount, always visible, even at 0) in the menu bar at the far left, 16px from the edge (top:9px, 78x38). It is in cartSideCss() + the in-iframe CSS in injectFrameFonts(). The drawer still opens from the side set in cart_side (default right). Deploy rule: ALWAYS git pull --rebase before deploying, the live editor commits content to GitHub and an old local copy would overwrite it.
