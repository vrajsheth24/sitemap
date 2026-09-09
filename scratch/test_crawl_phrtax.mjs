import { ClientCrawler } from '../src/utils/clientCrawler.js';

const crawler = new ClientCrawler({
  url: 'https://www.phrtax.cpa',
  maxPages: 1000,
  onProgress: (p) => {
    // console.log(`Progress: ${p.current}/${p.total} (${p.url})`);
  },
  onComplete: (pages) => {
    console.log(`\nCRAWL COMPLETE!`);
    console.log(`Total real pages discovered: ${pages.length}`);
    console.log(`First 5 pages:`, pages.slice(0, 5).map(p => ({ url: p.url, title: p.title })));
    console.log(`Last 5 pages:`, pages.slice(-5).map(p => ({ url: p.url, title: p.title })));
    
    // Check if there are any fake entry- URLs
    const fakePages = pages.filter(p => p.url.includes('entry-'));
    console.log(`Fake 'entry-' pages found: ${fakePages.length}`);
    if (fakePages.length === 0) {
      console.log('SUCCESS: ZERO fake pages generated! All crawled pages are authentic.');
    } else {
      console.error('FAILED: Found synthetic fake pages!');
    }
  }
});

crawler.start();
