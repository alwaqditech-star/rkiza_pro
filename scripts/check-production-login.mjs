/**
 * فحص سريع لسلسلة تسجيل الدخول على الإنتاج
 * node scripts/check-production-login.mjs
 */
const API = 'https://rkiza-api.vercel.app';
const PRO = 'https://rkiza-pro.vercel.app';

const username = process.argv[2] ?? 'osama';
const password = process.argv[3] ?? 'osama123';

async function main() {
  console.log('1) فحص API...');
  const health = await fetch(`${API}/api/health`).then((r) => r.json());
  console.log(health.success ? '   ✓ API + DB OK' : '   ✗ API health failed', health.message ?? '');

  console.log('2) تسجيل الدخول على API...');
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const login = await loginRes.json();
  if (!login.success || !login.token) {
    console.log('   ✗ فشل login:', login.message);
    process.exit(1);
  }
  console.log('   ✓ login OK, role =', login.data?.role);

  console.log('3) حفظ الجلسة على rkiza-pro (/api/session)...');
  const sessionRes = await fetch(`${PRO}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: PRO,
      Referer: `${PRO}/`,
    },
    body: JSON.stringify({ token: login.token }),
  });
  const session = await sessionRes.json().catch(() => ({}));
  if (!sessionRes.ok) {
    console.log('   ✗ فشل session:', session.message, `(HTTP ${sessionRes.status})`);
    if (sessionRes.status === 401) {
      console.log('\n→ الحل: في Vercel → rkiza-pro → Settings → Environment Variables');
      console.log('   أضف JWT_SECRET بنفس قيمة rkiza-api ثم Redeploy');
    }
    process.exit(1);
  }
  console.log('   ✓ session OK — rkiza-pro جاهز لتسجيل الدخول');
}

main().catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
