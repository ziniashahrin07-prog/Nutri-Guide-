export interface SignUpValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates sign-up form fields for Nutri Guide authentication.
 * Performs a direct, unmodified comparison (password === confirmPassword).
 * Preserves exact passwords including leading/trailing spaces and special characters.
 */
export function validateSignUpFields(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): SignUpValidationResult {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Please enter your full name.' };
  }
  if (!email || !email.trim()) {
    return { isValid: false, error: 'Please enter your email address.' };
  }
  if (!password) {
    return { isValid: false, error: 'Please enter a password.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters long.' };
  }
  if (!confirmPassword) {
    return { isValid: false, error: 'Passwords do not match. Please verify your password.' };
  }
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match. Please verify your password.' };
  }
  return { isValid: true, error: null };
}
