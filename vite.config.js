import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'http';
import https from 'https';

// Dev proxy plugin to crawl any website on the internet without CORS restrictions
function devProxyPlugin() {
  return {
    name: 'dev-cors-proxy',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost:5173');
        const target = urlObj.searchParams.get('url');
        if (!target) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          return res.end(JSON.stringify({ error: 'Missing url parameter' }));
        }

        try {
          const client = target.startsWith('https') ? https : http;
          const proxyReq = client.get(target, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9'
            },
            timeout: 8000
          }, (proxyRes) => {
            // Follow 3xx redirects
            if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
              const redirectUrl = new URL(proxyRes.headers.location, target).href;
              const subClient = redirectUrl.startsWith('https') ? https : http;
              return subClient.get(redirectUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                timeout: 8000
              }, (redRes) => {
                res.statusCode = redRes.statusCode || 200;
                res.setHeader('Content-Type', redRes.headers['content-type'] || 'text/html');
                res.setHeader('Access-Control-Allow-Origin', '*');
                redRes.pipe(res);
              }).on('error', (err) => {
                res.statusCode = 502;
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify({ error: err.message }));
              });
            }

            res.statusCode = proxyRes.statusCode || 200;
            res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'text/html');
            res.setHeader('Access-Control-Allow-Origin', '*');
            proxyRes.pipe(res);
          });

          proxyReq.on('error', (err) => {
            if (!res.headersSent) {
              res.statusCode = 502;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ error: err.message }));
            }
          });

          proxyReq.on('timeout', () => {
            proxyReq.destroy();
            if (!res.headersSent) {
              res.statusCode = 504;
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ error: 'Gateway Timeout' }));
            }
          });
        } catch (e) {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: e.message }));
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
