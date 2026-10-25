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
<section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;color:var(--c-text,#ffffff);text-align:center;padding:40px 20px;">
  <h1 style="font-family:'Playfair Display',serif;font-size:4.5rem;margin:0 0 20px 0;color:var(--c-text,#ffffff);letter-spacing:2px;">Coming Soon</h1>
  <p style="font-family:'Inter',sans-serif;font-size:1.1rem;max-width:500px;line-height:1.7;color:#999;margin:0 0 40px 0;">We are preparing something special. Stay tuned for the launch of INTEERNEETS — where art meets the internet.</p>
  <a href="mailto:inteerneets@gmail.com" style="display:inline-block;padding:14px 36px;background:var(--btn-fill,transparent);border:var(--btn-border-width,2px) solid var(--btn-border,#000000);color:var(--btn-text,#000000);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;transition:all 0.3s;">EMAIL US</a>
</section>
`;

const DEFAULT_SHOP_HTML = `
<section style="padding:80px 20px;color:var(--c-text,#ffffff);text-align:center;">
  <h1 style="font-family:'Playfair Display',serif;font-size:3rem;margin:0 0 10px 0;color:var(--c-text,#ffffff);">Shop</h1>
  <p style="font-family:'Inter',sans-serif;font-size:1rem;color:#999;">Browse our collections below.</p>
</section>

<section style="padding:60px 20px;color:var(--c-text,#ffffff);">
  <h2 style="font-family:'Playfair Display',serif;font-size:2rem;text-align:center;margin:0 0 40px 0;color:var(--c-text,#ffffff);">Original Works</h2>
  <div data-shopify-section="originals" style="min-height:200px;border:2px dashed #333;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;font-family:'Inter',sans-serif;">
    Shopify products will load here
  </div>
</section>

<section style="padding:60px 20px;color:var(--c-text,#ffffff);">
  <h2 style="font-family:'Playfair Display',serif;font-size:2rem;text-align:center;margin:0 0 40px 0;color:var(--c-text,#ffffff);">Merchandise</h2>
  <div data-shopify-section="merch" style="min-height:200px;border:2px dashed #333;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;font-family:'Inter',sans-serif;">
    Shopify products will load here
  </div>
</section>

<section style="padding:60px 20px;text-align:center;">
  <a href="mailto:inteerneets@gmail.com" style="display:inline-block;padding:14px 36px;background:var(--btn-fill,transparent);border:var(--btn-border-width,2px) solid var(--btn-border,#000000);color:var(--btn-text,#000000);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;">EMAIL US</a>
</section>
`;

const DEFAULT_HOME_CSS = `
  body { margin:0; padding:0; color:var(--c-text,#ffffff); }
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
      { name: 'Phone landscape', width: '812px' },
      { name: 'Laptop', width: '1366px' },
      { name: 'Big screen', width: '1920px' },
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
          {
            // Photoshop-style drop shadow for text: + adds a shadow, X/Y = distance, Blur = softness.
            // Color accepts transparency, e.g. rgba(0,0,0,0.6) for a 60% black shadow. Stack several for glows.
            property: 'text-shadow',
            type: 'stack',
            label: 'Text Shadow',
            properties: [
              { property: 'text-shadow-h',    label: 'X (right)',  default: '2px', units: ['px'], min: -100, max: 100 },
              { property: 'text-shadow-v',    label: 'Y (down)',   default: '2px', units: ['px'], min: -100, max: 100 },
              { property: 'text-shadow-blur', label: 'Blur',       default: '4px', units: ['px'], min: 0,    max: 100 },
              { type: 'color', property: 'text-shadow-color', label: 'Color / opacity', default: 'rgba(0,0,0,0.75)' },
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
    <section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;color:var(--c-text,#ffffff);text-align:center;padding:60px 20px;">
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
  content: `<a href="mailto:inteerneets@gmail.com" style="display:inline-block;padding:14px 36px;background:var(--btn-fill,transparent);border:var(--btn-border-width,2px) solid var(--btn-border,#000000);color:var(--btn-text,#000000);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;">EMAIL US</a>`,
});

bm.add('goto-button', {
  label: 'Go-To Button',
  category: 'Studio',
  content: `<a href="#shop" style="display:inline-block;padding:14px 36px;background:var(--btn-fill,transparent);border:var(--btn-border-width,2px) solid var(--btn-border,#000000);color:var(--btn-text,#000000);text-decoration:none;font-family:'Inter',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:3px;text-transform:uppercase;">GO TO SHOP</a>`,
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

bm.add('login-box', {
  label: 'Login box',
  category: 'Studio',
  content: `
    <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
      <input type="password" data-login-pw="1" placeholder="Password" style="width:280px;max-width:100%;background:#111;border:1px solid #e53935;color:#e53935;padding:12px 14px;font-size:15px;border-radius:6px;text-align:center;">
      <button type="button" data-login-btn="1" style="width:280px;max-width:100%;background:#e53935;color:#000;border:0;padding:12px;font-weight:700;letter-spacing:.2em;border-radius:6px;">ENTER</button>
      <div data-login-err="1" style="color:#e53935;font-size:12px;min-height:16px;"></div>
    </div>`,
});
bm.add('shopify-category', {
  label: 'Shop Category',
  category: 'Studio',
  content: `
    <div data-shopify-section="category" data-shopify-category="Category name" style="min-height:160px;border:2px dashed #333;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;font-family:'Inter',sans-serif;padding:40px;">
      Products of one category load here (type its name in this block's settings)
    </div>`,
});
bm.add('shopify-product-page', {
  label: 'Product Details',
  category: 'Studio',
  content: `
    <div data-shopify-product-page="1" style="max-width:1100px;margin:0 auto;min-height:320px;border:2px dashed #333;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#555;font-family:'Inter',sans-serif;padding:40px;">
      The selected product shows here (use on the Product Page)
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
// PAGES, SAVE / LOAD
// The site is one scrolling page made of "pages" (Home, Shop, Video, ...).
// In the editor you work on one page at a time via the tabs at the top.
// ═══════════════════════════════════════════════════════════════

const byId = (id) => document.getElementById(id);

let pages = [{ id: 'home', title: 'Home' }, { id: 'shop', title: 'Shop' }];
const pageBg = {};          // page id -> background settings (color / picture / pattern)
const drafts = {};          // page id -> unsaved snapshot while you work on another tab
const dirty = new Set();    // pages with unsaved changes
const newPages = new Set(); // pages created in this session, not saved yet
let pagesDirty = false;
let settingsLoaded = false;
let loadingPage = false;
let saving = false;

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
// The Error page (shown for any unknown address) is a special page: it has its own
// tab, is not part of the site menu and cannot be deleted.
const ERROR_PAGE = { id: '404', title: 'Error Page' };
// The Loading page is the screen visitors see while the site loads (same idea, own tab)
const LOADING_PAGE = { id: 'loading', title: 'Loading Page' };
// The Product page is the design visitors see when they open a product (one design, every product)
const PRODUCT_PAGE = { id: 'product', title: 'Product Page' };
// The Login page is the password screen shown before the editor opens
const LOGIN_PAGE = { id: 'login', title: 'Login Page' };
const SPECIAL_PAGES = [ERROR_PAGE, LOADING_PAGE, PRODUCT_PAGE, LOGIN_PAGE];
// Each product can have its own page design: page id product-<slug> (the plain product page is the template)
function isProductPageId(id) { return id === PRODUCT_PAGE.id || String(id).indexOf(PRODUCT_PAGE.id + '-') === 0; }
function shopSlug(key) { return String(key).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32); }
function pageTitle(id) {
  if (id !== PRODUCT_PAGE.id && isProductPageId(id)) { const slug = id.slice(PRODUCT_PAGE.id.length + 1); return 'Product: ' + ((window.__shopNames || {})[slug] || slug); }
  const sp = SPECIAL_PAGES.find((s) => s.id === id);
  if (sp) return sp.title;
  const p = pages.find((x) => x.id === id);
  return p ? p.title : id;
}

// Read a content file. On the live site this reads straight from GitHub (always the
// newest save, no waiting for a rebuild); locally it reads the file from disk.
async function fetchContent(name) {
  const fromStatic = async () => {
    const r = await fetch(`/content/${name}?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('nf');
    return r.json();
  };
  if (IS_LIVE) {
    try {
      const r = await fetch(`/api/content?name=${encodeURIComponent(name)}&fresh=1`, { cache: 'no-store' });
      if (r.ok) return r.json();
      if (r.status === 404) throw new Error('nf');
    } catch (e) {
      if (e.message === 'nf') throw e;
    }
  }
  return fromStatic();
}

// Make sure text you are still typing is written into the page before we read it
function flushEditing() {
  try {
    const sel = editor.getSelected();
    if (sel && sel.view && typeof sel.view.disableEditing === 'function') sel.view.disableEditing();
  } catch (_) { /* nothing is being edited */ }
}

// The size of the editor canvas when a page is saved = the "stage" size the live site scales from.
// Only measured on the Desktop view; other device previews keep the last desktop size.
var pageRef = {};
function canvasRefSize() {
  try {
    const dev = editor.getDevice && editor.getDevice();
    const f = editor.Canvas.getFrameEl();
    const doc = f && f.contentDocument;
    if ((!dev || /desktop/i.test(String(dev))) && doc && doc.documentElement.clientWidth > 300) {
      return { w: doc.documentElement.clientWidth, h: f.clientHeight };
    }
  } catch (_) { /* fall through */ }
  return pageRef[currentPage] || null;
}
function snapshot() {
  flushEditing();
  const ref = canvasRefSize();
  if (ref) pageRef[currentPage] = ref;
  return {
    refW: ref ? ref.w : undefined,
    refH: ref ? ref.h : undefined,
    projectData: editor.getProjectData(),
    html: editor.getHtml(),
    css: fontFaceCss() + editor.getCss(),
    bg: pageBg[currentPage] || null,
  };
}

function markDirty(id) {
  if (loadingPage || dirty.has(id)) return;
  dirty.add(id);
  renderTabs();
}
editor.on('update', () => markDirty(currentPage));
window.addEventListener('beforeunload', (e) => {
  if (dirty.size || pagesDirty) { e.preventDefault(); e.returnValue = ''; }
});

// ─── Tabs ───
function renderTabs() { renderTabsCore(); if (typeof devSchedule === 'function') devSchedule(); if (typeof shopSyncSwitch === 'function') shopSyncSwitch(); }
let tabDrag = null;
function renderTabsCore() {
  const box = byId('page-tabs');
  box.innerHTML = '';
  [...pages, ...SPECIAL_PAGES].forEach((p) => {
    const isError = SPECIAL_PAGES.some((s) => s.id === p.id);
    const b = document.createElement('button');
    b.className = 'page-btn' + ((p.id === currentPage || (p.id === PRODUCT_PAGE.id && isProductPageId(currentPage))) ? ' active' : '') + (isError ? ' error-tab' : '');
    b.dataset.page = p.id;
    b.title = p.id === LOGIN_PAGE.id
      ? 'Design the password screen shown before this editor opens'
      : p.id === PRODUCT_PAGE.id
      ? 'Design the page that opens when a visitor clicks a product (use the arrows to preview each product)'
      : p.id === LOADING_PAGE.id
      ? 'Design the loading screen visitors see while the site loads'
      : isError
        ? 'Design the page visitors see when they open an address that does not exist (404)'
        : 'Click to edit this page. Double-click to rename.';
    b.appendChild(document.createTextNode(p.title));
    if (dirty.has(p.id)) {
      const dot = document.createElement('span');
      dot.className = 'tab-dot';
      dot.textContent = '●';
      dot.title = 'Unsaved changes';
      b.appendChild(dot);
    }
    if (p.id !== 'home' && !isError) {
      const x = document.createElement('span');
      x.className = 'tab-x';
      x.textContent = '×';
      x.title = 'Delete this page';
      x.addEventListener('click', (e) => { e.stopPropagation(); deletePage(p.id); });
      b.appendChild(x);
    }
    if (!isError && p.id !== PRODUCT_PAGE.id) {
      b.draggable = true;
      b.addEventListener('dragstart', (e) => { tabDrag = p.id; b.classList.add('tab-dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', p.id); } catch (_) {} });
      b.addEventListener('dragend', () => { tabDrag = null; box.querySelectorAll('.page-btn').forEach((x) => x.classList.remove('tab-dragging', 'tab-drop-before', 'tab-drop-after')); });
      b.addEventListener('dragover', (e) => {
        if (!tabDrag || tabDrag === p.id) return;
        e.preventDefault();
        const r = b.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2;
        b.classList.toggle('tab-drop-after', after); b.classList.toggle('tab-drop-before', !after);
      });
      b.addEventListener('dragleave', () => b.classList.remove('tab-drop-before', 'tab-drop-after'));
      b.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!tabDrag || tabDrag === p.id) return;
        const after = b.classList.contains('tab-drop-after');
        const from = pages.findIndex((x) => x.id === tabDrag);
        const item = pages.splice(from, 1)[0];
        let to = pages.findIndex((x) => x.id === p.id);
        pages.splice(after ? to + 1 : to, 0, item);
        tabDrag = null; pagesDirty = true;
        markDirty(currentPage);
        renderTabs();
        showToast('Page order changed — press Save to publish');
      });
    }
    b.addEventListener('click', () => switchPage(p.id));
    if (!isError) b.addEventListener('dblclick', () => renamePage(p.id));
    box.appendChild(b);
  });
}

async function switchPage(id) {
  if (id === PRODUCT_PAGE.id) {
    const k = shopPageProductKey() || (shopProducts[0] && shopProducts[0].key);
    if (k) id = PRODUCT_PAGE.id + '-' + shopSlug(k);
  }
  if (id === currentPage || loadingPage) return;
  if (dirty.has(currentPage) || newPages.has(currentPage)) drafts[currentPage] = snapshot();
  await loadPage(id);
}

function addPage() {
  const name = prompt('Name of the new page (for example: Video, About, Portfolio):');
  if (!name || !name.trim()) return;
  let id = slugify(name) || 'page';
  const base = id;
  let n = 2;
  while (pages.some((p) => p.id === id) || SPECIAL_PAGES.some((s) => s.id === id)) id = `${base}-${n++}`;
  pages.push({ id, title: name.trim() });
  newPages.add(id);
  pagesDirty = true;
  switchPage(id);
}

function renamePage(id) {
  const name = prompt('Rename page (this is the name shown in the site menu):', pageTitle(id));
  if (!name || !name.trim()) return;
  pages.find((p) => p.id === id).title = name.trim();
  pagesDirty = true;
  renderTabs();
  showToast('Renamed — press Save to publish');
}

async function deletePage(id) {
  if (id === 'home') return;
  if (!confirm(`Delete the "${pageTitle(id)}" page? This removes it from the site.`)) return;
  try {
    if (!newPages.has(id)) {
      const res = await apiFetch('/api/delete-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: id }),
      });
      if (!res.ok) { showToast('Could not delete the page'); return; }
    }
    pages = pages.filter((p) => p.id !== id);
    delete drafts[id]; delete pageBg[id];
    dirty.delete(id); newPages.delete(id);
    // Publish the updated page list right away so the site menu matches
    await apiFetch('/api/save-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages }),
    });
    pagesDirty = false;
    if (currentPage === id) { currentPage = 'home'; await loadPage('home'); } else { renderTabs(); }
    showToast('Page deleted');
  } catch (err) {
    console.error(err);
    showToast('Could not delete the page');
  }
}

async function loadPagesList() {
  try {
    const j = await fetchContent('pages.json');
    if (j && Array.isArray(j.pages) && j.pages.length) pages = j.pages;
  } catch (_) { /* keep defaults */ }
  if (!pages.some((p) => p.id === 'home')) pages.unshift({ id: 'home', title: 'Home' });
}

// ─── Save everything that changed (all edited pages + page list + colors/settings) ───
async function saveAll() {
  if (saving) return;
  saving = true;
  const btn = byId('btn-save');
  const label = btn.innerHTML;
  btn.innerHTML = 'Saving…';
  try {
    flushEditing();
    const ids = new Set([...dirty, ...newPages, currentPage]);
    const snaps = {};
    ids.forEach((id) => { snaps[id] = id === currentPage ? snapshot() : drafts[id]; });

    let first = true;
    for (const id of ids) {
      if (!snaps[id]) continue;
      const body = { page: id, content: snaps[id] };
      if (first) {
        body.pages = pages;                                   // page list / names / order
        if (settingsLoaded) body.settings = collectSettings(); // colors + settings travel together
        first = false;
      }
      const res = await apiFetch('/api/save-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
    }
    dirty.clear(); newPages.clear(); pagesDirty = false;
    Object.keys(drafts).forEach((k) => delete drafts[k]);
    renderTabs();
    showToast(IS_LIVE ? 'Published! The live site updates within seconds' : 'Saved!');
  } catch (err) {
    console.error('Save error', err);
    showToast('Save failed');
  } finally {
    btn.innerHTML = label;
    saving = false;
  }
}
function savePage() { return saveAll(); }

// ─── Templates ───
function defaultPageHtml(title) {
  return `
<section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;color:var(--c-text,#ffffff);text-align:center;padding:80px 20px 40px;">
  <h1 style="font-family:'Playfair Display',serif;font-size:3.5rem;margin:0 0 16px 0;color:var(--c-text,#ffffff);">${escapeHtml(title)}</h1>
  <p style="font-family:'Inter',sans-serif;font-size:1.1rem;max-width:520px;line-height:1.7;color:#999;margin:0;">Add text, images and videos to this page.</p>
</section>`;
}

// Default template: set the CSS FIRST, then the components. Calling setStyle()
// after setComponents() would wipe the rules GrapesJS derives from inline styles.
function applyDefaultTemplate(page) {
  if (page === LOADING_PAGE.id) {
    // A ring of 12 red dots that spin and fade (CSS only). Edit/delete/add anything around it.
    editor.setStyle('@keyframes ldfade{0%{opacity:1}100%{opacity:.12}}');
    editor.setComponents(`
<section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:40px 20px;">
  <div style="position:relative;width:64px;height:64px;"><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(0deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-1.2s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(30deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-1.1s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(60deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-1.0s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(90deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.9s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(120deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.8s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(150deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.7s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(180deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.6s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(210deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.5s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(240deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.4s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(270deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.3s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(300deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.2s;"></span><span style="position:absolute;left:50%;top:50%;width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:50%;background:var(--c-highlight,#e53935);opacity:.12;transform:rotate(330deg) translateY(-28px);animation:ldfade 1.2s linear infinite;animation-delay:-0.1s;"></span></div>
</section>`);
    return;
  }
  if (page === LOGIN_PAGE.id) {
    editor.setStyle('');
    editor.setComponents(`
<section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px 20px;box-sizing:border-box;">
  <div style="font-family:'Playfair Display',serif;font-size:28px;letter-spacing:.2em;color:#e53935;margin-bottom:8px;">INTEERNEETS</div>
  <input type="password" data-login-pw="1" placeholder="Password" style="width:280px;max-width:100%;background:#111;border:1px solid #e53935;color:#e53935;padding:12px 14px;font-size:15px;border-radius:6px;text-align:center;letter-spacing:.1em;">
  <button type="button" data-login-btn="1" style="width:280px;max-width:100%;background:#e53935;color:#000;border:0;padding:12px;font-weight:700;letter-spacing:.2em;border-radius:6px;cursor:pointer;">ENTER</button>
  <div data-login-err="1" style="color:#e53935;font-size:12px;min-height:16px;"></div>
</section>`);
    return;
  }
  if (isProductPageId(page)) {
    editor.setStyle('');
    const slug = page.slice(PRODUCT_PAGE.id.length + 1);
    const prod = shopProducts.find((x) => shopSlug(x.key) === slug);
    const ttl = escapeHtml((prod && prod.title) || 'Product name');
    const IB = "font-family:'Inter 18pt Bold',sans-serif;color:#ffffff;";
    editor.setComponents(`
<section style="min-height:100vh;padding:90px 5vw 60px;color:#ffffff;box-sizing:border-box;">
  <div style="max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;gap:40px;align-items:flex-start;">
    <div data-shopify-product-page="gallery" style="flex:1 1 380px;min-width:260px;min-height:320px;"></div>
    <div style="flex:1 1 380px;min-width:260px;">
      <h1 data-product-title="1" style="margin:0 0 8px;font-size:30px;line-height:1.2;${IB}">${ttl}</h1>
      <div data-shopify-product-page="buy" style="min-height:120px;"></div>
      <div data-product-desc="1" style="margin-top:22px;min-height:90px;font-size:15px;line-height:1.65;${IB}">Click here and type the description of this item…</div>
    </div>
  </div>
</section>`);
    return;
  }
  if (page === ERROR_PAGE.id) {
    editor.setStyle('');
    editor.setComponents(`
<section style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;color:var(--c-text,#ffffff);text-align:center;padding:40px 20px;">
  <h1 style="font-family:'Playfair Display',serif;font-size:8rem;line-height:1;margin:0;color:var(--c-highlight,#e53935);">404</h1>
  <p style="font-family:'Inter',sans-serif;font-size:1.2rem;margin:16px 0 32px 0;color:var(--c-text,#ffffff);opacity:.75;">This page does not exist.</p>
  <a href="/" style="background:var(--btn-fill,transparent);color:var(--btn-text,#000000);text-decoration:none;padding:14px 36px;font-family:'Inter',sans-serif;font-size:.85rem;font-weight:600;letter-spacing:.15em;">BACK HOME</a>
</section>`);
    return;
  }
  const html = page === 'shop' ? DEFAULT_SHOP_HTML : page === 'home' ? DEFAULT_HOME_HTML : defaultPageHtml(pageTitle(page));
  const css = page === 'shop' ? DEFAULT_SHOP_CSS : DEFAULT_HOME_CSS;
  editor.setStyle(css);
  editor.setComponents(html);
}

async function loadPage(id) {
  loadingPage = true;
  currentPage = id;
  renderTabs();

  let data = drafts[id] || null;
  const fromDraft = !!data;
  if (!data) {
    try { data = await fetchContent(`page-${id}.json`); } catch (_) { data = null; }
  }
  let fromTemplate = false;
  if (data && isProductPageId(id)) {
    const s = JSON.stringify(data.projectData || {});
    if (s.includes('data-shopify-product-page') && !s.includes('data-product-desc')) data = null;   // old single-block layout -> new editable layout
  }

  if (data && data.projectData) {
    editor.loadProjectData(data.projectData);
    showToast(fromTemplate ? `${pageTitle(id)} starts from the template: change anything, then Save` : `Loaded ${pageTitle(id)}`);
  } else {
    applyDefaultTemplate(id);
    showToast(`New ${pageTitle(id)} page — design it, then Save`);
  }
  stripThemeBg();
  normalizeEditorBtn();
  pageRef[id] = (data && data.refW) ? { w: data.refW, h: data.refH || 808 } : null;
  pageBg[id] = (data && data.bg) || (isProductPageId(id) ? Object.assign({}, DEFAULT_BG, { color: '#f80000' }) : (id === LOGIN_PAGE.id ? Object.assign({}, DEFAULT_BG, { color: '#000000' }) : null));
  applyPageBg();
  applyColorsToCanvas();
  editor.UndoManager.clear();

  setTimeout(() => {
    loadingPage = false;
    if (!fromDraft && !newPages.has(id)) dirty.delete(id);
    if (newPages.has(id)) dirty.add(id);
    renderTabs();
    syncPageBgPanel();
  }, 600);
}

// ═══════════════════════════════════════════════════════════════
// PAGE BACKGROUND (color, picture or pattern for the current page)
// ═══════════════════════════════════════════════════════════════

const DEFAULT_BG = { color: '', image: '', mode: 'cover', tile_size: 256, position: 'center center', overlay: 0 };
const curBg = () => Object.assign({}, DEFAULT_BG, pageBg[currentPage] || {});

function setBg(patch) {
  pageBg[currentPage] = Object.assign(curBg(), patch);
  applyPageBg();
  syncPageBgPanel();
  markDirty(currentPage);
}

// Shown on the editor canvas via the <html> element (the live site uses cross-fading layers)
function applyPageBg() {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  let tag = doc.getElementById('page-bg');
  if (!tag) { tag = doc.createElement('style'); tag.id = 'page-bg'; doc.head.appendChild(tag); }
  const b = curBg();
  let css = `html{background-color:${b.color || 'var(--c-bg,#0a0a0a)'};`;
  if (b.image) {
    const size = b.mode === 'tile' ? `${b.tile_size || 256}px` : b.mode === 'stretch' ? '100% 100%' : b.mode;
    const rep = b.mode === 'tile' ? 'repeat' : 'no-repeat';
    const a = Math.max(0, Math.min(0.9, (Number(b.overlay) || 0) / 100));
    if (a > 0) {
      css += `background-image:linear-gradient(rgba(0,0,0,${a}),rgba(0,0,0,${a})),url("${b.image}");` +
             `background-size:cover,${size};background-repeat:no-repeat,${rep};background-position:center,${b.position};`;
    } else {
      css += `background-image:url("${b.image}");background-size:${size};background-repeat:${rep};background-position:${b.position};`;
    }
    css += 'background-attachment:fixed;';
  }
  // The editor canvas paints <body> white by default; keep it see-through so the Page BG shows
  tag.textContent = css + '}body{background:transparent !important;}';
}
editor.on('canvas:frame:load', applyPageBg);
// Safety net: if anything ever removes the background style from the canvas, put it back
let pageBgWatch = null;
editor.on('canvas:frame:load', () => {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  if (pageBgWatch) pageBgWatch.disconnect();
  pageBgWatch = new MutationObserver(() => { if (!doc.getElementById('page-bg')) applyPageBg(); });
  pageBgWatch.observe(doc.head, { childList: true });
});

// A page's background is controlled only by the Page BG button. Remove any background that
// older designs painted on the page itself (var(--c-bg) full-page sections, html/body rules).
function stripThemeBg() {
  const THEME = /^var\(--c-bg/;
  const clean = (obj) => {
    if (!obj) return null;
    const patch = {};
    ['background', 'background-color', 'background-image'].forEach((k) => {
      if (obj[k] !== undefined && THEME.test(String(obj[k]).trim())) patch[k] = '';
    });
    return Object.keys(patch).length ? patch : null;
  };
  try {
    editor.Css.getRules().forEach((rule) => {
      const sel = rule.selectorsToString ? rule.selectorsToString() : '';
      const st = rule.getStyle();
      let patch = clean(st);
      if (/^(html|body)$/i.test(String(sel).trim())) {
        patch = Object.assign(patch || {}, ...['background', 'background-color', 'background-image']
          .filter((k) => st[k] !== undefined).map((k) => ({ [k]: '' })));
      }
      if (patch) { const next = Object.assign({}, st); Object.keys(patch).forEach((k) => delete next[k]); rule.setStyle(next); }
    });
    editor.getWrapper().find('*').forEach((c) => {
      const patch = clean(c.getStyle());
      if (patch) c.removeStyle(Object.keys(patch).join(' '));
    });
    const w = editor.getWrapper();
    const ws = w.getStyle();
    ['background', 'background-color', 'background-image'].forEach((k) => { if (ws[k] !== undefined) w.removeStyle(k); });
  } catch (e) { console.warn('stripThemeBg', e); }
}

function syncPageBgPanel() {
  const b = curBg();
  byId('pagebg-pagename').textContent = '— ' + pageTitle(currentPage);
  byId('pbg-color').value = b.color || (siteColors && siteColors.bg) || '#0a0a0a';
  byId('pbg-color-hex').value = b.color || '';
  byId('pbg-color-hex').placeholder = 'site color';
  byId('pbg-mode').value = b.mode;
  byId('pbg-tile').value = b.tile_size;
  byId('pbg-tile-row').style.display = b.mode === 'tile' ? 'flex' : 'none';
  byId('pbg-position').value = b.position;
  byId('pbg-overlay').value = b.overlay;
  byId('pbg-overlay-val').textContent = `${b.overlay}%`;
  byId('pbg-thumb').style.backgroundImage = b.image
    ? `url("${b.image}")`
    : '';
}

byId('btn-pagebg').addEventListener('click', () => {
  syncPageBgPanel();
  byId('colors-panel').classList.add('hidden');
  byId('pagebg-panel').classList.toggle('hidden');
});
byId('pagebg-close').addEventListener('click', () => byId('pagebg-panel').classList.add('hidden'));
byId('pbg-color').addEventListener('input', (e) => setBg({ color: e.target.value }));
byId('pbg-color-hex').addEventListener('input', (e) => {
  let v = e.target.value.trim();
  if (v === '') return setBg({ color: '' });
  if (!v.startsWith('#')) v = '#' + v;
  if (/^#[0-9a-fA-F]{6}$/.test(v)) setBg({ color: v });
});
byId('pbg-mode').addEventListener('change', (e) => setBg({ mode: e.target.value }));
byId('pbg-tile').addEventListener('input', (e) => setBg({ tile_size: Math.max(16, Number(e.target.value) || 256) }));
byId('pbg-position').addEventListener('change', (e) => setBg({ position: e.target.value }));
byId('pbg-overlay').addEventListener('input', (e) => setBg({ overlay: Number(e.target.value) }));
byId('pbg-remove').addEventListener('click', () => setBg({ image: '' }));
byId('pbg-reset').addEventListener('click', () => { pageBg[currentPage] = null; applyPageBg(); syncPageBgPanel(); markDirty(currentPage); });
byId('pbg-choose').addEventListener('click', () => {
  editor.AssetManager.open({
    select(asset) {
      const src = asset.get ? asset.get('src') : asset;
      setBg({ image: src });
      editor.AssetManager.close();
    },
  });
});
byId('pbg-save').addEventListener('click', async () => {
  await saveAll();
  byId('pagebg-panel').classList.add('hidden');
});

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

var shopStyle = {}, shopCats = [], shopImgs = {}, shopOptsData = {}, shopBadges = {}, shopHidden = {}, shopSiteFonts = [], shopDescs = {};   // Shop panel data (saved inside settings.json)

async function loadSettings() {
  try {
    let s = {};
    try { s = await fetchContent('settings.json'); } catch (e) { if (e.message !== 'nf') throw e; }
    const set = (id, v) => { if (v) byId(id).value = v; };
    set('set-email', s.contact_email);
    set('set-loading-min', s.loading_min_seconds);
    set('set-shopify-domain', s.shopify_domain);
    set('set-shopify-token', s.shopify_storefront_token);
    set('set-product-ids', Array.isArray(s.shopify_product_ids) ? s.shopify_product_ids.join('\n') : s.shopify_product_ids);
    set('set-instagram', s.social_instagram);
    set('set-tiktok', s.social_tiktok);
    set('set-twitter', s.social_twitter);
    if (s.site_colors) setSiteColors(s.site_colors);
    else if (s.site_bg_color) setSiteColors({ bg: s.site_bg_color });
    byId('set-bg-shading').checked = !!s.site_bg_shading;
    byId('set-show-nav').checked = s.show_nav !== false;
    shopStyle = Object.assign({}, s.shopify_style || {});
    shopCats = Array.isArray(s.shop_categories) ? s.shop_categories : [];
    shopImgs = Object.assign({}, s.product_custom_images || {});
    shopOptsData = Object.assign({}, s.shop_opts || {});
    shopBadges = Object.assign({}, s.product_badges || {});
    shopHidden = Object.assign({}, s.product_hidden || {});
    shopSiteFonts = Array.isArray(s.site_fonts) ? s.site_fonts : [];
    shopDescs = Object.assign({}, s.product_descriptions || {});
    settingsLoaded = true; // only now is it safe to write settings back
    if (typeof shopAfterSettings === 'function') shopAfterSettings();
  } catch (_) {
    // Could not read settings — never overwrite them with blanks
  }
}

function collectSettings() {
  const val = (id) => byId(id).value.trim();
  return {
    contact_email:            val('set-email'),
    loading_min_seconds:      Number(val('set-loading-min')) || 0,
    shopify_domain:           val('set-shopify-domain'),
    shopify_storefront_token: val('set-shopify-token'),
    shopify_product_ids:      val('set-product-ids').split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
    social_instagram:         val('set-instagram'),
    social_tiktok:            val('set-tiktok'),
    social_twitter:           val('set-twitter'),
    // Global swatches: flat exact colors; shading only when explicitly enabled
    site_colors:              siteColors,
    site_bg_color:            siteColors.bg,
    site_bg_shading:          byId('set-bg-shading').checked,
    show_nav:                 byId('set-show-nav').checked,
    shopify_style:            shopStyle,
    shop_categories:          shopCats,
    product_custom_images:    shopImgs,
    shop_opts:                shopOptsData,
    product_badges:           shopBadges,
    product_hidden:           shopHidden,
    site_fonts:               shopFontsAll(),
    product_descriptions:     shopDescs,
  };
}

async function saveSettings() {
  if (!settingsLoaded) { showToast('Settings are still loading — try again in a moment'); return; }
  try {
    const res = await apiFetch('/api/save-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectSettings()),
    });
    if (res.ok) {
      showToast('Settings saved!');
      if (typeof shopAfterSettings === 'function') shopAfterSettings();
      byId('settings-overlay').classList.add('hidden');
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
// every font you uploaded (saved with the settings so the live shop can load it too)
function shopFontsAll() {
  const seen = {};
  return [...customFonts, ...shopSiteFonts].filter((f) => f && f.url && !seen[f.url] && (seen[f.url] = 1));
}
function shopFontsChanged() {
  if (typeof shopRenderSoon !== 'function') return;
  shopRenderSoon(true);
  const sp = document.getElementById('shop-panel');
  if (sp && !sp.classList.contains('hidden') && typeof shopDrawBody === 'function') shopDrawBody();
}
function registerFont(url) {
  const name = fontNameFromUrl(url);
  if (customFonts.some((f) => f.url === url)) return;
  customFonts.push({ name, url });
  setTimeout(shopFontsChanged, 50);
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
      let data = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      data = await shrinkIfBig(file, data);
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
      } else if (IS_LIVE) {
        // On the live site the picture only exists after Cloudflare redeploys (about a minute).
        // Wait until it is really available so the picker never shows a broken thumbnail.
        const ok = await waitForUrl(json.url, 30000);
        if (!ok) { showToast('Uploaded \u2014 reopen the picture picker in a moment'); continue; }
        if (!editor.AssetManager.getAll().some((a) => a.get('src') === json.url)) editor.AssetManager.add(json.url);
        showToast('Image ready \u2014 pick it in the picture picker');
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

// Resolves true once a URL can be fetched (used to wait for a fresh upload to be published)
async function waitForUrl(url, maxMs) {
  const end = Date.now() + maxMs;
  while (Date.now() < end) {
    try {
      const r = await fetch(`${url}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
      if (r.ok && /^image\//i.test(r.headers.get('content-type') || '')) return true;
    } catch (_) { /* keep waiting */ }
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

async function loadAssets() {
  try {
    const res = await fetch('/api/assets');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.images)) {
      let imgs = data.images.filter((u) => !u.endsWith('.gitkeep'));
      if (IS_LIVE) { // hide pictures that are uploaded but not published yet (they would be broken thumbnails)
        const ok = await Promise.all(imgs.map((u) => fetch(`${u}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' }).then((r) => r.ok).catch(() => false)));
        imgs = imgs.filter((_, i) => ok[i]);
      }
      editor.AssetManager.add(imgs);
    }
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
  showToast(freeDrag ? 'Free Drag ON — drag anywhere. Hold Ctrl to snap to guides & grid' : 'Free Drag OFF — elements snap into layout');
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

// Page tabs are built dynamically (renderTabs); "+ Page" adds a new page
document.getElementById('btn-add-page').addEventListener('click', addPage);

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
  if (confirm(`Reset the ${pageTitle(currentPage)} page to its default template? All unsaved changes will be lost.`)) {
    applyDefaultTemplate(currentPage);
    markDirty(currentPage);
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
editor.on('load', async () => {
  // Allow styling the page body itself (default only allows background)
  editor.getWrapper().set('stylable', true);
  await loadPagesList();
  loadPage('home');
  loadSettings();
  loadAssets();
  setupTooltips();
  setupFontPreview();
  setupTextToolbars();
  setupSnapping();
});


// ═══════════════════════════════════════════════════════════════
// GLOBAL COLOR SWATCHES (theme variables)
// Elements use var(--c-bg), var(--c-text), var(--c-highlight),
// var(--c-button), var(--btn-text,#000000). Change once, updates everywhere.
// ═══════════════════════════════════════════════════════════════

const DEFAULT_COLORS = {
  bg: '#0a0a0a', text: '#ffffff', highlight: '#e53935', button: '#e53935', button_text: '#ffffff',
  // Buttons: outline only, black, soft shadow on hover (all customizable in the Colors panel)
  btn_fill: 'transparent', btn_text: '#000000', btn_border: '#000000', btn_border_width: '2px', btn_radius: '0px',
  btn_hover_fill: '', btn_shadow: 'drop-shadow(0 6px 16px rgba(0,0,0,0.28))',
};
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
  return `:root{--c-bg:${c.bg};--c-text:${c.text};--c-highlight:${c.highlight};--c-button:${c.button};--c-button-text:${c.button_text};` +
    `--btn-fill:${c.btn_fill || 'transparent'};--btn-text:${c.btn_text || '#000000'};--btn-border:${c.btn_border || '#000000'};` +
    `--btn-border-width:${c.btn_border_width || '0px'};--btn-radius:${c.btn_radius || '0px'};` +
    `--btn-hover-fill:${c.btn_hover_fill || 'var(--btn-fill)'};--btn-shadow:${toFilterShadow(c.btn_shadow)};}`;
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
    const v = siteColors[inp.dataset.key];
    inp.value = /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000';
    const hex = document.querySelector(`.hex[data-for="${inp.id}"]`);
    if (hex) hex.value = v || '';
  });
  if (byId('btn-nofill')) {
    byId('btn-nofill').checked = siteColors.btn_fill === 'transparent';
    byId('btn-samehover').checked = !siteColors.btn_hover_fill;
    byId('btn-width').value = parseFloat(siteColors.btn_border_width) || 0;
    byId('btn-radius').value = parseFloat(siteColors.btn_radius) || 0;
    if (window.__btnShadowEd) window.__btnShadowEd.set(siteColors.btn_shadow || 'none', true);
  }
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


// ═══════════════════════════════════════════════════════════════
// TOOLTIPS — every icon in the editor gets a hover name
// ═══════════════════════════════════════════════════════════════

const ICON_TIPS = {
  'fa-paint-brush': 'Style Manager — fonts, colors, size and spacing of the selected element',
  'fa-cog': 'Settings — link address, ID and other attributes',
  'fa-bars': 'Layers — see and reorder what is on top of what',
  'fa-th-large': 'Blocks — drag new elements onto the page',
  'fa-square-o': 'Show / hide the dotted outlines around elements',
  'fa-eye': 'Preview — see the page without editing outlines',
  'fa-arrows-alt': 'Fullscreen',
  'fa-code': 'View the page code',
  'fa-arrow-up': 'Select the parent (container) of this element',
  'fa-arrows': 'Move this element (drag)',
  'fa-clone': 'Duplicate this element',
  'fa-trash-o': 'Delete this element',
  'fa-undo': 'Undo',
  'fa-repeat': 'Redo',
};

function setupTooltips() {
  const apply = () => {
    document.querySelectorAll('[class*="fa-"]').forEach((el) => {
      if (el.title) return;
      for (const k in ICON_TIPS) {
        if (el.classList.contains(k)) { el.title = ICON_TIPS[k]; break; }
      }
    });
    document.querySelectorAll('.gjs-pn-devices-c select, .gjs-devices-c select, .gjs-pn-devices-c').forEach((el) => {
      if (!el.title) el.title = 'Preview size — Desktop, Tablet or Mobile';
    });
    document.querySelectorAll('.gjs-rte-action').forEach((el) => {
      if (!el.title && el.dataset.title) el.title = el.dataset.title;
    });
  };
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; apply(); });
  }).observe(document.body, { childList: true, subtree: true });
  apply();
}

// ═══════════════════════════════════════════════════════════════
// FONT PREVIEW — every font in the Font dropdown is shown in its own style
// ═══════════════════════════════════════════════════════════════

function setupFontPreview() {
  const refresh = () => {
    document.querySelectorAll('.gjs-sm-property__font-family select').forEach((sel) => {
      if (sel.dataset.fp !== String(sel.options.length)) {
        sel.dataset.fp = String(sel.options.length);
        Array.from(sel.options).forEach((o) => { o.style.fontFamily = o.value; o.style.fontSize = '16px'; });
        sel.addEventListener('change', refresh);
      }
      sel.style.fontFamily = sel.value;
      sel.style.fontSize = '15px';
      // Live sample line under the dropdown
      let sample = sel.parentElement && sel.parentElement.querySelector('.font-sample');
      if (!sample && sel.parentElement) {
        sample = document.createElement('div');
        sample.className = 'font-sample';
        sample.textContent = 'Aa — The quick brown fox 123';
        sample.style.cssText = 'margin-top:6px;padding:6px 8px;background:#111;border:1px solid #333;border-radius:4px;font-size:18px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        sel.parentElement.appendChild(sample);
      }
      if (sample) sample.style.fontFamily = sel.value || 'inherit';
    });
  };
  let pending = false;
  const schedule = () => { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; refresh(); }); };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  editor.on('component:selected', () => setTimeout(refresh, 50));
  editor.on('style:property:update', schedule);
  refresh();
}

// ═══════════════════════════════════════════════════════════════
// QUICK TEXT CONTROLS
//  • Click any text → font, bold, italic, underline, size buttons in its toolbar
//  • Double-click text to type → font / size / color in the text toolbar
// ═══════════════════════════════════════════════════════════════

function fontOptionsHtml(selected) {
  return FONT_OPTIONS.map((f) =>
    `<option value="${f.value.replace(/"/g, '&quot;')}" style="font-family:${f.value.replace(/"/g, '&quot;')}"${f.value === selected ? ' selected' : ''}>${f.name}</option>`
  ).join('');
}
function firstFamily(v) {
  return String(v || '').split(',')[0].replace(/['"]/g, '').trim().toLowerCase();
}
function matchFontOption(cssValue) {
  const fam = firstFamily(cssValue);
  const hit = FONT_OPTIONS.find((f) => firstFamily(f.value) === fam);
  return hit ? hit.value : '';
}
function computedOf(comp, prop) {
  const el = comp.getEl && comp.getEl();
  return el ? el.ownerDocument.defaultView.getComputedStyle(el)[prop] : '';
}

function refreshToolbarFont() {
  const comp = editor.getSelected();
  document.querySelectorAll('select.tb-font').forEach((sel) => {
    sel.innerHTML = '<option value="">Font…</option>' + fontOptionsHtml('');
    if (comp) sel.value = matchFontOption(computedOf(comp, 'fontFamily'));
    sel.style.fontFamily = sel.value || 'inherit';
  });
}

function isTextual(c) {
  return c && (c.is('text') || c.is('link'));
}

function ensureTextToolbar(c) {
  if (!isTextual(c)) return;
  const tb = c.get('toolbar') || [];
  if (tb.some((t) => t.id === 'q-font')) return;
  const toggle = (prop, on, off, test) => () => {
    const cur = computedOf(c, prop);
    c.addStyle({ [prop]: test(cur) ? off : on });
  };
  const size = (delta) => () => {
    const px = parseFloat(computedOf(c, 'fontSize')) || 16;
    c.addStyle({ 'font-size': `${Math.max(8, Math.round(px + delta))}px` });
  };
  c.set('toolbar', [
    { id: 'q-font', label: '<select class="tb-font" title="Font"></select>', command: () => {} },
    { id: 'q-b', label: '<span class="tb-fmt">B</span>', attributes: { title: 'Bold' },
      command: toggle('font-weight', '700', '400', (v) => v === 'bold' || parseInt(v, 10) >= 600) },
    { id: 'q-i', label: '<span class="tb-fmt" style="font-style:italic">I</span>', attributes: { title: 'Italic' },
      command: toggle('font-style', 'italic', 'normal', (v) => v === 'italic') },
    { id: 'q-u', label: '<span class="tb-fmt" style="text-decoration:underline">U</span>', attributes: { title: 'Underline' },
      command: toggle('text-decoration', 'underline', 'none', (v) => String(v).includes('underline')) },
    { id: 'q-sm', label: '<span class="tb-fmt">A−</span>', attributes: { title: 'Smaller text' }, command: size(-2) },
    { id: 'q-lg', label: '<span class="tb-fmt">A+</span>', attributes: { title: 'Bigger text' }, command: size(2) },
    { id: 'q-col', label: '<input type="color" class="tb-color" value="#ffffff" title="Text color">', attributes: { title: 'Text color' }, command: () => {} },
    ...tb,
  ]);
}

function setupTextToolbars() {
  editor.on('component:add', ensureTextToolbar);
  editor.on('component:selected', (c) => { ensureTextToolbar(c); setTimeout(refreshToolbarFont, 30); });
  // Existing components (already on the page)
  editor.getWrapper().find('*').forEach(ensureTextToolbar);

  document.addEventListener('input', (e) => {
    if (!e.target.matches || !e.target.matches('input.tb-color')) return;
    const comp = editor.getSelected();
    if (comp) comp.addStyle({ color: e.target.value });
  });
  document.addEventListener('change', (e) => {
    if (!e.target.matches || !e.target.matches('select.tb-font')) return;
    const comp = editor.getSelected();
    if (comp && e.target.value) {
      comp.addStyle({ 'font-family': e.target.value });
      e.target.style.fontFamily = e.target.value;
    }
  });

  // Uploaded fonts appear in the text toolbar too
  editor.on('rte:enable', () => {
    document.querySelectorAll('select.rte-font').forEach((s) => {
      s.innerHTML = '<option value="">Font…</option>' + fontOptionsHtml('');
    });
  });

  // Rich-text toolbar (while typing in a text box): font, size, color for the selected words
  const rte = editor.RichTextEditor;
  const wrapSel = (rteInst, style) => {
    const s = String(rteInst.selection ? rteInst.selection() : '');
    if (s) rteInst.insertHTML(`<span style="${style}">${escapeHtml(s)}</span>`);
  };
  rte.add('rte-font', {
    name: 'rte-font',
    icon: `<select class="rte-font" title="Font for the selected words"><option value="">Font…</option>${fontOptionsHtml('')}</select>`,
    event: 'change',
    attributes: { title: 'Font for the selected words' },
    result: (r, action) => {
      const sel = action.btn && action.btn.querySelector('select');
      if (sel && sel.value) { wrapSel(r, `font-family:${sel.value}`); sel.value = ''; }
    },
  });
  rte.add('rte-size', {
    name: 'rte-size',
    icon: `<select class="rte-size" title="Size of the selected words"><option value="">Size…</option>${[12, 14, 16, 18, 24, 32, 48, 64, 96].map((n) => `<option value="${n}">${n}px</option>`).join('')}</select>`,
    event: 'change',
    attributes: { title: 'Size of the selected words' },
    result: (r, action) => {
      const sel = action.btn && action.btn.querySelector('select');
      if (sel && sel.value) { wrapSel(r, `font-size:${sel.value}px`); sel.value = ''; }
    },
  });
  rte.add('rte-color', {
    name: 'rte-color',
    icon: '<input type="color" class="rte-color" value="#ffffff" title="Color of the selected words" />',
    event: 'change',
    attributes: { title: 'Color of the selected words' },
    result: (r, action) => {
      const inp = action.btn && action.btn.querySelector('input');
      if (inp) wrapSel(r, `color:${inp.value}`);
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// SNAPPING — hold Ctrl while dragging in Free Drag mode (like Photoshop)
// Snaps edges/centers to the page, to other elements and to a 10px grid,
// and shows red guide lines.
// ═══════════════════════════════════════════════════════════════

function setupSnapping() {
  const THRESH = 8;
  const GRID = 10;
  let dragging = null;

  const guideLayer = () => {
    const doc = editor.Canvas.getDocument();
    if (!doc) return null;
    let g = doc.getElementById('snap-guides');
    if (!g) {
      g = doc.createElement('div');
      g.id = 'snap-guides';
      g.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;';
      doc.body.appendChild(g);
    }
    return g;
  };
  const clearGuides = () => { const g = guideLayer(); if (g) g.innerHTML = ''; };
  const drawGuide = (axis, pos) => {
    const g = guideLayer();
    if (!g) return;
    const d = g.ownerDocument.createElement('div');
    d.style.cssText = axis === 'x'
      ? `position:absolute;top:0;bottom:0;left:${pos}px;width:1px;background:#ff2d55;box-shadow:0 0 4px #ff2d55;`
      : `position:absolute;left:0;right:0;top:${pos}px;height:1px;background:#ff2d55;box-shadow:0 0 4px #ff2d55;`;
    g.appendChild(d);
  };

  // Best snap for one axis: anchors of the dragged element vs. candidate lines
  const bestSnap = (anchors, lines, gridOrigin, size) => {
    let best = null;
    anchors.forEach((a) => lines.forEach((l) => {
      const dist = l - a;
      if (Math.abs(dist) <= THRESH && (!best || Math.abs(dist) < Math.abs(best.delta))) best = { delta: dist, line: l };
    }));
    if (!best) { // fall back to the grid (left/top edge)
      const rel = anchors[0] - gridOrigin;
      const snapped = Math.round(rel / GRID) * GRID + gridOrigin;
      if (Math.abs(snapped - anchors[0]) <= GRID / 2) best = { delta: snapped - anchors[0], line: snapped };
    }
    return best;
  };

  const onMove = (e) => {
    if (!dragging) return;
    if (!(e.ctrlKey || e.metaKey)) { clearGuides(); return; }
    const el = dragging.getEl();
    if (!el) return;
    const doc = el.ownerDocument;
    const r = el.getBoundingClientRect();

    // Container the element is positioned in
    const host = el.offsetParent && el.offsetParent !== doc.body ? el.offsetParent : null;
    const pr = host
      ? host.getBoundingClientRect()
      : { left: 0, right: doc.documentElement.clientWidth, top: -doc.defaultView.scrollY, bottom: doc.documentElement.scrollHeight - doc.defaultView.scrollY };
    const pw = pr.right - pr.left, ph = pr.bottom - pr.top;

    const xs = [pr.left, pr.left + pw / 2, pr.right];
    const ys = [pr.top, pr.top + ph / 2, pr.bottom];
    Array.from(el.parentElement ? el.parentElement.children : []).forEach((sib) => {
      if (sib === el || sib.id === 'snap-guides') return;
      const s = sib.getBoundingClientRect();
      if (!s.width && !s.height) return;
      xs.push(s.left, s.left + s.width / 2, s.right);
      ys.push(s.top, s.top + s.height / 2, s.bottom);
    });

    const sx = bestSnap([r.left, r.left + r.width / 2, r.right], xs, pr.left, pw);
    const sy = bestSnap([r.top, r.top + r.height / 2, r.bottom], ys, pr.top, ph);

    clearGuides();
    if (sx || sy) {
      const st = dragging.getStyle();
      const left = parseFloat(st.left) || 0;
      const top = parseFloat(st.top) || 0;
      const patch = {};
      if (sx && sx.delta) patch.left = `${Math.round(left + sx.delta)}px`;
      if (sy && sy.delta) patch.top = `${Math.round(top + sy.delta)}px`;
      if (Object.keys(patch).length) dragging.addStyle(patch);
      if (sx) drawGuide('x', sx.line);
      if (sy) drawGuide('y', sy.line);
    }
  };

  editor.on('dmode:start', (opts) => {
    dragging = opts && opts.target;
    const doc = editor.Canvas.getDocument();
    if (doc) doc.addEventListener('mousemove', onMove);
  });
  editor.on('dmode:end', () => {
    const doc = editor.Canvas.getDocument();
    if (doc) doc.removeEventListener('mousemove', onMove);
    dragging = null;
    clearGuides();
  });
}


// ???????????????????????????????????????????????????????????????
// PHONE FIT ? in Mobile/Tablet preview, text that is too wide for the screen
// (e.g. a big heading) is shrunk just enough to fit. Preview only, never saved.
// ???????????????????????????????????????????????????????????????

// ?? Phone fit: text that is too wide for a narrow screen (e.g. a huge heading) is shrunk
// just enough to fit. Runtime only: nothing is saved, and desktop is left untouched.
function fitTextToWidth(root) {
  var win = root.ownerDocument.defaultView;
  var els = root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,span,li,button,div');
  Array.prototype.forEach.call(els, function (el) {
    if (el.hasAttribute('data-fit-size')) { el.style.fontSize = el.getAttribute('data-fit-size'); el.removeAttribute('data-fit-size'); }
  });
  if (win.innerWidth > 700) return;
  Array.prototype.forEach.call(els, function (el) {
    if (!el.textContent.trim() || el.children.length > 2) return;
        if (el.closest && el.closest('[contenteditable="true"]')) return;
    if (el.clientWidth <= 0) return;
    var avail = function () {
      var p = el.parentElement, w = win.innerWidth;
      if (p) { var cs = win.getComputedStyle(p); w = Math.min(w, p.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0)); }
      return w;
    };
    var tooWide = function () { return el.scrollWidth > avail() + 1 || el.getBoundingClientRect().width > avail() + 1; };
    if (!tooWide()) return;
    var fs = parseFloat(win.getComputedStyle(el).fontSize), n = 0;
    el.setAttribute('data-fit-size', el.style.fontSize || '');
    while (tooWide() && fs > 12 && n++ < 40) { fs *= 0.94; el.style.fontSize = fs + 'px'; }
  });
}

(function setupPhoneFit() {
  let t;
  const run = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const doc = editor.Canvas.getDocument();
      if (doc && doc.body) fitTextToWidth(doc.body);
    }, 120);
  };
  editor.on('canvas:frame:load', () => {
    const win = editor.Canvas.getWindow();
    if (win) win.addEventListener('resize', run);
    run();
  });
  editor.on('change:device', () => { run(); setTimeout(run, 500); setTimeout(run, 1200); });
  // The preview width changes when you switch Desktop / Tablet / Mobile: re-fit whenever it does
  let lastW = 0;
  setInterval(() => {
    const win = editor.Canvas.getWindow();
    if (win && win.innerWidth !== lastW) { lastW = win.innerWidth; run(); }
  }, 500);
  editor.on('component:update', run);
  editor.on('component:add', run);
  editor.on('load', run);
})();


// ???????????????????????????????????????????????????????????????
// BUTTONS ? outline only (no fill), black outline + text, soft shadow on hover.
// Everything is a variable (Colors panel -> Buttons) and each button can still be
// styled individually in the Style panel.
// ???????????????????????????????????????????????????????????????
function normBtn(css) {
  return String(css)
    .replace(/border(-color)?\s*:\s*([\d.]+px\s+solid\s+)?var\(--c-button(?:,[^)]*)?\)/gi, function (m, c) {
      return c ? 'border-color:var(--btn-border,#000000)' : 'border:var(--btn-border-width,2px) solid var(--btn-border,#000000)';
    })
    .replace(/background(?:-color)?\s*:\s*var\(--c-button(?:,[^)]*)?\)/gi, 'background:var(--btn-fill,transparent)')
    .replace(/var\(--c-button-text(?:,[^)]*)?\)/gi, 'var(--btn-text,#000000)');
}

// Move older designs (buttons that used --c-button) onto the new button variables
function normalizeEditorBtn() {
  try {
    editor.Css.getRules().forEach((rule) => {
      const st = rule.getStyle();
      let changed = false;
      const next = {};
      Object.keys(st).forEach((k) => {
        const out = normBtn(k + ':' + st[k]);
        if (out !== k + ':' + st[k]) {
          const m = out.match(/^([\w-]+)\s*:\s*([\s\S]*)$/);
          if (m) { next[m[1]] = m[2]; changed = true; return; }
        }
        next[k] = st[k];
      });
      if (JSON.stringify(st).includes('--btn-fill') && next['box-shadow'] && next['box-shadow'] !== 'none' && !next.filter) {
        next.filter = toFilterShadow(next['box-shadow']);
        next['box-shadow'] = 'none';
        changed = true;
      }
      if (changed) rule.setStyle(next);
    });
  } catch (e) { console.warn('normalizeEditorBtn', e); }
  refreshBtnCss();
}

// Hover look for every element that uses the button variables (shown in the editor canvas too)
function refreshBtnCss() {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  let tag = doc.getElementById('btn-extra');
  if (!tag) { tag = doc.createElement('style'); tag.id = 'btn-extra'; doc.head.appendChild(tag); }
  let css = '';
  editor.Css.getRules().forEach((rule) => {
    if (!JSON.stringify(rule.getStyle()).includes('--btn-fill')) return;
    const sel = rule.selectorsToString();
    if (!sel || /:hover/.test(sel)) return;
    css += ':where(' + sel + '){border-radius:var(--btn-radius,0);transition:filter .25s ease,background .25s ease,color .25s ease;}' +
           sel + ':hover{filter:var(--btn-shadow,none);background:var(--btn-hover-fill,var(--btn-fill,transparent));}';
  });
  tag.textContent = css;
}
let btnCssTimer;
const refreshBtnCssSoon = () => { clearTimeout(btnCssTimer); btnCssTimer = setTimeout(refreshBtnCss, 200); };
editor.on('canvas:frame:load', refreshBtnCssSoon);
editor.on('update', refreshBtnCssSoon);
editor.on('component:add', refreshBtnCssSoon);

// Colors panel: Buttons section
(function setupButtonPanel() {
  const set = (patch) => { Object.assign(siteColors, patch); applyColorsToCanvas(); };
  byId('btn-nofill').addEventListener('change', (e) => set({ btn_fill: e.target.checked ? 'transparent' : byId('sw-btn-fill').value }));
  byId('sw-btn-fill').addEventListener('input', () => { byId('btn-nofill').checked = false; });
  byId('btn-samehover').addEventListener('change', (e) => set({ btn_hover_fill: e.target.checked ? '' : byId('sw-btn-hover').value }));
  byId('sw-btn-hover').addEventListener('input', () => { byId('btn-samehover').checked = false; });
  byId('btn-width').addEventListener('input', (e) => set({ btn_border_width: (Number(e.target.value) || 0) + 'px' }));
  byId('btn-radius').addEventListener('input', (e) => set({ btn_radius: (Number(e.target.value) || 0) + 'px' }));
})();
﻿
// ═══════════════════════════════════════════════════════════════
// CENTER HORIZONTALLY · TEXT SHADOW POPUP · BUTTON EDITOR
// ═══════════════════════════════════════════════════════════════

// Clicking the font dropdown inside the element toolbar used to do nothing: GrapesJS cancels the
// mouse-down on toolbar items (so the dropdown never opened). Let the dropdown handle its own clicks.
['mousedown', 'pointerdown', 'touchstart', 'click'].forEach((t) => {
  document.addEventListener(t, (e) => {
    const el = e.target;
    if (el && el.closest && el.closest('select.tb-font, select.rte-font, select.rte-size, input.rte-color')) e.stopPropagation();
  }, true);
});
let lastPointer = { x: 400, y: 200 };
document.addEventListener('mousedown', (e) => { lastPointer = { x: e.clientX, y: e.clientY }; }, true);

// ── Center horizontally ──
function centerHorizontally(c) {
  c = c || editor.getSelected();
  if (!c || c === editor.getWrapper()) { showToast('Select something first, then click Center'); return; }
  const el = c.getEl();
  if (!el) return;
  const cs = el.ownerDocument.defaultView.getComputedStyle(el);
  if (cs.position === 'absolute' || cs.position === 'fixed') {
    // Percent-based so it stays centered on every screen size (desktop, tablet, phone).
    const patch = { left: '50%', right: 'auto', transform: 'translateX(-50%)', 'margin-left': '0', 'margin-right': '0' };
    if (c.is('text') || isButtonLike(c)) {
      // fit the box to its text and center the text, otherwise a wide fixed box looks off-center
      Object.assign(patch, { width: 'max-content', 'max-width': '100%', 'text-align': 'center' });
    }
    c.addStyle(patch);
  } else {
    const patch = { 'margin-left': 'auto', 'margin-right': 'auto', 'max-width': '100%' };
    if (cs.display === 'inline') patch.display = 'block';
    if (cs.width && !c.getStyle().width) patch.width = 'fit-content';
    if (c.is('text') || (c.get('tagName') || '').toLowerCase() === 'a') patch['text-align'] = 'center';
    c.addStyle(patch);
  }
  showToast('Centered');
}

function isButtonLike(c) {
  const t = c && (c.get('tagName') || '').toLowerCase();
  return t === 'a' || t === 'button';
}

// Add "Center" (and "Button" for links/buttons) to the little toolbar above a selected element
function ensureExtraTools(c) {
  if (!c || c === editor.getWrapper()) return;
  const tb = c.get('toolbar') || [];
  const add = [];
  if (!tb.some((t) => t.id === 'q-center')) {
    add.push({ id: 'q-center', label: '<span class="tb-fmt" style="font-size:15px">\u2194</span>',
      attributes: { title: 'Center horizontally on the page' }, command: () => centerHorizontally(c) });
  }
  if (isButtonLike(c) && !tb.some((t) => t.id === 'q-btn')) {
    add.push({ id: 'q-btn', label: '<span class="tb-fmt" style="font-size:11px">Button\u270E</span>',
      attributes: { title: 'Edit this button: text, font, colors, outline, shadow' }, command: () => openButtonPanel() });
  }
  if (add.length) c.set('toolbar', [...add, ...tb]);
}
editor.on('component:add', ensureExtraTools);
editor.on('component:selected', ensureExtraTools);
editor.getWrapper().find('*').forEach(ensureExtraTools);
byId('btn-center').addEventListener('click', () => centerHorizontally());

// ── Text shadow popup (Photoshop-style drop shadow for the selected text) ──
const hexToRgba = (hex, a) => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : hex;
};
const rgbToHex = (rgb) => {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb || '');
  return m ? '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('') : '#000000';
};
let shadowPopTarget = null;
function openShadowPop(c) {
  c = c || editor.getSelected();
  if (!c) { showToast('Select some text first'); return; }
  shadowPopTarget = c;
  const pop = byId('shadow-pop');
  // read the current shadow (first layer) if there is one
  const el = c.getEl();
  const cur = el ? el.ownerDocument.defaultView.getComputedStyle(el).textShadow : 'none';
  const m = /(rgba?\([^)]*\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(cur || '');
  const rgba = m ? m[1] : 'rgba(0,0,0,0.6)';
  const alpha = (/rgba\([^)]*,\s*([\d.]+)\)/.exec(rgba) || [])[1];
  byId('sh-x').value = m ? m[2] : 2;
  byId('sh-y').value = m ? m[3] : 2;
  byId('sh-blur').value = m ? m[4] : 4;
  byId('sh-opacity').value = Math.round((alpha === undefined ? 0.6 : Number(alpha)) * 100);
  byId('sh-color').value = rgbToHex(rgba);
  pop.style.left = Math.max(8, Math.min(window.innerWidth - 300, lastPointer.x - 20)) + 'px';
  pop.style.top = Math.max(60, Math.min(window.innerHeight - 260, lastPointer.y + 24)) + 'px';
  pop.classList.remove('hidden');
}
function applyShadowPop() {
  if (!shadowPopTarget) return;
  const v = `${byId('sh-x').value || 0}px ${byId('sh-y').value || 0}px ${byId('sh-blur').value || 0}px ${hexToRgba(byId('sh-color').value, (Number(byId('sh-opacity').value) || 0) / 100)}`;
  shadowPopTarget.addStyle({ 'text-shadow': v });
}
['sh-x', 'sh-y', 'sh-blur', 'sh-opacity', 'sh-color'].forEach((id) => byId(id).addEventListener('input', applyShadowPop));
byId('sh-none').addEventListener('click', () => { if (shadowPopTarget) shadowPopTarget.addStyle({ 'text-shadow': 'none' }); byId('shadow-pop').classList.add('hidden'); });
byId('sh-close').addEventListener('click', () => byId('shadow-pop').classList.add('hidden'));
byId('sh-presets').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  const [x, y, bl, op] = b.dataset.v.split(',').map(Number);
  byId('sh-x').value = x; byId('sh-y').value = y; byId('sh-blur').value = bl; byId('sh-opacity').value = op;
  applyShadowPop();
}));
editor.on('component:deselected', () => byId('shadow-pop').classList.add('hidden'));

// shadow item on the element toolbar of text, and in the rich-text bar while typing
(function addShadowTools() {
  const prev = ensureTextToolbar;
  ensureTextToolbar = function (c) {
    prev(c);
    if (!isTextual(c)) return;
    const tb = c.get('toolbar') || [];
    if (tb.some((t) => t.id === 'q-shadow')) return;
    const i = tb.findIndex((t) => t.id === 'q-lg');
    const item = { id: 'q-shadow', label: '<span class="tb-fmt" style="color:#fff;text-shadow:1px 2px 2px #e53935">S</span>',
      attributes: { title: 'Text shadow (drop shadow)' }, command: () => openShadowPop(c) };
    tb.splice(i >= 0 ? i + 1 : 1, 0, item);
    c.set('toolbar', [...tb]);
  };
  const rte = editor.RichTextEditor;
  rte.add('rte-shadow', {
    name: 'rte-shadow',
    icon: '<span class="tb-fmt" style="color:#fff;text-shadow:1px 2px 2px #e53935;font-size:14px">S</span>',
    attributes: { title: 'Text shadow (drop shadow) for this text' },
    result: () => openShadowPop(editor.getSelected()),
  });
})();

// ── Button editor panel ──

// Reusable shadow editor: on/off, X, Y, blur, spread, a real color picker and opacity. No typing of CSS.
function parseShadow(str) {
  const out = { on: false, x: 0, y: 6, blur: 16, spread: 0, color: '#000000', opacity: 30 };
  str = String(str || '').trim().replace(/^drop-shadow\((.*)\)$/i, '$1');
  if (!str || str === 'none') return out;
  const first = str.split(/,(?![^(]*\))/)[0]; // first layer only
  const col = /(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8})/.exec(first);
  if (col) {
    const c = col[1];
    if (c[0] === '#') { out.color = c.length === 4 ? '#' + [...c.slice(1)].map((x) => x + x).join('') : c.slice(0, 7); }
    else {
      const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/.exec(c);
      if (m) { out.color = '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join(''); out.opacity = Math.round((m[4] === undefined ? 1 : Number(m[4])) * 100); }
    }
  }
  const nums = (first.replace(col ? col[1] : '', '').match(/-?[\d.]+(?=px|\s|$)/g) || []).map(Number);
  if (nums.length >= 2) { out.on = true; out.x = nums[0]; out.y = nums[1]; out.blur = nums[2] || 0; out.spread = nums[3] || 0; }
  return out;
}
function buildShadow(v) {
  if (!v.on) return 'none';
  return `${v.x}px ${v.y}px ${v.blur}px${v.spread ? ' ' + v.spread + 'px' : ''} ${hexToRgba(v.color, (v.opacity || 0) / 100)}`;
}
function makeShadowEditor(host, { spread = true, onChange }) {
  const presets = [
    ['Soft', { x: 0, y: 2, blur: 6, spread: 0, opacity: 30 }],
    ['Medium', { x: 0, y: 6, blur: 16, spread: 0, opacity: 35 }],
    ['Strong', { x: 0, y: 12, blur: 30, spread: 0, opacity: 50 }],
    ['Glow', { x: 0, y: 0, blur: 18, spread: 0, opacity: 70, color: '#ffffff' }],
  ];
  const sliders = [['x', 'X (right)', -60, 60], ['y', 'Y (down)', -60, 60], ['blur', 'Blur', 0, 80]];
  if (spread) sliders.push(['spread', 'Spread', -30, 60]);
  sliders.push(['opacity', 'Opacity %', 0, 100]);
  host.classList.add('sh-ed');
  host.innerHTML =
    '<div class="sh-top"><label class="mini-check"><input type="checkbox" class="se-on" /> On</label>' +
    '<span class="sh-presets">' + presets.map((p, i) => '<button type="button" data-i="' + i + '">' + p[0] + '</button>').join('') + '</span></div>' +
    sliders.map((s) => '<div class="sh-row"><span>' + s[1] + '</span><input type="range" class="se-' + s[0] + '" min="' + s[2] + '" max="' + s[3] + '" /><b class="sv-' + s[0] + '"></b></div>').join('') +
    '<div class="sh-row"><span>Color</span><input type="color" class="se-color" /></div>';
  const q = (c) => host.querySelector(c);
  const state = parseShadow('none');
  const render = () => {
    q('.se-on').checked = state.on;
    sliders.forEach((s) => { q('.se-' + s[0]).value = state[s[0]]; q('.sv-' + s[0]).textContent = state[s[0]]; });
    q('.se-color').value = state.color;
    host.classList.toggle('off', !state.on);
  };
  const fire = () => { render(); if (onChange) onChange(buildShadow(state)); };
  q('.se-on').addEventListener('change', (e) => { state.on = e.target.checked; fire(); });
  sliders.forEach((s) => q('.se-' + s[0]).addEventListener('input', (e) => { state[s[0]] = Number(e.target.value); state.on = true; fire(); }));
  q('.se-color').addEventListener('input', (e) => { state.color = e.target.value; state.on = true; fire(); });
  host.querySelectorAll('.sh-presets button').forEach((b) => b.addEventListener('click', () => {
    Object.assign(state, { color: '#000000' }, presets[Number(b.dataset.i)][1], { on: true }); fire();
  }));
  render();
  return { set(str) { Object.assign(state, parseShadow(str)); render(); }, get: () => buildShadow(state) };
}
// Button shadows are drop-shadow filters: they follow the outline and text, so a see-through button stays see-through
const wrapDrop = (v) => (v === 'none' ? 'none' : `drop-shadow(${v})`);
const bpDropEd = makeShadowEditor(byId('bp-shadow-box'), { spread: false, onChange: (v) => { const c = editor.getSelected(); if (isButtonLike(c)) c.addStyle({ filter: wrapDrop(v), 'box-shadow': 'none' }); } });
const bpHoverEd = makeShadowEditor(byId('bp-hshadow-box'), { spread: false, onChange: (v) => { const c = editor.getSelected(); if (isButtonLike(c)) c.addStyle({ '--btn-shadow': wrapDrop(v) }); } });
window.__btnShadowEd = makeShadowEditor(byId('btn-shadow-box'), { spread: false, onChange: (v) => { siteColors.btn_shadow = wrapDrop(v); applyColorsToCanvas(); } });
window.__btnShadowEd.set(siteColors.btn_shadow || 'none');

const BP_FONT = byId('bp-font');
function openButtonPanel() {
  byId('colors-panel').classList.add('hidden');
  byId('pagebg-panel').classList.add('hidden');
  byId('button-panel').classList.remove('hidden');
  syncButtonPanel();
}
function syncButtonPanel() {
  const c = editor.getSelected();
  const ok = isButtonLike(c);
  byId('bp-hint').style.display = ok ? 'none' : 'block';
  byId('bp-body').style.display = ok ? 'block' : 'none';
  if (!ok) return;
  const el = c.getEl();
  const cs = el.ownerDocument.defaultView.getComputedStyle(el);
  byId('bp-text').value = el.textContent.trim();
  const href = c.getAttributes().href || '';
  byId('bp-link').value = href;
  const goto = byId('bp-goto');
  goto.innerHTML = '<option value="">Choose where it goes...</option>' +
    pages.map((p) => `<option value="#${escapeHtml(p.id)}">Page: ${escapeHtml(p.title)}</option>`).join('') +
    '<option value="__custom">Other address (type below)</option>';
  goto.value = pages.some((p) => '#' + p.id === href) ? href : (href ? '__custom' : '');
  BP_FONT.innerHTML = fontOptionsHtml('');
  BP_FONT.value = matchFontOption(cs.fontFamily);
  byId('bp-size').value = parseFloat(cs.fontSize) || 14;
  byId('bp-weight').value = String(Math.round((parseInt(cs.fontWeight, 10) || 400) / 100) * 100);
  byId('bp-spacing').value = parseFloat(cs.letterSpacing) || 0;
  byId('bp-color').value = rgbToHex(cs.color);
  const transparent = !cs.backgroundColor || /rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(cs.backgroundColor);
  byId('bp-nofill').checked = transparent;
  byId('bp-fill').value = transparent ? '#ffffff' : rgbToHex(cs.backgroundColor);
  byId('bp-bwidth').value = parseFloat(cs.borderTopWidth) || 0;
  byId('bp-bcolor').value = rgbToHex(cs.borderTopColor);
  byId('bp-radius').value = parseFloat(cs.borderTopLeftRadius) || 0;
  bpDropEd.set(cs.filter && cs.filter !== 'none' ? cs.filter : cs.boxShadow);
  bpHoverEd.set((cs.getPropertyValue('--btn-shadow') || '').trim() || siteColors.btn_shadow || 'none');
}
const bpSel = () => { const c = editor.getSelected(); return isButtonLike(c) ? c : null; };
const bpApply = (patch) => { const c = bpSel(); if (c) c.addStyle(patch); };
byId('btn-button').addEventListener('click', () => {
  const p = byId('button-panel');
  if (p.classList.contains('hidden')) openButtonPanel(); else p.classList.add('hidden');
});
byId('bp-close').addEventListener('click', () => byId('button-panel').classList.add('hidden'));
editor.on('component:selected', () => { if (!byId('button-panel').classList.contains('hidden')) syncButtonPanel(); });
byId('bp-text').addEventListener('input', (e) => { const c = bpSel(); if (c) { c.components(escapeHtml(e.target.value)); markDirty(currentPage); } });
byId('bp-link').addEventListener('input', (e) => {
  const c = bpSel();
  if (c) c.addAttributes({ href: e.target.value.trim() });
  byId('bp-goto').value = pages.some((p) => '#' + p.id === e.target.value.trim()) ? e.target.value.trim() : (e.target.value.trim() ? '__custom' : '');
});
byId('bp-goto').addEventListener('change', (e) => {
  const c = bpSel();
  if (!c) return;
  if (e.target.value === '__custom') { byId('bp-link').focus(); return; }
  if (!e.target.value) return;
  c.addAttributes({ href: e.target.value });
  byId('bp-link').value = e.target.value;
  markDirty(currentPage);
});
BP_FONT.addEventListener('change', (e) => { if (e.target.value) bpApply({ 'font-family': e.target.value }); });
byId('bp-size').addEventListener('input', (e) => bpApply({ 'font-size': (Number(e.target.value) || 14) + 'px' }));
byId('bp-weight').addEventListener('change', (e) => bpApply({ 'font-weight': e.target.value }));
byId('bp-spacing').addEventListener('input', (e) => bpApply({ 'letter-spacing': (Number(e.target.value) || 0) + 'px' }));
byId('bp-color').addEventListener('input', (e) => bpApply({ color: e.target.value, '--btn-text': e.target.value }));
byId('bp-fill').addEventListener('input', (e) => { byId('bp-nofill').checked = false; bpApply({ '--btn-fill': e.target.value, background: 'var(--btn-fill)' }); });
byId('bp-nofill').addEventListener('change', (e) => bpApply({ '--btn-fill': e.target.checked ? 'transparent' : byId('bp-fill').value, background: 'var(--btn-fill)' }));
const bpBorder = () => bpApply({ border: `${Number(byId('bp-bwidth').value) || 0}px solid ${byId('bp-bcolor').value}` });
byId('bp-bwidth').addEventListener('input', bpBorder);
byId('bp-bcolor').addEventListener('input', bpBorder);
byId('bp-radius').addEventListener('input', (e) => bpApply({ 'border-radius': (Number(e.target.value) || 0) + 'px', '--btn-radius': (Number(e.target.value) || 0) + 'px' }));

// Dragging an element that was centered with "Center": convert its percent position to pixels first
editor.on('dmode:start', (opts) => {
  const c = opts && opts.target;
  if (!c || !c.getStyle) return;
  const st = c.getStyle();
  if (st.transform && /translateX\(-50%\)/.test(st.transform) && /%$/.test(String(st.left || ''))) {
    const el = c.getEl();
    if (el) c.addStyle({ left: el.offsetLeft + 'px', transform: 'none' });
  }
});

// Helper shared with the live site: turn any shadow text into a drop-shadow() filter value
function toFilterShadow(v) {
  v = String(v || '').trim();
  if (!v || v === 'none') return 'none';
  if (/^drop-shadow\(/i.test(v)) return v;
  var col = /(rgba?\([^)]*\)|#[0-9a-fA-F]{3,8})/.exec(v);
  var rest = v.replace(col ? col[1] : '', '');
  var nums = (rest.match(/-?[\d.]+(?:px)?/g) || []).slice(0, 3).map(function (n) { return parseFloat(n) + 'px'; });
  while (nums.length < 3) nums.push('0px');
  return 'drop-shadow(' + nums.join(' ') + ' ' + (col ? col[1] : 'rgba(0,0,0,.3)') + ')';
}
// Old designs used a box-shadow on buttons (it can't show through a see-through button).
// Convert it to a drop-shadow filter that follows the outline and text.
function migrateBtnShadow(style) {
  var bs = style.getPropertyValue('box-shadow');
  if (bs && bs !== 'none' && !style.getPropertyValue('filter')) {
    style.setProperty('filter', toFilterShadow(bs));
    style.setProperty('box-shadow', 'none');
  }
}

// Big JPEG photos are scaled down (max 2560px wide, good quality) before upload so they send much faster.
function shrinkIfBig(file, dataUrl) {
  if (!/^image\/jpeg$/i.test(file.type) || file.size < 1200 * 1024) return Promise.resolve(dataUrl);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 2560 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const out = c.toDataURL('image/jpeg', 0.88);
      resolve(out.length < dataUrl.length ? out : dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}


// ???????????????????????????????????????????????????????????????
// PICTURE RESIZE ? big drag handles + a panel with exact size, proportions, fit, corners, opacity
// ???????????????????????????????????????????????????????????????
const isImageComp = (c) => !!c && (c.is('image') || (c.get('tagName') || '').toLowerCase() === 'img');
// the panel works for pictures and for text/buttons
const imgSel = () => { const c = editor.getSelected(); return (isImageComp(c) || isTextLikeSafe(c)) ? c : null; };
const isTextLikeSafe = (c) => typeof isTextLike === 'function' && isTextLike(c);
function openImagePanel() {
  ['colors-panel', 'pagebg-panel', 'button-panel'].forEach((id) => byId(id).classList.add('hidden'));
  byId('image-panel').classList.remove('hidden');
  syncImagePanel();
}
function syncImagePanel() {
  const c = imgSel();
  byId('bi-hint').style.display = c ? 'none' : 'block';
  byId('bi-body').style.display = c ? 'block' : 'none';
  if (!c) return;
  const el = c.getEl();
  const cs = el.ownerDocument.defaultView.getComputedStyle(el);
  const st = c.getStyle();
  const isText = !isImageComp(c);
  document.querySelectorAll('#image-panel .bi-img-only').forEach((n) => { n.style.display = isText ? 'none' : ''; });
  document.querySelectorAll('#image-panel .bi-text-only').forEach((n) => { n.style.display = isText ? '' : 'none'; });
  byId('image-panel').querySelector('.colors-head strong').textContent = isText ? 'Text size' : 'Picture size';
  if (isText) { byId('bi-fontsize').value = Math.round(parseFloat(cs.fontSize) || 16); byId('bi-fsslider').value = byId('bi-fontsize').value; }
  const w = String(st.width || '');
  const unit = /%$/.test(w) ? '%' : 'px';
  byId('bi-unit').value = unit;
  byId('bi-width').value = unit === '%' ? parseFloat(w) : Math.round(el.getBoundingClientRect().width);
  const wsl = byId('bi-wslider');
  wsl.max = unit === '%' ? 100 : 1600;
  wsl.value = byId('bi-width').value;
  // "Keep proportions" is on when the height follows the width (auto) or already matches the picture's own shape
  const rect = el.getBoundingClientRect();
  const nat = el.naturalWidth && el.naturalHeight ? el.naturalWidth / el.naturalHeight : 0;
  const auto = !st.height || st.height === 'auto' || (nat && Math.abs(rect.width / rect.height - nat) / nat < 0.03);
  byId('bi-lock').checked = auto;
  byId('bi-height').value = Math.round(el.getBoundingClientRect().height);
  byId('bi-height').disabled = auto;
  byId('bi-fit').value = cs.objectFit || 'fill';
  byId('bi-radius').value = parseFloat(cs.borderTopLeftRadius) || 0;
  byId('bi-opacity').value = Math.round((parseFloat(cs.opacity) || 1) * 100);
}
function setImageWidth(val, unit) {
  const c = imgSel();
  if (!c) return;
  const patch = { width: val + unit, 'max-width': '100%' };
  if (isImageComp(c) && byId('bi-lock').checked) patch.height = 'auto';
  c.addStyle(patch);
}
byId('btn-imgsize').addEventListener('click', () => {
  const p = byId('image-panel');
  if (p.classList.contains('hidden')) openImagePanel(); else p.classList.add('hidden');
});
byId('bi-close').addEventListener('click', () => byId('image-panel').classList.add('hidden'));
editor.on('component:selected', () => { if (!byId('image-panel').classList.contains('hidden')) syncImagePanel(); });
editor.on('component:styleUpdate', () => { if (!byId('image-panel').classList.contains('hidden')) clearTimeout(window.__imgSync), window.__imgSync = setTimeout(syncImagePanel, 150); });
byId('bi-width').addEventListener('input', (e) => {
  const v = Number(e.target.value) || 1;
  byId('bi-wslider').value = v;
  setImageWidth(v, byId('bi-unit').value);
});
byId('bi-wslider').addEventListener('input', (e) => { byId('bi-width').value = e.target.value; setImageWidth(Number(e.target.value), byId('bi-unit').value); });
byId('bi-unit').addEventListener('change', () => {
  const c = imgSel();
  if (!c) return;
  const el = c.getEl(), pw = el.parentElement ? el.parentElement.clientWidth : el.ownerDocument.documentElement.clientWidth;
  const unit = byId('bi-unit').value, cur = el.getBoundingClientRect().width;
  const v = unit === '%' ? Math.max(1, Math.min(100, Math.round(cur / pw * 100))) : Math.round(cur);
  byId('bi-wslider').max = unit === '%' ? 100 : 1600;
  byId('bi-width').value = v; byId('bi-wslider').value = v;
  setImageWidth(v, unit);
});
byId('bi-lock').addEventListener('change', (e) => {
  const c = imgSel();
  if (!c) return;
  byId('bi-height').disabled = e.target.checked;
  if (e.target.checked) c.addStyle({ height: 'auto' });
  else { const h = Math.round(c.getEl().getBoundingClientRect().height); byId('bi-height').value = h; c.addStyle({ height: h + 'px' }); }
});
byId('bi-height').addEventListener('input', (e) => { const c = imgSel(); if (c && !byId('bi-lock').checked) c.addStyle({ height: (Number(e.target.value) || 1) + 'px' }); });
byId('bi-fit').addEventListener('change', (e) => { const c = imgSel(); if (c) c.addStyle({ 'object-fit': e.target.value }); });
byId('bi-radius').addEventListener('input', (e) => { const c = imgSel(); if (c) c.addStyle({ 'border-radius': (Number(e.target.value) || 0) + 'px' }); });
byId('bi-opacity').addEventListener('input', (e) => { const c = imgSel(); if (c) c.addStyle({ opacity: String((Number(e.target.value) || 0) / 100) }); });
byId('bi-center').addEventListener('click', () => centerHorizontally(imgSel()));
byId('bi-quick').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  const c = imgSel();
  if (!c) return;
  byId('bi-lock').checked = true;
  if (b.dataset.w === 'orig') {
    const nw = c.getEl().naturalWidth || 400;
    byId('bi-unit').value = 'px'; byId('bi-width').value = nw;
    setImageWidth(nw, 'px');
  } else {
    byId('bi-unit').value = '%'; byId('bi-width').value = parseFloat(b.dataset.w);
    setImageWidth(parseFloat(b.dataset.w), '%');
  }
  syncImagePanel();
}));
byId('bi-replace').addEventListener('click', () => {
  const c = imgSel();
  if (!c) return;
  editor.AssetManager.open({
    select(asset, complete) {
      const src = asset.get ? asset.get('src') : asset;
      c.set('src', src); c.addAttributes({ src });
      if (complete !== false) editor.AssetManager.close();
      markDirty(currentPage);
    },
  });
});
// "Size" shortcut on the little toolbar above a selected picture
(function addImageTool() {
  const prev = ensureExtraTools;
  ensureExtraTools = function (c) {
    prev(c);
    if (!isImageComp(c)) return;
    const tb = c.get('toolbar') || [];
    if (tb.some((t) => t.id === 'q-img')) return;
    c.set('toolbar', [{ id: 'q-img', label: '<span class="tb-fmt" style="font-size:11px">Size\u270E</span>', attributes: { title: 'Resize this picture: exact size, proportions, fit, corners' }, command: () => openImagePanel() }, ...tb]);
  };
})();

editor.on('component:add', ensureExtraTools);
editor.on('component:selected', ensureExtraTools);


// ???????????????????????????????????????????????????????????????
// TEXT RESIZE ? drag the corner handles to make the text bigger/smaller (font size scales),
// drag the side handles to change the width of the text box.
// ???????????????????????????????????????????????????????????????
const isTextLike = (c) => !!c && (c.is('text') || c.is('link') || ['h1','h2','h3','h4','h5','h6','p','a','button','span'].includes((c.get('tagName') || '').toLowerCase()));
function makeTextResizable(c) {
  if (!isTextLike(c) || c === editor.getWrapper()) return;
  let start = null; // set again on every load/select: functions are not saved with the page
  c.set('resizable', {
    tl: 1, tr: 1, bl: 1, br: 1, cl: 1, cr: 1, tc: 0, bc: 0,
    updateTarget(el, rect, opts) {
      const handle = (opts && (opts.selectedHandler || opts.handler)) || '';
      const corner = /^(tl|tr|bl|br)$/.test(String(handle));
      if (!start) {
        const cs = el.ownerDocument.defaultView.getComputedStyle(el);
        start = { w: el.getBoundingClientRect().width, fs: parseFloat(cs.fontSize) || 16, ls: parseFloat(cs.letterSpacing) || 0, hasW: !!c.getStyle().width };
      }
      if (corner) {
        const k = Math.max(0.1, rect.w / start.w);
        const patch = { 'font-size': Math.max(6, Math.round(start.fs * k * 10) / 10) + 'px' };
        if (start.ls) patch['letter-spacing'] = Math.round(start.ls * k * 10) / 10 + 'px';
        if (start.hasW) patch.width = Math.round(rect.w) + 'px';
        c.addStyle(patch);
      } else {
        c.addStyle({ width: Math.round(rect.w) + 'px', 'max-width': '100%' });
      }
      if (opts && opts.store) start = null;
    },
  });
}
editor.on('component:add', makeTextResizable);
editor.on('component:selected', makeTextResizable);

const setFontSize = (v) => { const c = imgSel(); if (c && !isImageComp(c)) c.addStyle({ 'font-size': Math.max(6, Number(v) || 16) + 'px' }); };
byId('bi-fontsize').addEventListener('input', (ev) => { byId('bi-fsslider').value = ev.target.value; setFontSize(ev.target.value); });
byId('bi-fsslider').addEventListener('input', (ev) => { byId('bi-fontsize').value = ev.target.value; setFontSize(ev.target.value); });
// "Size" shortcut for text too
(function addTextSizeTool() {
  const prev = ensureExtraTools;
  ensureExtraTools = function (c) {
    prev(c);
    if (!isTextLike(c) || isButtonLike(c)) return;
    const tb = c.get('toolbar') || [];
    if (tb.some((t) => t.id === 'q-img')) return;
    c.set('toolbar', [{ id: 'q-img', label: '<span class="tb-fmt" style="font-size:11px">Size\u270E</span>', attributes: { title: 'Text size and width' }, command: () => openImagePanel() }, ...tb]);
  };
})();
editor.on('component:add', ensureExtraTools);
editor.on('component:selected', ensureExtraTools);


// ═══════════════════════════════════════════════════════════════
// LOCK SCREEN · SHOP PANEL · CATEGORIES · PRODUCT PICTURES · PRODUCT PAGE
// ═══════════════════════════════════════════════════════════════

// ── Lock screen: /admin/ only opens with the admin password ──
// CSS of the designed login page, limited to the lock screen
function scopeLoginCss(css, scope) {
  const sheet = new CSSStyleSheet();
  try { sheet.replaceSync(css); } catch (_) { return ''; }
  const map = (rules) => Array.from(rules).map((r) => {
    if (r.type === 1) {
      const sel = r.selectorText.split(',').map((x) => {
        x = x.trim();
        if (/^(html|body)$/i.test(x)) return scope;
        if (/^(html|body)\s/i.test(x)) return scope + ' ' + x.replace(/^(html|body)\s+/i, '');
        return scope + ' ' + x;
      }).join(',');
      return sel + '{' + r.style.cssText + '}';
    }
    if (r.type === 4) return '@media ' + r.media.mediaText + '{' + map(r.cssRules) + '}';
    return r.cssText;   // @font-face, @keyframes ...
  }).join('\n');
  return map(sheet.cssRules);
}
(function lockGate() {
  const lock = byId('lock-screen');
  if (!lock) return;
  if (!IS_LIVE) { lock.classList.add('hidden'); return; }   // local testing needs no password
  const check = async (pw) => {
    try {
      const r = await fetch('/api/check-auth', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-password': pw }, body: '{}' });
      return r.ok;
    } catch (_) { return false; }
  };
  const unlock = () => lock.classList.add('hidden');
  let pwEl = byId('lock-pw'), btnEl = byId('lock-btn'), errEl = byId('lock-err');
  const wire = () => {
    const submit = async () => {
      const pw = pwEl.value.trim();
      errEl.textContent = '';
      if (!pw) return;
      btnEl.disabled = true;
      const ok = await check(pw);
      btnEl.disabled = false;
      if (ok) { sessionStorage.setItem('adminPassword', pw); unlock(); }
      else { errEl.textContent = 'Wrong password'; pwEl.value = ''; pwEl.focus(); }
    };
    btnEl.addEventListener('click', (e) => { e.preventDefault(); submit(); });
    pwEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    byId('lock-form').addEventListener('submit', (e) => { e.preventDefault(); submit(); });
    setTimeout(() => pwEl.focus(), 60);
  };
  const saved = sessionStorage.getItem('adminPassword');
  if (saved) check(saved).then((ok) => { if (ok) unlock(); else sessionStorage.removeItem('adminPassword'); });
  // show the login page you designed (Login Page tab); the built-in box is the fallback
  (async () => {
    let d = null;
    try { d = await Promise.race([fetchContent('page-login.json'), new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 2500))]); } catch (_) { d = null; }
    if (d && d.html) {
      const root = document.createElement('div');
      root.id = 'lock-root';
      root.innerHTML = d.html;
      const pw = root.querySelector('[data-login-pw]'), btn = root.querySelector('[data-login-btn]');
      if (pw && btn) {
        let err = root.querySelector('[data-login-err]');
        if (!err) { err = document.createElement('div'); err.style.cssText = 'color:#e53935;font-size:12px;text-align:center;'; root.appendChild(err); }
        const st = document.createElement('style');
        st.textContent = scopeLoginCss(d.css || '', '#lock-root');
        root.appendChild(st);
        const bg = d.bg || {};
        if (bg.color) lock.style.backgroundColor = bg.color;
        if (bg.image) {
          lock.style.backgroundImage = 'url("' + bg.image + '")';
          const mode = bg.mode || 'cover';
          lock.style.backgroundRepeat = mode === 'tile' ? 'repeat' : 'no-repeat';
          lock.style.backgroundSize = mode === 'tile' ? (bg.tile_size || 256) + 'px' : (mode === 'stretch' ? '100% 100%' : mode);
          lock.style.backgroundPosition = bg.position || 'center center';
        }
        lock.appendChild(root);
        lock.classList.add('designed');
        pwEl = pw; btnEl = btn; errEl = err;
      }
    }
    lock.classList.add('ready');
    wire();
  })();
})();

// ── Category blocks get a "Category name" setting ──
editor.DomComponents.addType('shop-category', {
  isComponent: (el) => (el.getAttribute && el.hasAttribute && el.hasAttribute('data-shopify-category')) ? { type: 'shop-category' } : undefined,
  model: { defaults: { traits: [{ type: 'text', name: 'data-shopify-category', label: 'Category name' }] } },
});
editor.on('component:update:attributes', (c) => {
  if (c && c.getAttributes && c.getAttributes()['data-shopify-category'] !== undefined) shopRenderSoon(true);
});

// ── State ──
let shopProducts = [];                       // [{ key, title, image, price }]
let shopCurrent = sessionStorage.getItem('shopCurrentProduct') || '';
let shopTimer = null;
let shopSel = '';                            // category selected in the manager (also previewed in the canvas)
let shopPreviewOn = false;
let shopTab = 'products';

const shopKeys = () => (byId('set-product-ids').value || '').split(/\r?\n/).map((x) => InteerShop.keyOf(x)).filter(Boolean);
const shopRawLines = () => (byId('set-product-ids').value || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

function shopEl(tag, props, ...kids) {
  const e = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach((c) => { if (c == null || c === false) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return e;
}

async function shopFetchProducts() {
  const keys = shopKeys();
  const st = collectSettings();
  let map = {};
  if (st.shopify_domain && st.shopify_storefront_token && keys.length) {
    try { window.__ishCache = null; map = await InteerShop.fetchShopData(st, window); } catch (e) { console.warn('Could not read products', e); }
  }
  shopProducts = keys.map((k) => {
    const n = map[k];
    window.__shopNames = window.__shopNames || {};
    if (n) window.__shopNames[shopSlug(k)] = n.title;
    return {
      key: k, title: n ? n.title : k, desc: n ? (n.description || '') : '',
      image: n && n.featuredImage ? n.featuredImage.url + (n.featuredImage.url.includes('?') ? '&' : '?') + 'width=140' : '',
      price: n ? InteerShop.money(n.priceRange.minVariantPrice.amount, n.priceRange.minVariantPrice.currencyCode) : '',
    };
  });
}

// ── Drawing the shop into the editor canvas ──
function shopCanvasCss(doc) {
  let tag = doc.getElementById('shop-canvas-css');
  if (!tag) { tag = doc.createElement('style'); tag.id = 'shop-canvas-css'; doc.head.appendChild(tag); }
  // clicks select the block (so it can be moved / resized) instead of pressing shop buttons; use the Shop panel to preview
  tag.textContent = '[data-shopify-section] .ish-root,[data-shopify-product-page] iframe{pointer-events:none!important}';
}
function shopRender(force) {
  if (typeof InteerShop === 'undefined') return;
  const doc = editor.Canvas.getDocument();
  if (!doc || !doc.body) return;
  const secs = Array.from(doc.querySelectorAll('[data-shopify-section]'));
  const pps = Array.from(doc.querySelectorAll('[data-shopify-product-page]'));
  if (!secs.length && !pps.length) return;
  const st = collectSettings();
  if (!st.shopify_domain || !st.shopify_storefront_token) return;
  shopCanvasCss(doc);
  const secNeed = secs.some((s) => !s.__shopTried);
  if (secs.length && (force || secNeed)) {
    secs.forEach((s) => { s.__shopTried = true; });
    InteerShop.render(doc, st, {
      toFilterShadow, editor: true,
      onBuilt: (section) => { if (shopPreviewOn && shopSel && section.__ish) section.__ish.setCat(shopSel); },
    });
  }
  const pk = shopPageProductKey();
  pps.forEach((el) => {
    if (!force && el.__shopFor === pk && el.querySelector('.shop-card')) return;
    el.__shopFor = pk;
    if (!pk) return;
    InteerShop.renderProductPage(doc, el, st, pk, { toFilterShadow });
    if (el.getAttribute('data-shopify-product-page') === 'gallery') {
      const addBtn = () => {
        if (el.querySelector('.ed-add-pics')) return;
        const b = doc.createElement('button');
        b.type = 'button'; b.className = 'ed-add-pics'; b.textContent = '+ Add images';
        b.style.cssText = 'display:block;margin:12px 0 0;padding:10px 16px;background:#000;color:#ff0000;border:2px solid #ff0000;font:700 13px Inter,sans-serif;letter-spacing:.08em;cursor:pointer;';
        b.addEventListener('mousedown', (ev) => ev.stopPropagation());
        b.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); shopAddImages(pk); });
        el.appendChild(b);
        if (shopImgList(pk).length) {
          const r = doc.createElement('button');
          r.type = 'button'; r.className = 'ed-add-pics'; r.textContent = "Remove my images (use Shopify's)";
          r.style.cssText = b.style.cssText + 'margin-top:8px;';
          r.addEventListener('mousedown', (ev) => ev.stopPropagation());
          r.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); if (!confirm("Remove all your pictures and go back to Shopify's picture?")) return; shopSetImgs(pk, []); shopChanged(); showToast("Back to Shopify's picture - press Save to publish"); });
          el.appendChild(r);
        }
      };
      [1200, 3000, 6000].forEach((ms) => setTimeout(addBtn, ms));
    }
  });
}
function shopRenderSoon(force) {
  clearTimeout(shopTimer);
  shopTimer = setTimeout(() => shopRender(force), force ? 250 : 250);
}
function shopPreviewCat(id) {
  const doc = editor.Canvas.getDocument();
  if (!doc) return;
  doc.querySelectorAll('[data-shopify-section]').forEach((s) => { if (s.__ish) s.__ish.setCat(id); });
}
editor.on('canvas:frame:load', () => shopRenderSoon(true));
editor.on('load', () => shopRenderSoon(true));
editor.on('component:add', () => shopRenderSoon(false));
editor.on('update', () => shopRenderSoon(false));
byId('colors-panel').addEventListener('input', () => shopRenderSoon(true));   // site button colors feed the shop buttons

async function shopAfterSettings() {
  await shopFetchProducts();
  const keys = shopProducts.map((p) => p.key);
  if (!shopCurrent || !keys.includes(shopCurrent)) shopCurrent = keys[0] || '';
  shopSyncSwitch();
  const sp = byId('shop-panel'); if (sp && !sp.classList.contains('hidden')) shopPanelDraw();
  shopRenderSoon(true);
}

// Product pages: arrows + a menu (Template or one product) in the top bar. Every product can have its own design.
function shopPageProductKey() {
  if (currentPage !== PRODUCT_PAGE.id && isProductPageId(currentPage)) {
    const slug = currentPage.slice(PRODUCT_PAGE.id.length + 1);
    const p = shopProducts.find((x) => shopSlug(x.key) === slug);
    return p ? p.key : '';
  }
  return shopCurrent;
}
(function buildProdSwitch() {
  const wrap = document.createElement('div');
  wrap.id = 'prod-switch';
  wrap.innerHTML = '<button type="button" class="tb-btn" id="ps-prev" title="Previous product page">&#9664;</button><select id="ps-sel" title="Pick which product page to edit"></select><button type="button" class="tb-btn" id="ps-next" title="Next product page">&#9654;</button><button type="button" class="tb-btn" id="ps-pics" title="Add pictures to this product (visitors can scroll through them). No pictures added = Shopify\'s picture only.">+ Pictures</button><button type="button" class="tb-btn" id="ps-reset" title="Throw away this product\'s design and start its layout again">&#8634; Reset layout</button>';
  byId('btn-add-page').parentNode.appendChild(wrap);
  const ids = () => [...shopProducts.map((p) => PRODUCT_PAGE.id + '-' + shopSlug(p.key))];
  const go = (id) => {
    const key = (shopProducts.find((p) => PRODUCT_PAGE.id + '-' + shopSlug(p.key) === id) || {}).key;
    if (key) { shopCurrent = key; sessionStorage.setItem('shopCurrentProduct', key); }
    switchPage(id);
  };
  const step = (d) => { const a = ids(), i = Math.max(0, a.indexOf(currentPage)); go(a[(i + d + a.length) % a.length]); };
  byId('ps-pics').addEventListener('click', () => { const k = shopPageProductKey(); if (k) shopAddImages(k); });
  byId('ps-prev').addEventListener('click', () => step(-1));
  byId('ps-next').addEventListener('click', () => step(1));
  byId('ps-sel').addEventListener('change', (e) => go(e.target.value));
  byId('ps-reset').addEventListener('click', async () => {
    if (currentPage === PRODUCT_PAGE.id || !isProductPageId(currentPage)) return;
    if (!confirm('Reset this product page to the default layout? Your changes to it are deleted.')) return;
    const id = currentPage;
    try { await apiFetch('/api/delete-page', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: id }) }); } catch (_) { /* never saved */ }
    dirty.delete(id); delete drafts[id];
    await loadPage(id);
    showToast('Layout reset');
  });
})();
function shopSyncSwitch() {
  const wrap = byId('prod-switch');
  if (!wrap) return;
  wrap.classList.toggle('on', isProductPageId(currentPage));
  const sel = byId('ps-sel');
  sel.innerHTML = '';
  const add = (v, n) => { const o = document.createElement('option'); o.value = v; o.textContent = n; sel.appendChild(o); };
  shopProducts.forEach((p) => add(PRODUCT_PAGE.id + '-' + shopSlug(p.key), p.title));
  sel.value = currentPage;
  byId('ps-reset').style.display = '';
}

function shopChanged() { markDirty(currentPage); shopRenderSoon(true); }

// ── Look tab: every color / font / size ──
const toHex6 = (v) => (/^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000');
function shopRow(f, eff) {
  const row = document.createElement('div');
  row.className = 'swatch-row';
  const lab = document.createElement('label');
  lab.textContent = f.l;
  row.appendChild(lab);
  const set = (v) => { shopStyle[f.k] = v; shopChanged(); };
  const cur = eff[f.k];
  let inp;
  const sel = (options, val) => {
    const s = document.createElement('select'); s.className = 'pbg-select';
    options.forEach(([v, n]) => { const o = document.createElement('option'); o.value = v; o.textContent = n; s.appendChild(o); });
    s.value = String(val); s.addEventListener('change', () => set(s.value));
    return s;
  };
  if (f.t === 'font') inp = sel(InteerShop.fontList(shopFontsAll()).map((n) => [n, n]), cur);
  else if (f.t === 'weight') inp = sel([['400', 'Regular'], ['500', 'Medium'], ['600', 'Semi Bold'], ['700', 'Bold'], ['800', 'Extra Bold']], cur);
  else if (f.t === 'select') inp = sel(f.o, cur);
  else if (f.t === 'num') {
    inp = document.createElement('input'); inp.type = 'number'; inp.className = 'pbg-num';
    inp.min = f.min; inp.max = f.max; inp.value = cur;
    inp.addEventListener('input', () => { if (inp.value !== '') set(Number(inp.value)); });
  } else if (f.t === 'text') {
    inp = document.createElement('input'); inp.type = 'text'; inp.className = 'hex wide';
    inp.value = cur;
    inp.addEventListener('input', () => set(inp.value));
  } else {   // color / colornone
    inp = document.createElement('input'); inp.type = 'color';
    inp.value = toHex6(cur);
    let none = null;
    inp.addEventListener('input', () => { if (none) none.checked = false; set(inp.value); });
    if (f.t === 'colornone') {
      const l = document.createElement('label'); l.className = 'mini-check';
      none = document.createElement('input'); none.type = 'checkbox'; none.checked = cur === 'transparent';
      l.appendChild(none); l.appendChild(document.createTextNode(' none'));
      none.addEventListener('change', () => set(none.checked ? 'transparent' : inp.value));
      row.appendChild(inp); row.appendChild(l);
      return row;
    }
  }
  row.appendChild(inp);
  return row;
}
function shopDrawLook(box) {
  box.appendChild(shopEl('div', { class: 'shop-row-btns' },
    shopEl('button', { class: 'tb-btn', text: 'Show cart', onclick: () => { if (!InteerShop.previewCart(editor.Canvas.getDocument())) showToast('Add a Shopify block to the page first (Blocks ▸ Studio ▸ Shopify Products)'); } }),
    shopEl('button', { class: 'tb-btn', text: 'Reset look', onclick: () => { shopStyle = {}; shopPanelDraw(); shopChanged(); } })));
  const eff = InteerShop.merged(shopStyle, siteColors);
  InteerShop.SCHEMA.forEach((g) => {
    box.appendChild(shopEl('div', { class: 'sh-title', text: g.group }));
    g.fields.forEach((f) => box.appendChild(shopRow(f, eff)));
  });
}

// ── Layout tab: what the shop shows ──
function shopDrawLayout(box) {
  const o = Object.assign({}, InteerShop.OPT_DEFAULTS, shopOptsData);
  const set = (k, v) => { shopOptsData[k] = v; shopChanged(); };
  const check = (k, label, hint) => shopEl('label', { class: 'shop-check', title: hint || '' },
    shopEl('input', { type: 'checkbox', checked: !!o[k], onchange: (e) => set(k, e.target.checked) }), ' ' + label);
  const row = (label, ctl) => shopEl('div', { class: 'swatch-row' }, shopEl('label', { text: label }), ctl);
  const sel = (k, opts) => { const s = shopEl('select', { class: 'pbg-select', onchange: (e) => set(k, e.target.value) }, opts.map(([v, n]) => shopEl('option', { value: v, text: n }))); s.value = String(o[k]); return s; };
  box.appendChild(shopEl('div', { class: 'sh-title', text: 'Show' }));
  box.appendChild(shopEl('div', { class: 'shop-checks' },
    check('sidebar', 'Categories sidebar'), check('search', 'Search box'), check('sort', 'Sort menu'), check('wishlist', 'Hearts + Saved filter'),
    check('swatches', 'Color dots'), check('counts', 'Product counts'), check('hover_image', 'Second picture on hover'), check('show_price', 'Prices')));
  box.appendChild(shopEl('div', { class: 'sh-title', text: 'Grid' }));
  box.appendChild(row('Cart button + cart', sel('cart_side', [['left', 'Left side'], ['right', 'Right side']])));
  box.appendChild(row('Columns', sel('cols', [[0, 'Automatic'], [2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']])));
  box.appendChild(row('Picture shape', sel('ratio', [['1 / 1', 'Square'], ['4 / 5', 'Portrait 4:5'], ['3 / 4', 'Tall 3:4'], ['5 / 4', 'Wide 5:4']])));
  box.appendChild(row('Picture fit', sel('fit', [['cover', 'Fill (crop)'], ['contain', 'Fit inside']])));
  box.appendChild(row('Default order', sel('default_sort', [['featured', 'Featured (your order)'], ['new', 'Newest'], ['low', 'Price low → high'], ['high', 'Price high → low'], ['az', 'Name A–Z']])));
  box.appendChild(shopEl('div', { class: 'sh-title', text: 'Words' }));
  box.appendChild(row('"All" label', shopEl('input', { type: 'text', class: 'hex wide', value: o.all_label, oninput: (e) => set('all_label', e.target.value) })));
  box.appendChild(row('Nothing found', shopEl('input', { type: 'text', class: 'hex wide', value: o.empty_text, oninput: (e) => set('empty_text', e.target.value) })));
  box.appendChild(row('"New" badge for (days)', shopEl('input', { type: 'number', class: 'pbg-num', min: 0, max: 365, value: o.new_days, oninput: (e) => set('new_days', Number(e.target.value) || 0) })));
  box.appendChild(shopEl('p', { class: 'colors-hint small', text: 'New badge: 0 = off. You can also set a badge per product on the Products tab.' }));
}

// ── Categories tab ──
const catById = (id) => shopCats.find((c) => c.id === id);
const catSiblings = (c) => shopCats.filter((x) => (x.parent || '') === (c.parent || ''));
function catMove(c, d) {
  const sib = catSiblings(c), o = sib[sib.indexOf(c) + d];
  if (!o) return;
  const a = shopCats.indexOf(c), b = shopCats.indexOf(o);
  shopCats[a] = o; shopCats[b] = c;
}
function catDepth(c) { let d = 0, p = catById(c.parent); while (p && d < 5) { d++; p = catById(p.parent); } return d; }
function catIndent(c) {
  const sib = catSiblings(c), p = sib[sib.indexOf(c) - 1];
  if (!p) { showToast('Put it under the category above it (needs one at the same level)'); return false; }
  if (catDepth(p) >= 2) { showToast('Three levels is the maximum'); return false; }
  c.parent = p.id; return true;
}
function catOutdent(c) { const p = catById(c.parent); if (!p) return false; c.parent = p.parent || ''; return true; }
function catDelete(c) {
  if (!confirm(`Delete the category "${c.title}"? Its products stay in the shop; its subcategories move up.`)) return;
  shopCats.filter((x) => x.parent === c.id).forEach((x) => { x.parent = c.parent || ''; });
  shopCats.splice(shopCats.indexOf(c), 1);
  if (shopSel === c.id) { shopSel = ''; shopPreviewCat(''); }
}
function catAdd(parent) {
  const name = prompt(parent ? 'Name of the new subcategory:' : 'Name of the new category (for example: Hoodies, Mugs, Prints):');
  if (!name || !name.trim()) return;
  let id = slugify(name) || 'cat';
  const base = id; let n = 2;
  while (catById(id)) id = `${base}-${n++}`;
  shopCats.push({ id, title: name.trim(), parent: parent || '', product_ids: [] });
  shopSel = id; shopPreviewOn = true;
}
function catCount(c) { return InteerShop.catKeys({ shop_categories: shopCats, shopify_product_ids: shopKeys(), product_hidden: shopHidden }, c.id).length; }

function shopDrawCategories(box) {
  const tree = InteerShop.catTree({ shop_categories: shopCats });
  box.appendChild(shopEl('p', { class: 'colors-hint small', text: 'Make categories (and subcategories like Printful), then tick the products that belong in each. Click a category to see it on the page.' }));
  box.appendChild(shopEl('div', { class: 'shop-row-btns' },
    shopEl('button', { class: 'tb-btn', text: '+ Category', onclick: () => { catAdd(''); shopDrawBody(); shopChanged(); } }),
    shopEl('button', { class: 'tb-btn', text: '+ Subcategory', title: 'Adds under the selected category', onclick: () => { if (!shopSel) { showToast('Select a category first'); return; } catAdd(shopSel); shopDrawBody(); shopChanged(); } }),
    shopEl('button', { class: 'tb-btn', text: 'Show all products', onclick: () => { shopSel = ''; shopPreviewCat(''); shopDrawBody(); } })));
  const list = shopEl('div', { class: 'shop-tree' });
  tree.forEach(({ cat: c, depth }) => {
    const after = (fn) => (e) => { e.stopPropagation(); if (fn() !== false) { shopDrawBody(); shopChanged(); } };
    list.appendChild(shopEl('div', { class: 'shop-trow' + (shopSel === c.id ? ' sel' : ''), style: `padding-left:${8 + depth * 18}px`,
      onclick: () => { shopSel = c.id; shopPreviewOn = true; shopPreviewCat(c.id); shopDrawBody(); } },
      shopEl('span', { class: 'nm', text: c.title || '(no name)' }),
      shopEl('em', { text: String(catCount(c)) }),
      shopEl('button', { class: 'shop-mini', text: '↑', title: 'Move up', onclick: after(() => catMove(c, -1)) }),
      shopEl('button', { class: 'shop-mini', text: '↓', title: 'Move down', onclick: after(() => catMove(c, 1)) }),
      shopEl('button', { class: 'shop-mini', text: '⇥', title: 'Make it a subcategory of the one above', onclick: after(() => catIndent(c)) }),
      shopEl('button', { class: 'shop-mini', text: '⇤', title: 'Move one level out', onclick: after(() => catOutdent(c)) }),
      shopEl('button', { class: 'shop-mini', text: '✎', title: 'Rename', onclick: after(() => { const n = prompt('Rename category:', c.title); if (n && n.trim()) c.title = n.trim(); else return false; }) }),
      shopEl('button', { class: 'shop-mini', text: '✕', title: 'Delete', onclick: after(() => catDelete(c)) })));
  });
  if (!tree.length) list.appendChild(shopEl('div', { class: 'shop-none', text: 'No categories yet — the shop shows all products without a sidebar.' }));
  box.appendChild(list);

  const sel = catById(shopSel);
  if (sel) {
    box.appendChild(shopEl('div', { class: 'sh-title', text: `Products in "${sel.title}"` }));
    const q = shopEl('input', { type: 'search', class: 'hex wide shop-q', placeholder: 'Search products', style: 'width:100%' });
    const inCat = () => (sel.product_ids || []).map(InteerShop.keyOf);
    const listBox = shopEl('div', { class: 'shop-prods' });
    const draw = () => {
      listBox.innerHTML = '';
      const term = q.value.trim().toLowerCase(), have = inCat();
      shopProducts.filter((p) => !term || p.title.toLowerCase().includes(term)).forEach((p) => {
        const on = have.includes(p.key);
        listBox.appendChild(shopEl('label', { class: 'shop-prod pick' },
          shopEl('input', { type: 'checkbox', checked: on, onchange: (e) => {
            sel.product_ids = (sel.product_ids || []).filter((k) => InteerShop.keyOf(k) !== p.key);
            if (e.target.checked) sel.product_ids.push(p.key);
            shopChanged(); shopRefreshCounts();
          } }),
          shopEl('img', { src: p.image, alt: '' }),
          shopEl('div', { class: 'nm' }, shopEl('b', { text: p.title }), shopEl('span', { text: p.price }))));
      });
    };
    q.addEventListener('input', draw);
    box.appendChild(shopEl('div', { class: 'shop-row-btns' }, q));
    box.appendChild(shopEl('div', { class: 'shop-row-btns' },
      shopEl('button', { class: 'tb-btn', text: 'Add all', onclick: () => { sel.product_ids = shopProducts.map((p) => p.key); shopChanged(); draw(); shopRefreshCounts(); } }),
      shopEl('button', { class: 'tb-btn', text: 'Remove all', onclick: () => { sel.product_ids = []; shopChanged(); draw(); shopRefreshCounts(); } })));
    box.appendChild(listBox);
    draw();
  }
}
function shopRefreshCounts() {
  const rows = document.querySelectorAll('#shop-body .shop-trow');
  const tree = InteerShop.catTree({ shop_categories: shopCats });
  rows.forEach((r, i) => { const em = r.querySelector('em'); if (em && tree[i]) em.textContent = String(catCount(tree[i].cat)); });
}

// ── Products tab ──
// ── Pictures (a list per product: first = main) and description ──
const shopImgList = (key) => { const v = shopImgs[key]; return (Array.isArray(v) ? v : (v ? [v] : [])).filter(Boolean); };
function shopSetImgs(key, arr) { if (arr && arr.length) shopImgs[key] = arr; else delete shopImgs[key]; }
async function shopUploadOne(file) {
  let data = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
  data = await shrinkIfBig(file, data);
  const res = await apiFetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, type: file.type, data }) });
  const j = await res.json();
  if (!j.success) throw new Error(j.error || 'upload failed');
  return j.url;
}
function shopAddImages(key) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
  inp.addEventListener('change', async () => {
    const files = Array.from(inp.files || []);
    if (!files.length) return;
    try {
      const list = shopImgList(key).slice();
      for (let i = 0; i < files.length; i++) {
        showToast(`Uploading picture ${i + 1} of ${files.length}\u2026`);
        list.push(await shopUploadOne(files[i]));
      }
      shopSetImgs(key, list);
      shopDrawBody(); shopChanged();
      showToast('Pictures added \u2014 click Save to publish');
    } catch (err) { console.error(err); showToast('Upload failed'); }
  });
  inp.click();
}
function shopMoveProduct(key, d) {
  const lines = shopRawLines();
  const i = lines.findIndex((l) => InteerShop.keyOf(l) === key), j = i + d;
  if (i < 0 || j < 0 || j >= lines.length) return;
  [lines[i], lines[j]] = [lines[j], lines[i]];
  byId('set-product-ids').value = lines.join('\n');
  const a = shopProducts.findIndex((p) => p.key === key), b = a + d;
  if (b >= 0 && b < shopProducts.length) [shopProducts[a], shopProducts[b]] = [shopProducts[b], shopProducts[a]];
  shopSyncSwitch(); shopDrawBody(); shopChanged();
}
const SHOP_BADGES = [['', 'Auto'], ['none', 'No badge'], ['New', 'New'], ['Sale', 'Sale'], ['Limited', 'Limited'], ['Best seller', 'Best seller'], ['Sold out', 'Sold out'], ['Coming soon', 'Coming soon']];
let shopEditKey = '';

// the "Edit" box under a product: description + pictures
function shopEditBox(p) {
  const box = shopEl('div', { class: 'shop-edit' });
  box.appendChild(shopEl('div', { class: 'sh-title', text: 'Description' }));
  const ta = shopEl('textarea', { class: 'shop-desc', rows: '6', placeholder: p.desc ? 'Shopify\'s text is shown until you write your own:\n' + p.desc.slice(0, 220) : 'Write a description for this product\u2026' });
  ta.value = shopDescs[p.key] || '';
  ta.addEventListener('input', () => { if (ta.value.trim()) shopDescs[p.key] = ta.value; else delete shopDescs[p.key]; shopChanged(); });
  box.appendChild(ta);
  box.appendChild(shopEl('div', { class: 'shop-row-btns' },
    p.desc ? shopEl('button', { class: 'shop-mini', text: 'Copy Shopify\'s text', title: 'Start from the text in Shopify and edit it', onclick: () => { ta.value = p.desc; ta.dispatchEvent(new Event('input')); } }) : null,
    shopEl('button', { class: 'shop-mini', text: 'Use Shopify\'s text', title: 'Remove your text', onclick: () => { ta.value = ''; ta.dispatchEvent(new Event('input')); } })));
  box.appendChild(shopEl('div', { class: 'sh-title', text: 'Pictures (the first one is the main picture)' }));
  const list = shopImgList(p.key);
  const row = shopEl('div', { class: 'shop-thumbs' });
  if (!list.length) row.appendChild(shopEl('div', { class: 'shop-thumb' }, shopEl('img', { src: p.image, alt: '' }), shopEl('span', { text: 'Shopify\'s' })));
  list.forEach((u, i) => {
    const mv = (d) => () => { const a = shopImgList(p.key).slice(); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; shopSetImgs(p.key, a); shopDrawBody(); shopChanged(); };
    row.appendChild(shopEl('div', { class: 'shop-thumb' + (i === 0 ? ' main' : '') },
      shopEl('img', { src: u, alt: '' }),
      shopEl('span', { text: i === 0 ? 'Main' : '#' + (i + 1) }),
      shopEl('div', { class: 'tb' },
        shopEl('button', { class: 'shop-mini', text: '\u25C0', title: 'Move earlier', onclick: mv(-1) }),
        shopEl('button', { class: 'shop-mini', text: '\u25B6', title: 'Move later', onclick: mv(1) }),
        shopEl('button', { class: 'shop-mini', text: '\u2715', title: 'Remove this picture', onclick: () => { const a = shopImgList(p.key).slice(); a.splice(i, 1); shopSetImgs(p.key, a); shopDrawBody(); shopChanged(); } }))));
  });
  box.appendChild(row);
  box.appendChild(shopEl('div', { class: 'shop-row-btns' },
    shopEl('button', { class: 'tb-btn', text: '+ Add pictures', onclick: () => shopAddImages(p.key) }),
    list.length ? shopEl('button', { class: 'tb-btn', text: 'Use Shopify\'s pictures', onclick: () => { shopSetImgs(p.key, []); shopDrawBody(); shopChanged(); } }) : null));
  return box;
}

function shopDrawProducts(box) {
  box.appendChild(shopEl('p', { class: 'colors-hint small', text: 'Order here = order in the shop. Click Edit to write your own description or change the pictures (otherwise Shopify\'s are used), set a badge, or hide a product. Add or remove products in \u2699 Settings \u25B8 Product IDs.' }));
  const q = shopEl('input', { type: 'search', class: 'hex wide shop-q', placeholder: 'Search products', style: 'width:100%' });
  box.appendChild(shopEl('div', { class: 'shop-row-btns' }, q));
  const listBox = shopEl('div', { class: 'shop-prods' });
  const draw = () => {
    listBox.innerHTML = '';
    if (!shopProducts.length) { listBox.appendChild(shopEl('p', { class: 'colors-hint small', text: 'Add your Shopify domain, token and product IDs in \u2699 Settings first.' })); return; }
    const term = q.value.trim().toLowerCase();
    shopProducts.forEach((p) => {
      if (term && !p.title.toLowerCase().includes(term)) return;
      const hidden = !!shopHidden[p.key];
      const mine = shopImgList(p.key);
      const open = shopEditKey === p.key;
      const badge = shopEl('select', { title: 'Badge shown on the card', onchange: (e) => { if (e.target.value) shopBadges[p.key] = e.target.value; else delete shopBadges[p.key]; shopChanged(); } },
        SHOP_BADGES.map(([v, n]) => shopEl('option', { value: v, text: n })));
      const known = SHOP_BADGES.some(([v]) => v === (shopBadges[p.key] || ''));
      if (!known) badge.appendChild(shopEl('option', { value: shopBadges[p.key], text: shopBadges[p.key] }));
      badge.value = shopBadges[p.key] || '';
      const notes = [p.price, mine.length ? 'your pictures' : '', shopDescs[p.key] ? 'your text' : '', hidden ? 'hidden' : ''].filter(Boolean).join(' \u00B7 ');
      listBox.appendChild(shopEl('div', { class: 'shop-prod' + (hidden ? ' off' : '') },
        shopEl('img', { src: mine[0] || p.image, alt: '' }),
        shopEl('div', { class: 'nm' }, shopEl('b', { text: p.title }), shopEl('span', { text: notes })),
        badge,
        shopEl('div', { class: 'shop-btnrow' },
          shopEl('button', { class: 'shop-mini', text: '\u2191', title: 'Move up', onclick: () => shopMoveProduct(p.key, -1) }),
          shopEl('button', { class: 'shop-mini', text: '\u2193', title: 'Move down', onclick: () => shopMoveProduct(p.key, 1) }),
          shopEl('button', { class: 'shop-mini' + (open ? ' on' : ''), text: open ? 'Close' : 'Edit', title: 'Description and pictures', onclick: () => { shopEditKey = open ? '' : p.key; shopDrawBody(); } }),
          shopEl('button', { class: 'shop-mini', text: hidden ? 'Show' : 'Hide', title: hidden ? 'Show this product in the shop' : 'Hide this product from the shop', onclick: () => { if (hidden) delete shopHidden[p.key]; else shopHidden[p.key] = true; shopDrawBody(); shopChanged(); } }))));
      if (open) listBox.appendChild(shopEditBox(p));
    });
  };
  q.addEventListener('input', draw);
  box.appendChild(listBox);
  draw();
}

// ── The Shop panel itself (tabs) ──
function shopDrawBody() {
  const body = byId('shop-body');
  const scroll = body.scrollTop;
  body.innerHTML = '';
  document.querySelectorAll('#shop-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === shopTab));
  if (shopTab === 'products') shopDrawProducts(body);
  else if (shopTab === 'categories') shopDrawCategories(body);
  else if (shopTab === 'layout') shopDrawLayout(body);
  else shopDrawLook(body);
  body.scrollTop = scroll;
}
function shopPanelDraw() { shopDrawBody(); }

(function buildShopPanel() {
  const p = document.createElement('div');
  p.id = 'shop-panel';
  p.className = 'colors-panel btn-panel hidden';
  p.innerHTML = '<div class="colors-head"><strong>Shop</strong><span class="shop-head-btns"><button id="shop-save" class="tb-btn save-btn">Save</button><button id="shop-close" class="settings-close-btn">&times;</button></span></div>' +
    '<div id="shop-tabs" class="shop-tabs"><button data-tab="products">Products</button><button data-tab="categories">Categories</button><button data-tab="layout">Layout</button><button data-tab="look">Look</button></div>' +
    '<div id="shop-body" class="shop-body"></div>';
  document.body.appendChild(p);
  const closeAll = () => ['colors-panel', 'pagebg-panel', 'button-panel', 'image-panel'].forEach((id) => { const e = byId(id); if (e) e.classList.add('hidden'); });
  const closeShop = () => { p.classList.add('hidden'); shopPreviewOn = false; shopPreviewCat(''); };
  byId('btn-shop').addEventListener('click', () => {
    if (p.classList.contains('hidden')) {
      closeAll(); p.classList.remove('hidden');
      shopFetchProducts().then(() => { shopSyncSwitch(); shopDrawBody(); });
      shopDrawBody();
    } else closeShop();
  });
  byId('shop-close').addEventListener('click', closeShop);
  byId('shop-save').addEventListener('click', () => saveAll());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !p.classList.contains('hidden')) closeShop(); });
  byId('shop-tabs').addEventListener('click', (e) => { const t = e.target.closest('button'); if (t) { shopTab = t.dataset.tab; shopDrawBody(); } });
  ['btn-colors', 'btn-pagebg', 'btn-button', 'btn-imgsize'].forEach((id) => { const b = byId(id); if (b) b.addEventListener('click', () => p.classList.add('hidden')); });
})();

// ???????????????????????????????????????????????????????????????
// DEVICE PREVIEW: Tablet / Mobile / Laptop ... show the REAL live site at that screen size
// (with your unsaved changes), so what you see here is exactly what visitors get.
// ???????????????????????????????????????????????????????????????
const DEVICE_SIZES = { Tablet: [768, 1024], Mobile: [375, 812], 'Phone landscape': [812, 375], Laptop: [1366, 768], 'Big screen': [1920, 1080] };
let devTimer = null;
function devName() {
  try { const d = editor.Devices.get(editor.getDevice()); return d ? d.get('name') : 'Desktop'; } catch (_) { return 'Desktop'; }
}
function devActive() { return !!DEVICE_SIZES[devName()]; }
function devData() {
  flushEditing();
  const d = { 'pages.json': { pages }, 'settings.json': collectSettings() };
  Object.keys(drafts).forEach((id) => { d['page-' + id + '.json'] = drafts[id]; });
  d['page-' + currentPage + '.json'] = snapshot();
  return d;
}
function devOverlay() {
  let o = byId('dev-preview');
  if (o) return o;
  o = document.createElement('div');
  o.id = 'dev-preview';
  o.innerHTML = '<div class="dp-bar"><span id="dp-label"></span><span class="dp-note">This is the live site at this size, so scaling is exactly what visitors see. Switch to Desktop to edit.</span><button type="button" class="tb-btn" id="dp-refresh">&#8635; Refresh</button><button type="button" class="tb-btn" id="dp-back">Back to Desktop</button></div><div class="dp-stage"><div class="dp-box" id="dp-box"><iframe id="dp-frame" title="Device preview"></iframe></div></div>';
  editor.Canvas.getElement().appendChild(o);
  byId('dp-refresh').addEventListener('click', () => devRefresh());
  byId('dp-back').addEventListener('click', () => editor.setDevice('Desktop'));
  window.addEventListener('resize', devLayout);
  return o;
}
function devLayout() {
  const o = byId('dev-preview');
  if (!o || !devActive()) return;
  const [w, h] = DEVICE_SIZES[devName()];
  const stage = o.querySelector('.dp-stage');
  const s = Math.min(1, (stage.clientWidth - 30) / w, (stage.clientHeight - 20) / h);
  const box = byId('dp-box'), fr = byId('dp-frame');
  fr.style.width = w + 'px'; fr.style.height = h + 'px';
  fr.style.transform = 'scale(' + s + ')';
  box.style.width = Math.round(w * s) + 'px'; box.style.height = Math.round(h * s) + 'px';
  byId('dp-label').textContent = devName() + '  ' + w + ' \u00D7 ' + h + (s < 1 ? '  (shown at ' + Math.round(s * 100) + '%)' : '');
}
function devRefresh() {
  if (!devActive()) return;
  window.__epData = devData();
  byId('dp-frame').src = '/?ep=1&t=' + Date.now();
}
function devSync() {
  const o = devOverlay();
  const on = devActive();
  o.style.display = on ? 'flex' : 'none';
  if (!on) { byId('dp-frame').src = 'about:blank'; return; }
  devLayout();
  devRefresh();
}
function devSchedule() {
  if (typeof devActive !== 'function' || !byId('dev-preview') || !devActive()) return;
  clearTimeout(devTimer);
  devTimer = setTimeout(devRefresh, 900);
}
editor.on('change:device', () => setTimeout(devSync, 60));
editor.on('update', devSchedule);
