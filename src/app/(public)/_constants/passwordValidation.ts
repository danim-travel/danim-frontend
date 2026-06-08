export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 20,
  hasLetter: /[a-zA-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^a-zA-Z0-9]/,
} as const;

export const NICKNAME_RULES = {
  minLength: 2,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9가-힣]+$/,
  inputFilter: /[^a-zA-Z0-9가-힣]/g,
} as const;
