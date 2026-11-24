# INTEERNEETS: Project Handoff & To-Do Guide

**Date:** November 24, 2026  
**Status:** Clean Git state (`origin/main` at `6a20726`). Ready for implementation of the 3 requested features.

---

## 1. Quick Reference & Credentials

- **Live Production URL:** [https://inteerneets.inteerneets.workers.dev](https://inteerneets.inteerneets.workers.dev)
- **Editor Admin URL:** [https://inteerneets.inteerneets.workers.dev/admin/](https://inteerneets.inteerneets.workers.dev/admin/)
- **Admin Password:** `KM4fNVpb6DFK2e25PAF8`
  *(Note: Password was previously rotated from the old default; Cloudflare secrets and local checks use this value)*
- **GitHub Repository:** `inteerneets/INTEERNEETS` (Branch: `main`)
- **Primary Working Directory:** `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB`
- **Git Clone Directory:** `C:\Users\xxx\Documents\GitHub\INTEERNEETS`
- **Git Binary Path:** `$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe`
- **GitHub Push Token:** Read via PowerShell:
  ```powershell
  $token = [Environment]::GetEnvironmentVariable('GH_PUSH_TOKEN','User')
  $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
  & $git -c credential.helper= -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $auth" push origin main
  ```
- **Deployment Command:** `npx wrangler deploy` (run from the project folder / repo folder).

---

## 2. Architecture & File Structure

```
INTEERNEETS WEB/
├── index.html                   # Live site entry, stage scaling (fitStage), mobile stack mode
├── shopify-shop.js              # Storefront API queries, product overlay, gallery, cart integration
├── soundcloud-player.js         # See-through glass SoundCloud playlist player widget
├── glass-scroll.js              # Custom glass scrollbar for desktop/mobile overlays
├── worker.js                    # Cloudflare Worker entry point
├── wrangler.jsonc               # Cloudflare Workers configuration (assets + worker bindings)
├── functions/api/[[route]].js   # Cloudflare Pages / Worker API routes:
│                                #   GET  /api/content?name=...
│                                #   GET  /api/assets
│                                #   POST /api/save-page
│                                #   POST /api/save-settings
│                                #   POST /api/upload
│                                #   POST /api/check-auth
├── admin/
│   ├── index.html               # Editor toolbar and side panels (Colors, Button, Picture size, etc.)
│   ├── editor.js                # GrapesJS editor logic (~3270 lines), component handlers, toolbar hooks
│   └── editor.css               # Editor theme & panel styling
├── content/                     # JSON storage for pages and settings
│   ├── pages.json               # Page list metadata
│   ├── settings.json            # Shop configuration, domain, tokens, colors, custom fonts
│   └── page-*.json              # Serialized HTML/CSS for individual pages
└── images/uploads/              # Uploaded user images and assets
```

---

## 3. Current Completed State (What is Done & Live)

1. **SoundCloud Player Swap:**
   - Spotify player was replaced with a see-through, draggable, resizable SoundCloud player (`soundcloud-player.js`).
   - Integrated into `admin/editor.js` and `admin/index.html` (`+ Playlist` button).
   - Committed to git (`6a20726`) and pushed to `origin/main`.
2. **Security Hardening Deployed:**
   - Rate limiting / brute-force protection on password auth and uploads.
   - File signature sniffing on asset uploads (validates real PNG/JPEG/WEBP/GIF/TTF/WOFF bytes; prevents malicious script uploads).
   - Direct access to `.git`, `.wrangler`, and `.env` files blocked.
3. **Shopify Storefront Auto-Sync & Color Swatches:**
   - Auto-adds new products fetched from Shopify (e.g. from Printful).
   - Color selection in product page updates the displayed mockup image.
   - Mobile compact cart drawer.

---

## 4. Pending Features — Comprehensive TO-DO List

The following 3 tasks were requested by the user and are pending implementation:

### [TODO #1] Dynamic Price Update on Size / Variant Selection

**Goal:** In the product overlay (`shopify-shop.js`), when a customer selects a different size or variant, update the displayed price (`.pg-price`) dynamically to reflect that specific variant's price.

**Context & Implementation Details:**
- **File:** `shopify-shop.js`
- **GraphQL Fragment:** In `fetchShopData` (around line 502), the fragment currently fetches:
  ```graphql
  fragment F on Product {
    ...
    variants(first: 100) {
      nodes {
        selectedOptions { name value }
        image { url }
        price { amount currencyCode } # <-- Ensure price is queried! (already added in working copy)
      }
    }
  }
  ```
  *(Note: Storefront API 2024-10 supports `price { amount currencyCode }`)*
- **Product Display Price Element:**
  In `addProduct()` (line ~419), the price container is created:
  ```javascript
  var pe = doc.createElement('div'); pe.className = 'pg-price'; pe.textContent = pr; info.appendChild(pe);
  ```
- **Listening to Variant Selection:**
  The size/variant selectors live inside the Shopify Buy Button iframe. When options change:
  - `enhanceSelects()` (lines 128–159) binds a `click` listener on dropdown items (`li`) and fires `change` events on the native `select`.
  - `varPick(sel, d)` is called whenever a select changes.
  - Currently, `varPick` checks `if (!/colou?r/i.test(name)) return;` and updates the gallery image.
  - **Change Required:** Expand `varPick` or add a new helper `variantUpdate(d)`:
    1. Read all active selected options from the iframe's select elements (`d.querySelectorAll('select')`).
    2. Find the matching variant in the product's `variants.nodes` where every `selectedOptions` matches the chosen values.
    3. If a matching variant is found, format its price with `money(variant.price.amount, variant.price.currencyCode)` and update the `.pg-price` element in the parent product overlay.

---

### [TODO #2] Custom Code / Embed Widget Block in Editor

**Goal:** Add a toolbar button in `/admin/` that allows pasting arbitrary HTML or iframe embed code (e.g. third-party widgets, players, forms), and drops it as a draggable/resizable block onto the canvas.

**Context & Implementation Details:**
- **Files:** `admin/index.html`, `admin/editor.js`
- **Toolbar Button:** In `admin/index.html` (around line 24), add:
  ```html
  <button id="btn-add-widget" class="tb-btn" title="Add a custom HTML/embed widget">&lt;/&gt; Widget</button>
  ```
- **Editor Action:** In `admin/editor.js`:
  ```javascript
  document.getElementById('btn-add-widget').addEventListener('click', () => {
    const code = prompt('Paste your embed/widget HTML or iframe code:');
    if (!code || !code.trim()) return;
    const c = editor.getWrapper().append({
      type: 'default',
      content: `<div class="custom-widget-block" style="position:absolute;top:80px;left:80px;width:380px;min-height:160px;z-index:10;">${code}</div>`
    })[0];
    if (c) {
      editor.select(c);
      markDirty(currentPage);
    }
  });
  ```
- **Handling GrapesJS Parsing & Resizing:**
  - Ensure GrapesJS allows iframes/custom code without stripping scripts or styles (`allowScripts: true` or custom component wrapper).
  - Enable free-drag & resizable handles on elements with `.custom-widget-block`.

---

### [TODO #3] Image Clickable Links & Shadow/Glow Picker

**Goal:**
1. Allow any picture added to the canvas to optionally have a clickable link (entering a URL wraps the picture in an `<a>` tag or sets navigation).
2. When the link is active, expose a shadow or glow picker (identical to the button drop-shadow and hover-glow controls).

**Context & Implementation Details:**
- **Files:** `admin/index.html`, `admin/editor.js`, `admin/editor.css`
- **Panel UI:** In `admin/index.html`, inside `#image-panel` (after the corner radius or opacity row):
  ```html
  <div class="swatch-row bi-img-only">
    <label for="bi-link">Link URL</label>
    <input type="url" id="bi-link" class="pbg-text" placeholder="https://... (optional)" />
  </div>
  <div id="bi-shadow-section" class="bi-img-only" style="display:none;">
    <div class="sh-title">Image Shadow / Glow</div>
    <div id="bi-shadow-box"></div>
  </div>
  ```
- **Editor Logic:** In `admin/editor.js`:
  1. Initialize a shadow editor using the existing helper:
     ```javascript
     const biShadowEd = makeShadowEditor(byId('bi-shadow-box'), {
       spread: false,
       onChange: (v) => {
         const c = imgSel();
         if (c) c.addStyle({ filter: wrapDrop(v) });
       }
     });
     ```
  2. In `syncImagePanel()`:
     - Read whether the image is wrapped in an `<a>` or has a `data-link` / `href` attribute.
     - Populate `#bi-link.value`.
     - If link is non-empty, display `#bi-shadow-section` and sync `biShadowEd.set(...)`.
  3. On `#bi-link` change:
     - If a valid URL is provided, attach the link (either wrap the component in `<a>` or store `data-link` / `href` and style with cursor pointer).
     - Show `#bi-shadow-section`.
     - If empty, remove the link wrapper/attribute and hide the shadow controls.

---

## 5. Development & Deployment Workflow

1. **Edit Working Copy:** Make modifications in `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB\`.
2. **Sync to Git Clone:** Copy updated files to `C:\Users\xxx\Documents\GitHub\INTEERNEETS\`.
3. **Cache Busting:** Whenever updating `shopify-shop.js`, `editor.js`, or other shared scripts, bump the query string `?v=...` in `index.html` and `admin/index.html`.
4. **Deploy Live:**
   ```powershell
   cd "C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB"
   npx wrangler deploy
   ```
5. **Commit & Push:**
   ```powershell
   $git = "$env:LOCALAPPDATA\GitHubDesktop\app-3.6.11\resources\app\git\cmd\git.exe"
   cd "C:\Users\xxx\Documents\GitHub\INTEERNEETS"
   & $git add -A
   & $git commit -m "Description of changes"
   $token = [Environment]::GetEnvironmentVariable('GH_PUSH_TOKEN','User')
   $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))
   & $git -c credential.helper= -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $auth" push origin main
   ```
