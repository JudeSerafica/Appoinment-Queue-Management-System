// Password policy. The API enforces the same rules (password_problem in functions.php);
// checking here as well just gives faster feedback.
export const PASSWORD_HINT = 'At least 8 characters, with a letter and a number'

export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long'
  // bcrypt only uses the first 72 bytes of a password
  if (new TextEncoder().encode(password).length > 72) return 'Password must be at most 72 characters long'
  if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  return null
}
