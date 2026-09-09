import http from 'http';

// Test universal BFS crawler logic
async function fetchUrl(url) {
  return new Promise((resolve) => {
    const proxyUrl = `http://localhost:5173/api/proxy?url=${encodeURIComponent(url)}`;
    http.get(proxyUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, html: data }));
    }).on('error', e => resolve({ ok: false, status: 0, html: '' }));
  });
}

async function crawlSite(startUrl, maxPages = 50) {
  const rootUrl = new URL(startUrl).href;
  const hostname = new URL(rootUrl).hostname;
  const queue = [{ url: rootUrl, depth: 0 }];
  const visited = new Set();
  const enqueued = new Set([rootUrl]);
  const discovered = [];

  console.log(`Starting crawl for ${rootUrl} (domain: ${hostname})...`);

  while (queue.length > 0 && discovered.length < maxPages) {
    const item = queue.shift();
    if (visited.has(item.url)) continue;
    visited.add(item.url);

    const res = await fetchUrl(item.url);
    if (!res.ok) continue;

    // Parse links with regex (Node testing)
    const links = new Set();
    const hrefRegex = /href=["']([^"'#\s]+)/gi;
    let match;
    while ((match = hrefRegex.exec(res.html)) !== null) {
      try {
        const resolved = new URL(match[1], item.url);
        if ((resolved.protocol === 'http:' || resolved.protocol === 'https:') && resolved.hostname === hostname) {
          resolved.hash = '';
          const norm = resolved.href;
          if (!norm.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|zip)$/i)) {
            links.add(norm);
          }
        }
      } catch (e) {}
    }

    discovered.push({ url: item.url, depth: item.depth });

    for (const link of links) {
      if (!visited.has(link) && !enqueued.has(link) && (discovered.length + queue.length) < maxPages) {
        enqueued.add(link);
        queue.push({ url: link, depth: item.depth + 1 });
      }
    }
  }

  console.log(`Crawled ${discovered.length} real pages from ${startUrl}!`);
  console.log('Sample pages:', discovered.slice(0, 5).map(p => p.url));
}

crawlSite('https://www.phrtax.cpa', 100);
