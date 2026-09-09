import http from 'http';
import https from 'https';

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, 'http://localhost:3344');
  const target = urlObj.searchParams.get('url');
  if (!target) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Missing url parameter' }));
  }

  try {
    const client = target.startsWith('https') ? https : http;
    const proxyReq = client.get(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': proxyRes.headers['content-type'] || 'text/html',
        'Access-Control-Allow-Origin': '*'
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: err.message }));
    });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(3344, () => {
  console.log('Proxy test running on port 3344');
  
  // Test it with phrtax.cpa
  http.get('http://localhost:3344/?url=https%3A%2F%2Fwww.phrtax.cpa', (r) => {
    let data = '';
    r.on('data', c => data += c);
    r.on('end', () => {
      console.log('Proxy response status:', r.statusCode, 'data len:', data.length);
      server.close();
    });
  });
});
