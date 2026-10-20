/* ============================================================
   STUDIO WEBSITE — MAIN JAVASCRIPT
   
   This file handles:
   1. Loading content from JSON files (managed by the CMS)
   2. Applying theme colors from settings
   3. Building product cards for in-person items with Shopify Buy Buttons
   4. Shopify Buy Button integration for POD products
   5. Navigation (mobile hamburger, scroll effects)
   ============================================================ */

// ---- Global state ----
let siteSettings = {};
let homeContent = {};
let shopContent = {};

/**
 * Main init function — called from each HTML page.
 * @param {string} page - 'home' or 'shop'
 */
async function initSite(page) {
  try {
    // Load settings (used on every page)
    siteSettings = await fetchJSON('/content/settings.json');
    applySettings(siteSettings);

    if (page === 'home') {
      homeContent = await fetchJSON('/content/home.json');
      applyHomeContent(homeContent);
    }

    if (page === 'shop') {
      shopContent = await fetchJSON('/content/shop.json');
      applyShopContent(shopContent);
      initAllShopifyProducts();
    }

    // Common setup
    initNavigation();
    buildSocialLinks(siteSettings);

    // Activate Feather icons
    if (window.feather) feather.replace();

  } catch (err) {
    console.error('Failed to initialize site:', err);
  }
}

/* ============================================================
   FETCH HELPER
   ============================================================ */
async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error('Failed to load ' + path);
  return response.json();
}

/* ============================================================
   APPLY SETTINGS (Theme Colors, Logo, etc.)
   ============================================================ */
function applySettings(s) {
  // Update CSS custom properties with CMS-managed colors
  const root = document.documentElement;
  if (s.primary_color) root.style.setProperty('--color-accent', s.primary_color);
  if (s.background_color) root.style.setProperty('--color-bg', s.background_color);
  if (s.text_color) root.style.setProperty('--color-text', s.text_color);
  if (s.card_color) root.style.setProperty('--color-card', s.card_color);

  // Update page title
  const titleEl = document.getElementById('page-title');
  if (titleEl && s.studio_name) {
    const existing = titleEl.textContent;
    titleEl.textContent = existing + ' — ' + s.studio_name;
  }

  // Update nav logo
  const logoEl = document.getElementById('nav-logo');
  if (logoEl) {
    if (s.logo_image) {
      logoEl.innerHTML = '<img src="' + s.logo_image + '" alt="' + (s.studio_name || 'Studio') + '">';
    } else {
      logoEl.textContent = s.studio_name || 'Studio';
    }
  }

  // Show/hide shop link in nav
  const shopLink = document.getElementById('nav-shop-link');
  if (shopLink && s.nav_show_shop === false) {
    shopLink.style.display = 'none';
  }

  // Footer text
  const footerText = document.getElementById('footer-text');
  if (footerText && s.studio_name) {
    const year = new Date().getFullYear();
    footerText.innerHTML = '&copy; ' + year + ' ' + s.studio_name + '. All rights reserved.';
  }
}

/* ============================================================
   SOCIAL LINKS
   ============================================================ */
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

  containers.forEach(function(container) {
    if (socials.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.innerHTML = socials.map(function(item) {
      return '<a href="' + item.url + '" target="_blank" rel="noopener noreferrer" aria-label="' + item.icon + '">' +
             '<i data-feather="' + item.icon + '"></i></a>';
    }).join('');
  });
}

/* ============================================================
   HOME PAGE — COMING SOON CONTENT
   ============================================================ */
function applyHomeContent(h) {
  const heading = document.getElementById('hero-heading');
  const subtitle = document.getElementById('hero-subtitle');
  const cta = document.getElementById('hero-cta');
  const bg = document.getElementById('hero-bg');

  if (heading && h.heading) heading.textContent = h.heading;
  if (subtitle && h.subtitle) subtitle.textContent = h.subtitle;

  // Background image
  if (bg && h.background_image) {
    bg.style.backgroundImage = 'url(' + h.background_image + ')';
  }

  // CTA button
  if (cta && h.cta_text && h.cta_link) {
    cta.textContent = h.cta_text;
    cta.href = h.cta_link;
    cta.style.display = 'inline-block';
  }
}

/* ============================================================
   SHOP PAGE — PRODUCT CARDS
   ============================================================ */
function applyShopContent(shop) {
  // Section titles
  setText('shop-hero-title', shop.hero_title);
  setText('shop-hero-subtitle', shop.hero_subtitle);
  setText('in-person-title', shop.in_person_section_title);
  setText('in-person-subtitle', shop.in_person_section_subtitle);
  setText('pod-title', shop.pod_section_title);
  setText('pod-subtitle', shop.pod_section_subtitle);

  // Build in-person product cards
  var grid = document.getElementById('in-person-grid');
  if (!grid || !shop.in_person_items) return;

  grid.innerHTML = '';

  shop.in_person_items.forEach(function(item, index) {
    var card = document.createElement('div');
    card.className = 'product-card';

    var imageHTML;
    if (item.image) {
      imageHTML = '<img class="product-card__image" src="' + item.image + '" alt="' + escapeHTML(item.title) + '">';
    } else {
      imageHTML = '<div class="product-card__image-placeholder"><span>No image yet</span></div>';
    }

    // The buy button container — Shopify Buy Button SDK will render into this
    var buyBtnId = 'buy-btn-inperson-' + index;

    card.innerHTML =
      imageHTML +
      '<div class="product-card__body">' +
        '<h3 class="product-card__title">' + escapeHTML(item.title) + '</h3>' +
        '<p class="product-card__desc">' + escapeHTML(item.description) + '</p>' +
        '<div class="product-card__buy" id="' + buyBtnId + '"></div>' +
      '</div>';

    grid.appendChild(card);
  });
}

/* ============================================================
   SHOPIFY BUY BUTTONS — ALL PRODUCTS
   Handles both in-person items and print-on-demand products.
   When someone buys, Shopify processes payment, collects their
   shipping address, and you get an order notification (the "ticket")
   with everything you need to pack and ship.
   ============================================================ */
function initAllShopifyProducts() {
  var domain = siteSettings.shopify_domain;
  var token = siteSettings.shopify_storefront_token;

  // If Shopify isn't configured yet, show placeholders
  if (!domain || !token) {
    // Show a setup message on in-person items that have no product ID
    var grid = document.getElementById('in-person-grid');
    if (grid) {
      var buyContainers = grid.querySelectorAll('.product-card__buy');
      buyContainers.forEach(function(container) {
        container.innerHTML = '<p class="buy-placeholder">Connect Shopify to enable purchases</p>';
      });
    }
    return;
  }

  function createAllBuyButtons() {
    var client = window.ShopifyBuy.buildClient({
      domain: domain,
      storefrontAccessToken: token
    });

    var ui = window.ShopifyBuy.UI.init(client);

    // Shared Buy Button styling that matches the site theme
    var buttonStyles = {
      product: {
        styles: {
          product: { '@media (min-width: 601px)': { 'max-width': '100%' } },
          title: { display: 'none' },  // We show our own title from the CMS
          price: {
            'font-family': 'Inter, sans-serif',
            'color': siteSettings.primary_color || '#c9a96e',
            'font-size': '1.1rem'
          },
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
          img: { display: 'none' }  // We show our own image from the CMS
        },
        text: { button: 'Buy Now' },
        contents: {
          img: false,
          title: false,
          price: true,
          description: false,
          button: true,
          buttonWithQuantity: false
        }
      },
      cart: {
        styles: {
          button: {
            'background-color': siteSettings.primary_color || '#c9a96e',
            'color': siteSettings.background_color || '#0a0a0a',
            'border-radius': '4px',
            'font-family': 'Inter, sans-serif',
            ':hover': {
              'opacity': '0.9',
              'background-color': siteSettings.primary_color || '#c9a96e'
            }
          }
        }
      },
      toggle: {
        styles: {
          toggle: {
            'background-color': siteSettings.primary_color || '#c9a96e'
          }
        }
      }
    };

    // --- In-Person Items Buy Buttons ---
    var inPersonItems = (shopContent.in_person_items || []);
    inPersonItems.forEach(function(item, index) {
      if (!item.shopify_product_id || item.shopify_product_id.trim() === '') {
        // No product ID yet — show placeholder
        var container = document.getElementById('buy-btn-inperson-' + index);
        if (container) {
          container.innerHTML = '<p class="buy-placeholder">Add Shopify product ID in admin to enable</p>';
        }
        return;
      }

      var container = document.getElementById('buy-btn-inperson-' + index);
      if (container) {
        ui.createComponent('product', {
          id: item.shopify_product_id,
          node: container,
          moneyFormat: '%24%7B%7Bamount%7D%7D',
          options: buttonStyles
        });
      }
    });

    // --- POD / Merch Buy Buttons ---
    var podProducts = (shopContent.pod_products || []).filter(function(p) {
      return p.shopify_product_id && p.shopify_product_id.trim() !== '';
    });

    if (podProducts.length > 0) {
      // Hide placeholder
      var placeholder = document.getElementById('pod-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      var podGrid = document.getElementById('pod-grid');

      // For POD items, show Shopify's full product card (image, title, price, button)
      var podButtonStyles = JSON.parse(JSON.stringify(buttonStyles));
      podButtonStyles.product.styles.title = {
        'font-family': "'Playfair Display', Georgia, serif",
        'color': siteSettings.text_color || '#f5f5f5',
        'font-size': '1.15rem'
      };
      podButtonStyles.product.styles.img = {
        'border-radius': '4px 4px 0 0'
      };
      podButtonStyles.product.contents = {
        img: true,
        title: true,
        price: true,
        description: false,
        button: true,
        buttonWithQuantity: false
      };

      podProducts.forEach(function(product) {
        var container = document.createElement('div');
        container.id = 'shopify-pod-' + product.shopify_product_id;
        container.className = 'pod-card';
        podGrid.appendChild(container);

        ui.createComponent('product', {
          id: product.shopify_product_id,
          node: container,
          moneyFormat: '%24%7B%7Bamount%7D%7D',
          options: podButtonStyles
        });
      });
    }
  }

  // Wait for Shopify SDK to be ready
  if (window.shopifySDKReady && window.ShopifyBuy && window.ShopifyBuy.UI) {
    createAllBuyButtons();
  } else {
    window.onShopifySDKReady = createAllBuyButtons;
  }
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function initNavigation() {
  var hamburger = document.getElementById('nav-hamburger');
  var navLinks = document.getElementById('nav-links');
  var nav = document.getElementById('nav');

  // Hamburger toggle
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // Scroll effect — add background to nav
  if (nav && !nav.classList.contains('scrolled')) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }
}

/* ============================================================
   UTILITY FUNCTIONS
   ============================================================ */
function setText(id, text) {
  var el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

function escapeHTML(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
