export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 20,
  hasLetter: /[a-zA-Z]/,
  hasUppercase: /[A-Z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^a-zA-Z0-9]/,
  /** 입력 필드 안내 문구. 위 규칙과 함께 바꿔야 검증과 안내가 어긋나지 않는다. */
  guideText: "8자 이상, 영문(대문자 포함) + 숫자 + 특수문자 조합",
} as const;
