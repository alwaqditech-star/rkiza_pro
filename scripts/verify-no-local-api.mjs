import fs from 'node:fs';
import path from 'node:path';

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const allowed = new Set([
  path.normalize(path.join(apiDir, '[...path]', 'route.ts')),
  path.normalize(path.join(apiDir, '.gitkeep')),
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
const illegal = routes.filter((file) => !allowed.has(file));

if (illegal.length > 0) {
  console.error(
    '\n[خطأ] مسارات API محلية غير مسموحة في rikaz_project.\n' +
      '       المسموح فقط: src/app/api/[...path]/route.ts (وكيل لـ api_project)\n',
  );
  for (const file of illegal) {
    console.error(`  ✗ ${path.relative(process.cwd(), file)}`);
  }
  console.error(
    '\n       احذف الملفات أعلاه — كل منطق البيانات في api_project.\n',
  );
  process.exit(1);
}

if (!routes.some((f) => f.endsWith(`${path.sep}[...path]${path.sep}route.ts`))) {
  console.error(
    '\n[خطأ] ملف الوكيل مفقود: src/app/api/[...path]/route.ts\n',
  );
  process.exit(1);
}

console.log('[OK] الواجهة تمرّر /api/* إلى https://rkiza-api.vercel.app');
