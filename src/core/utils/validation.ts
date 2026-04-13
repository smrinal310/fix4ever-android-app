/**
 * Client-side validation aligned with backend auth rules.
 * Keeps error messages consistent with backend for a professional experience.
 */

const SPECIALS = "!@#$%^&*()-_=+[]{}|;:',.<>/?`~";

/** Email format (basic). Backend validates required; this avoids unnecessary requests. */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(trimmed);
}

export function getEmailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Email is required.';
  if (!isValidEmail(trimmed)) return 'Please enter a valid email address.';
  return null;
}

/**
 * Password strength – must match backend isStrongPassword() exactly.
 * Backend: min 8 chars, one upper, one lower, one digit, one special.
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }
  let hasUpper = false;
  let hasLower = false;
  let hasDigit = false;
  let hasSpecial = false;
  for (const char of password) {
    if (char >= 'A' && char <= 'Z') hasUpper = true;
    else if (char >= 'a' && char <= 'z') hasLower = true;
    else if (char >= '0' && char <= '9') hasDigit = true;
    else if (SPECIALS.includes(char)) hasSpecial = true;
  }
  if (!hasUpper)
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter.',
    };
  if (!hasLower)
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter.',
    };
  if (!hasDigit)
    return {
      valid: false,
      message: 'Password must contain at least one digit.',
    };
  if (!hasSpecial)
    return {
      valid: false,
      message: 'Password must contain at least one special character.',
    };
  return { valid: true };
}

/** Backend: username required, non-empty after trim. */
export function getUsernameError(value: string): string | null {
  if (!value.trim()) return 'Username is required.';
  return null;
}

/** Backend: phone required. We only check non-empty; backend may validate format. */
export function getPhoneError(value: string): string | null {
  if (!value.trim()) return 'Phone number is required.';
  return null;
}
