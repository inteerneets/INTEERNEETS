# INTEERNEETS: Full Handoff (end of Claude session, 2026-11-24)

Read these first, in the project folder: `CLAUDE.md` (architecture and rules), `HANDOFF.md` (credentials and original to-do), `UPDATED_HANDOFF.md`, `HANDOFF-SESSION-2.md`.
Credentials are intentionally not repeated here; they are in `HANDOFF.md`.

---

## 1. Where things stand right now

| Item | State |
|---|---|
| Desktop working copy (`C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB`) | Latest code. Includes the widget `dmode: 'absolute'` fix and `editor.js?v=20261124e`. |
| Git clone (`C:\Users\xxx\Documents\GitHub\INTEERNEETS`) | Same files. Local `main` is **ahead of origin by 1 commit**: `82b0383 Widget blocks always drag freely (dmode absolute)`. **Not pushed.** |
| `origin/main` | At `4b464fc`. |
| Live site (Cloudflare Worker `inteerneets`) | Deployed version `ad7d1506-a6db-4fe1-ae59-9d76cfbd1281`, which is `4b464fc`. It does **not** have the `82b0383` widget fix. Previous version: `49cc9048-9de3-4ab2-8e3e-450f7cc2874e`. |

To ship the pending commit, from PowerShell:
```powershell
$git = "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe"
cd "C:\Users\xxx\Documents\GitHub\INTEERNEETS"
$token = [Environment]::GetEnvironmentVariable('GH_PUSH_TOKEN','User')
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
& $git -c credential.helper= -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $auth" push origin main
cd "C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB"
npx wrangler deploy
```
(`git log` in PowerShell fails with a missing-`less` pager error; use `& $git --no-pager log --oneline -5`.)

---

## 2. What was built this session (code is in place)

1. **Dynamic price on variant change** (`shopify-shop.js`): `varPick()` calls new `variantPriceUpdate(d, wr, key)`, which reads every `<select>` in the Shopify iframe, finds the matching variant in `window.__ishCache`, and writes `money(price)` into `.pg-price`. Matching picks the variant with the most agreeing options and no conflicts.
2. **Embed / Widget block** (`admin/index.html`, `admin/editor.js`):
   - Toolbar button `#btn-add-widget` (`</> Widget`). With a widget selected it replaces that widget's code; otherwise it creates a new absolutely positioned `.custom-widget-block`.
   - Studio sidebar block "Embed / Widget" (`bm.add('custom-widget', ...)`).
   - Someone else (not Claude) added `injectWidgetEditorCss()` (children `pointer-events:none` in the canvas) and committed it as `f71ac54`.
   - Claude's last edit: `makeWidgetResizable()` now also sets `draggable: true, dmode: 'absolute'` so widgets drag freely without the Free Drag toggle. **Untested.**
3. **Image link + shadow/glow** (`admin/index.html`, `admin/editor.js`, `index.html`): `#bi-link` field and `#bi-shadow-box` editor in the picture panel; link stored as `data-link` plus parent `<a href>` if wrapped; `index.html` has a global `[data-link]` click handler.
4. **Less lag** (`index.html`): section offsets cached in `cacheSectionOffsets()` (refreshed in `fitAll()`), `blend()`/`update()` no longer call `getBoundingClientRect()` per scroll frame; `.bg-layer` has `will-change` and `contain: layout style`.
5. **Cart top-right, always visible**: CSS in `index.html` and `cartSideCss()` in `shopify-shop.js` (`position:fixed; top:12px; right:16px; z-index:110`; drawer slides from the right). The old `cart_side` setting is ignored.
6. **Product page scrolls instead of zooming** (`index.html`): `productFit()` scales to width only; the product `ResizeObserver` only re-scales when viewport width changes.
7. `CLAUDE.md` updated (cart location, rules 6-9).

Current cache-bust strings: `shopify-shop.js?v=20261124d` (both HTML files), `editor.js?v=20261124e` (admin only), `soundcloud-player.js?v=20261117e`.

---

## 3. Open problems reported by the user (NOT solved)

1. **"Nothing appears when I first go in, and after a while it looks like this"** (shop page). Cause unknown. Unclear whether it is the live site or the editor. My scroll-caching code runs at load (`cacheSectionOffsets()` is called before `fitAll()`), so look there first. Get the browser console output (F12) and check the loading-screen logic (`hideLoader`, `loading_min_seconds`).
2. **Sidebar categories (All products / INTEERNEETS / C4PARS) and the search + sort bar look smaller than before.** I diffed everything against `6a20726`: no change touches `.ish-side`, `.ish-bar`, shop settings, `content/*.json` (only line endings), or `fitStage`. I could not find a cause in code. Quickest test: `npx wrangler rollback 49cc9048-9de3-4ab2-8e3e-450f7cc2874e`, compare, then redeploy. The sizes are controlled by the editor's Shop panel ("Categories sidebar", "Search & sort bar") and `settings.json` `shopify_style` (`side_size`, etc.).
3. **Widget cannot be dragged in the editor.** The screenshot shows the placeholder widget selected with handles and a ✥ handle; it was treated as a text component. The `dmode: 'absolute'` fix is committed locally but **not deployed and not tested**.
4. **Nothing from this session was ever run in a browser.** Only `node --check` syntax checks and code review. Still to verify: cart position vs the 56px fixed top menu, size dropdown scrolling with the glass scrollbar, price changing per size, widget code surviving Save and reload, image link click behavior on the live site.

---

## 4. Things to know

- Line endings: `6a20726` had LF; current `HEAD` files are CRLF (Windows). Harmless to the browser but makes `git diff` show whole files. Use `git diff --ignore-space-at-eol`.
- Early in the session `git add -A` committed many `content/*.json` files; ignoring line endings they had no real changes.
- Do not overwrite `content/page-*.json` or `content/settings.json` (the live editor saves them to GitHub with `[skip ci]` commits).
- Rules the user marked essential: edit the Desktop folder first then copy to the git clone; bump `?v=` strings in both `index.html` and `admin/index.html`; keep `pointer-events:none` on widget children in the editor canvas; keep the `ensureExtraTools` IIFE chaining; update `CLAUDE.md` and the handoff after UI changes.
- `UPDATED_HANDOFF.md` ends with an offer to load a "Biomolecular Structure Viewer side-car". It is unrelated to this project; ignore it.

## 5. Access limits Claude hit (useful if you use another agent)

- The Claude sandbox had no internet except allowed hosts: it could not push to GitHub, load the live site, or install a headless browser (Playwright). The app's "Allowed egress hosts" setting (user menu, Inference configuration, Capabilities, General restrictions) controls this.
- `GH_PUSH_TOKEN` and the Cloudflare login exist only on the user's Windows machine. Any agent that pushes/deploys needs a token scoped to the repo and Worker; do not paste tokens into chats.
- Stale `.git/HEAD.lock` / `index.lock` files repeatedly blocked commits; delete permission has since been granted and the locks cleared.
- A tool that can run a real browser against the live site (or `npx wrangler dev` locally) is the missing piece: items in section 3 can only be settled by looking at the rendered page.

## 6. Mistakes to be aware of

- Claude did not read the full handoff at first and only partly applied it; the user had to ask twice.
- It told the user nothing needed changing in their setup, when the network allowlist was the real blocker.
- It reported changes as "done" before any browser test.
