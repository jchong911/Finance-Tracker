export type PasswordCheck = {
  valid: boolean;
  errors: string[];
};

export function validatePassword(password: string): PasswordCheck {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("At least 10 characters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("At least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("At least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("At least one number");
  }

  return { valid: errors.length === 0, errors };
}
