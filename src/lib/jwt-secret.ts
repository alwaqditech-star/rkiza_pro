/** يجب أن يطابق القيمة الافتراضية في api_project */
export const JWT_SECRET_DEFAULT = 'rikaz_secret_key_change_in_production';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || JWT_SECRET_DEFAULT;
}
