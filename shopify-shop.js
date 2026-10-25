/* Shared Shopify shop renderer: used by the live site (index.html) AND the editor canvas (admin/),
   so what you design in the editor's "Shop" panel is exactly what visitors see. */
(function (g) {
  var FONTS = ['Inter', 'Playfair Display', 'Poppins', 'Montserrat', 'Oswald', 'Raleway', 'Space Grotesk', 'Cormorant Garamond', 'Libre Baskerville', 'Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Impact'];
  var SYSTEM = ['Arial', 'Georgia', 'Courier New', 'Times New Roman', 'Impact'];
  var RED = '#ff0000', BLACK = '#000000';

  // Factory look (the user's brief): sizing = black + red text, cart button = black + red text/icon,
  // cart = black background + red text + red buttons with black text.
  var DEFAULTS = {
    title_font: 'Playfair Display', title_color: '#ffffff', title_size: 15, title_weight: '700', title_transform: 'uppercase',
    price_font: 'Inter', price_color: BLACK, price_size: 14,
    img_radius: 0,
    desc_font: 'Inter', desc_color: '#ffffff', desc_size: 15,
    side_font: 'Inter', side_text: '#ffffff', side_size: 15, side_active: '#000000', side_bar: '#000000',
    card_bg: '#ffffff', card_radius: 14, badge_bg: BLACK, badge_text: RED, heart_bg: BLACK, heart_color: RED,
    bar_bg: BLACK, bar_text: RED, bar_border: BLACK, swatch_border: BLACK,
    cat_font: 'Playfair Display', cat_color: '#ffffff', cat_size: 28, cat_weight: '700', cat_transform: 'uppercase',
    size_bg: BLACK, size_text: RED, size_border: BLACK, size_font: 'Inter', size_size: 14,
    btn_label: 'ADD TO CART', btn_font: 'Inter', btn_size: 14,
    toggle_bg: BLACK, toggle_color: RED, toggle_radius: 8,
    cart_title: 'Cart', checkout_label: 'CHECKOUT', cart_font: 'Inter',
    cart_bg: BLACK, cart_text: RED, cart_btn_fill: RED, cart_btn_text: BLACK
  };

  // The editor builds its "Shop" panel from this list.
  var SCHEMA = [
    { group: 'Product name', fields: [
      { k: 'title_font', l: 'Font', t: 'font' }, { k: 'title_color', l: 'Color', t: 'color' },
      { k: 'title_size', l: 'Size (px)', t: 'num', min: 8, max: 60 },
      { k: 'title_weight', l: 'Weight', t: 'weight' },
      { k: 'title_transform', l: 'Letters', t: 'select', o: [['uppercase', 'CAPITALS'], ['none', 'Normal'], ['capitalize', 'Each Word']] } ] },
    { group: 'Price', fields: [
      { k: 'price_font', l: 'Font', t: 'font' }, { k: 'price_color', l: 'Color', t: 'color' },
      { k: 'price_size', l: 'Size (px)', t: 'num', min: 8, max: 60 } ] },
    { group: 'Product page description', fields: [
      { k: 'desc_font', l: 'Font', t: 'font' }, { k: 'desc_color', l: 'Color', t: 'color' },
      { k: 'desc_size', l: 'Size (px)', t: 'num', min: 10, max: 40 } ] },
    { group: 'Categories sidebar', fields: [
      { k: 'side_font', l: 'Font', t: 'font' }, { k: 'side_size', l: 'Size (px)', t: 'num', min: 10, max: 40 },
      { k: 'side_text', l: 'Text color', t: 'color' }, { k: 'side_active', l: 'Selected text', t: 'color' },
      { k: 'side_bar', l: 'Selected marker', t: 'color' } ] },
    { group: 'Product cards', fields: [
      { k: 'card_bg', l: 'Picture background', t: 'color' }, { k: 'card_radius', l: 'Corner radius (px)', t: 'num', min: 0, max: 60 },
      { k: 'badge_bg', l: 'Badge (New / Sale)', t: 'color' }, { k: 'badge_text', l: 'Badge text', t: 'color' },
      { k: 'heart_bg', l: 'Heart background', t: 'color' }, { k: 'heart_color', l: 'Heart color', t: 'color' },
      { k: 'swatch_border', l: 'Color dots outline', t: 'color' } ] },
    { group: 'Search & sort bar', fields: [
      { k: 'bar_bg', l: 'Background', t: 'color' }, { k: 'bar_text', l: 'Text', t: 'color' }, { k: 'bar_border', l: 'Outline', t: 'color' } ] },
    { group: 'Picture (product page)', fields: [ { k: 'img_radius', l: 'Corner radius (px)', t: 'num', min: 0, max: 80 } ] },
    { group: 'Sizing menu (S / M / L ...)', fields: [
      { k: 'size_bg', l: 'Background', t: 'color' }, { k: 'size_text', l: 'Text + arrow', t: 'color' },
      { k: 'size_border', l: 'Outline', t: 'color' }, { k: 'size_font', l: 'Font', t: 'font' },
      { k: 'size_size', l: 'Size (px)', t: 'num', min: 8, max: 40 } ] },
    { group: 'Add to cart button', fields: [
      { k: 'btn_label', l: 'Text', t: 'text' }, { k: 'btn_font', l: 'Font', t: 'font' },
      { k: 'btn_size', l: 'Size (px)', t: 'num', min: 8, max: 40 },
      { k: 'btn_text', l: 'Text color', t: 'color' }, { k: 'btn_fill', l: 'Fill', t: 'colornone' },
      { k: 'btn_border', l: 'Outline', t: 'color' }, { k: 'btn_radius', l: 'Corner radius (px)', t: 'num', min: 0, max: 60 } ] },
    { group: 'Cart button (the floating cart)', fields: [
      { k: 'toggle_bg', l: 'Background', t: 'color' }, { k: 'toggle_color', l: 'Icon + number', t: 'color' },
      { k: 'toggle_radius', l: 'Corner radius (px)', t: 'num', min: 0, max: 40 } ] },
    { group: 'Cart panel', fields: [
      { k: 'cart_title', l: 'Title', t: 'text' }, { k: 'checkout_label', l: 'Checkout text', t: 'text' },
      { k: 'cart_font', l: 'Font', t: 'font' },
      { k: 'cart_bg', l: 'Background', t: 'color' }, { k: 'cart_text', l: 'Text', t: 'color' },
      { k: 'cart_btn_fill', l: 'Buttons', t: 'color' }, { k: 'cart_btn_text', l: 'Button text', t: 'color' } ] }
  ];

  // Fonts you uploaded in the editor: [{ name, url }]
  function fontFormat(url) { var e = String(url).split('.').pop().toLowerCase(); return { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[e] || 'truetype'; }
  function withBuiltin(list) {
    list = (list || []).slice();
    if (!list.some(function (x) { return /^inter/i.test(x.name) && /bold/i.test(x.name) && !/semi|extra|italic|light|thin|black/i.test(x.name); })) list.push({ name: 'Inter 18pt Bold', url: '/fonts/Inter_18pt-Bold.ttf' });
    return list;
  }
  function fontFaceCss(list) {
    return withBuiltin(list).map(function (f) { return "@font-face{font-family:'" + f.name + "';src:url('" + f.url + "') format('" + fontFormat(f.url) + "');font-display:swap;}\n"; }).join('');
  }
  function fontList(list) { return FONTS.concat(withBuiltin(list).map(function (f) { return f.name; })); }
  // the cart / product page live in iframes: give them the uploaded fonts too
  function injectFrameFonts(doc, settings) {
    var css = fontFaceCss(settings.site_fonts);
    if (!css) return;
    Array.prototype.forEach.call(doc.querySelectorAll('iframe'), function (f) {
      try {
        var d = f.contentDocument;
        if (!d || !d.head || d.getElementById('site-fonts')) return;
        var s = d.createElement('style'); s.id = 'site-fonts'; s.textContent = css; d.head.appendChild(s);
      } catch (e) { /* cross-origin frame */ }
    });
  }
  function injectFontsSoon(doc, settings) {
    [300, 900, 2000, 4500, 8000].forEach(function (t) { setTimeout(function () { injectFrameFonts(doc, settings); }, t); });
  }

  // Until you pick another font, all shop text uses your uploaded "Inter ... Bold" font (if there is one)
  var _siteFonts = [];
  var FONT_KEYS = ['title_font', 'price_font', 'size_font', 'btn_font', 'cart_font', 'side_font', 'desc_font', 'cat_font'];
  function setSiteFonts(list) { _siteFonts = withBuiltin(list); }
  function preferredFont() {
    var f = _siteFonts.filter(function (x) { return /^inter/i.test(x.name) && /bold/i.test(x.name) && !/semi|extra|italic|light|thin|black/i.test(x.name); })[0];
    return f ? f.name : '';
  }

  function px(n, d) { n = parseFloat(n); return (isNaN(n) ? d : n) + 'px'; }
  function ff(n) { return SYSTEM.indexOf(n) >= 0 ? '"' + n + '"' : '"' + n + '", sans-serif'; }

  // exact values used everywhere: factory look < site button colors < the user's own choices
  function merged(style, colors) {
    colors = colors || {};
    var site = {
      btn_fill: colors.btn_fill || 'transparent', btn_text: colors.btn_text || BLACK,
      btn_border: colors.btn_border || BLACK, btn_radius: parseFloat(colors.btn_radius) || 0
    };
    var base = Object.assign({}, DEFAULTS), pf = preferredFont();
    if (pf) FONT_KEYS.forEach(function (k) { base[k] = pf; });
    return Object.assign(base, site, style || {});
  }

  function options(style, colors, toFilter, siteFonts) {
    if (siteFonts) setSiteFonts(siteFonts);
    var s = merged(style, colors);
    var mine = (siteFonts || []).map(function (f) { return f.name; });
    var fonts = [s.title_font, s.price_font, s.size_font, s.btn_font, s.cart_font].filter(function (f, i, a) { return f && SYSTEM.indexOf(f) < 0 && mine.indexOf(f) < 0 && a.indexOf(f) === i; });
    var gf = fonts.map(function (f) { return f + ':400,500,600,700'; });
    var shadow = (colors && colors.btn_shadow) || 'drop-shadow(0 6px 16px rgba(0,0,0,0.28))';
    var hoverFilter = toFilter ? toFilter(shadow) : shadow;
    var btnBase = {
      'background-color': s.btn_fill, 'color': s.btn_text, 'border': '2px solid ' + s.btn_border,
      'border-radius': px(s.btn_radius, 0), 'font-family': ff(s.btn_font), 'font-size': px(s.btn_size, 14),
      'font-weight': '600', 'letter-spacing': '0.1em', 'transition': 'filter .25s ease'
    };
    var btnHover = { 'background-color': s.btn_fill, 'color': s.btn_text, 'filter': hoverFilter };
    var cartBtn = { 'background-color': s.cart_btn_fill, 'color': s.cart_btn_text, 'font-family': ff(s.cart_font), 'border-radius': '0px' };
    var cartBtnHover = { 'background-color': s.cart_btn_fill, 'color': s.cart_btn_text };
    var qty = { 'color': s.cart_btn_text, 'background-color': s.cart_btn_fill, 'border-color': s.cart_btn_fill };
    var ct = { 'color': s.cart_text, 'font-family': ff(s.cart_font) };
    var o = {
      product: {
        googleFonts: gf,
        text: { button: s.btn_label },
        styles: {
          product: { '@media (min-width: 601px)': { 'max-width': '100%' } },
          img: { 'border-radius': px(s.img_radius, 0) },
          title: { 'font-family': ff(s.title_font), 'color': s.title_color, 'font-size': px(s.title_size, 15), 'font-weight': s.title_weight, 'text-transform': s.title_transform },
          price: { 'font-family': ff(s.price_font), 'color': s.price_color, 'font-size': px(s.price_size, 14) },
          actualPrice: { 'color': s.price_color, 'font-size': px(s.price_size, 14) },
          button: Object.assign({}, btnBase, { ':hover': btnHover, ':focus': btnHover })
        }
      },
      option: {
        googleFonts: gf,
        styles: {
          label: { 'color': s.title_color, 'font-family': ff(s.size_font) },
          select: { 'background-color': s.size_bg, 'color': s.size_text, 'border-color': s.size_border, 'font-family': ff(s.size_font), 'font-size': px(s.size_size, 14) },
          selectIcon: { 'fill': s.size_text }
        }
      },
      toggle: {
        googleFonts: gf,
        styles: {
          toggle: { 'background-color': s.toggle_bg, 'border-radius': px(s.toggle_radius, 0), ':hover': { 'background-color': s.toggle_bg } },
          count: { 'color': s.toggle_color, 'font-family': ff(s.cart_font) },
          iconPath: { 'fill': s.toggle_color }
        }
      },
      cart: {
        googleFonts: gf,
        text: { title: s.cart_title, button: s.checkout_label },
        styles: {
          cart: { 'background-color': s.cart_bg },
          header: { 'color': s.cart_text },
          title: ct,
          close: { 'color': s.cart_text, ':hover': { 'color': s.cart_text } },
          lineItems: { 'color': s.cart_text },
          footer: { 'background-color': s.cart_bg, 'border-top-color': s.cart_btn_fill },
          subtotalText: ct, subtotal: ct, notice: ct, currency: ct, empty: ct,
          button: Object.assign({}, cartBtn, { ':hover': cartBtnHover, ':focus': cartBtnHover })
        }
      },
      lineItem: {
        googleFonts: gf,
        styles: {
          variantTitle: ct, title: ct, itemTitle: ct, price: ct, fullPrice: ct, discount: ct, quantity: ct,
          quantityIncrement: Object.assign({}, qty, { ':hover': qty }),
          quantityDecrement: Object.assign({}, qty, { ':hover': qty }),
          quantityInput: { 'color': s.cart_text, 'background-color': s.cart_bg, 'border-color': s.cart_btn_fill, 'font-family': ff(s.cart_font) }
        }
      }
    };
    return o;
  }

  function parseId(raw) {
    var s = String(raw || '').trim();
    if (!s) return null;
    var num = s.match(/(?:\/products\/|Product\/|^)(\d+)(?:[/?#].*)?$/);
    if (num) return { id: num[1] };
    var h = s.match(/\/products\/([^/?#]+)/);
    return { handle: h ? decodeURIComponent(h[1]) : s };
  }
  function keyOf(raw) { var p = parseId(raw); return p ? (p.id || p.handle) : ''; }

  function loadSdk(win, cb) {
    if (win.ShopifyBuy && win.ShopifyBuy.UI) return cb();
    var d = win.document;
    var existing = d.getElementById('shopify-buy-sdk');
    if (existing) { existing.addEventListener('load', cb); return; }
    var s = d.createElement('script');
    s.id = 'shopify-buy-sdk';
    s.async = true;
    s.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    s.onload = cb;
    d.head.appendChild(s);
  }

  function clientFor(win, settings) {
    var domain = String(settings.shopify_domain).trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    return win.ShopifyBuy.buildClient({ domain: domain, storefrontAccessToken: String(settings.shopify_storefront_token).trim() });
  }

  // Your own pictures for a product: string (old) or list of urls; first = main picture
  function customImgs(settings, key) {
    var v = (settings.product_custom_images || {})[key];
    return (Array.isArray(v) ? v : (v ? [v] : [])).filter(Boolean);
  }
  // Your own description wins over Shopify's
  function descFor(settings, key, node) {
    var d = (settings.product_descriptions || {})[key];
    return (typeof d === 'string' && d.trim()) ? d : ((node && node.description) || '');
  }
  function pageCss(doc, s) {
    var tag = doc.getElementById('ish-pg-css');
    if (!tag) { tag = doc.createElement('style'); tag.id = 'ish-pg-css'; doc.head.appendChild(tag); }
    tag.textContent =
      '.pg{display:flex;flex-wrap:wrap;gap:36px;align-items:flex-start;width:100%;box-sizing:border-box;text-align:left;}' +
      '.pg.pg-gallery,.pg.pg-info{display:block;}' +
      '.pg *{box-sizing:border-box;}' +
      '.pg-gal{flex:1 1 360px;min-width:0;}' +
      '.pg-info{flex:1 1 340px;min-width:0;}' +
      '.pg-main{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:' + s.card_bg + ';border-radius:' + px(s.img_radius, 0) + ';}' +
      '.pg-has-thumbs .pg-main{width:calc(100% - 76px);}' +
    '.pg-thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}' +
      '.pg-thumbs img{width:66px;height:66px;object-fit:cover;background:' + s.card_bg + ';border-radius:' + px(Math.min(parseFloat(s.img_radius) || 0, 10), 0) + ';cursor:pointer;border:2px solid transparent;opacity:.75;}' +
      '.pg-thumbs img.on{border-color:' + s.side_bar + ';opacity:1;}' +
      '.pg-name{margin:0 0 8px;color:' + s.title_color + ';font-family:' + ff(s.title_font) + ';font-size:' + px((parseFloat(s.title_size) || 15) * 1.8, 27) + ';font-weight:' + s.title_weight + ';text-transform:' + s.title_transform + ';line-height:1.25;}' +
      '.pg-price{margin:0 0 16px;color:' + s.price_color + ';font-family:' + ff(s.price_font) + ';font-size:' + px((parseFloat(s.price_size) || 14) * 1.35, 19) + ';font-weight:600;}' +
      '.pg-desc{margin-top:22px;color:' + s.desc_color + ';font-family:' + ff(s.desc_font) + ';font-size:' + px(s.desc_size, 15) + ';line-height:1.65;white-space:pre-line;}';
  }

  // The product page body. mode: 'full' (gallery + info side by side), 'gallery' (pictures only) or 'info'
  // (name, price, sizes + Add to cart). The description box is a normal text box you type in the editor.
  function addProduct(doc, ui, parent, raw, settings, opt, extra) {
    var p = parseId(raw);
    if (!p) return;
    var key = p.id || p.handle, data = extra && extra.data, mode = (extra && extra.mode) || 'full';
    var s = merged(settings.shopify_style, settings.site_colors);
    pageCss(doc, s);
    var wrap = doc.createElement('div');
    wrap.className = 'shop-card pg' + (mode === 'gallery' ? ' pg-gallery' : (mode === 'info' || mode === 'buy') ? ' pg-info' : '');
    wrap.setAttribute('data-product-key', key);
    parent.appendChild(wrap);
    var gal = (mode === 'info' || mode === 'buy') ? null : doc.createElement('div');
    var info = mode === 'gallery' ? null : doc.createElement('div');
    if (gal) { gal.className = 'pg-gal'; wrap.appendChild(gal); }
    if (info) { info.className = 'pg-info'; wrap.appendChild(info); }

    if (gal) {
      var imgs = customImgs(settings, key);
      var scroll = imgs.length > 1;   // only your own pictures can be scrolled through; Shopify's picture stays single
      if (!imgs.length && data && data.featuredImage) imgs = [data.featuredImage.url];
      if (!imgs.length && data) imgs = ((data.images && data.images.nodes) || []).slice(0, 1).map(function (x) { return x.url; });
      if (imgs.length) {
        var stage = doc.createElement('div'); stage.style.cssText = 'position:relative;';
        var main = doc.createElement('img');
        main.className = 'pg-main'; main.src = imgs[0]; main.alt = (data && data.title) || '';
        stage.appendChild(main); gal.appendChild(stage);
        if (scroll) {
          gal.className += ' pg-has-thumbs';   // picture gets a little smaller so the thumbnails fit without scrolling
          var cur = 0, th = doc.createElement('div'); th.className = 'pg-thumbs';
          var go = function (n) {
            cur = (n + imgs.length) % imgs.length; main.src = imgs[cur];
            Array.prototype.forEach.call(th.children, function (c, i) { c.className = i === cur ? 'on' : ''; });
          };
          var sx = null;
          stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
          stage.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); });
          imgs.forEach(function (u, i) {
            var tt = doc.createElement('img'); tt.src = u; tt.alt = ''; if (i === 0) tt.className = 'on';
            tt.addEventListener('click', function () { go(i); });
            th.appendChild(tt);
          });
          gal.appendChild(th);
        }
      }
    }

    if (info) {
      if (data) {
        if (mode !== 'buy') { var nm = doc.createElement('h1'); nm.className = 'pg-name'; nm.textContent = data.title; info.appendChild(nm); }
        var mn = data.priceRange.minVariantPrice, mx = data.priceRange.maxVariantPrice;
        var pr = money(mn.amount, mn.currencyCode);
        if (mx && parseFloat(mx.amount) > parseFloat(mn.amount)) pr = 'From ' + pr;
        var pe = doc.createElement('div'); pe.className = 'pg-price'; pe.textContent = pr; info.appendChild(pe);
      }
      var po = Object.assign({}, opt.product);
      po.layout = 'vertical';
      po.width = '100%';
      // name, price and pictures are our own text/pictures (editable); the Shopify box only keeps sizes + Add to cart
      po.contents = Object.assign({}, po.contents, { img: false, imgWithCarousel: false, description: false, title: !data, price: !data });
      po.styles = Object.assign({}, po.styles, {
        product: Object.assign({}, po.styles.product, { 'max-width': '100%', 'margin-left': '0', 'margin-right': '0', 'text-align': 'left' })
      });
      var node = doc.createElement('div');
      info.appendChild(node);
      var cfg = { node: node, moneyFormat: '%24%7B%7Bamount%7D%7D', options: Object.assign({}, opt, { product: po }) };
      if (p.id) cfg.id = p.id; else cfg.handle = p.handle;
      ui.createComponent('product', cfg);
      var d = (settings.product_descriptions || {})[key];
      if (mode !== 'buy' && typeof d === 'string' && d.trim()) { var dd = doc.createElement('div'); dd.className = 'pg-desc'; dd.textContent = d; info.appendChild(dd); }
    }
  }

  var SHOP_API = '2024-10';
  var OPT_DEFAULTS = { sidebar: true, search: true, sort: true, wishlist: false, swatches: true, counts: true, hover_image: true, show_price: true, cols: 0, ratio: '1 / 1', fit: 'cover', default_sort: 'featured', new_days: 0, cart_side: 'left', all_label: 'All products', empty_text: 'No products found' };
  function shopOpts(settings) { return Object.assign({}, OPT_DEFAULTS, (settings && settings.shop_opts) || {}); }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var COLOR_NAMES = {
    black: '#111111', white: '#ffffff', red: '#d32f2f', blue: '#1e63d6', navy: '#14213d', royal: '#2b4fb3', green: '#2e7d32', forest: '#1f4d2b',
    olive: '#5b6130', army: '#4b5320', grey: '#9e9e9e', gray: '#9e9e9e', heather: '#b5b5b5', ash: '#c9c9c9', charcoal: '#36454f', silver: '#c0c0c0',
    pink: '#f4a6c0', purple: '#6a3fa0', orange: '#f57c00', yellow: '#f6d33c', gold: '#d4a017', maroon: '#6d1a2b', burgundy: '#6d1a2b', brown: '#6b4423',
    tan: '#c8a97e', sand: '#d9c7a1', beige: '#d8c9ac', cream: '#f3ead3', natural: '#efe6cf', khaki: '#b8a573', mint: '#a8e0c5', teal: '#14807a',
    lime: '#9be22d', turquoise: '#2bc4c4', lavender: '#b9a6e0', coral: '#ff7f6e', stone: '#b8b0a2', sage: '#9caf88'
  };
  function swatchColor(name) {
    var n = String(name || '').toLowerCase().trim();
    if (COLOR_NAMES[n]) return COLOR_NAMES[n];
    var words = n.split(/[\s\/\-_,]+/), i;
    for (i = 0; i < words.length; i++) if (COLOR_NAMES[words[i]]) return COLOR_NAMES[words[i]];
    try { var o = new Option().style; o.color = n; if (o.color) return n; } catch (e) { /* not a css color */ }
    return '#bdbdbd';
  }

  function hiddenMap(settings) { return (settings && settings.product_hidden) || {}; }
  // Product keys in shop order, without the ones you hid
  function visibleKeys(settings) {
    var hid = hiddenMap(settings);
    return (settings.shopify_product_ids || []).map(keyOf).filter(function (k) { return k && !hid[k]; });
  }
  // Categories as a flat list in display order: [{ cat, depth }]
  function catTree(settings) {
    var cats = (settings.shop_categories || []).filter(function (c) { return c && c.id; });
    var byParent = {};
    cats.forEach(function (c) {
      var p = c.parent && cats.some(function (x) { return x.id === c.parent; }) ? c.parent : '';
      (byParent[p] = byParent[p] || []).push(c);
    });
    var out = [];
    (function walk(p, d, seen) {
      (byParent[p] || []).forEach(function (c) { if (seen.indexOf(c.id) >= 0) return; out.push({ cat: c, depth: d }); walk(c.id, d + 1, seen.concat(c.id)); });
    })('', 0, []);
    return out;
  }
  // Products of a category including everything in its subcategories
  function catKeys(settings, id) {
    var tree = catTree(settings), ids = {}, on = false, base = 0;
    tree.forEach(function (n) {
      if (n.cat.id === id) { on = true; base = n.depth; ids[n.cat.id] = 1; return; }
      if (on && n.depth > base) ids[n.cat.id] = 1; else on = false;
    });
    var member = {};
    (settings.shop_categories || []).forEach(function (c) { if (ids[c.id]) (c.product_ids || []).forEach(function (k) { member[keyOf(k)] = 1; }); });
    return visibleKeys(settings).filter(function (k) { return member[k]; });
  }

  // Product details for the shop cards, straight from Shopify (one request, cached for the page)
  function fetchShopData(settings, win) {
    var keys = (settings.shopify_product_ids || []).map(keyOf).filter(Boolean);
    var sig = settings.shopify_domain + '|' + settings.shopify_storefront_token + '|' + keys.join(',');
    if (win.__ishCache && win.__ishCache.sig === sig) return win.__ishCache.p;
    var domain = String(settings.shopify_domain).trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    var token = String(settings.shopify_storefront_token).trim();
    var nums = keys.filter(function (k) { return /^\d+$/.test(k); });
    var hs = keys.filter(function (k) { return !/^\d+$/.test(k); });
    var frag = 'fragment F on Product{id title handle description availableForSale productType tags createdAt featuredImage{url} images(first:12){nodes{url}} priceRange{minVariantPrice{amount currencyCode} maxVariantPrice{amount}} compareAtPriceRange{minVariantPrice{amount}} options{name values}}';
    var q = 'query{' + (nums.length ? 'nodes(ids:[' + nums.map(function (n) { return '"gid://shopify/Product/' + n + '"'; }).join(',') + ']){... on Product{...F}}' : '') +
      hs.map(function (h, i) { return ' h' + i + ':productByHandle(handle:"' + h.replace(/"/g, '') + '"){...F}'; }).join('') + '}' + frag;
    var p = win.fetch('https://' + domain + '/api/' + SHOP_API + '/graphql.json', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token }, body: JSON.stringify({ query: q })
    }).then(function (r) { return r.json(); }).then(function (j) {
      var d = (j && j.data) || {}, map = {};
      (d.nodes || []).concat(hs.map(function (h, i) { return d['h' + i]; })).forEach(function (n) {
        if (!n || !n.id) return;
        var num = n.id.split('/').pop();
        map[num] = n;
        if (n.handle) map[n.handle] = n;
      });
      return map;
    }).catch(function () { return {}; });
    win.__ishCache = { sig: sig, p: p };
    return p;
  }

  function money(amount, cur) {
    var a = parseFloat(amount);
    if (isNaN(a)) return '';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || 'USD' }).format(a); } catch (e) { return (cur || '$') + a.toFixed(2); }
  }

  function shopCss(s, o) {
    var cols = o.cols > 0 ? 'repeat(' + o.cols + ',minmax(0,1fr))' : 'repeat(auto-fill,minmax(230px,1fr))';
    return '' +
      '.ish-root{display:flex;gap:30px;align-items:flex-start;width:100%;box-sizing:border-box;text-align:left;}' +
      '.ish-root *{box-sizing:border-box;}' +
      '.ish-side{flex:0 0 220px;padding-top:4px;}' +
      '.ish-side a{display:block;position:relative;padding:7px 0 7px 14px;margin:1px 0;color:' + s.side_text + ';font:600 ' + px(s.side_size, 15) + ' ' + ff(s.side_font) + ';cursor:pointer;text-decoration:none;line-height:1.3;transition:opacity .2s;}' +
      '.ish-side a.sub{padding-left:30px;font-weight:500;font-size:' + px(parseFloat(s.side_size) - 1, 14) + ';}' +
      '.ish-side a.sub2{padding-left:46px;font-weight:500;font-size:' + px(parseFloat(s.side_size) - 1, 14) + ';}' +
      '.ish-side a:hover{opacity:.7;}' +
      '.ish-side a.on{color:' + s.side_active + ';font-weight:800;opacity:1;}' +
      '.ish-side a.on::before{content:"";position:absolute;left:0;top:5px;bottom:5px;width:4px;border-radius:2px;background:' + s.side_bar + ';}' +
      '.ish-side a em{font-style:normal;opacity:.55;font-weight:500;margin-left:6px;font-size:.85em;}' +
      '.ish-main{flex:1;min-width:0;}' +
      '.ish-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 20px;}' +
      '.ish-bar input,.ish-bar select,.ish-bar button{background:' + s.bar_bg + ';color:' + s.bar_text + ';border:2px solid ' + s.bar_border + ';border-radius:' + px(Math.min(parseFloat(s.card_radius) || 0, 10), 0) + ';padding:9px 12px;font:600 13px ' + ff(s.size_font) + ';outline:none;}' +
      '.ish-bar input{min-width:200px;flex:1 1 200px;max-width:340px;}' +
      '.ish-bar input::placeholder{color:' + s.bar_text + ';opacity:.6;}' +
      '.ish-bar button,.ish-bar select{cursor:pointer;}' +
      '.ish-bar button.on{background:' + s.bar_text + ';color:' + s.bar_bg + ';}' +
      '.ish-count{margin-left:auto;color:' + s.title_color + ';font:600 13px ' + ff(s.price_font) + ';opacity:.85;}' +
      '.ish-grid{display:grid;grid-template-columns:' + cols + ';gap:26px 22px;}' +
      '.ish-card{display:flex;flex-direction:column;cursor:pointer;color:inherit;text-decoration:none;}' +
      '.ish-img{position:relative;background:' + s.card_bg + ';border-radius:' + px(s.card_radius, 0) + ';aspect-ratio:' + o.ratio + ';overflow:hidden;}' +
      '.ish-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:' + o.fit + ';transition:opacity .3s ease,transform .5s ease;}' +
      '.ish-img img.alt{opacity:0;}' +
      '.ish-card:hover .ish-img img.alt{opacity:1;}' +
      '.ish-card:hover .ish-img img.main{transform:scale(1.03);}' +
      '.ish-card.soldout .ish-img img{filter:grayscale(.6);opacity:.75;}' +
      '.ish-heart{position:absolute;right:10px;top:10px;width:34px;height:34px;border-radius:50%;border:0;background:' + s.heart_bg + ';color:' + s.heart_color + ';font-size:17px;line-height:34px;text-align:center;cursor:pointer;padding:0;box-shadow:0 1px 5px rgba(0,0,0,.18);z-index:2;}' +
      '.ish-heart.on{background:' + s.heart_color + ';color:' + s.heart_bg + ';}' +
      '.ish-badge{position:absolute;left:10px;bottom:10px;z-index:2;padding:4px 10px;border-radius:6px;background:' + s.badge_bg + ';color:' + s.badge_text + ';font:700 12px ' + ff(s.size_font) + ';}' +
      '.ish-name{flex:1 0 auto;margin-top:12px;color:' + s.title_color + ';font-family:' + ff(s.title_font) + ';font-size:' + px(s.title_size, 15) + ';font-weight:' + s.title_weight + ';text-transform:' + s.title_transform + ';line-height:1.35;}' +
      '.ish-meta{margin-top:auto;padding-top:8px;}' +
      '.ish-price{margin-top:0;color:' + s.price_color + ';font-family:' + ff(s.price_font) + ';font-size:' + px(s.price_size, 14) + ';font-weight:600;}' +
      '.ish-price s{opacity:.55;margin-left:8px;font-weight:400;}' +
      '.ish-sw{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;align-items:center;min-height:15px;}' +
      '.ish-sw i{display:block;width:15px;height:15px;border-radius:3px;border:1px solid ' + s.swatch_border + ';}' +
      '.ish-sw span{font:600 11px ' + ff(s.price_font) + ';color:' + s.price_color + ';margin-left:2px;}' +
      '.ish-narrow{flex-direction:column;gap:14px;}' +
      '.ish-narrow .ish-side{flex:none;width:100%;display:flex;gap:8px;overflow-x:auto;padding:2px 0 8px;-webkit-overflow-scrolling:touch;}' +
      '.ish-narrow .ish-side a{flex:none;white-space:nowrap;margin:0;padding:8px 16px;border:2px solid ' + s.side_text + ';border-radius:999px;font-size:' + px(s.side_size, 15) + ';}' +
      '.ish-narrow .ish-side a.on{background:' + s.side_text + ';color:' + s.bar_bg + ';}' +
      '.ish-narrow .ish-side a.on::before{display:none;}' +
      '.ish-narrow .ish-side a em{display:none;}' +
      '.ish-narrow .ish-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 12px;}' +
      '.ish-narrow .ish-bar input{min-width:0;flex:1 1 100%;max-width:none;}' +
      '.ish-narrow .ish-count{margin-left:0;}' +
      '.ish-empty{grid-column:1/-1;padding:50px 0;text-align:center;color:' + s.title_color + ';font:600 15px ' + ff(s.price_font) + ';opacity:.8;}';
  }

  function wishGet(win) { try { return JSON.parse(win.localStorage.getItem('inteer-wish') || '[]'); } catch (e) { return []; } }
  function wishSet(win, a) { try { win.localStorage.setItem('inteer-wish', JSON.stringify(a)); } catch (e) { /* private mode */ } }

  // Builds one shop block: sidebar with categories, search/sort bar and the product grid
  function buildShop(doc, section, settings, data, opts) {
    var win = doc.defaultView;
    var s = merged(settings.shopify_style, settings.site_colors);
    var o = shopOpts(settings);
    var catAttr = section.getAttribute('data-shopify-category');
    var own = section.getAttribute('data-shopify-product');
    var tree = catTree(settings);
    var state = { cat: '', q: '', sort: o.default_sort, wish: false };
    var single = !!own || !!catAttr;
    if (catAttr) {
      var want = catAttr.trim().toLowerCase();
      var hit = tree.filter(function (n) { return String(n.cat.id).toLowerCase() === want || String(n.cat.title).toLowerCase() === want; })[0];
      state.cat = hit ? hit.cat.id : '__none';
    }
    section.innerHTML = '';
    section.style.display = 'block';
    section.style.border = 'none';
    section.style.gridTemplateColumns = '';
    var css = doc.getElementById('ish-css');
    if (!css) { css = doc.createElement('style'); css.id = 'ish-css'; doc.head.appendChild(css); }
    css.textContent = fontFaceCss(settings.site_fonts) + shopCss(s, o);

    var root = doc.createElement('div'); root.className = 'ish-root';
    var sideEl = doc.createElement('aside'); sideEl.className = 'ish-side';
    var main = doc.createElement('div'); main.className = 'ish-main';
    var barEl = doc.createElement('div'); barEl.className = 'ish-bar';
    var gridEl = doc.createElement('div'); gridEl.className = 'ish-grid';
    main.appendChild(barEl); main.appendChild(gridEl);
    var showSide = o.sidebar && !single && tree.length > 0;
    if (showSide) root.appendChild(sideEl);
    root.appendChild(main);
    section.appendChild(root);

    function baseKeys() {
      if (own) { var k = keyOf(own); return k ? [k] : []; }
      if (state.cat === '__none') return [];
      return state.cat ? catKeys(settings, state.cat) : visibleKeys(settings);
    }
    function priceOf(n) { return n && n.priceRange ? parseFloat(n.priceRange.minVariantPrice.amount) : 0; }
    function listKeys() {
      var wish = wishGet(win), q = state.q.trim().toLowerCase();
      var keys = baseKeys().filter(function (k) { return data[k]; });
      if (state.wish) keys = keys.filter(function (k) { return wish.indexOf(k) >= 0; });
      if (q) keys = keys.filter(function (k) { var n = data[k]; return (n.title + ' ' + (n.tags || []).join(' ') + ' ' + (n.productType || '')).toLowerCase().indexOf(q) >= 0; });
      if (state.sort === 'low') keys.sort(function (a, b) { return priceOf(data[a]) - priceOf(data[b]); });
      else if (state.sort === 'high') keys.sort(function (a, b) { return priceOf(data[b]) - priceOf(data[a]); });
      else if (state.sort === 'az') keys.sort(function (a, b) { return data[a].title.localeCompare(data[b].title); });
      else if (state.sort === 'new') keys.sort(function (a, b) { return String(data[b].createdAt).localeCompare(String(data[a].createdAt)); });
      return keys;
    }
    function badgeFor(k, n) {
      var m = (settings.product_badges || {})[k];
      if (m === 'none') return '';
      if (m) return m;
      if (n.availableForSale === false) return 'Sold out';
      var cmp = n.compareAtPriceRange ? parseFloat(n.compareAtPriceRange.minVariantPrice.amount) : 0;
      if (cmp > priceOf(n)) return 'Sale';
      var days = (Date.now() - Date.parse(n.createdAt)) / 86400000;
      if (o.new_days > 0 && days >= 0 && days <= o.new_days) return 'New';
      return '';
    }
    function cardHtml(k, wish) {
      var n = data[k];
      var shopImgs = (n.images && n.images.nodes || []).map(function (x) { return x.url; });
      if (!shopImgs.length && n.featuredImage) shopImgs.push(n.featuredImage.url);
      var custom = customImgs(settings, k);
      var main = custom[0] || shopImgs[0] || '';
      var alt = '';   // the shop picture never changes on hover: the 1st picture is always the front
      var b = badgeFor(k, n);
      var min = n.priceRange.minVariantPrice, max = n.priceRange.maxVariantPrice;
      var price = money(min.amount, min.currencyCode);
      if (max && parseFloat(max.amount) > parseFloat(min.amount)) price = 'From ' + price;
      var cmp = n.compareAtPriceRange ? parseFloat(n.compareAtPriceRange.minVariantPrice.amount) : 0;
      var cmpHtml = cmp > parseFloat(min.amount) ? '<s>' + esc(money(cmp, min.currencyCode)) + '</s>' : '';
      var sw = o.swatches ? '<div class="ish-sw"></div>' : '';
      if (o.swatches) {
        var opt = (n.options || []).filter(function (x) { return /colou?r/i.test(x.name); })[0];
        if (opt && opt.values.length > 1) {
          sw = '<div class="ish-sw">' + opt.values.slice(0, 8).map(function (v) { return '<i title="' + esc(v) + '" style="background:' + esc(swatchColor(v)) + '"></i>'; }).join('') + (opt.values.length > 8 ? '<span>+' + (opt.values.length - 8) + '</span>' : '') + '</div>';
        }
      }
      var heart = o.wishlist ? '<button type="button" class="ish-heart' + (wish.indexOf(k) >= 0 ? ' on' : '') + '" data-heart="' + esc(k) + '" title="Save">' + (wish.indexOf(k) >= 0 ? '\u2665' : '\u2661') + '</button>' : '';
      return '<div class="ish-card' + (n.availableForSale === false ? ' soldout' : '') + '" data-key="' + esc(k) + '">' +
        '<div class="ish-img">' + (main ? '<img class="main" src="' + esc(main) + '" alt="' + esc(n.title) + '" loading="lazy">' : '') + (alt ? '<img class="alt" src="' + esc(alt) + '" alt="" loading="lazy">' : '') + heart + (b ? '<span class="ish-badge">' + esc(b) + '</span>' : '') + '</div>' +
        '<div class="ish-name">' + esc(n.title) + '</div>' +
        '<div class="ish-meta">' + (o.show_price ? '<div class="ish-price">' + esc(price) + cmpHtml + '</div>' : '') + sw + '</div></div>';
    }
    function renderGrid() {
      var wish = wishGet(win), keys = listKeys();
      gridEl.innerHTML = keys.length ? keys.map(function (k) { return cardHtml(k, wish); }).join('') : '<div class="ish-empty">' + esc(state.wish ? 'No saved products yet \u2014 tap a heart' : o.empty_text) + '</div>';
      var c = barEl.querySelector('.ish-count');
      if (c) c.textContent = keys.length + (keys.length === 1 ? ' product' : ' products');
      var wb = barEl.querySelector('[data-wishbtn]');
      if (wb) wb.textContent = '\u2665 Saved (' + wishGet(win).length + ')';
    }
    function renderSide() {
      if (!showSide) return;
      var html = '<a data-cat="" class="' + (state.cat === '' ? 'on' : '') + '">' + esc(o.all_label) + (o.counts ? '<em>' + visibleKeys(settings).filter(function (k) { return data[k]; }).length + '</em>' : '') + '</a>';
      // open path: the selected category and everything above it; only their children are listed
      var open = {}, byId = {};
      tree.forEach(function (n) { byId[n.cat.id] = n.cat; });
      for (var cur = state.cat, guard = 0; cur && byId[cur] && guard < 6; guard++) { open[cur] = true; cur = byId[cur].parent; }
      tree.forEach(function (n) {
        var par = n.cat.parent && byId[n.cat.parent] ? n.cat.parent : '';
        if (par && !open[par]) return;
        var cnt = catKeys(settings, n.cat.id).filter(function (k) { return data[k]; }).length;
        if (!cnt && !opts.editor) return;
        html += '<a data-cat="' + esc(n.cat.id) + '" class="' + (n.depth === 1 ? 'sub ' : n.depth > 1 ? 'sub2 ' : '') + (state.cat === n.cat.id ? 'on' : '') + '">' + esc(n.cat.title) + (o.counts ? '<em>' + cnt + '</em>' : '') + '</a>';
      });
      sideEl.innerHTML = html;
    }
    function renderBar() {
      if (single) { barEl.style.display = 'none'; return; }
      var h = '';
      if (o.search) h += '<input type="search" data-q placeholder="Search products" value="' + esc(state.q) + '">';
      if (o.sort) h += '<select data-sort>' + [['featured', 'Featured'], ['new', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['az', 'Name A\u2013Z']].map(function (x) { return '<option value="' + x[0] + '"' + (state.sort === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>';
      if (o.wishlist) h += '<button type="button" data-wishbtn class="' + (state.wish ? 'on' : '') + '"></button>';
      h += '<span class="ish-count"></span>';
      barEl.innerHTML = h;
    }
    renderSide(); renderBar(); renderGrid();

    root.addEventListener('click', function (e) {
      var t = e.target;
      var cat = t.closest && t.closest('[data-cat]');
      if (cat) { state.cat = cat.getAttribute('data-cat'); renderSide(); renderGrid(); return; }
      var heart = t.closest && t.closest('[data-heart]');
      if (heart) {
        e.stopPropagation();
        var k = heart.getAttribute('data-heart'), w = wishGet(win), i = w.indexOf(k);
        if (i >= 0) w.splice(i, 1); else w.push(k);
        wishSet(win, w);
        if (state.wish) renderGrid(); else { heart.classList.toggle('on', i < 0); heart.textContent = i < 0 ? '\u2665' : '\u2661'; var wb = barEl.querySelector('[data-wishbtn]'); if (wb) wb.textContent = '\u2665 Saved (' + w.length + ')'; }
        return;
      }
      var wbtn = t.closest && t.closest('[data-wishbtn]');
      if (wbtn) { state.wish = !state.wish; wbtn.classList.toggle('on', state.wish); renderGrid(); return; }
      var card = t.closest && t.closest('.ish-card');
      if (card && opts.onOpenProduct) opts.onOpenProduct(card.getAttribute('data-key'));
    });
    root.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-q')) { state.q = e.target.value; renderGrid(); } });
    root.addEventListener('change', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-sort')) { state.sort = e.target.value; renderGrid(); } });
    // phones: sidebar becomes a row of chips and the grid 2 columns
    function narrowCheck() { root.classList.toggle('ish-narrow', section.clientWidth < 760); }
    narrowCheck();
    if (win.ResizeObserver) new win.ResizeObserver(narrowCheck).observe(section);
    // lets the editor preview a category
    section.__ish = { setCat: function (id) { state.cat = id || ''; renderSide(); renderGrid(); } };
  }

  // Cart side: the floating cart button and the cart drawer sit on the left (default) or the right
  function cartSideCss(doc, settings, opt) {
    var side = shopOpts(settings).cart_side === 'right' ? 'right' : 'left';
    var s = merged(settings.shopify_style, settings.site_colors), rad = px(s.toggle_radius, 0);
    var tag = doc.getElementById('ish-cart-css');
    if (!tag) { tag = doc.createElement('style'); tag.id = 'ish-cart-css'; doc.head.appendChild(tag); }
    if (side === 'right') {
      tag.textContent = '@media(max-width:520px){.shopify-buy-frame--cart{max-width:100%!important;}}';
      return;
    }
    if (opt && opt.toggle) opt.toggle.styles.toggle['border-radius'] = '0 ' + rad + ' ' + rad + ' 0';
    tag.textContent =
      '.shopify-buy-frame--toggle.is-sticky{right:auto!important;left:0!important;top:auto!important;bottom:22px!important;transform:none!important;}' +
      '.shopify-buy-frame--cart{right:auto!important;left:0!important;transform:translateX(-100%)!important;}' +
      '.shopify-buy-frame--cart.is-active{transform:translateX(0)!important;}' +
      '@media(max-width:520px){.shopify-buy-frame--cart{max-width:100%!important;}}';
  }

  // Cart drawer + floating cart button (Shopify), styled from the Shop panel
  function setupCart(doc, win, settings, opts) {
    var ui = win.ShopifyBuy.UI.init(clientFor(win, settings));   // the SDK hands back the SAME object every time
    // start clean so the new colors / fonts apply (otherwise the old cart is kept and its button is gone)
    ['product', 'toggle', 'cart'].forEach(function (t) {
      ((ui.components && ui.components[t]) || []).slice().forEach(function (c) { try { ui.destroyComponent(t, c.id); } catch (e) { /* already gone */ } });
    });
    Array.prototype.forEach.call(doc.querySelectorAll('.shopify-buy-frame--toggle, .shopify-buy-cart-wrapper, [data-cart-seed]'), function (n) { n.remove(); });
    win.__shopUI = ui;
    win.__shopCheckoutLabel = merged(settings.shopify_style, settings.site_colors).checkout_label;
    var opt = options(settings.shopify_style, settings.site_colors, opts.toFilterShadow, settings.site_fonts);
    // The SDK creates the cart + cart button together with its first product, so make one hidden product.
    var first = parseId(visibleKeys(settings)[0]);
    if (first) {
      var hid = doc.createElement('div');
      hid.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;';
      hid.setAttribute('data-cart-seed', '1');
      doc.body.appendChild(hid);
      var cfg = { node: hid, moneyFormat: '%24%7B%7Bamount%7D%7D', options: opt };
      if (first.id) cfg.id = first.id; else cfg.handle = first.handle;
      ui.createComponent('product', cfg);
    }
    cartSideCss(doc, settings, opt);
    injectFontsSoon(doc, settings);
    // an older render's async cart can land late: keep only the newest cart + cart button
    setTimeout(function () {
      ['.shopify-buy-frame--toggle', '.shopify-buy-cart-wrapper'].forEach(function (sel) {
        var n = doc.querySelectorAll(sel);
        for (var i = 0; i < n.length - 1; i++) n[i].remove();
      });
    }, 2500);
    return ui;
  }

  // Draws every [data-shopify-section] block on the page. Safe to call again after any change.
  //  - plain block: the full shop (categories sidebar, search, sort, grid)
  //  - data-shopify-category="<name>": just that category's products
  //  - data-shopify-product="<id>": just that product
  function render(doc, settings, opts) {
    opts = opts || {};
    settings = settings || {};
    if (!settings.shopify_domain || !settings.shopify_storefront_token) return;
    var sections = doc.querySelectorAll('[data-shopify-section]');
    if (!sections.length) return;
    var win = doc.defaultView;
    setSiteFonts(settings.site_fonts);
    var seq = (win.__shopSeq = (win.__shopSeq || 0) + 1);
    var sdk = new Promise(function (res) { loadSdk(win, res); });
    Promise.all([fetchShopData(settings, win), sdk]).then(function (r) {
      if (seq !== win.__shopSeq) return;           // a newer render took over
      setupCart(doc, win, settings, opts);
      Array.prototype.forEach.call(doc.querySelectorAll('[data-shopify-section]'), function (section) { buildShop(doc, section, settings, r[0], opts); if (opts.onBuilt) opts.onBuilt(section); });
    });
  }

  // The big single-product layout used by the Product Page (editor preview + live overlay).
  function renderProductPage(doc, container, settings, productId, opts) {
    opts = opts || {};
    if (!settings.shopify_domain || !settings.shopify_storefront_token || !productId) return;
    var win = doc.defaultView;
    setSiteFonts(settings.site_fonts);
    loadSdk(win, function () {
      container.style.display = 'block';
      container.style.border = 'none';
      var ui = win.__shopUI;
      if (!ui) { ui = win.ShopifyBuy.UI.init(clientFor(win, settings)); win.__shopUI = ui; }
      var opt = options(settings.shopify_style, settings.site_colors, opts.toFilterShadow, settings.site_fonts);
      Promise.resolve(fetchShopData(settings, win)).then(function (map) {
        container.innerHTML = '';
        var attr = container.getAttribute('data-shopify-product-page');
        addProduct(doc, ui, container, productId, settings, opt, { data: map[productId], mode: attr === 'gallery' || attr === 'info' || attr === 'buy' ? attr : 'full' });
        injectFontsSoon(doc, settings);
      });
    });
  }

  // Editor helper: open the cart and fill it with a sample item so its colors can be designed.
  function previewCart(doc) {
    var win = doc.defaultView, ui = win.__shopUI;
    var cart = ui && ui.components && ui.components.cart && ui.components.cart[0];
    if (!cart) return false;
    cart.open();
    setTimeout(function () {
      var f = doc.querySelector('.shopify-buy-cart-wrapper iframe');
      var d = f && f.contentDocument;
      if (!d || d.querySelector('.shopify-buy__cart-item')) return;
      var scroll = d.querySelector('.shopify-buy__cart-scroll');
      if (!scroll) return;
      scroll.innerHTML = '<ul role="list" class="shopify-buy__cart-items"><li class="shopify-buy__cart-item"><div class="shopify-buy__cart-item__image"></div><span class="shopify-buy__cart-item__title">SAMPLE PRODUCT</span><div class="shopify-buy__cart-item__variant-title">M</div><div class="shopify-buy__cart-item__price-and-discounts"><div class="shopify-buy__cart-item__price">$20.00</div></div><div class="shopify-buy__quantity-container clearfix"><button class="shopify-buy__btn--seamless shopify-buy__quantity-decrement" type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M4 7h8v2H4z"></path></svg></button><input class="shopify-buy__quantity shopify-buy__cart-item__quantity-input" type="number" value="1"><button class="shopify-buy__btn--seamless shopify-buy__quantity-increment" type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M12 7H9V4H7v3H4v2h3v3h2V9h3z"></path></svg></button></div></li></ul>';
      if (!d.querySelector('.shopify-buy__cart-bottom')) {
        var b = d.createElement('div');
        b.className = 'shopify-buy__cart-bottom';
        b.innerHTML = '<p class="shopify-buy__cart__subtotal__text">SUBTOTAL</p><p class="shopify-buy__cart__subtotal__price">$20.00</p><p class="shopify-buy__cart__notice">Shipping and discount codes are added at checkout.</p><button class="shopify-buy__btn shopify-buy__btn--cart-checkout" type="button">' + (doc.defaultView.__shopCheckoutLabel || 'CHECKOUT') + '</button>';
        scroll.parentNode.appendChild(b);
      }
    }, 600);
    return true;
  }

  g.InteerShop = { FONTS: FONTS, DEFAULTS: DEFAULTS, SCHEMA: SCHEMA, merged: merged, options: options, render: render, renderProductPage: renderProductPage, previewCart: previewCart, parseId: parseId, keyOf: keyOf, visibleKeys: visibleKeys, catTree: catTree, catKeys: catKeys, fetchShopData: fetchShopData, shopOpts: shopOpts, OPT_DEFAULTS: OPT_DEFAULTS, money: money, fontList: fontList, fontFaceCss: fontFaceCss, customImgs: customImgs, setSiteFonts: setSiteFonts };
})(window);
