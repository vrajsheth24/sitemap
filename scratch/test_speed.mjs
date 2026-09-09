import { ClientCrawler } from '../src/utils/clientCrawler.js';

console.log('Testing optimized ClientCrawler...');
const startTime = Date.now();

const crawler = new ClientCrawler({
  url: 'https://www.phrtax.cpa',
  maxPages: 1000,
  concurrency: 6,
  onProgress: (p) => {
    // process.stdout.write(`\rProgress: ${p.current} pages (${p.url.slice(0, 40)})`);
  },
  onComplete: (pages) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nDONE in ${elapsed}s! Discovered ${pages.length} real pages.`);
  }
});

// crawler.start();
