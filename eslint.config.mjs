import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['ky', 'ky/*'],
            message: 'ky를 직접 import하지 마세요. src/lib/apiClient.ts를 사용하세요.',
          },
        ],
      }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: 'process.env를 직접 참조하지 마세요. src/lib/config.ts를 사용하세요.',
        },
      ],
    },
  },
  {
    // config.ts는 process.env 접근이 허용되는 유일한 파일
    files: ['src/lib/config.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // apiClient.ts는 ky를 직접 사용하는 유일한 파일
    files: ['src/lib/apiClient.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // providers는 NODE_ENV 체크로 MSW 초기화 — 빌드 타임 상수라 허용
    files: ['src/providers/index.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/mocks/**'],
    rules: {
      'no-restricted-imports': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/mockServiceWorker.js",
  ]),
]);

export default eslintConfig;
