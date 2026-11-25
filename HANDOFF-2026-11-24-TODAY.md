# INTEERNEETS – Full Handoff of Today's Work (2026-11-24 / 2026-11-25)

Read `CLAUDE.md` first for core architecture and coding rules (`1–28`). Credentials are stored in `HANDOFF.md` and environment variables, not repeated here.

- **Live site:** https://inteerneets.inteerneets.workers.dev
- **Editor:** https://inteerneets.inteerneets.workers.dev/admin/
- **Git clone (author, test, commit, push here):** `C:\Users\xxx\Documents\GitHub\INTEERNEETS` (`main`)
- **Desktop deploy mirror (what `wrangler deploy` uploads):** `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB`
- **Git binary:** `$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe`
- **Safety backups created before the revert:**
  - GitHub tag `backup-before-revert` (state immediately prior to reverting to `ef584c7`)
  - Local folder backup `C:\Users\xxx\.gemini\antigravity\scratch\desktop-full-backup`

---

## 1. Chronological Story & Commit Timeline

Earlier work (`29209ae` and prior sessions) introduced untested regressions in the cart button, text resize, undo history, widgets, and editor canvas layout. Today the codebase was cleanly reset and rebuilt step by step with browser verification in headless Chromium (Playwright against `node server.js` on port `8000`) at each stage, while keeping the user's own `content/*.json` saves intact:

1. **`e81ff49` – Revert whole site to `ef584c7` (Nov 18 baseline)**
   Clean rollback after backing up the pre-revert state (`backup-before-revert`).
2. **`283519f` – Core feature restoration & editor foundation**
   Restored dynamic variant pricing, embed widget block, image links + shadows/glow, SoundCloud playlist player, glass scrollbars, performance section-offset caching, fixed Desktop editor canvas stage, text resize/undo improvements, and early shop prewarm (`InteerShop.prewarm()`).
3. **`33d5359` – Stage centering, 1-step undo, embed persistence, glass scrollbars**
   Added `place()` re-centering for the fixed stage, wrapped operations in single undo transactions, moved embed widget markup into component `content` with cleared children, added `keepLookOnMove`, and wired glass scrollbars cleanly.
4. **`1afa6c2` – Scrolling text (`marquee.js`), text alignment & Scroll/Align panel**
   Introduced `marquee.js` (`data-marquee`, `data-marquee-speed`), the editor `Scroll/Align` toolbar popover (Left/Middle/Right align, marquee toggle, direction, speed), and zoom-aware text resize fixes.
5. **`004dfdd` / `620b83b` – Undo selection cleanup, widget 8-handle resize & scroll box, marquee width fix**
   Set `undoManager: { trackSelection: false }`, cleaned leftover `.gjs-freezed` opacity state, added custom edge-detected 8-handle widget resize (`makeWidgetResizable`) + `Scroll` button (`data-scroll-h` + `--eh`), and fixed marquee to measure original width (`mqOrigWidth`) before applying `nowrap`.
6. **`4947797` / `bfb977e` / `2fe1d3d` – Marquee seamless `::after` loop, transparent cart toggle, iframe scrollbar clip**
   Rewrote `marquee.js` loop using GPU-animated `transform: translate3d` on an `::after` copy (`data-mq-rep`) so scrolling text loops seamlessly without jumps; hid embed iframes' native scrollbar by expanding iframe width `+24px` inside an overflow-clipped container; removed the cart button's black rounded background pill.
7. **`3df4cd2` – Independent text width resize, 43px white default, tighter marquee gap, per-element drag mode, in-flow widgets**
   Changed text box resize handles to change width independently of height (text size is controlled by font size controls), set default new text to `43px` white, tightened marquee separator gap to a single space (`GAP = ' '`), added drop shadow to cart button, switched to `autoDragMode` (floating vs flow), and made newly added widgets default to in-flow blocks (`position: relative; margin: 20px auto`).
8. **`71f3fce` – Zoom-accurate drag controller + sibling push-away + instant `#cart-fast` button on top-right**
   Rewrote floating drag handling (`snapshotAbs`, `ptr` in page px, `place`, `applySnap`, `resolveOverlaps`) to eliminate zoom drift and push overlapping floating elements cleanly aside as one undo step; added `#cart-fast` inline in `index.html` at top-right (`right: 22px; top: 9px`) backed by `localStorage.ish_cart`; expanded nested/widget iframe scrollbar clipping.
9. **`9e7bd3d` – Unlimited downward page growth, auto-scroll, click-through floating sections, better push-away**
   Added `growPage`, `tick` edge auto-scroll, and `growOnEdit` so dragging or placing/resizing elements below the page bottom extends the page dynamically without breaking fixed-width zoom; added `.ed-clickthrough` for floating page sections over the canvas; widened `resolveOverlaps` across all floating items on the page.
10. **Final fix (red cart button SVG fill & smooth red-bg fade) – `index.html`**
    Fixed `#cart-fast svg` rendering black (`rgb(0, 0, 0)`) despite `#cart-fast` having red `color: rgb(255, 0, 0)`: added `fill:currentColor` on `#cart-fast svg` and `#cart-fast svg *` with subtle drop shadow (no outline) and `transition:color .4s ease`. Added background color sampling inside `blend()` (`readLayerRgb`, `isRedRgb`) and `openProduct()`/`closeProduct()` (`__setCartScrollRed`, `__setCartProdRed`): when the visible background at `#cart-fast` is red (e.g. Shop `#ff0000` or product overlay `#f80000`), both the cart icon and count smoothly fade to black (`#000`), and smoothly fade back to red on all other page backgrounds.

---

## 2. Current State of Every Feature & Subsystem

### A. Fast Cart Button & Shopify Drawer (`index.html`, `shopify-shop.js`)
- **`#cart-fast` (`index.html`):** Rendered immediately in the fixed top bar at `top: 9px; right: 22px; height: 38px; z-index: 120`, displaying the SVG cart icon + item count (`#cart-fast-n`) with transparent background and subtle `drop-shadow(0 1px 3px rgba(0,0,0,.65))`. Always visible even at `0`.
- **Instant paint & sync:** Reads/writes `localStorage.ish_cart` (`st.on`, `st.n`, `st.svg`, `st.color`, fallback `#ff0000`) and polls every `600ms` via `sync()` against Shopify's hidden `.shopify-buy-frame--toggle.is-sticky` iframe. Once loaded, `body.has-fast-cart` hides Shopify's toggle iframe. Clicking `#cart-fast` calls `e.stopPropagation()` and `window.__shopUI.openCart()` (or queues `window.__cartOpenPending = true` until ready).
- **Red icon fix:** `#cart-fast svg` and `#cart-fast svg *` inherit `fill: currentColor` from `#cart-fast` (`rgb(255, 0, 0)`), matching the count text and red site accents.
- **Shop & Cart drawer (`shopify-shop.js`):** `InteerShop.prewarm()` starts loading shop data early. `cartSideCss()` keeps the drawer sliding from `cart_side` (`right` by default, or `left`), and dynamic pricing / custom size dropdowns / swatch switching work inside the styled iframes.

### B. Editor Canvas, Drag, Snap & Unlimited Page Growth (`admin/editor.js`, `admin/editor.css`)
- **Fixed Desktop stage:** Canvas is locked to the page's saved stage (`refW × refH`, default `1275 × 808`) and zoomed + re-centered (`place()`) cleanly inside the editor viewport so browser resizing never reflows layout.
- **Per-element drag mode (`autoDragMode`) & custom zoomed drag controller (`setupSnapping`):**
  - Floating (`position: absolute` / `fixed`) elements use `snapshotAbs`, `ptr` (pointer coordinates normalized to unscaled page pixels, ignoring synthetic re-dispatched events), `applySnap` (red guides, sibling edges, 10px grid; hold `Alt` to bypass snap/push), and `resolveOverlaps` (cascading push-away across all floating items on the page by the shortest axis).
  - Flow elements snap along blue insertion guide lines and push flow neighbors naturally.
  - Hold-dragging an already-selected element works cleanly in addition to the move handle, for both newly added and pre-existing items across every page.
- **Unlimited page height (`growPage`, `tick`, `growOnEdit`):**
  - Dragging past the bottom edge stretches the page and its section downward and auto-scrolls the canvas (`tick` near top/bottom viewport edges). Adding or resizing items below the bottom also triggers `growOnEdit`.
  - `growPage` ignores editor chrome and section wrappers so stretched sections do not self-inflate infinitely.
  - `pageRef[page].h` stores full page height and persists as `refH`, while the editor viewport height stays locked to one screen height so zoom does not jump.
  - Floating full-page sections receive `.ed-clickthrough` in the editor so elements positioned underneath in DOM order remain selectable and draggable.
- **Undo/Redo & cleanup:** `undoManager: { trackSelection: false }`, each drag/push/resize transaction is recorded as a single undo step (`UndoManager.stop()/start()`), `cleanFrozen` clears stuck `.gjs-freezed` transparency, and `keepLookOnMove` preserves font size/color when reparenting elements.
- **Toolbar spacing (`admin/editor.css`):** Custom buttons (`Scroll/Align`, `</> Code`, `Scroll`, etc.) have dedicated width classes so labels never collide.

### C. Typography & Scrolling Marquee (`marquee.js`, `admin/editor.js`, `index.html`, `admin/index.html`)
- **Defaults & resizing:** New text elements default to `43px` `#ffffff`. Side resize handles adjust box `width` independently while `height` tracks text naturally; font size controls text scale (`makeTextResizable`, using page-px `offsetWidth`/`offsetHeight`).
- **Smooth endless marquee (`marquee.js`):** Elements with `data-marquee="left|right"` and `data-marquee-speed` clone their visible text into CSS `--mq-text` / `[data-mq-rep]::after` with a single-space separator (`GAP = ' '`), hiding the underlying flow text (`color: transparent`) to preserve layout box dimensions and animating via `transform: translate3d(...)` for a seamless endless loop without gaps. Disabling scroll (`clear()`) restores `mqOrigWidth`.
- **Scroll/Align toolbar panel (`admin/editor.js`):** Controls Left/Middle/Right alignment, scrolling toggle, Left/Right direction, and speed slider.

### D. Embed / Widget Blocks & Glass Scrollbars (`admin/editor.js`, `glass-scroll.js`, `soundcloud-player.js`, `index.html`)
- **Component & persistence (`embed-widget`):** Embed markup is stored cleanly via `setWidgetCode`/`getWidgetCode` in `content` (clearing children) so HTML survives moves and saves. Default placement uses in-flow layout (`position: relative; margin: 20px auto`).
- **8-handle resize & scroll clipping:** `makeWidgetResizable` determines active edges from where the pointer grabs the box rather than relying on ambiguous handle names. Embedded iframes (including nested frames) are styled `+24px` wider than their wrapper with overflow hidden to clip unstyleable third-party native scrollbars.
- **Widget `Scroll` mode:** Toolbar `Scroll` button sets `data-scroll-h` + `--eh` so tall widgets scroll internally, wired on the live site to `glass-scroll.js` fading glass scrollbars. SoundCloud playlist cards (`soundcloud-player.js`) also use `glassScroll({ el: list, host: host, inner: true })`.

---

## 3. Deploy & Verification Routine (Strict)

Always develop/test in `C:\Users\xxx\Documents\GitHub\INTEERNEETS` first, **never** overwrite `content/*.json` from test runs, and **always** pull-rebase before pushing/deploying because the live admin editor commits `content/*.json` updates directly to `origin/main`.

```powershell
$git = "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe"
cd "C:\Users\xxx\Documents\GitHub\INTEERNEETS"
& $git checkout -- content                      # drop any local test saves to content/
& $git add -A . ; & $git reset -q HANDOFF-DETAILED.md
& $git commit -m "message"
$token = [Environment]::GetEnvironmentVariable('GH_PUSH_TOKEN','User')
$auth  = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
$gh = @('-c','credential.helper=','-c',"http.https://github.com/.extraheader=AUTHORIZATION: basic $auth")
& $git @gh pull --rebase origin main            # REQUIRED: preserve live editor saves
& $git @gh push origin main
robocopy "C:\Users\xxx\Documents\GitHub\INTEERNEETS" "C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB" /MIR /XD .git .wrangler node_modules /XF HANDOFF-DETAILED.md
cd "C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB"; npx wrangler deploy
```

Local test server: `node server.js` on `http://localhost:8000` (verify in Playwright Chromium, run `node --check` on any modified `.js` files, bump `?v=` query params in both `index.html` and `admin/index.html` when touching JS files, stop `node server.js` cleanly afterward, and run `git checkout -- content`).

---

## 4. Known Limits & Untested Edge Cases

- **Cross-origin nested scrollers:** Third-party cross-origin iframe contents (such as nested cookie banners inside RA widgets) cannot have their internal scrollbars restyled; the `+24px` outer wrapper clip hides the primary embed scrollbar, while nested scrollers inside cross-origin frames remain browser-rendered.
- **Cart non-zero count sync:** `#cart-fast` rendering (`rgb(255, 0, 0)` icon + count, localStorage warm paint, click opening drawer) is verified at `0` items; live count updates immediately after adding a paid Shopify item were not exercised in an isolated test with real cart mutations.
- **Glass pill drag scaling:** Dragging the glass scrollbar pill inside the zoomed live stage works in element pixels and can feel slightly offset depending on zoom scale.
- **Legacy pre-update pages:** Pages last saved prior to these updates retain their historical `refW`/`refH` stage dimensions until re-saved in the editor.
