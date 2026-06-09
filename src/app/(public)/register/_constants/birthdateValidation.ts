export const BIRTHDATE_RULES = {
  year: /^\d{4}$/,
  month: /^(0?[1-9]|1[0-2])$/,
  day: /^(0?[1-9]|[12]\d|3[01])$/,
} as const;
