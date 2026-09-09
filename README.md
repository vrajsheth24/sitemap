# SitemapFlow Pro - Modern Visual Sitemap Generator & SEO Intelligence Tool

A dynamic, state-of-the-art **React single-page application** for generating compliant `sitemap.xml` files, exploring interactive directory hierarchies, auditing SEO health, and validating XML structures. 

Built with **100% client-side architecture (zero backend required)** and optimized for instant deployment to **GitHub Pages**.

---

## 🌟 Key Features

1. **Zero-Backend Client-Side Engine**:
   - Runs entirely in the browser with zero server maintenance, databases, or API keys.
   - Dual-mode URL discovery: direct browser fetch with optional CORS proxy fallback.
   - 1-click interactive demo datasets for E-Commerce, SaaS, and Tech Blogs.
   - Universal importer for existing `sitemap.xml`, CSV, TXT, and JSON files.

2. **Interactive Visual Directory Tree**:
   - Converts flat URL lists into collapsible nested directory hierarchies.
   - Node depth badges, status code indicators, and item count tallies.
   - 1-click inspection modal for any node or branch.

3. **Real-Time SEO Health & Audit Suite**:
   - Automated SEO Health Index score (0-100) with dynamic circular SVG gauge.
   - Flags critical broken links (4xx/5xx errors), missing title tags, short/long meta descriptions, and missing `<h1>` headings.
   - Latency and Core Web Vitals response time metrics.

4. **Live XML Studio & Multi-Format Exporter**:
   - Real-time syntax-highlighted `sitemap.xml` with Google Image Sitemap extensions.
   - Export to **XML**, **robots.txt**, **URLs (TXT)**, **SEO Audit (CSV)**, and **JSON**.
   - One-click copy to clipboard with toast notifications and confetti celebrations.

5. **XML Conformance Validator & Search Engine Submission Guide**:
   - Live conformance validator checking against `sitemaps.org 0.9` standards, maximum 50,000 URLs limit, and 50MB size rules.
   - Step-by-step submission checklists for **Google Search Console** and **Bing Webmaster Tools**.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🌐 Deploy to GitHub Pages

This repository includes a ready-to-use **GitHub Actions workflow** located at `.github/workflows/deploy.yml` that automatically builds and deploys the site on every push to the `main` branch.

### How to Enable GitHub Pages:

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Deploy SitemapFlow Pro React application"
   git push origin main
   ```

2. **Enable GitHub Pages in your repository settings**:
   - Open your repository on GitHub: `https://github.com/vrajsheth24/sitemap`
   - Click **Settings** (top tab)
   - In the left sidebar, click **Pages**
   - Under **Build and deployment > Source**, select:
     👉 **GitHub Actions**
   
3. **That's it!** GitHub Actions will automatically run the build and publish your site at:
   👉 **`https://vrajsheth24.github.io/sitemap/`**

### Alternative 1-Command Deployment (Manual):
You can also deploy manually at any time using the `gh-pages` script:
```bash
npm run deploy
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Icons**: Lucide React
- **Animations**: Canvas Confetti & Glassmorphic CSS Design System
- **Hosting**: GitHub Pages (Static / Serverless)
- **CI/CD**: GitHub Actions (`deploy.yml`)

---

## 📄 License

MIT © vrajsheth24
