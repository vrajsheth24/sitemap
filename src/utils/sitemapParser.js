// Client-side parser for sitemap.xml, CSV, TXT, and JSON files

const today = () => new Date().toISOString().split('T')[0];

function inferTitle(path) {
  const slug = path.split('/').filter(Boolean).pop() || 'Home';
  return decodeURIComponentSafe(slug)
    .replace(/\.(php|html|htm|aspx|jsp)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function decodeURIComponentSafe(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    return text;
  }
}

function defaultPriority(depth) {
  return Math.max(0.2, parseFloat((1.0 - depth * 0.15).toFixed(1)));
}

function defaultChangefreq(depth) {
  return depth === 0 ? 'daily' : depth === 1 ? 'weekly' : 'monthly';
}

export function parseSitemapXml(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check parser errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  const urlElements = xmlDoc.getElementsByTagNameNS('*', 'url');
  if (!urlElements || urlElements.length === 0) {
    // Check if it's a sitemapindex
    const sitemapElements = xmlDoc.getElementsByTagNameNS('*', 'sitemap');
    if (sitemapElements.length > 0) {
      throw new Error(`This appears to be a sitemap index containing ${sitemapElements.length} child sitemaps. Please upload an individual sitemap.`);
    }
    throw new Error('No <url> elements found in XML sitemap.');
  }

  // Direct child text by local name (avoids matching <image:loc> instead of <loc>)
  const childText = (el, name) => {
    for (const child of el.children) {
      if (child.localName === name) return child.textContent.trim();
    }
    return '';
  };

  const pages = [];
  const seen = new Set();
  Array.from(urlElements).forEach(el => {
    const loc = childText(el, 'loc');
    if (!loc || seen.has(loc)) return;
    seen.add(loc);

    const images = Array.from(el.getElementsByTagNameNS('*', 'image'))
      .map(img => childText(img, 'loc'))
      .filter(Boolean);

    let path = '';
    let depth = 1;
    try {
      path = new URL(loc).pathname;
      depth = path.split('/').filter(Boolean).length;
    } catch (e) {}

    const priorityText = childText(el, 'priority');
    const parsedPriority = parseFloat(priorityText);
    const inferredTitle = inferTitle(path);

    pages.push({
      url: loc,
      title: inferredTitle,
      description: `Parsed from sitemap: ${loc}`,
      h1: inferredTitle,
      statusCode: 200,
      loadTime: 0,
      sizeKb: 0,
      depth,
      imagesCount: images.length,
      images,
      hasCanonical: true,
      isIndexable: true,
      lastmod: childText(el, 'lastmod') || today(),
      changefreq: childText(el, 'changefreq') || 'weekly',
      priority: Number.isNaN(parsedPriority) ? 0.7 : parsedPriority,
    });
  });

  return pages;
}

// Accepts plain URL lists as well as CSV/TSV exports (first URL-looking cell per row)
export function parseUrlList(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  const pages = [];
  const seen = new Set();
  lines.forEach(line => {
    const cells = line.split(/[,\t;]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
    let cleanUrl = cells.find(c => /^https?:\/\//i.test(c)) || cells[0];
    if (!cleanUrl || /\s/.test(cleanUrl)) return;
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      const parsed = new URL(cleanUrl);
      // Skip header rows like "URL" which would otherwise parse as https://url/
      if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') return;
      if (seen.has(parsed.href)) return;
      seen.add(parsed.href);

      const depth = parsed.pathname.split('/').filter(Boolean).length;
      const inferredTitle = inferTitle(parsed.pathname);

      pages.push({
        url: parsed.href,
        title: inferredTitle,
        description: `Page metadata for ${parsed.href}`,
        h1: inferredTitle,
        statusCode: 200,
        loadTime: 0,
        sizeKb: 0,
        depth,
        imagesCount: 0,
        images: [],
        hasCanonical: true,
        isIndexable: true,
        lastmod: today(),
        changefreq: defaultChangefreq(depth),
        priority: defaultPriority(depth),
      });
    } catch (e) {
      // ignore invalid URLs
    }
  });

  return pages;
}

// Accepts a SitemapFlow JSON export, or a plain array of URL strings
export function parseJsonPages(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : Array.isArray(data?.pages) ? data.pages : null;
  if (!list) {
    throw new Error('JSON must be an array of pages or URL strings.');
  }

  const urlStrings = list.filter(item => typeof item === 'string');
  const fromStrings = urlStrings.length ? parseUrlList(urlStrings.join('\n')) : [];

  const fromObjects = list
    .filter(item => item && typeof item === 'object' && typeof item.url === 'string')
    .map(item => {
      const fallback = parseUrlList(item.url)[0];
      if (!fallback) return null;
      return {
        ...fallback,
        ...item,
        url: fallback.url,
        images: Array.isArray(item.images) ? item.images : [],
        imagesCount: Array.isArray(item.images) ? item.images.length : (item.imagesCount || 0)
      };
    })
    .filter(Boolean);

  const seen = new Set();
  return [...fromObjects, ...fromStrings].filter(p => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });
}
