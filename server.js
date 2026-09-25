import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const port = Number(process.env.PORT || 41741);

function findIndex(dir, depth = 0) {
  if (depth > 3) return null;

  const direct = path.join(dir, 'index.html');
  if (fs.existsSync(direct)) return direct;

  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }

  const skip = new Set([
    '.git', 'node_modules', 'playwright-report',
    'test-results', 'screenshots', '.github'
  ]);

  for (const entry of entries) {
    if (!entry.isDirectory() || skip.has(entry.name)) continue;
    const found = findIndex(path.join(dir, entry.name), depth + 1);
    if (found) return found;
  }
  return null;
}

const indexFile = findIndex(repoRoot);
if (!indexFile) {
  console.error('Could not find index.html within the repository.');
  process.exit(1);
}

const root = path.dirname(indexFile);

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/') pathname = '/index.html';

  const target = path.resolve(root, '.' + pathname);

  if (!target.startsWith(root)) {
    res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(target, (statErr, stat) => {
    const file = !statErr && stat.isDirectory()
      ? path.join(target, 'index.html')
      : target;

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'content-type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'
      });
      res.end(data);
    });
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Forest Radio test server: http://127.0.0.1:${port}`);
  console.log(`Serving: ${root}`);
});
