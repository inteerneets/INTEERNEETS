# INTEERNEETS: Session Handoff (follow-up to HANDOFF.md)

**Date:** 2026-11-24
**Read first:** `CLAUDE.md` (architecture and rules) and `HANDOFF.md` (credentials, workflow, original to-do list).
Credentials are not repeated here; they are in `HANDOFF.md`.

---

## 1. What was done this session

### The 3 features from HANDOFF.md

1. **Dynamic price on variant change** (`shopify-shop.js`)
   - `varPick()` no longer returns early for non-color options. It now calls a new `variantPriceUpdate(d, wr, key)`.
   - That helper reads every `<select>` in the Shopify iframe, finds the variant whose `selectedOptions` match, and writes its price (via `money()`) into `.pg-price`.
   - Product data comes from the `window.__ishCache` promise already used by `fetchShopData()`. The GraphQL fragment already requested `price { amount currencyCode }`.
2. **Embed / Widget block** (`admin/index.html`, `admin/editor.js`)
   - Toolbar button `#btn-add-widget` (`</> Widget`) prompts for HTML/iframe code and appends an absolutely positioned `.custom-widget-block` with resize handles.
   - Also added a Studio sidebar block, **Embed / Widget** (`bm.add('custom-widget', ...)`), after "Shopify Products".
3. **Image link + shadow/glow** (`admin/index.html`, `admin/editor.js`, `index.html`)
   - Picture panel has a `Link URL` field (`#bi-link`) and a shadow/glow editor (`#bi-shadow-box`, shown only when a link is set). Shadow is applied as a `filter: drop-shadow(...)`.
   - The link is stored as a `data-link` attribute plus `cursor:pointer`. `syncImagePanel` was wrapped to populate both controls. Clearing the field uses `removeAttributes(['data-link'])`.
   - `index.html` has a global click handler: `[data-link]` opens `http(s)` URLs in a new tab, other values navigate in the same tab.

### Extra requests

- **Less lag** (`index.html`): section offsets are cached (`cacheSectionOffsets()`, refreshed in `fitAll()`), so `blend()` and `update()` no longer call `getBoundingClientRect()` on every scroll frame. `.bg-layer` got `will-change: transform, opacity; contain: layout style`.
- **Cart button top-right, always visible** (`index.html` CSS and `cartSideCss()` in `shopify-shop.js`): toggle is `position:fixed; top:12px; right:16px; z-index:110`. The cart drawer now slides in from the right. The old `cart_side` setting is ignored.
- **No zoom when opening the size dropdown** (`index.html`): `productFit()` now scales to screen width only and the overlay scrolls with the glass scrollbar. The product `ResizeObserver` only re-scales when the viewport width changes. On height-only changes it just updates the wrapper height.

### Cache-bust versions currently in use
- `shopify-shop.js?v=20261124c` (both `index.html` and `admin/index.html`)
- `editor.js?v=20261124b` (`admin/index.html`)
- `soundcloud-player.js?v=20261117e` (unchanged)

---

## 2. Git / deploy status (verify before trusting)

- Commit `e422dd2` (the 3 features) is on `origin/main`.
- Commit `963e7e5` (Studio "Embed / Widget" block) was created in the repo, but the push from the sandbox failed (no network to GitHub). It is unknown whether it was pushed from PowerShell.
- The performance, cart, and product-scroll edits exist in **both** folders but are **not committed**: the commit was blocked by stale `.git/HEAD.lock` / `.git/index.lock` files.
- Nothing from this session after the first features has been confirmed deployed.

To finish (PowerShell):
```powershell
$git = "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe"
cd "C:\Users\xxx\Documents\GitHub\INTEERNEETS"
Remove-Item ".git\HEAD.lock",".git\index.lock" -ErrorAction SilentlyContinue
& $git status
& $git add -A
& $git commit -m "Performance, cart top-right, product page scroll"
# push with the token command from HANDOFF.md, then:
cd "C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB"
npx wrangler deploy
```
Close GitHub Desktop first if the lock files keep coming back. `git status` earlier also listed many modified `content/*.json` files that were not ours (likely editor saves); check them before using `add -A`.

---

## 3. Known issues / not yet done

1. **Widget cannot be dragged** (documented in `CLAUDE.md` section 2). Not fixed. Needed: editor-only CSS `.custom-widget-block * { pointer-events: none !important; }` in the canvas, re-apply resizable handles on `component:selected` / `component:add`, and make sure the block is draggable (Free Drag mode or a Move handle).
2. **Studio "Embed / Widget" block is only a placeholder.** Its text says to click it and use the Widget button, but the button currently *creates a new* widget; it does not fill the selected one. Either make the button fill the selected `.custom-widget-block`, or drop the placeholder text.
3. **Widget content persistence is untested.** The handler sets `innerHTML` directly and `content`; confirm it survives Save and reload and that scripts/iframes render on the live site.
4. **Nothing has been tested in a browser.** Changes were code-reviewed once (that review caught the `removeAttributes` bug), not run. Please check on the live site: cart position on desktop and phone (does it collide with the top menu bar, which is 56px tall and also fixed?), the size dropdown on the product page (scroll, no zoom, glass scrollbar redraw), and the price changing with size on a product that has different variant prices.
5. **Price shown for multi-option products:** the matcher only rejects a variant when a chosen option explicitly differs, so with several selects it picks the first match. Looks fine for size-only products.
6. **Image link `<a>` wrapper case:** `getImageLink()` reads a parent `<a>` href, but setting a link only writes `data-link`.
7. **`CLAUDE.md` is now out of date** on one point: it says the cart sits flush against the left edge. It is now top-right.
8. **Cloud/GitHub access:** no GitHub or Cloudflare plugin was available, so pushing and `wrangler deploy` must be done by the user in PowerShell.

---

## 4. Files changed this session

`shopify-shop.js`, `index.html`, `admin/index.html`, `admin/editor.js` (identical edits applied to the Desktop working folder and the Documents git clone).
