export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_MIN_LENGTH_MESSAGE = `كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل`;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}
