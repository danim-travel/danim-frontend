export const NICKNAME_RULES = {
  minLength: 2,
  maxLength: 10,
  // 영문·숫자·_·. 만 허용
  pattern: /^[a-zA-Z0-9_.]+$/,
  // 입력 중 허용 문자 외 키 입력을 실시간으로 걸러낼 때 사용
  inputFilter: /[^a-zA-Z0-9_.]/g,
} as const;
