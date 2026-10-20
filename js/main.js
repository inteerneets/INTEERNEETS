/* ============================================================
   MAIN JAVASCRIPT
   - Direct Shopify Integration (No Inquiry Forms)
   - Zero-Flash (FOUC) Loading
   - Pure Dynamic Color Application
   - Custom Layer Rendering
   ============================================================ */

let siteSettings = {};
let homeContent = {};
let shopContent = {};

async function initSite(page) {
  try {
    siteSettings = await fetchJSON('/content/settings.json');
    applySettings(siteSettings);

    if (page === 'home') {
      homeContent = await fetchJSON('/content/home.json');
      applyHomeContent(homeContent);
    }

    if (page === 'shop') {
      shopContent = await fetchJSON('/content/shop.json');
      applyShopContent(shopContent);
      initShopify();
    }

    initNavigation();
    buildSocialLinks(siteSettings);

    if (window.feather) feather.replace();

    // Reveal page immediately without template flash
    document.body.classList.add('loaded');
  } catch (err) {
    console.error('Initialization error:', err);
    document.body.classList.add('loaded');
  }
}

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('Failed to load: ' + path);
  return res.json();
}

function applySettings(s) {
  const root = document.documentElement;

  // Pure colors with zero forced grayness or dark overlays
  if (s.primary_color) root.style.setProperty('--color-accent', s.primary_color);
  if (s.background_color) root.style.setProperty('--color-bg', s.background_color);
  if (s.text_color) root.style.setProperty('--color-text', s.text_color);
  if (s.card_color) root.style.setProperty('--color-card', s.card_color);

  // Overlay opacity toggle
  if (s.enable_bg_overlay) {
    const opacity = typeof s.overlay_opacity === 'number' ? s.overlay_opacity : 0.5;
    root.style.setProperty('--overlay-opacity', opacity);
  } else {
    root.style.setProperty('--overlay-opacity', '0.0');
  }

  // Update title & logo
  const titleEl = document.getElementById('page-title');
  if (titleEl && s.studio_name) {
    titleEl.textContent = titleEl.textContent + ' — ' + s.studio_name;
  }

  const logoEl = document.getElementById('nav-logo');
  if (logoEl) {
    if (s.logo_image) {
      logoEl.innerHTML = '<img src="' + s.logo_image + '" alt="' + (s.studio_name || 'Studio') + '">';
    } else {
      logoEl.textContent = s.studio_name || 'Studio';
    }
  }

  // Shop visibility
  const shopLink = document.getElementById('nav-shop-link');
  if (shopLink && s.nav_show_shop === false) {
    shopLink.style.display = 'none';
  }

  // Footer copyright
  const footerText = document.getElementById('footer-text');
  if (footerText && s.studio_name) {
    footerText.innerHTML = '&copy; ' + new Date().getFullYear() + ' ' + s.studio_name + '. All rights reserved.';
  }
}

function applyHomeContent(h) {
  const heading = document.getElementById('hero-heading');
  const subtitle = document.getElementById('hero-subtitle');
  const cta = document.getElementById('hero-cta');
  const bg = document.getElementById('hero-bg');

  if (heading && h.heading) {
    heading.textContent = h.heading;
    if (h.heading_font) heading.style.fontFamily = "'" + h.heading_font + "', sans-serif";
    if (h.heading_color) heading.style.color = h.heading_color;
    if (h.heading_size) heading.style.fontSize = h.heading_size + 'rem';
  }

  if (subtitle && h.subtitle) {
    subtitle.textContent = h.subtitle;
    if (h.subtitle_font) subtitle.style.fontFamily = "'" + h.subtitle_font + "', sans-serif";
    if (h.subtitle_color) subtitle.style.color = h.subtitle_color;
    if (h.subtitle_size) subtitle.style.fontSize = h.subtitle_size + 'rem';
  }

  if (bg && h.background_image) {
    bg.style.backgroundImage = 'url(' + h.background_image + ')';
  }

  // EMAIL US Button
  if (cta) {
    if (h.show_email_button !== false) {
      const email = siteSettings.contact_email || 'inteerneets@gmail.com';
      cta.href = 'mailto:' + email;
      cta.textContent = h.email_button_text || 'EMAIL US';
      if (h.email_button_color) {
        cta.style.borderColor = h.email_button_color;
        cta.style.color = h.email_button_color;
      }
      cta.style.display = 'inline-block';
    } else {
      cta.style.display = 'none';
    }
  }

  // Render Custom Layers (Background layer, text, images, z-indexes)
  renderCustomLayers(h.custom_layers || []);
}

function renderCustomLayers(layers) {
  const container = document.getElementById('hero-layers-container');
  if (!container) return;
  container.innerHTML = '';

  layers.forEach((layer) => {
    const el = document.createElement('div');
    el.className = 'custom-layer ' + (layer.type === 'image' ? 'custom-layer--image' : 'custom-layer--text');
    el.style.top = (layer.top || 20) + '%';
    el.style.left = (layer.left || 20) + '%';
    el.style.zIndex = layer.z_index || 5;

    if (layer.type === 'image' && layer.image) {
      el.innerHTML = '<img src="' + layer.image + '" alt="Layer" style="max-width:' + (layer.width || 200) + 'px;">';
    } else if (layer.type === 'text') {
      el.textContent = layer.text || '';
      if (layer.color) el.style.color = layer.color;
      if (layer.font_size) el.style.fontSize = layer.font_size + 'rem';
      if (layer.font_family) el.style.fontFamily = "'" + layer.font_family + "', sans-serif";
    }

    container.appendChild(el);
  });
}

function applyShopContent(shop) {
  setText('shop-hero-title', shop.hero_title);
  setText('shop-hero-subtitle', shop.hero_subtitle);
  setText('in-person-title', shop.in_person_section_title);
  setText('in-person-subtitle', shop.in_person_section_subtitle);
  setText('pod-title', shop.pod_section_title);
  setText('pod-subtitle', shop.pod_section_subtitle);

  const grid = document.getElementById('in-person-grid');
  if (!grid || !shop.in_person_items) return;

  grid.innerHTML = '';

  shop.in_person_items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    let imageHTML = item.image
      ? '<img class="product-card__image" src="' + item.image + '" alt="' + escapeHTML(item.title) + '">'
      : '<div class="product-card__image-placeholder"><span>Studio Piece</span></div>';

    card.innerHTML =
      imageHTML +
      '<div class="product-card__body">' +
        '<h3 class="product-card__title">' + escapeHTML(item.title) + '</h3>' +
        '<p class="product-card__desc">' + escapeHTML(item.description) + '</p>' +
        '<div class="product-card__footer">' +
          '<span class="product-card__price">' + escapeHTML(item.price) + '</span>' +
        '</div>' +
        '<div class="product-card__buy-target" id="shopify-item-' + index + '"></div>' +
      '</div>';

    grid.appendChild(card);
  });
}

function initShopify() {
  const domain = siteSettings.shopify_domain;
  const token = siteSettings.shopify_storefront_token;

  if (!domain || !token) {
    document.querySelectorAll('.product-card__buy-target').forEach((el) => {
      el.innerHTML = '<div class="placeholder-notice">Shopify Storefront Token required in Admin</div>';
    });
    return;
  }

  function mountButtons() {
    const client = window.ShopifyBuy.buildClient({
      domain: domain,
      storefrontAccessToken: token
    });
    const ui = window.ShopifyBuy.UI.init(client);

    const buttonConfig = {
      product: {
        styles: {
          product: { '@media (min-width: 601px)': { 'max-width': '100%' } },
          button: {
            'background-color': siteSettings.primary_color || '#c9a96e',
            'color': siteSettings.background_color || '#0a0a0a',
            'border-radius': '4px',
            'font-family': 'Inter, sans-serif',
            'font-weight': '600',
            'letter-spacing': '1px',
            'text-transform': 'uppercase',
            'font-size': '13px',
            'padding': '12px 24px',
            'width': '100%',
            ':hover': {
              'opacity': '0.9',
              'background-color': siteSettings.primary_color || '#c9a96e'
            }
          },
          title: { display: 'none' },
          img: { display: 'none' },
          price: { display: 'none' }
        },
        text: { button: 'Buy Now' },
        contents: { img: false, title: false, price: false, button: true }
      },
      cart: {
        styles: {
          button: {
            'background-color': siteSettings.primary_color || '#c9a96e',
            'color': siteSettings.background_color || '#0a0a0a',
            'border-radius': '4px'
          }
        }
      }
    };

    // Mount In-Person pieces
    (shopContent.in_person_items || []).forEach((item, index) => {
      const target = document.getElementById('shopify-item-' + index);
      if (target && item.shopify_product_id) {
        ui.createComponent('product', {
          id: item.shopify_product_id,
          node: target,
          moneyFormat: '%24%7B%7Bamount%7D%7D',
          options: buttonConfig
        });
      }
    });

    // Mount Print-on-Demand products
    const podGrid = document.getElementById('pod-grid');
    if (podGrid && shopContent.pod_products) {
      podGrid.innerHTML = '';
      const podConfig = JSON.parse(JSON.stringify(buttonConfig));
      podConfig.product.contents = { img: true, title: true, price: true, button: true };
      podConfig.product.styles.title = {
        display: 'block',
        color: siteSettings.text_color || '#f5f5f5',
        'font-family': 'Playfair Display, serif'
      };
      podConfig.product.styles.price = {
        display: 'block',
        color: siteSettings.primary_color || '#c9a96e',
        'font-family': 'Inter, sans-serif'
      };
      podConfig.product.styles.img = { display: 'block', 'border-radius': '4px' };

      shopContent.pod_products.forEach((pod) => {
        if (!pod.shopify_product_id) return;
        const div = document.createElement('div');
        podGrid.appendChild(div);

        ui.createComponent('product', {
          id: pod.shopify_product_id,
          node: div,
          moneyFormat: '%24%7B%7Bamount%7D%7D',
          options: podConfig
        });
      });
    }
  }

  if (window.shopifySDKReady && window.ShopifyBuy && window.ShopifyBuy.UI) {
    mountButtons();
  } else {
    window.onShopifySDKReady = mountButtons;
  }
}

function buildSocialLinks(s) {
  const containers = [
    document.getElementById('hero-socials'),
    document.getElementById('footer-socials')
  ].filter(Boolean);

  const socials = [];
  if (s.social_instagram) socials.push({ icon: 'instagram', url: s.social_instagram });
  if (s.social_twitter) socials.push({ icon: 'twitter', url: s.social_twitter });
  if (s.social_tiktok) socials.push({ icon: 'music', url: s.social_tiktok });
  if (s.social_email) socials.push({ icon: 'mail', url: 'mailto:' + s.social_email });

  containers.forEach((container) => {
    if (socials.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.innerHTML = socials.map((item) => {
      return '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" aria-label="' + item.icon + '">' +
             '<i data-feather="' + item.icon + '"></i></a>';
    }).join('');
  });
}

function initNavigation() {
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  const nav = document.getElementById('nav');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  if (nav && !nav.classList.contains('scrolled')) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
