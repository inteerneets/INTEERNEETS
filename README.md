# Your Studio Website

A simple, beautiful website with a Coming Soon page, a shop, and an easy-to-use admin panel for editing everything — no coding needed.

---

## 🚀 How to Get This Live (Step by Step)

### Step 1: Create a GitHub Account (free)

1. Go to [github.com](https://github.com) and sign up (it's free)
2. Create a new repository:
   - Click the **+** button → **New repository**
   - Name it something like `my-studio-website`
   - Set it to **Public** (required for free Netlify hosting)
   - Click **Create repository**
3. Upload all the files from this folder to the repository:
   - On the repository page, click **"uploading an existing file"**
   - Drag and drop ALL the files and folders from this `studio-website` folder
   - Click **Commit changes**

### Step 2: Deploy on Netlify (free)

1. Go to [netlify.com](https://www.netlify.com) and click **Sign up** → **Sign up with GitHub**
2. Once logged in, click **Add new site** → **Import an existing project**
3. Choose **GitHub** and select your `my-studio-website` repository
4. Leave all settings as default and click **Deploy site**
5. Wait ~30 seconds — your site is now live! 🎉
6. Netlify gives you a URL like `https://random-name-12345.netlify.app`
   - You can change this to a custom name in **Site settings → Domain management**

### Step 3: Enable the CMS (so you can edit content)

1. In your Netlify dashboard, go to your site
2. Click **Integrations** → **Identity** → **Enable Identity**
3. Under **Identity** → **Services**, click **Enable Git Gateway**
4. Go to **Identity** → **Invite users** and invite yourself (your email)
5. Check your email and accept the invite
6. Now go to `https://your-site.netlify.app/admin/` — you can log in and start editing! ✨

### Step 4: Set Up Your Shopify Buy Buttons (optional — for print-on-demand)

If you want to sell print-on-demand merchandise:

1. **Create a Shopify account** at [shopify.com](https://www.shopify.com) (Starter plan works, ~$5/month)
2. **Install a POD app** (Printful or Printify) from the Shopify App Store
3. **Design your products** in the POD app and publish them to Shopify
4. **Get your Storefront API token:**
   - In Shopify Admin, go to **Settings** → **Apps and sales channels** → **Develop apps**
   - Create a new app, enable **Storefront API** access
   - Copy the **Storefront API access token**
5. **Get your product IDs:**
   - In Shopify Admin, click on a product
   - The URL will look like: `https://admin.shopify.com/store/your-store/products/1234567890`
   - The number at the end (`1234567890`) is the product ID
6. **Add these to your site:**
   - Go to your CMS admin panel (`your-site.netlify.app/admin/`)
   - Go to **⚙️ Site Settings** → **General Settings**
   - Paste your Shopify domain and Storefront API token
   - Go to **🛍️ Shop** → **Shop Page**
   - Add your product IDs under **Print-on-Demand Products**

---

## ✏️ How to Edit Your Website

Once set up, go to `https://your-site.netlify.app/admin/` and log in.

### Things you can change:

| What | Where in the admin |
|---|---|
| Studio name & logo | ⚙️ Site Settings → General Settings |
| Colors (background, text, accent) | ⚙️ Site Settings → General Settings |
| Social media links | ⚙️ Site Settings → General Settings |
| Home page heading & subtitle | 📄 Pages → Home Page |
| Home page background image | 📄 Pages → Home Page |
| Call-to-action button | 📄 Pages → Home Page |
| Shop page titles | 🛍️ Shop → Shop Page |
| Add/edit/remove in-person items | 🛍️ Shop → Shop Page → In-Person Items |
| Mark items as sold | 🛍️ Shop → Shop Page → toggle "Available" off |
| Add POD product IDs | 🛍️ Shop → Shop Page → Print-on-Demand Products |

### How saving works:
1. Make your changes in the admin panel
2. Click **Publish** (or **Save**)
3. The CMS saves your changes to GitHub automatically
4. Netlify detects the change and rebuilds your site (~30 seconds)
5. Your changes are live! ✅

---

## 📬 Inquiry Form (Ticket System)

When someone fills out the inquiry form on your shop page:
- You'll receive an email notification (sent by Netlify)
- You can also see all submissions in your **Netlify dashboard → Forms**
- Each submission includes: their name, email, which item they're interested in, and their message

To manage the email notifications:
1. Go to your Netlify dashboard → **Forms** → **Form notifications**
2. Add an **Email notification** with your email address

---

## 🌐 Custom Domain (optional)

To use your own domain (e.g., `yourstudio.com`):
1. Buy a domain from a registrar (Namecheap, Google Domains, etc.)
2. In Netlify, go to **Domain management** → **Add custom domain**
3. Follow Netlify's instructions to point your domain's DNS to Netlify
4. Netlify will automatically set up free HTTPS/SSL

---

## 📁 File Structure

```
studio-website/
├── index.html          ← Home page (Coming Soon)
├── shop.html           ← Shop page
├── css/style.css       ← Styling (colors come from CMS settings)
├── js/main.js          ← Loads content, handles forms, Shopify
├── content/            ← CMS-managed content (don't edit directly)
│   ├── settings.json   ← Studio name, colors, socials, Shopify config
│   ├── home.json       ← Home page text and images
│   └── shop.json       ← Shop items and POD product IDs
├── images/uploads/     ← Images uploaded through the CMS
├── admin/
│   ├── index.html      ← CMS entry point
│   └── config.yml      ← CMS configuration
└── netlify.toml        ← Netlify deployment settings
```

---

## 💡 Tips

- **Test locally**: You can open `index.html` directly in your browser to preview. For full functionality (loading JSON files), use a local server: right-click the folder → open in terminal → run `npx serve` or `python -m http.server 8000`
- **Hiding the shop**: If you want to launch with just the Coming Soon page, go to **Site Settings** and turn off "Show Shop Link in Navigation"
- **Changing colors**: The whole site's color scheme can be changed from **Site Settings** — try different accent colors to match your brand!
- **Images**: For best results, use images at least 1200px wide. The CMS automatically stores them in the `images/uploads/` folder.
