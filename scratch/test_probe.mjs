import { ClientCrawler } from '../src/utils/clientCrawler.js';

console.log('Testing speed with probe logic...');
const start = Date.now();

const crawler = new ClientCrawler({
  url: 'https://www.phrtax.cpa',
  maxPages: 1000
});

console.log('Target:', crawler.targetUrl);
console.log('Hostname:', crawler.hostname);
