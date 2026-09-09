// Test queue logic for ClientCrawler
const rootUrl = 'https://www.phrtax.cpa/';
const visited = new Set();
const enqueued = new Set([rootUrl]);
const queue = [{ url: rootUrl, depth: 0 }];

console.log('Queue initialized:', queue.length);
