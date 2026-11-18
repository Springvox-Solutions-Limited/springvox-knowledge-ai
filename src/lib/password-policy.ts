const MIN_LENGTH = 10;
const MAX_LENGTH = 128;

const WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'letmein123',
  'admin12345',
]);

/**
 * Shared server-side password policy. Supabase Auth also has a dashboard
 * policy, but admin-created users and invite registration must enforce this
 * before calling the Auth admin API.
 */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters.`;
  }
  if (password.length > MAX_LENGTH) {
    return `Password must be at most ${MAX_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    return 'That password is too common. Choose a different one.';
  }
  return null;
}
