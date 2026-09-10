import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy plugin to crawl any website on the internet without CORS restrictions
function devProxyPlugin() {
  return {
    name: 'dev-cors-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        const urlObj = new URL(req.url, 'http://localhost:5173');
        const target = urlObj.searchParams.get('url');
        if (!target) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Missing url parameter' }));
        }

        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);

          const upstreamRes = await fetch(target, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          clearTimeout(timer);

          const contentType = upstreamRes.headers.get('content-type') || 'text/html; charset=utf-8';
          const bodyBuffer = await upstreamRes.arrayBuffer();

          res.statusCode = upstreamRes.status || 200;
          res.setHeader('Content-Type', contentType);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(Buffer.from(bodyBuffer));
        } catch (err) {
          if (!res.headersSent) {
            res.statusCode = err.name === 'AbortError' ? 504 : 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: err.message || 'Proxy request failed' }));
          }
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devProxyPlugin()],
  base: './',
  server: {
    host: '0.0.0.0', // Listen on all network addresses (both IPv4 127.0.0.1 and IPv6 ::1)
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  }
});
