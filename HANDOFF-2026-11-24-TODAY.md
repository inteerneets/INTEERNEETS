# INTEERNEETS – Handoff for 2026-11-24 / 25 (everything done today)

Read `CLAUDE.md` first (architecture and rules 1-24). Credentials are in `HANDOFF.md`, not repeated here.

- **Live:** https://inteerneets.inteerneets.workers.dev · **Admin:** `/admin/`
- **Desktop folder (what `wrangler deploy` uploads):** `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB`
- **Git clone (commit/push from here):** `C:\Users\xxx\Documents\GitHub\INTEERNEETS` (branch `main`)
- **Git binary:** `$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe`
- **Safety copies:** tag `backup-before-revert` on GitHub (last state before the Nov-18 revert), `C:\Users\xxx\.gemini\antigravity\scratch\desktop-full-backup` (old Desktop folder).

## 1. How the day went (so nobody repeats it)

1. A Claude session on claude.ai made many changes that were never tested in a browser and broke things (cart, text resize, undo, widgets, editor layout).
2. The whole site was reverted to the Nov-18 commit `ef584c7` (`e81ff49`), then the wanted features were re-added **and tested in headless Chromium** (Playwright + `node server.js` on port 8000), then deployed.
3. Content (`content/*.json`) was kept at the user's own saves. **Never overwrite it** (see rule below).

## 2. Deploy routine (use exactly this)

```powershell
$git = "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe"
cd "C:\Users\xxx\Documents\GitHub\INTEERNEETS"
& $git checkout -- content                      # tests may have saved into content/: drop that
& $git add -A . ; & $git reset -q HANDOFF-DETAILED.md
& $git commit -m "message"
$token = [Environment]::GetEnvironmentVariable('GH_PUSH_TOKEN','User')
$auth  = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
$gh = @('-c','credential.helper=','-c',"http.https://github.com/.extraheader=AUTHORIZATION: basic $auth")
& $git @gh pull --rebase origin main            # ALWAYS: the live editor commits pages to GitHub
& $git @gh push origin main
robocopy "C:\Users\xxx\Documents\GitHub\INTEERNEETS" "C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB" /MIR /XD .git .wrangler node_modules /XF HANDOFF-DETAILED.md
cd "C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB"; npx wrangler deploy
```
**Lesson:** once a deploy published an old copy of `page-home.json` over the user's fresh save, because `pull --rebase` was skipped. Always pull first, then robocopy, then deploy.

Local testing: `node server.js` (port 8000, serves `/` and `/admin/`; saving in the local editor writes into `content/`, so run `git checkout -- content` afterwards). Chromium for Playwright is installed (`python` + `playwright`).

## 3. What exists now (all deployed, version ids in git log / wrangler)

**Features restored / built**
- Dynamic price when a size/option changes (`shopify-shop.js`).
- Embed / Widget block (`embed-widget` component type): code lives in `content` (children cleared by `setWidgetCode`), box gets a real height so the iframe fills and resizes with it; custom resizer where **all 8 handles move their own edge** (edge chosen from where the pointer grabbed the box); toolbar buttons `Scroll`, `</> Code`; widgets are normal in-flow blocks (`position:relative; margin:20px auto`) so they push other items. Embed iframes are 24px wider than the box and the box clips them (hides the embed's own scrollbar, which cannot be styled). `Scroll` = `data-scroll-h` + `--eh`: the box scrolls over a tall iframe and gets the glass scrollbar on the live site.
- Image link + shadow/glow, SoundCloud playlist player, glass scrollbar (`glass-scroll.js`, also on scrolling areas inside widgets), perf (cached section offsets), product page scrolls instead of zooming.
- **Cart button:** compact, in the menu bar at the far left (16px gap, top 9px), cart icon + amount only: transparent background, small drop shadow, always visible even at 0. The drawer still opens from the side set by `cart_side` (default right). `InteerShop.prewarm()` starts loading shop data early.
- **Scrolling text** (`marquee.js`, loaded by `index.html` and `admin/index.html`): `data-marquee="left|right"` + `data-marquee-speed`. A `::after` layer holds the text repeated with a single space and is animated with `transform` (smooth, endless, no gap); the real text stays invisible to keep the box size. Turning it off restores the old box width (`mqOrigWidth`).
- **Text toolbar `Scroll/Align`:** panel with Left/Middle/Right alignment, scrolling on/off, direction, speed.
- **Text boxes:** new text is white, 43px. Resize handles change only the **width**; height follows the text; size is changed with the font controls.

**Editor behaviour (works on every page and new pages)**
- Fixed Desktop stage: canvas is the page's saved stage (default 1275×808), zoomed to fit and re-centred (`place()`), so resizing the browser never reflows the page.
- Undo/redo: selection is not an undo step; one drag / resize = one step; leftover `gjs-freezed` (half-transparent) is cleaned after undo/redo/drag; elements dropped into another block keep their font size/colour (`keepLookOnMove`).
- **Drag mode per element** (`autoDragMode`): floating (position:absolute/fixed) elements move freely and snap to guides + grid (red guides, snap re-applied on release; hold Alt to move freely); elements in the page flow snap into the layout at the blue guide line and push the others aside. Hold-dragging a selected element works as well as the move button. The Free Drag button forces free placement for everything (off by default).
- Toolbar buttons with long labels have their own width (no overlap with the Center button).

## 4. Rules that matter (also in CLAUDE.md)

1. Edit the clone, test in Chromium, `node --check` every JS file, bump `?v=` in **both** `index.html` and `admin/index.html` (and `404.html` for glass-scroll), then deploy as above.
2. Never overwrite `content/page-*.json` / `settings.json`; the live editor writes them.
3. Keep the `ensureExtraTools` IIFE chain when adding toolbar buttons; new toolbar IDs need `gjs-toolbar-item__<id>` CSS if the label is long.
4. Use `offsetWidth/offsetHeight` (page pixels), not `getBoundingClientRect` (scaled by editor zoom / live stage scale) for sizes you write into styles.
5. Don't put cart CSS in `index.html`; it lives in `cartSideCss()` / `injectFrameFonts()`.
6. Report only what was actually tested.

## 5. Open items / known limits

- A **cross-origin iframe's own scrollbar** (e.g. the ra.co widget, its cookie box) cannot be restyled; it is hidden by clipping, so the arrows of a nested scroller can still peek out. For a glass bar use the widget `Scroll` option.
- Cart at 0 items was tested; the count update with real items was not.
- Glass-pill dragging inside the scaled live stage may feel slightly off (drag math is in element pixels).
- Pages saved before today keep their old saved stage size until re-saved in the editor.
- Shop sidebar / search bar size controls (Shop panel) and widget snapping to guides beyond the above were not changed.

## 6. Later changes (02:00-02:35)

- **Drag controller rewritten** (setupSnapping in dmin/editor.js): the editor's own drag maths is wrong when the canvas is zoomed (elements ran away from the pointer, and left:50% + 	ranslateX items jumped). Now: a snapshot of every floating element is taken on mouse-down (snapshotAbs), the element is placed from the real pointer movement in PAGE pixels (ptr, place), snapped (red guides, grid, siblings) and **any floating element it lands on is pushed away** (esolveOverlaps, then snapped next to it, cascading). The whole drag incl. pushed items is ONE undo step. Hold Alt to move freely (no snap, no push). Works for old and new items on every page.
- ptr (pointer tracker) is in page pixels: events inside the canvas are already page px, real events in the editor window are converted, synthetic re-dispatched ones are ignored (isTrusted).
- **Cart button:** #cart-fast (index.html, right after <nav>) is drawn at once from localStorage.ish_cart (count, icon, colour) at the far RIGHT of the menu bar (22px gap), then kept in sync with Shopify's real toggle (which is hidden); click opens the drawer (__shopUI.openCart(), with stopPropagation because page click handlers close it). 2nd visit: button present after 0.1 s.
- Widgets: every embed iframe (also nested) is 24px wider than its box so the box clips the embed's own scrollbar.