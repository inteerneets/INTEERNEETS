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
    { group: 'Category titles', fields: [
      { k: 'cat_font', l: 'Font', t: 'font' }, { k: 'cat_color', l: 'Color', t: 'color' },
      { k: 'cat_size', l: 'Size (px)', t: 'num', min: 10, max: 120 }, { k: 'cat_weight', l: 'Weight', t: 'weight' },
      { k: 'cat_transform', l: 'Letters', t: 'select', o: [['uppercase', 'CAPITALS'], ['none', 'Normal'], ['capitalize', 'Each Word']] } ] },
    { group: 'Picture', fields: [ { k: 'img_radius', l: 'Corner radius (px)', t: 'num', min: 0, max: 80 } ] },
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

  function px(n, d) { n = parseFloat(n); return (isNaN(n) ? d : n) + 'px'; }
  function ff(n) { return SYSTEM.indexOf(n) >= 0 ? '"' + n + '"' : '"' + n + '", sans-serif'; }

  // exact values used everywhere: factory look < site button colors < the user's own choices
  function merged(style, colors) {
    colors = colors || {};
    var site = {
      btn_fill: colors.btn_fill || 'transparent', btn_text: colors.btn_text || BLACK,
      btn_border: colors.btn_border || BLACK, btn_radius: parseFloat(colors.btn_radius) || 0
    };
    return Object.assign({}, DEFAULTS, site, style || {});
  }

  function options(style, colors, toFilter) {
    var s = merged(style, colors);
    var fonts = [s.title_font, s.price_font, s.size_font, s.btn_font, s.cart_font].filter(function (f, i, a) { return f && SYSTEM.indexOf(f) < 0 && a.indexOf(f) === i; });
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

  // Which products go where: [{ id, title, ids: [...] }]. With no categories everything is one group.
  function categoryGroups(settings) {
    var all = (settings.shopify_product_ids || []).map(keyOf).filter(Boolean);
    var cats = (settings.shop_categories || []).filter(function (c) { return c && c.title !== undefined; });
    if (!cats.length) return [{ id: '', title: '', ids: all }];
    var used = {};
    var out = cats.map(function (c) {
      var ids = (c.product_ids || []).map(keyOf).filter(function (k) { return k && all.indexOf(k) >= 0 && !used[k] && (used[k] = 1); });
      return { id: c.id, title: c.title, ids: ids };
    });
    var rest = all.filter(function (k) { return !used[k]; });
    if (rest.length) out.push({ id: '_other', title: 'Other', ids: rest });
    return out;
  }

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

  // One product card: your own picture (if you uploaded one) or Shopify's own picture, then the SDK card.
  function addProduct(doc, ui, parent, raw, settings, opt, extra) {
    var p = parseId(raw);
    if (!p) return;
    var key = p.id || p.handle;
    var custom = (settings.product_custom_images || {})[key];
    var wrap = doc.createElement('div');
    wrap.className = 'shop-card';
    wrap.setAttribute('data-product-key', key);
    parent.appendChild(wrap);
    var po = Object.assign({}, opt.product);
    var page = !!(extra && extra.page);
    if (page) {
      // Product page: everything (sizes / types / colors, quantity, Add to cart, description)
      po.layout = doc.defaultView.innerWidth < 700 ? 'vertical' : 'horizontal';
      po.contents = Object.assign({}, po.contents, { options: true, button: true, description: true });
    } else {
      // Shop grid: just picture, name and price; a click opens the product page
      po.contents = Object.assign({}, po.contents, { options: false, button: false, buttonWithQuantity: false, quantity: false });
    }
    var img;
    if (custom) {
      po.contents = Object.assign({}, po.contents, { img: false, imgWithCarousel: false });
      img = doc.createElement('img');
      img.src = custom;
      img.alt = '';
      img.style.cssText = 'display:block;width:100%;height:auto;border-radius:' + px(merged(settings.shopify_style, settings.site_colors).img_radius, 0) + ';';
      wrap.appendChild(img);
    }
    var openCb = extra && extra.onOpen;
    if (openCb) {
      var open = function () { openCb(key); };
      if (img) { img.style.cursor = 'pointer'; img.addEventListener('click', open); }
      po.DOMEvents = { 'click .shopify-buy__product-img-wrapper': open, 'click .shopify-buy__product__title': open, 'click .shopify-buy__product__price': open };
      po.styles = Object.assign({}, po.styles, {
        product: Object.assign({ cursor: 'pointer' }, po.styles.product),
        title: Object.assign({ cursor: 'pointer' }, po.styles.title),
        imgWrapper: { cursor: 'pointer' }
      });
    }
    var node = doc.createElement('div');
    wrap.appendChild(node);
    var cfg = { node: node, moneyFormat: '%24%7B%7Bamount%7D%7D', options: Object.assign({}, opt, { product: po }) };
    if (p.id) cfg.id = p.id; else cfg.handle = p.handle;
    ui.createComponent('product', cfg);
  }

  function heading(doc, text, s) {
    var h = doc.createElement('h2');
    h.className = 'shop-cat-title';
    h.textContent = text;
    h.style.cssText = 'grid-column:1/-1;margin:24px 0 0;font-family:' + ff(s.cat_font) + ';color:' + s.cat_color + ';font-size:' + px(s.cat_size, 28) + ';font-weight:' + s.cat_weight + ';text-transform:' + s.cat_transform + ';';
    return h;
  }

  // Draw every [data-shopify-section] block on the page. Safe to call again (e.g. after a style change).
  // A block with data-shopify-category="<id or name>" shows just that category, a block with
  // data-shopify-product="<id>" just that product, any other block shows every category with titles.
  function render(doc, settings, opts) {
    opts = opts || {};
    settings = settings || {};
    if (!settings.shopify_domain || !settings.shopify_storefront_token) return;
    var sections = doc.querySelectorAll('[data-shopify-section]');
    if (!sections.length) return;
    var win = doc.defaultView;
    var seq = (win.__shopSeq = (win.__shopSeq || 0) + 1);
    loadSdk(win, function () {
      if (seq !== win.__shopSeq) return;           // a newer render took over
      // remove the previous cart + floating cart button, then start fresh
      Array.prototype.forEach.call(doc.querySelectorAll('.shopify-buy-frame--toggle, .shopify-buy-cart-wrapper'), function (n) { n.remove(); });
      var ui = win.ShopifyBuy.UI.init(clientFor(win, settings));
      win.__shopUI = ui;
      var s = merged(settings.shopify_style, settings.site_colors);
      win.__shopCheckoutLabel = s.checkout_label;
      var opt = options(settings.shopify_style, settings.site_colors, opts.toFilterShadow);
      var groups = categoryGroups(settings);
      Array.prototype.forEach.call(sections, function (section) {
        var own = section.getAttribute('data-shopify-product');
        var catAttr = section.getAttribute('data-shopify-category');
        var list;
        if (own) list = [{ title: '', ids: [own] }];
        else if (catAttr) {
          var want = catAttr.trim().toLowerCase();
          list = groups.filter(function (g) { return String(g.id).toLowerCase() === want || String(g.title).toLowerCase() === want; }).map(function (g) { return { title: '', ids: g.ids }; });
        } else list = groups;
        if (!list.some(function (g) { return g.ids.length; })) return;
        section.innerHTML = '';
        section.style.display = 'grid';
        section.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
        section.style.gap = '24px';
        section.style.border = 'none';
        list.forEach(function (g) {
          if (!g.ids.length) return;
          if (g.title) section.appendChild(heading(doc, g.title, s));
          g.ids.forEach(function (raw) { addProduct(doc, ui, section, raw, settings, opt, { onOpen: opts.onOpenProduct }); });
        });
      });
    });
  }

  // The big single-product layout used by the Product Page (editor preview + live overlay).
  function renderProductPage(doc, container, settings, productId, opts) {
    opts = opts || {};
    if (!settings.shopify_domain || !settings.shopify_storefront_token || !productId) return;
    var win = doc.defaultView;
    loadSdk(win, function () {
      container.innerHTML = '';
      container.style.display = 'block';
      container.style.border = 'none';
      var ui = win.__shopUI;
      if (!ui) { ui = win.ShopifyBuy.UI.init(clientFor(win, settings)); win.__shopUI = ui; }
      var opt = options(settings.shopify_style, settings.site_colors, opts.toFilterShadow);
      addProduct(doc, ui, container, productId, settings, opt, { page: true });
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

  g.InteerShop = { FONTS: FONTS, DEFAULTS: DEFAULTS, SCHEMA: SCHEMA, merged: merged, options: options, render: render, renderProductPage: renderProductPage, previewCart: previewCart, parseId: parseId, keyOf: keyOf, categoryGroups: categoryGroups };
})(window);
