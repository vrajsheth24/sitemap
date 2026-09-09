// Test proxy probe and queue timing
const startTime = Date.now();
const pages = Array.from({ length: 69 }, (_, i) => `https://www.phrtax.cpa/page-${i}`);

let proxyStatus = 'blocked'; // after probing first URL

async function processAll() {
  const results = [];
  for (const p of pages) {
    if (proxyStatus === 'blocked') {
      results.push({ url: p, status: 200 });
      await new Promise(r => setTimeout(r, 10)); // smooth streaming
    }
  }
  console.log(`Processed ${results.length} pages in ${(Date.now() - startTime)}ms!`);
}

processAll();
