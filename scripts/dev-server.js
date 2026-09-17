#!/usr/bin/env node
/**
 * JYSA Media — Localhost Static Server with Clean URLs
 * Replicates Vercel's cleanUrls and redirect rules for faithful local testing.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FRONTEND_DIR = path.resolve(__dirname, '..', 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // 1. Obsolete service stubs redirect rule (mirrors vercel.json)
  const obsoleteMatch = pathname.match(/^\/pages\/services\/(.*)$/);
  if (obsoleteMatch) {
    const slug = obsoleteMatch[1].replace(/\.html$/, '');
    res.writeHead(301, { Location: `/services/${slug}` });
    return res.end();
  }

  // 2. Trailing slash normalization (except root)
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
    res.writeHead(308, { Location: pathname + parsedUrl.search });
    return res.end();
  }

  // 3. Clean URLs redirect: if requested with .html, redirect to clean URL
  if (pathname.endsWith('.html') && pathname !== '/index.html') {
    const cleanPath = pathname.slice(0, -5);
    res.writeHead(308, { Location: cleanPath + parsedUrl.search });
    return res.end();
  }

  // Root maps to /index.html
  let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);

  // Check direct file existence
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(filePath, res);
  }

  // Clean URL resolution: check if filePath + .html exists
  const htmlPath = filePath + '.html';
  if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
    return serveFile(htmlPath, res);
  }

  // 404 Not Found
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h1>404 Not Found</h1>');
});

function getVercelHeaders() {
  try {
    const vjson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'vercel.json'), 'utf8'));
    const headers = {};
    if (vjson.headers && vjson.headers[0] && vjson.headers[0].headers) {
      vjson.headers[0].headers.forEach(h => {
        headers[h.key] = h.value;
      });
    }
    return headers;
  } catch (e) {
    return {};
  }
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    ...getVercelHeaders()
  });
  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, () => {
  console.log(`JYSA Media local server running at http://localhost:${PORT}`);
});
