import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      curly: ['error', 'all'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['function', 'class'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['if', 'for', 'while', 'do', 'try', 'switch'] },
        { blankLine: 'always', prev: ['if', 'for', 'while', 'do', 'try', 'switch'], next: '*' },
        { blankLine: 'any', prev: 'if', next: 'if' },
      ],
    },
  },
  {
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'features/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'i18n/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
    ],
    ignores: ['app/*/template/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/template', '@/template/**'],
              message: 'Application code must not depend on the UI demo in template/.',
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
