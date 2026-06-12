import fs from 'node:fs';
import path from 'node:path';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

function findRouteFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findRouteFiles(full));
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      found.push(path.normalize(full));
    }
  }
  return found;
}

const routes = findRouteFiles(apiDir);

if (routes.length > 0) {
  console.error(
    '\n[خطأ] مسارات API محلية غير مسموحة — احذفها.\n' +
      '       التوجيه إلى rkiza-api.vercel.app عبر next.config.ts\n',
  );
  for (const file of routes) {
    console.error(`  ✗ ${path.relative(process.cwd(), file)}`);
  }
  process.exit(1);
}

console.log('[OK] /api/* → https://rkiza-api.vercel.app (next.config rewrites)');
