import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const IMPORT = 'import { apiFetch, apiUrl } from "@/lib/api-client";\n';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next'].includes(entry.name)) walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function ensureImport(content) {
  if (content.includes('@/lib/api-client')) return content;
  const clientMatch = content.match(/^(['"])use client\1;?\r?\n/);
  if (clientMatch) {
    return content.replace(clientMatch[0], `${clientMatch[0]}${IMPORT}`);
  }
  return `${IMPORT}${content}`;
}

let count = 0;
for (const file of walk(SRC)) {
  if (file.includes('api-client.ts')) continue;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  if (!content.includes('fetch("/api/') && !content.includes("fetch('/api/") && !content.includes('fetch(`/api/')) {
    continue;
  }

  content = content.replace(/fetch\((['"`])\/api\//g, 'apiFetch($1/api/');
  content = ensureImport(content);

  if (content !== original) {
    fs.writeFileSync(file, content);
    count += 1;
    console.log('updated', path.relative(process.cwd(), file));
  }
}

console.log(`Done: ${count} files`);
