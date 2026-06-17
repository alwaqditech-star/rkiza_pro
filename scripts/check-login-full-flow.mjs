/**
 * فحص سلسلة تسجيل الدخول الكاملة (مثل المتصفح)
 * node scripts/check-login-full-flow.mjs [baseUrl]
 */
const API = 'https://rkiza-api.vercel.app';
const PRO = process.argv[2] ?? 'https://rikiza-pro.vercel.app';
const username = process.argv[3] ?? 'osama';
const password = process.argv[4] ?? 'osama123';

async function main() {
  console.log(`Base: ${PRO}\n`);

  console.log('1) تسجيل الدخول عبر BFF proxy (كالمتصفح)...');
  const proxyRes = await fetch(`${PRO}/api/proxy/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const proxyText = await proxyRes.text();
  let proxyJson;
  try {
    proxyJson = JSON.parse(proxyText);
  } catch {
    console.log(`   ✗ استجابة غير JSON (${proxyRes.status}):`, proxyText.slice(0, 120));
    process.exit(1);
  }
  if (!proxyRes.ok || !proxyJson.success || !proxyJson.token) {
    console.log('   ✗ فشل proxy login:', proxyJson.message ?? proxyRes.status);
    process.exit(1);
  }
  console.log('   ✓ proxy login OK, role =', proxyJson.data?.role);

  console.log('2) حفظ الجلسة (/api/session)...');
  const sessionRes = await fetch(`${PRO}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: PRO,
      Referer: `${PRO}/`,
      'Sec-Fetch-Site': 'same-origin',
    },
    body: JSON.stringify({ token: proxyJson.token }),
  });
  const setCookie = sessionRes.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie.map((c) => c.split(';')[0]).join('; ');
  const sessionJson = await sessionRes.json().catch(() => ({}));
  if (!sessionRes.ok) {
    console.log('   ✗ فشل session:', sessionJson.message, `(HTTP ${sessionRes.status})`);
    process.exit(1);
  }
  console.log('   ✓ session OK, cookie set:', Boolean(cookieHeader));

  const role = proxyJson.data?.role === 'admin' ? 'admin' : 'client';
  console.log(`3) الوصول إلى /${role} (middleware + layout)...`);
  const dashRes = await fetch(`${PRO}/${role}`, {
    headers: { Cookie: cookieHeader, Accept: 'text/html' },
    redirect: 'manual',
  });
  const location = dashRes.headers.get('location');
  console.log(`   HTTP ${dashRes.status}`, location ? `→ ${location}` : '(بدون إعادة توجيه)');

  if (dashRes.status === 307 || dashRes.status === 302 || dashRes.status === 303) {
    if (location?.includes('/') && !location.includes(`/${role}`)) {
      console.log('\n   ✗ تم إعادة التوجيه لصفحة الدخول — غالباً فشل التحقق من الجلسة في middleware أو layout');
      console.log('   → تأكد من JWT_SECRET على rkiza-pro أو انتظر اكتمال النشر على Vercel');
      process.exit(1);
    }
  }

  if (dashRes.status === 404) {
    console.log('\n   ✗ النشر غير موجود على Vercel (DEPLOYMENT_NOT_FOUND)');
    process.exit(1);
  }

  console.log('\n   ✓ سلسلة تسجيل الدخول الكاملة تعمل');
}

main().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
