import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    rules: {
      curly: ['error', 'all'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['function', 'class'], next: '*' },
        {
          blankLine: 'always',
          prev: '*',
          next: ['if', 'for', 'while', 'do', 'try', 'switch'],
        },
        {
          blankLine: 'always',
          prev: ['if', 'for', 'while', 'do', 'try', 'switch'],
          next: '*',
        },
        { blankLine: 'any', prev: 'if', next: 'if' },
      ],
    },
  },
  {
    files: ['**/tests/identity-http.spec.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '../../identity/src/app/modules/auth/controllers/auth.controller',
            '../../identity/src/app/modules/auth/services/auth.service',
            '../../identity/src/app/modules/user/controllers/user.controller',
            '../../identity/src/app/modules/user/services/user.service',
            '../../identity/src/app/modules/user/repositories/user.repository',
            '../../identity/src/app/modules/role/controllers/role.controller',
            '../../identity/src/app/modules/role/services/role.service',
            '../../identity/src/app/modules/role/repositories/role.repository',
          ],
          depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }],
        },
      ],
    },
  },
];
