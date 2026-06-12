/** مصدر البيانات — API المنشور على Vercel */
export const API_URL = 'https://rkiza-api.vercel.app';

/** عنوان API الذي تستخدمه الواجهة (الوكيل في /api/*) */
export function getApiBaseUrl(): string {
  const fromEnv =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();

  return (fromEnv || API_URL).replace(/\/$/, '');
}
