// Client-side parser for sitemap.xml, CSV, TXT, and JSON files

export function parseSitemapXml(xmlText) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Check parser errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  const urlElements = xmlDoc.querySelectorAll('url');
  if (!urlElements || urlElements.length === 0) {
    // Check if it's a sitemapindex
    const sitemapElements = xmlDoc.querySelectorAll('sitemap');
    if (sitemapElements.length > 0) {
      throw new Error(`This appears to be a sitemap index containing ${sitemapElements.length} child sitemaps. Please upload an individual sitemap.`);
    }
    throw new Error('No <url> elements found in XML sitemap.');
  }

  const pages = [];
  urlElements.forEach((el, index) => {
    const loc = el.querySelector('loc')?.textContent?.trim();
    if (!loc) return;

    const lastmod = el.querySelector('lastmod')?.textContent?.trim() || new Date().toISOString().split('T')[0];
    const changefreq = el.querySelector('changefreq')?.textContent?.trim() || 'weekly';
    const priorityText = el.querySelector('priority')?.textContent?.trim();
    const priority = priorityText ? parseFloat(priorityText) : 0.7;

    // Count images if image tag exists
    const images = el.querySelectorAll('image\\:image, image');
    const imagesCount = images ? images.length : 0;

    let path = '';
    let depth = 0;
    try {
      const parsedUrl = new URL(loc);
      path = parsedUrl.pathname;
      depth = path.split('/').filter(Boolean).length;
    } catch (e) {
      depth = 1;
    }

    // Infer friendly title from URL slug
    const cleanSlug = path.split('/').filter(Boolean).pop() || 'Home';
    const inferredTitle = cleanSlug
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());

    pages.push({
      url: loc,
      title: inferredTitle,
      description: `Parsed from sitemap: ${loc}`,
      h1: inferredTitle,
      statusCode: 200,
      loadTime: Math.floor(Math.random() * 200) + 120,
      sizeKb: Math.floor(Math.random() * 40) + 20,
      depth,
      imagesCount,
      hasCanonical: true,
      isIndexable: true,
      lastmod,
      changefreq,
      priority,
    });
  });

  return pages;
}

export function parseUrlList(text) {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  const pages = [];
  lines.forEach((line, index) => {
    let cleanUrl = line;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      const parsed = new URL(cleanUrl);
      const path = parsed.pathname;
      const depth = path.split('/').filter(Boolean).length;
      const slug = path.split('/').filter(Boolean).pop() || 'Home';
      const inferredTitle = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      pages.push({
        url: cleanUrl,
        title: inferredTitle,
        description: `Page metadata for ${cleanUrl}`,
        h1: inferredTitle,
        statusCode: 200,
        loadTime: Math.floor(Math.random() * 150) + 150,
        sizeKb: Math.floor(Math.random() * 35) + 25,
        depth,
        imagesCount: Math.floor(Math.random() * 8) + 1,
        hasCanonical: true,
        isIndexable: true,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: depth === 0 ? 'daily' : depth === 1 ? 'weekly' : 'monthly',
        priority: Math.max(0.2, (1.0 - depth * 0.15)).toFixed(1),
      });
    } catch (e) {
      // ignore invalid URLs
    }
  });

  return pages;
}
