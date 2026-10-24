# INTEERNEETS: Handoff (last updated 2026-10-24, evening)

Live site: https://inteerneets.inteerneets.workers.dev  ·  Editor: /admin/ (password gate)
Project folder (work here): `C:\Users\xxx\Desktop\INTEERNEETS\INTEERNEETS WEB`
Git clone (GitHub Desktop): `C:\Users\xxx\Documents\GitHub\INTEERNEETS`  (repo `inteerneets/INTEERNEETS`, branch `main`)
Never touch the `.html` shortcut files directly in `C:\Users\xxx\Desktop\INTEERNEETS\`.

## How we work (important, this saves time)
1. Edit files in the project folder, test with headless Edge (`puppeteer-core` in the Antigravity scratch folder, local server: `node server.js` in the project folder, port 8000).
2. Copy changed files to the git clone, commit, push, then deploy with `npx wrangler deploy` (run inside the project folder). The live site is deployed straight from the project folder; GitHub is the history + where editor saves land.
3. **Pushing works**: user env var `GH_PUSH_TOKEN` (fine-grained PAT, Contents read/write). Read it with `[Environment]::GetEnvironmentVariable('GH_PUSH_TOKEN','User')` and push with
   `git -c credential.helper= -c "http.https://github.com/.extraheader=AUTHORIZATION: basic <base64 of x-access-token:TOKEN>" push origin main`. Never print the token.
   Git binary: `$env:LOCALAPPDATA\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe` (git is not on PATH). Always `pull --rebase` first: editor saves create `[skip ci]` commits (content/*.json).
4. Do **not** let tests write into `content/`: intercept `/api/save-*` in puppeteer (the local server writes real files).
5. Files may be CRLF; patch scripts normalise (`replace(/\r\n/g,'\n')`) then write back CRLF. Write node patch scripts to a file first (write_file) instead of piping through PowerShell, or use unicode escapes, to avoid mojibake.
6. Background commands that print nothing for a long time are usually fine; use `schedule` timers, not polling loops.

## Architecture
- Hosting: Cloudflare Worker + static assets (`worker.js`, `wrangler.jsonc`, API in `functions/api/[[route]].js`). Secrets (via `wrangler secret put`): `GITHUB_TOKEN`, `ADMIN_PASSWORD` (= `INTEERNEETSADMIN2026GANG`). `/api/check-auth` validates the password (used by the lock screen). Editor saves commit to GitHub; the worker serves `/api/content` from GitHub (public GET); uploads are served from GitHub instantly.
- `index.html`: the live site. Pages load from `content/page-<id>.json` (`html`, `css`, `bg`, `refW`, `refH`). Backgrounds blend on scroll. Menu hides when scrolled (shows near top / back at Home).
  - **Scaling**: wide screens (>= 820px) = each page is a fixed "stage" (`refW` x `refH` = editor canvas size at save time, default 1275x808) scaled to the screen (`fitStage`; one-screen pages are fitted and centered). Phones/small tablets (< 820px) = "stack mode": free-positioned elements are stacked in a column in top-to-bottom order, pictures scale, text stays readable (`stackMeasure/stackEnter/stackExit`). `vh/vw` in saved CSS are rewritten to stage units (`unitFix`).
  - **Product page overlay** (`openProduct`): menu on top, glass scrollbar, close/prev/next buttons top-left, keys Esc/arrows. Per-product design `page-product-<slug>.json`, fallback to the template `page-product.json`.
  - Editor device preview loads `/?ep=1` and takes unsaved designs from `window.parent.__epData`.
- `shopify-shop.js` (shared by live site + editor canvas): Printful-style shop (sidebar with categories/subcategories shown under the selected one, search, sort, hearts "Saved", badges, color dots, equal-height cards, phone layout = chips + 2 columns), cart (Shopify Buy SDK cart + button, on the LEFT by default, black/red), product page body (gallery + buy box + description). Data comes from the Storefront GraphQL API (domain/token in settings). SDK `UI.init` returns a singleton: `setupCart` destroys old components before re-creating (needed for editor re-renders).
- `glass-scroll.js`: glass scrollbar for the page, the product overlay and the 404 page.
- `admin/` (`index.html`, `editor.js`, `editor.css`): GrapesJS editor. Special tabs: Error Page, Loading Page, Product Page (template + one design per product via the ◀ menu ▶ in the top bar), **Login Page** (designs the password screen; `data-login-pw/-btn/-err` attributes). Save / Reset / Settings are pinned top right.
  - **Shop panel (🛍)**: tabs Products (order, badge, hide, Edit = own description + pictures list), Categories (tree: add/rename/move/indent/delete, tick products per category), Layout (what the shop shows, columns, cart side...), Look (colors/fonts incl. uploaded fonts).
  - **Device menu**: Tablet / Mobile / Phone landscape / Laptop / Big screen show the REAL live site at that size (view-only; switch to Desktop to edit).
- Settings (`content/settings.json`) keys used by the shop: `shopify_domain`, `shopify_storefront_token`, `shopify_product_ids`, `shopify_style`, `shop_categories` [{id,title,parent,product_ids}], `shop_opts`, `product_badges`, `product_hidden`, `product_custom_images` (string or list), `product_descriptions`, `site_fonts` [{name,url}], `site_colors`.
- Older notes (Netlify fallback, `server.js`, README) are still valid; Netlify was replaced by Cloudflare because it paused deploys.

## State at the end of this session
Everything above is deployed (last Worker version `523ebcb5`) and pushed (GitHub `b220466` + the commit that adds this file). Nothing important is uncommitted.

## Known limitations / ideas for next time
- Phone layout is automatic (stacking). Elements the user deliberately overlaps will stack instead; a hand-made mobile layout per page could be added if wanted.
- Login page is simple (not scaled / stacked on phones): keep it centered.
- Colour dots on shop cards use a name -> colour dictionary (`COLOR_NAMES`); unknown names fall back to grey.
- "New" badge is off by default (all products are recent); set days in Shop ▸ Layout or a badge per product.
- Product IDs come from Settings ▸ Product IDs (numeric ids, admin URLs or store links all work).
- Ideas: wishlist page, per-category banner/description, reviews block, size guide per product, discount banner, image zoom on the product page, remember scroll position when closing a product.
