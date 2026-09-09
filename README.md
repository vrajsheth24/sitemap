# SitemapFlow - Modern Visual Sitemap Generator & Website Crawler

A state-of-the-art, full-featured web application that crawls any website, analyzes SEO health, visualizes directory structures in an interactive tree view, and generates standard-compliant `sitemap.xml` files.

---

## 🌟 Key Features

1. **High-Performance Web Crawler**:
   - Depth-limited concurrent crawler with breadth-first queue.
   - Respects `robots.txt` directives (allow/disallow & crawl-delay).
   - Extracts SEO metadata: `<title>`, `<meta description>`, `<h1>`, `<link rel="canonical">`, `<meta name="robots">`, HTTP status codes, response times, and page sizes.
   - Extracts images with `src`, `alt`, and `title` for `<image:image>` sitemap extensions.
   - Subdomain and URL regex inclusion/exclusion filters.

2. **Google-Compliant `sitemap.xml` Generator**:
   - Generates compliant XML (`http://www.sitemaps.org/schemas/sitemap/0.9`).
   - Supports Google Image Sitemap extensions (`http://www.google.com/schemas/sitemap-image/1.1`).
   - Smart priority & change frequency calculator based on page depth.
   - Exports in multiple formats: **XML**, **CSV** (SEO audit report), **TXT** (clean URL list), and **JSON**.

3. **Real-Time Live Dashboard & Terminal**:
   - Server-Sent Events (SSE) live streaming of discovered URLs, crawl progress, and queue size.
   - Live speedometer, status code counters (2xx/3xx/4xx/5xx), and error flags.
   - Live syntax-highlighted XML preview with one-click copy.
   - Live stdout terminal feed with color-coded logs.

4. **Interactive Visual Site Hierarchy Tree**:
   - Automatically builds a nested directory tree showing how pages link together.
   - Collapsible/expandable folder nodes with page count badges.
   - One-click page inspection modal with full SEO metrics.

5. **SEO Health & Broken Link Audit**:
   - Automatically flags 4xx/5xx broken links, missing title tags, missing meta descriptions, slow response times (> 1.5s), and noindex tags.
   - Provides an aggregate 0-100 SEO health index.

6. **Sitemap Validator & Search Engine Submission Guide**:
   - Validate any pasted XML content or fetch external live sitemaps.
   - Direct step-by-step submission guides for Google Search Console and Bing Webmaster Tools.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application
```bash
npm start
```
The server will start on `http://localhost:3000`.

### 3. Open in Browser
Visit [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, Axios, Cheerio, robots-parser, xmlbuilder2
- **Frontend**: HTML5, Vanilla CSS (Glassmorphic dark design system), Vanilla JavaScript (SSE streaming, dynamic DOM), Lucide Icons
