/** يجب أن يطابق القيمة في api_project / rkiza-api على Vercel */
export const JWT_SECRET_DEFAULT = 'rikaz_secret_key_change_in_production';

export function isJwtSecretConfigured(): boolean {
  return Boolean(process.env.JWT_SECRET?.trim());
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[rikaz] JWT_SECRET غير مضبوط في الإنتاج — رفض التحقق المحلي من التوكن',
    );
    return '';
  }

  return JWT_SECRET_DEFAULT;
}
