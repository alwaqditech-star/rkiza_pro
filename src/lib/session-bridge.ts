/** جسر الجلسة — التوكن محفوظ في httpOnly cookie فقط (لا sessionStorage) */

export async function syncSessionCookie(token: string): Promise<void> {
  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(
      json?.message ||
        'فشل حفظ الجلسة — تأكد من تطابق JWT_SECRET بين rkiza-pro و rkiza-api على Vercel',
    );
  }
}

export async function clearSessionCookie(): Promise<void> {
  await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
}
