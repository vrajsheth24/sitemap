// Verify new queue crawler logic
const targetUrl = 'https://www.phrtax.cpa';
const maxPages = 1000;
const maxDepth = 4;

const phrTaxPages = [
  { path: 'firmprofile.php', title: 'Firm Profile' },
  { path: 'pricing.php', title: 'Pricing & Fee Schedule' },
  { path: 'services.php', title: 'Our Services Overview' },
  { path: 'contact.php', title: 'Contact Us' }
];

const queue = [{ url: targetUrl + '/', depth: 0 }];
const visited = new Set();
const enqueued = new Set([targetUrl + '/']);

for (const p of phrTaxPages) {
  const full = `${targetUrl}/${p.path}`;
  if (!enqueued.has(full)) {
    enqueued.add(full);
    queue.push({ url: full, depth: 1, customMeta: p });
  }
}

const discovered = [];
while (queue.length > 0 && discovered.length < maxPages) {
  const item = queue.shift();
  if (visited.has(item.url)) continue;
  visited.add(item.url);
  discovered.push({ url: item.url, depth: item.depth, title: item.customMeta?.title || 'Home' });
}

console.log('Crawled pages count:', discovered.length);
console.log('First 2:', discovered.slice(0, 2));
console.log('Last 2:', discovered.slice(-2));
