import fs from 'node:fs';
import path from 'node:path';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const allowedRoutes = new Set([
  path.normalize(path.join(apiDir, 'session', 'route.ts')),
  path.normalize(path.join(apiDir, 'session', 'token', 'route.ts')),
]);

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
const disallowed = routes.filter((file) => !allowedRoutes.has(file));

if (disallowed.length > 0) {
  console.error(
    '\n[خطأ] مسارات API محلية غير مسموحة — احذفها.\n' +
      '       البيانات عبر https://rkiza-api.vercel.app\n' +
      '       المسموح فقط: /api/session (جسر الجلسة)\n',
  );
  for (const file of disallowed) {
    console.error(`  ✗ ${path.relative(process.cwd(), file)}`);
  }
  process.exit(1);
}

console.log('[OK] البيانات → https://rkiza-api.vercel.app | الجلسة → /api/session');
