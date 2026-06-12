/** عنوان API المنشور على Vercel */
export const PRODUCTION_API_URL = 'https://rkiza-api.vercel.app';

/** يُستخدم من الوكيل في src/app/api/[...path]/route.ts */
export function getApiBaseUrl(): string {
  const raw =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    PRODUCTION_API_URL;

  return raw.replace(/\/$/, '');
}
