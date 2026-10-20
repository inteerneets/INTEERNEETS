/* ============================================================
   INTEERNEETS — GrapesJS Editor Logic
   ============================================================ */

// ─── API helper: sends the admin password when publishing to the live site ───
const IS_LIVE = !['localhost', '127.0.0.1'].includes(location.hostname);

async function apiFetch(url, opts = {}, retried = false) {
  const headers = Object.assign({}, opts.headers);
  const pw = sessionStorage.getItem('adminPassword');
  if (pw) headers['x-admin-password'] = pw;
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (res.status === 401 && !retried) {
    const entered = prompt('Enter your admin password to publish to the live site:');
    if (!entered) return res;
    sessionStorage.setItem('adminPassword', entered);
    return apiFetch(url, opts, true);
  }
  if (res.status === 401) sessionStorage.removeItem('adminPassword');
  if (!res.ok && res.status !== 401) {
    // Surface the server's reason (e.g. missing GITHUB_TOKEN) after the generic toast
    res.clone().json().then((j) => j && j.error && setTimeout(() => showToast('Error: ' + j.error), 50)).catch(() => {});
  }
  return res;
}

// ─── Current page state ───
let currentPage = 'home';

// ─── Google Fonts URL (same as <head>) ───
const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600;700&family=Raleway:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap';

// ═══════════════════════════════════════════════════════════════
// DEFAULT TEMPLATES
// ═══════════════════════════════════════════════════════════════

const DEFAULT_HOME_HTML = `
<section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:var(--c-bg,#0a0a0a);color:var(--c-text,#ffffff);text-align:center;padding:40px 20px;">
  <h1 style="font-family:'Playfair Display',serif;font-size:4.5rem;margin:0 0 20px 0;color:var(--c-text,#ffffff);letter-spacing:2px;">Coming Soon</h1>
  <p style="font-family:'Inter',sans-serif;font-size:1.1rem;max-width:500px;line-height:1.7;color:#999;margin:0 0 40px 0;">We are preparing something special. Stay tuned for the launch of INTEERNEETS — where art meets the internet.</p>
  <a href="mailto:inteerneets@gmail.com" style="display:inline-block;padding:14px 36px;background:var(--c-button,#e53935);border:2px solid var(--c-button,#e53935);color:var(--c-button-text,#ffffff);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;transition:all 0.3s;">EMAIL US</a>
</section>
`;

const DEFAULT_SHOP_HTML = `
<section style="padding:80px 20px;background:var(--c-bg,#0a0a0a);color:var(--c-text,#ffffff);text-align:center;">
  <h1 style="font-family:'Playfair Display',serif;font-size:3rem;margin:0 0 10px 0;color:var(--c-text,#ffffff);">Shop</h1>
  <p style="font-family:'Inter',sans-serif;font-size:1rem;color:#999;">Browse our collections below.</p>
</section>

<section style="padding:60px 20px;background:var(--c-bg,#0a0a0a);color:var(--c-text,#ffffff);">
  <h2 style="font-family:'Playfair Display',serif;font-size:2rem;text-align:center;margin:0 0 40px 0;color:var(--c-text,#ffffff);">Original Works</h2>
  <div data-shopify-section="originals" style="min-height:200px;border:2px dashed #333;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;font-family:'Inter',sans-serif;">
    Shopify products will load here
  </div>
</section>

<section style="padding:60px 20px;background:var(--c-bg,#0a0a0a);color:var(--c-text,#ffffff);">
  <h2 style="font-family:'Playfair Display',serif;font-size:2rem;text-align:center;margin:0 0 40px 0;color:var(--c-text,#ffffff);">Merchandise</h2>
  <div data-shopify-section="merch" style="min-height:200px;border:2px dashed #333;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;font-family:'Inter',sans-serif;">
    Shopify products will load here
  </div>
</section>

<section style="padding:60px 20px;background:var(--c-bg,#0a0a0a);text-align:center;">
  <a href="mailto:inteerneets@gmail.com" style="display:inline-block;padding:14px 36px;background:var(--c-button,#e53935);border:2px solid var(--c-button,#e53935);color:var(--c-button-text,#ffffff);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;">EMAIL US</a>
</section>
`;

const DEFAULT_HOME_CSS = `
  body { margin:0; padding:0; background:var(--c-bg,#0a0a0a); }
  * { box-sizing:border-box; }
`;
const DEFAULT_SHOP_CSS = DEFAULT_HOME_CSS;

// ═══════════════════════════════════════════════════════════════
// FONT LIST
// ═══════════════════════════════════════════════════════════════

const FONT_OPTIONS = [
  { value: "'Inter', sans-serif",                  name: 'Inter' },
  { value: "'Playfair Display', serif",            name: 'Playfair Display' },
  { value: "'Poppins', sans-serif",                name: 'Poppins' },
  { value: "'Montserrat', sans-serif",             name: 'Montserrat' },
  { value: "'Oswald', sans-serif",                 name: 'Oswald' },
  { value: "'Raleway', sans-serif",                name: 'Raleway' },
  { value: "'Space Grotesk', sans-serif",          name: 'Space Grotesk' },
  { value: "'Cormorant Garamond', serif",          name: 'Cormorant Garamond' },
  { value: "'Libre Baskerville', serif",           name: 'Libre Baskerville' },
  { value: 'Arial, sans-serif',                    name: 'Arial' },
  { value: 'Georgia, serif',                       name: 'Georgia' },
  { value: "'Courier New', monospace",             name: 'Courier New' },
  { value: "'Times New Roman', serif",             name: 'Times New Roman' },
  { value: 'Impact, sans-serif',                   name: 'Impact' },
];

// ═══════════════════════════════════════════════════════════════
// GRAPESJS INITIALISATION
// ═══════════════════════════════════════════════════════════════

const editor = grapesjs.init({
  container: '#gjs',
  height: 'calc(100vh - 50px)',
  fromElement: false,

  // Manual save/load — no built-in storage
  storageManager: false,

  // Canvas: inject Google Fonts so they render inside the iframe
  canvas: {
    styles: [GOOGLE_FONTS_URL],
  },

  // Plugins
  plugins: ['gjs-blocks-basic'],
  pluginsOpts: {
    'gjs-blocks-basic': { flexGrid: true },
  },

  // Asset manager
  assetManager: {
    upload: false,
    uploadFile(ev) {
      const files = ev.dataTransfer ? ev.dataTransfer.files : ev.target.files;
      uploadFiles(files);
    },
  },

  // Devices
  deviceManager: {
    devices: [
      { name: 'Desktop', width: '' },
      { name: 'Tablet', width: '768px', widthMedia: '992px' },
      { name: 'Mobile', width: '375px', widthMedia: '480px' },
    ],
  },

  // ─── Style Manager Sectors ───
  styleManager: {
    sectors: [
      {
        name: 'Typography',
        open: true,
        properties: [
          {
            type: 'select',
            property: 'font-family',
            label: 'Font',
            options: FONT_OPTIONS,
          },
          { property: 'font-size',       label: 'Size' },
          {
            type: 'select',
            property: 'font-weight',
            label: 'Weight',
            options: [
              { value: '300', name: 'Light' },
              { value: '400', name: 'Regular' },
              { value: '500', name: 'Medium' },
              { value: '600', name: 'Semi Bold' },
              { value: '700', name: 'Bold' },
            ],
          },
          {
            type: 'select',
            property: 'font-style',
            label: 'Style',
            options: [
              { value: 'normal', name: 'Normal' },
              { value: 'italic', name: 'Italic' },
            ],
          },
          { type: 'color', property: 'color', label: 'Color' },
          {
            type: 'radio',
            property: 'text-align',
            label: 'Align',
            options: [
              { value: 'left',    name: 'Left' },
              { value: 'center',  name: 'Center' },
              { value: 'right',   name: 'Right' },
              { value: 'justify', name: 'Justify' },
            ],
          },
          { property: 'letter-spacing',  label: 'Letter Spacing' },
          { property: 'line-height',     label: 'Line Height' },
          {
            type: 'select',
            property: 'text-decoration',
            label: 'Decoration',
            options: [
              { value: 'none',         name: 'None' },
              { value: 'underline',    name: 'Underline' },
              { value: 'line-through', name: 'Line-through' },
              { value: 'overline',     name: 'Overline' },
            ],
          },
          {
            type: 'select',
            property: 'text-transform',
            label: 'Transform',
            options: [
              { value: 'none',       name: 'None' },
              { value: 'uppercase',  name: 'Uppercase' },
              { value: 'lowercase',  name: 'Lowercase' },
              { value: 'capitalize', name: 'Capitalize' },
            ],
          },
        ],
      },
      {
        name: 'Size & Spacing',
        open: false,
        properties: [
          { property: 'width',      label: 'Width' },
          { property: 'height',     label: 'Height' },
          { property: 'min-height', label: 'Min Height' },
          { property: 'max-width',  label: 'Max Width' },
          {
            property: 'padding',
            type: 'composite',
            label: 'Padding',
            properties: [
              { property: 'padding-top',    label: 'Top' },
              { property: 'padding-right',  label: 'Right' },
              { property: 'padding-bottom', label: 'Bottom' },
              { property: 'padding-left',   label: 'Left' },
            ],
          },
          {
            property: 'margin',
            type: 'composite',
            label: 'Margin',
            properties: [
              { property: 'margin-top',    label: 'Top' },
              { property: 'margin-right',  label: 'Right' },
              { property: 'margin-bottom', label: 'Bottom' },
              { property: 'margin-left',   label: 'Left' },
            ],
          },
        ],
      },
      {
        name: 'Background',
        open: false,
        properties: [
          { type: 'color', property: 'background-color', label: 'Bg Color' },
          { type: 'file',  property: 'background-image', label: 'Bg Image' },
          {
            type: 'select',
            property: 'background-size',
            label: 'Bg Size',
            options: [
              { value: 'auto',    name: 'Auto' },
              { value: 'cover',   name: 'Cover' },
              { value: 'contain', name: 'Contain' },
            ],
          },
          {
            type: 'select',
            property: 'background-position',
            label: 'Bg Position',
            options: [
              { value: 'center center', name: 'Center' },
              { value: 'top center',    name: 'Top' },
              { value: 'bottom center', name: 'Bottom' },
              { value: 'left center',   name: 'Left' },
              { value: 'right center',  name: 'Right' },
            ],
          },
          {
            type: 'select',
            property: 'background-repeat',
            label: 'Bg Repeat',
            options: [
              { value: 'no-repeat', name: 'No Repeat' },
              { value: 'repeat',    name: 'Repeat' },
              { value: 'repeat-x',  name: 'Repeat X' },
              { value: 'repeat-y',  name: 'Repeat Y' },
            ],
          },
        ],
      },
      {
        name: 'Borders & Effects',
        open: false,
        properties: [
          { property: 'border-radius', label: 'Radius' },
          {
            property: 'border',
            type: 'composite',
            label: 'Border',
            properties: [
              { property: 'border-width', label: 'Width' },
              {
                type: 'select',
                property: 'border-style',
                label: 'Style',
                options: [
                  { value: 'none',   name: 'None' },
                  { value: 'solid',  name: 'Solid' },
                  { value: 'dashed', name: 'Dashed' },
                  { value: 'dotted', name: 'Dotted' },
                  { value: 'double', name: 'Double' },
                ],
              },
              { type: 'color', property: 'border-color', label: 'Color' },
            ],
          },
          {
            type: 'slider',
            property: 'opacity',
            label: 'Opacity',
            defaults: 1,
            min: 0,
            max: 1,
            step: 0.01,
          },
          {
            property: 'box-shadow',
            type: 'stack',
            label: 'Box Shadow',
            properties: [
              { property: 'box-shadow-h',      label: 'X' },
              { property: 'box-shadow-v',      label: 'Y' },
              { property: 'box-shadow-blur',   label: 'Blur' },
              { property: 'box-shadow-spread', label: 'Spread' },
              { type: 'color', property: 'box-shadow-color', label: 'Color' },
            ],
          },
        ],
      },
      {
        name: 'Layout',
        open: false,
        properties: [
          {
            type: 'select',
            property: 'display',
            label: 'Display',
            options: [
              { value: 'block',        name: 'Block' },
              { value: 'flex',         name: 'Flex' },
              { value: 'inline-block', name: 'Inline-Block' },
              { value: 'inline',       name: 'Inline' },
              { value: 'grid',         name: 'Grid' },
              { value: 'none',         name: 'None' },
            ],
          },
          {
            type: 'select',
            property: 'flex-direction',
            label: 'Direction',
            options: [
              { value: 'row',            name: 'Row' },
              { value: 'column',         name: 'Column' },
              { value: 'row-reverse',    name: 'Row Reverse' },
              { value: 'column-reverse', name: 'Column Reverse' },
            ],
          },
          {
            type: 'select',
            property: 'justify-content',
            label: 'Justify',
            options: [
              { value: 'flex-start',    name: 'Start' },
              { value: 'center',        name: 'Center' },
              { value: 'flex-end',      name: 'End' },
              { value: 'space-between', name: 'Space Between' },
              { value: 'space-around',  name: 'Space Around' },
              { value: 'space-evenly',  name: 'Space Evenly' },
            ],
          },
          {
            type: 'select',
            property: 'align-items',
            label: 'Align Items',
            options: [
              { value: 'stretch',    name: 'Stretch' },
              { value: 'flex-start', name: 'Start' },
              { value: 'center',     name: 'Center' },
              { value: 'flex-end',   name: 'End' },
              { value: 'baseline',   name: 'Baseline' },
            ],
          },
          { property: 'gap', label: 'Gap' },
        ],
      },
      {
        name: 'Position & Layers',
        open: false,
        properties: [
          {
            type: 'select',
            property: 'position',
            label: 'Free Position (Absolute)',
            options: [
              { value: 'static',   name: 'Static' },
              { value: 'relative', name: 'Relative' },
              { value: 'absolute', name: 'Absolute' },
              { value: 'fixed',    name: 'Fixed' },
              { value: 'sticky',   name: 'Sticky' },
            ],
          },
          { property: 'top',    label: 'Top' },
          { property: 'left',   label: 'Left' },
          { property: 'right',  label: 'Right' },
          { property: 'bottom', label: 'Bottom' },
          { property: 'z-index', label: 'Z-Index' },
          {
            type: 'select',
            property: 'overflow',
            label: 'Overflow',
            options: [
              { value: 'visible', name: 'Visible' },
              { value: 'hidden',  name: 'Hidden' },
              { value: 'scroll',  name: 'Scroll' },
              { value: 'auto',    name: 'Auto' },
            ],
          },
        ],
      },
    ],
  },
});

// ═══════════════════════════════════════════════════════════════
// CUSTOM BLOCKS — Category "Studio"
// ═══════════════════════════════════════════════════════════════

const bm = editor.BlockManager;

bm.add('hero-section', {
  label: 'Hero Section',
  category: 'Studio',
  content: `
    <section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:var(--c-bg,#0a0a0a);color:var(--c-text,#ffffff);text-align:center;padding:60px 20px;">
      <h1 style="font-family:'Playfair Display',serif;font-size:4rem;margin:0 0 20px 0;">Your Headline</h1>
      <p style="font-family:'Inter',sans-serif;font-size:1.1rem;color:#999;max-width:500px;line-height:1.7;">Subtitle text goes here. Tell your story.</p>
    </section>`,
});

bm.add('heading', {
  label: 'Heading',
  category: 'Studio',
  content: `<h2 style="font-family:'Playfair Display',serif;font-size:2.5rem;color:var(--c-text,#ffffff);text-align:center;margin:20px 0;">Heading</h2>`,
});

bm.add('paragraph', {
  label: 'Paragraph',
  category: 'Studio',
  content: `<p style="font-family:'Inter',sans-serif;font-size:1rem;color:#bbb;line-height:1.7;max-width:640px;margin:10px auto;">Write your paragraph here. This text uses Inter for readability.</p>`,
});

bm.add('email-us-button', {
  label: 'Email Us Button',
  category: 'Studio',
  content: `<a href="mailto:inteerneets@gmail.com" style="display:inline-block;padding:14px 36px;background:var(--c-button,#e53935);border:2px solid var(--c-button,#e53935);color:var(--c-button-text,#ffffff);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;">EMAIL US</a>`,
});

bm.add('divider', {
  label: 'Divider',
  category: 'Studio',
  content: `<hr style="border:none;border-top:1px solid #333;margin:40px auto;width:80%;" />`,
});

bm.add('spacer', {
  label: 'Spacer',
  category: 'Studio',
  content: `<div style="height:60px;"></div>`,
});

bm.add('floating-text', {
  label: 'Floating Text',
  category: 'Studio',
  content: `<div style="position:absolute;top:50px;left:50px;font-family:'Playfair Display',serif;font-size:2rem;color:var(--c-text,#ffffff);cursor:move;z-index:10;">Floating Text</div>`,
});

bm.add('floating-image', {
  label: 'Floating Image',
  category: 'Studio',
  content: {
    type: 'image',
    style: {
      position: 'absolute',
      top: '50px',
      left: '50px',
      width: '200px',
      'z-index': '10',
    },
    attributes: { alt: 'Floating image' },
  },
});

bm.add('card', {
  label: 'Card',
  category: 'Studio',
  content: `
    <div style="background:#1a1a1a;border-radius:8px;overflow:hidden;max-width:340px;margin:20px auto;border:1px solid #333;">
      <img src="https://placehold.co/340x220/222/666?text=Image" alt="Card image" style="width:100%;display:block;" />
      <div style="padding:20px;">
        <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--c-text,#ffffff);margin:0 0 8px 0;">Card Title</h3>
        <p style="font-family:'Inter',sans-serif;font-size:0.9rem;color:#999;margin:0;line-height:1.6;">Card description goes here.</p>
      </div>
    </div>`,
});

bm.add('social-links', {
  label: 'Social Links',
  category: 'Studio',
  content: `
    <div style="display:flex;gap:20px;justify-content:center;padding:20px;">
      <a href="#" style="color:var(--c-highlight,#e53935);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.85rem;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Instagram</a>
      <a href="#" style="color:var(--c-highlight,#e53935);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.85rem;font-weight:500;letter-spacing:1px;text-transform:uppercase;">TikTok</a>
      <a href="#" style="color:var(--c-highlight,#e53935);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.85rem;font-weight:500;letter-spacing:1px;text-transform:uppercase;">Twitter</a>
    </div>`,
});

bm.add('shopify-products', {
  label: 'Shopify Products',
  category: 'Studio',
  content: `
    <div data-shopify-section="products" style="min-height:200px;border:2px dashed #333;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;font-family:'Inter',sans-serif;padding:40px;">
      Shopify products will load here
    </div>`,
});

// ═══════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.classList.add('hidden'), 400);
  }, 2500);
}

// ═══════════════════════════════════════════════════════════════
// SAVE / LOAD
// ═══════════════════════════════════════════════════════════════

async function savePage() {
  const projectData = editor.getProjectData();
  const html = editor.getHtml();
  // Uploaded-font @font-face rules are prepended so the live site can use them
  const css = fontFaceCss() + editor.getCss();

  try {
    const res = await apiFetch('/api/save-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: currentPage,
        content: { projectData, html, css },
      }),
    });
    if (res.ok) {
      showToast(IS_LIVE ? 'Published! Live in about 1 minute' : 'Page saved!');
    } else {
      showToast('Save failed');
    }
  } catch (err) {
    console.error('Save error', err);
    showToast('Save failed');
  }
}

// Default template: set the CSS FIRST, then the components. Calling setStyle()
// after setComponents() would wipe the rules GrapesJS derives from inline styles.
function applyDefaultTemplate(page) {
  const html = page === 'shop' ? DEFAULT_SHOP_HTML : DEFAULT_HOME_HTML;
  const css = page === 'shop' ? DEFAULT_SHOP_CSS : DEFAULT_HOME_CSS;
  editor.setStyle(css);
  editor.setComponents(html);
}

async function loadPage(page) {
  currentPage = page;

  // Update active tab
  document.querySelectorAll('.page-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  try {
    const res = await fetch(`/content/page-${page}.json`);
    if (res.ok) {
      const data = await res.json();
      editor.loadProjectData(data.projectData);
      showToast(`Loaded ${page} page`);
      return;
    }
  } catch (_) {
    // fall through to defaults
  }

  // Fall back to default template
  applyDefaultTemplate(page);
  showToast(`Loaded default ${page} template`);
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

async function loadSettings() {
  try {
    const res = await fetch('/content/settings.json');
    if (!res.ok) return;
    const s = await res.json();
    const set = (id, v) => { if (v) document.getElementById(id).value = v; };
    set('set-email', s.contact_email);
    set('set-shopify-domain', s.shopify_domain);
    set('set-shopify-token', s.shopify_storefront_token);
    set('set-product-ids', Array.isArray(s.shopify_product_ids) ? s.shopify_product_ids.join('\n') : s.shopify_product_ids);
    set('set-instagram', s.social_instagram);
    set('set-tiktok', s.social_tiktok);
    set('set-twitter', s.social_twitter);
    if (s.site_colors) setSiteColors(s.site_colors);
    else if (s.site_bg_color) setSiteColors({ bg: s.site_bg_color });
    document.getElementById('set-bg-shading').checked = !!s.site_bg_shading;
  } catch (_) {
    // Settings not found — that's fine
  }
}

async function saveSettings() {
  const val = (id) => document.getElementById(id).value.trim();
  const payload = {
    contact_email:            val('set-email'),
    shopify_domain:           val('set-shopify-domain'),
    shopify_storefront_token: val('set-shopify-token'),
    shopify_product_ids:      val('set-product-ids').split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    social_instagram:         val('set-instagram'),
    social_tiktok:            val('set-tiktok'),
    social_twitter:           val('set-twitter'),
    // Global swatches: flat exact colors; shading only when explicitly enabled
    site_colors:              siteColors,
    site_bg_color:            siteColors.bg,
    site_bg_shading:          document.getElementById('set-bg-shading').checked,
  };

  try {
    const res = await apiFetch('/api/save-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      showToast('Settings saved!');
      document.getElementById('settings-overlay').classList.add('hidden');
    } else {
      showToast('Failed to save settings');
    }
  } catch (err) {
    console.error('Settings save error', err);
    showToast('Failed to save settings');
  }
}

// ═══════════════════════════════════════════════════════════════
// UPLOADS, ASSETS & CUSTOM FONTS
// ═══════════════════════════════════════════════════════════════

const FONT_EXT = /\.(woff2?|ttf|otf)$/i;
let customFonts = []; // [{ name, url }]

function fontNameFromUrl(url) {
  return decodeURIComponent(url.split('/').pop()).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
}
function fontFormat(url) {
  const e = url.split('.').pop().toLowerCase();
  return { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[e] || 'truetype';
}
function fontFaceCss() {
  return customFonts
    .map((f) => `@font-face{font-family:'${f.name}';src:url('${f.url}') format('${fontFormat(f.url)}');font-display:swap;}\n`)
    .join('');
}

// Make uploaded fonts visible in the canvas and selectable in the Font dropdown
function registerFont(url) {
  const name = fontNameFromUrl(url);
  if (customFonts.some((f) => f.url === url)) return;
  customFonts.push({ name, url });
  FONT_OPTIONS.push({ value: `'${name}', sans-serif`, name: `${name} (uploaded)` });
  injectFontsIntoCanvas();
  try {
    const prop = editor.StyleManager.getProperty('Typography', 'font-family');
    if (prop) { prop.set('options', FONT_OPTIONS.slice()); editor.StyleManager.render && editor.StyleManager.render(); }
  } catch (_) { /* dropdown refresh is best-effort */ }
}
function injectFontsIntoCanvas() {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  let tag = doc.getElementById('uploaded-fonts');
  if (!tag) {
    tag = doc.createElement('style');
    tag.id = 'uploaded-fonts';
    doc.head.appendChild(tag);
  }
  tag.textContent = fontFaceCss();
}
editor.on('canvas:frame:load', injectFontsIntoCanvas);
editor.on('load', injectFontsIntoCanvas);

async function uploadFiles(files) {
  if (!files || !files.length) return;
  for (const file of Array.from(files)) {
    try {
      const data = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await apiFetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, type: file.type, data }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'upload failed');
      if (FONT_EXT.test(json.url)) {
        registerFont(json.url);
        showToast(`Font "${fontNameFromUrl(json.url)}" uploaded — pick it in Typography > Font`);
      } else {
        editor.AssetManager.add(json.url);
        showToast('Image uploaded — double-click an image or use Bg Image to pick it');
      }
    } catch (err) {
      console.error('Upload failed', err);
      showToast('Upload failed (is the local server running?)');
    }
  }
}

async function loadAssets() {
  try {
    const res = await fetch('/api/assets');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.images)) editor.AssetManager.add(data.images.filter((u) => !u.endsWith('.gitkeep')));
    if (Array.isArray(data.fonts)) data.fonts.filter((u) => FONT_EXT.test(u)).forEach(registerFont);
  } catch (_) {
    // Assets endpoint not available yet — no problem
  }
}

// Upload button (images + fonts)
document.getElementById('btn-upload').addEventListener('click', () => {
  document.getElementById('upload-input').click();
});
document.getElementById('upload-input').addEventListener('change', (e) => {
  uploadFiles(e.target.files);
  e.target.value = '';
});

// Free-drag mode: drag any element anywhere on the canvas (absolute positioning)
let freeDrag = false;
document.getElementById('btn-freedrag').addEventListener('click', (e) => {
  freeDrag = !freeDrag;
  editor.setDragMode(freeDrag ? 'absolute' : '');
  e.currentTarget.classList.toggle('active', freeDrag);
  showToast(freeDrag ? 'Free Drag ON — drag elements anywhere' : 'Free Drag OFF — elements snap into layout');
});

// Quick add: text box / image dropped onto the page, ready to drag
document.getElementById('btn-add-text').addEventListener('click', () => {
  const w = editor.getWrapper();
  const c = w.append(`<div style="position:absolute;top:80px;left:80px;font-family:'Playfair Display',serif;font-size:2rem;color:#ffffff;z-index:10;">New text</div>`)[0];
  editor.select(c);
});
document.getElementById('btn-add-image').addEventListener('click', () => {
  editor.AssetManager.open({
    select(asset) {
      const src = asset.get ? asset.get('src') : asset;
      const c = editor.getWrapper().append({
        type: 'image', attributes: { src, alt: '' },
        style: { position: 'absolute', top: '80px', left: '80px', width: '240px', 'z-index': '5' },
      })[0];
      editor.select(c);
      editor.AssetManager.close();
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// UI EVENTS
// ═══════════════════════════════════════════════════════════════

// Page tabs
document.querySelectorAll('.page-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.page !== currentPage) {
      loadPage(btn.dataset.page);
    }
  });
});

// Save
document.getElementById('btn-save').addEventListener('click', savePage);

// Ctrl+S
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    savePage();
  }
});

// Undo / Redo
document.getElementById('btn-undo').addEventListener('click', () => {
  editor.UndoManager.undo();
});
document.getElementById('btn-redo').addEventListener('click', () => {
  editor.UndoManager.redo();
});

// Preview
document.getElementById('btn-preview').addEventListener('click', () => {
  editor.runCommand('preview');
});

// Reset
document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm(`Reset the ${currentPage} page to its default template? All unsaved changes will be lost.`)) {
    applyDefaultTemplate(currentPage);
    showToast('Page reset to default');
  }
});

// Settings modal
document.getElementById('btn-settings').addEventListener('click', () => {
  document.getElementById('settings-overlay').classList.remove('hidden');
});
document.getElementById('settings-close').addEventListener('click', () => {
  document.getElementById('settings-overlay').classList.add('hidden');
});
document.getElementById('settings-overlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.add('hidden');
  }
});
document.getElementById('settings-save').addEventListener('click', saveSettings);

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

// Wait until the editor + canvas are ready before loading content
editor.on('load', () => {
  // Allow styling the page body itself (default only allows background)
  editor.getWrapper().set('stylable', true);
  loadPage('home');
  loadSettings();
  loadAssets();
});


// ═══════════════════════════════════════════════════════════════
// GLOBAL COLOR SWATCHES (theme variables)
// Elements use var(--c-bg), var(--c-text), var(--c-highlight),
// var(--c-button), var(--c-button-text). Change once, updates everywhere.
// ═══════════════════════════════════════════════════════════════

const DEFAULT_COLORS = { bg: '#0a0a0a', text: '#ffffff', highlight: '#e53935', button: '#e53935', button_text: '#ffffff' };
const COLOR_PRESETS = [
  { name: 'Dark + Red',    c: { bg: '#0a0a0a', text: '#ffffff', highlight: '#e53935', button: '#e53935', button_text: '#ffffff' } },
  { name: 'Pure White',    c: { bg: '#ffffff', text: '#111111', highlight: '#e53935', button: '#111111', button_text: '#ffffff' } },
  { name: 'Cream',         c: { bg: '#f5f0e8', text: '#2a2a2a', highlight: '#b3261e', button: '#2a2a2a', button_text: '#f5f0e8' } },
  { name: 'Midnight Blue', c: { bg: '#0b1426', text: '#e8eefc', highlight: '#4d8dff', button: '#4d8dff', button_text: '#ffffff' } },
  { name: 'Forest',        c: { bg: '#0f1d16', text: '#e6f2ea', highlight: '#3ddc84', button: '#3ddc84', button_text: '#0f1d16' } },
  { name: 'Mono',          c: { bg: '#000000', text: '#ffffff', highlight: '#ffffff', button: '#ffffff', button_text: '#000000' } },
];
let siteColors = Object.assign({}, DEFAULT_COLORS);

function colorVarsCss(c) {
  return `:root{--c-bg:${c.bg};--c-text:${c.text};--c-highlight:${c.highlight};--c-button:${c.button};--c-button-text:${c.button_text};}`;
}
function applyColorsToCanvas() {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  let tag = doc.getElementById('theme-vars');
  if (!tag) { tag = doc.createElement('style'); tag.id = 'theme-vars'; doc.head.appendChild(tag); }
  tag.textContent = colorVarsCss(siteColors);
}
function syncColorInputs() {
  document.querySelectorAll('#colors-panel input[type=color]').forEach((inp) => {
    inp.value = siteColors[inp.dataset.key];
    const hex = document.querySelector(`.hex[data-for="${inp.id}"]`);
    if (hex) hex.value = siteColors[inp.dataset.key];
  });
}
function setSiteColors(c) {
  siteColors = Object.assign({}, DEFAULT_COLORS, c || {});
  syncColorInputs();
  applyColorsToCanvas();
}
editor.on('canvas:frame:load', applyColorsToCanvas);
editor.on('load', applyColorsToCanvas);

document.querySelectorAll('#colors-panel input[type=color]').forEach((inp) => {
  inp.addEventListener('input', () => {
    siteColors[inp.dataset.key] = inp.value;
    const hex = document.querySelector(`.hex[data-for="${inp.id}"]`);
    if (hex) hex.value = inp.value;
    applyColorsToCanvas();
  });
});
document.querySelectorAll('#colors-panel .hex').forEach((hex) => {
  hex.addEventListener('input', () => {
    let v = hex.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      const inp = document.getElementById(hex.dataset.for);
      inp.value = v;
      siteColors[inp.dataset.key] = v;
      applyColorsToCanvas();
    }
  });
});
const presetBox = document.getElementById('color-presets');
COLOR_PRESETS.forEach((p) => {
  const b = document.createElement('button');
  b.className = 'preset';
  b.title = p.name;
  b.style.background = p.c.bg;
  b.innerHTML = `<span style="background:${p.c.highlight}"></span>`;
  b.addEventListener('click', () => setSiteColors(p.c));
  presetBox.appendChild(b);
});
document.getElementById('btn-colors').addEventListener('click', () => {
  document.getElementById('colors-panel').classList.toggle('hidden');
});
document.getElementById('colors-close').addEventListener('click', () => {
  document.getElementById('colors-panel').classList.add('hidden');
});
document.getElementById('colors-reset').addEventListener('click', () => setSiteColors(DEFAULT_COLORS));
document.getElementById('colors-save').addEventListener('click', async () => {
  await saveSettings();
  document.getElementById('colors-panel').classList.add('hidden');
});
syncColorInputs();
