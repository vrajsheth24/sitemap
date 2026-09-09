const axios = require('axios');

async function testEndpoints() {
  console.log('--- 1. Testing Crawl Start Endpoint ---');
  const startRes = await axios.post('http://localhost:3000/api/crawl/start', {
    url: 'https://example.com',
    maxPages: 5,
    maxDepth: 1
  });
  console.log('Crawl Start Response:', startRes.data);
  const jobId = startRes.data.jobId;

  console.log('\n--- 2. Waiting 3s for crawl to finish ---');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n--- 3. Testing XML Export ---');
  const xmlRes = await axios.get(`http://localhost:3000/api/crawl/export/${jobId}/xml`);
  console.log('XML snippet:\n', xmlRes.data.slice(0, 300));

  console.log('\n--- 4. Testing Sitemap Validator ---');
  const valRes = await axios.post('http://localhost:3000/api/sitemap/validate', {
    xml: xmlRes.data
  });
  console.log('Validation results:', valRes.data);

  console.log('\n✅ All tests passed successfully!');
}

testEndpoints().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
