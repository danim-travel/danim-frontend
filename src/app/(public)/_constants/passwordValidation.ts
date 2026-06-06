export const PASSWORD_RULES = {
  minLength: 8,
  hasLetter: /[a-zA-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^a-zA-Z0-9]/,
} as const;
