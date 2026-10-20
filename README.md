# INTEERNEETS WEB — Studio Website

A static studio website with a "Coming Soon" landing page, full visual CMS, and direct Shopify checkout integration.

---

## ⚡ Quick Start (Local Preview)

1. Open the folder: `Desktop\INTEERNEETS\INTEERNEETS WEB`
2. Double-click `RUN WEBSITE.bat`.
3. Your browser will open to:
   - **Website**: `http://localhost:8000`
   - **CMS Admin**: `http://localhost:8000/admin/`

---

## 🚀 How to Put This Live on Netlify (Free)

1. **Push to GitHub**:
   - Commit all files in this folder to your GitHub repository `inteerneets/INTEERNEETS`.
2. **Connect to Netlify**:
   - Go to [netlify.com](https://www.netlify.com) $\rightarrow$ Add New Site $\rightarrow$ Import an existing project from GitHub.
   - Choose your repo `INTEERNEETS`.
   - Leave build command blank and publish directory as `.`. Click **Deploy site**.
3. **Enable Identity & Git Gateway (for the Admin panel)**:
   - In Netlify, go to **Site configuration** $\rightarrow$ **Identity** $\rightarrow$ **Enable Identity**.
   - Scroll down to **Services** $\rightarrow$ click **Enable Git Gateway**.
   - Under Identity $\rightarrow$ click **Invite users** $\rightarrow$ invite your own email.
   - Open the confirmation link in your email to set your password.
4. Go to `https://your-site.netlify.app/admin/` and log in to start editing!

---

## ✏️ Features & Controls

1. **Direct Shopify Purchases (No Inquiry Forms)**:
   - All pieces (both studio works and merchandise) use direct Shopify checkout.
   - Purchases create real orders / tickets in your Shopify backend with full shipping and customer details.
2. **Visual Live Preview**:
   - In `/admin/`, editing text, font sizes, and colors updates a live side-by-side preview in real-time.
3. **Dark Mode Admin**:
   - The `/admin/` dashboard has a dark theme.
4. **Freeform Layer System**:
   - In the Home Page section of the admin, you can add new text blocks or images and position them freely on top of the page using top/left percentages and layer order (z-index).
5. **Per-Element Font & Color Controls**:
   - Heading and subtitle font families, sizes, and colors can be customized individually.
6. **"EMAIL US" Button**:
   - A direct link configured to open an email directly to `inteerneets@gmail.com`.
7. **Pure Flat Colors**:
   - In **Site Settings**, you can set background colors (like pure white `#ffffff`) with zero gray shading. A dark shading toggle is available if you ever want shading over a background photo.
8. **Zero-Flash Loading**:
   - Refreshes render smoothly without flashing default template text.
