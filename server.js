'use strict';
// Zero-dependency static file server for the Newton page.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.join(__dirname, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; img-src 'self' data:",
};

function send(res, status, body, extra = {}) {
  res.writeHead(status, { ...HEADERS, ...extra });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
  }

  if (req.url === '/healthz') {
    return send(res, 200, 'ok', { 'Content-Type': 'text/plain' });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, 'Bad Request');
  }
  if (pathname.includes('\0')) return send(res, 400, 'Bad Request');
  if (pathname.endsWith('/')) pathname += 'index.html';

  // Resolve and make sure the result stays inside ROOT (blocks ../ traversal).
  const file = path.join(ROOT, path.normalize(pathname));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    return send(res, 403, 'Forbidden');
  }

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' });
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const cache = type.startsWith('text/html') ? 'no-cache' : 'public, max-age=86400';
    res.writeHead(200, {
      ...HEADERS,
      'Content-Type': type,
      'Content-Length': stat.size,
      'Cache-Control': cache,
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Newton site listening on :${PORT}`));

// Stop cleanly when Docker sends SIGTERM.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
