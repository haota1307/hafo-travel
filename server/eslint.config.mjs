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
    files: ['**/tests/authorizer-http.spec.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '../../authorizer/src/app/modules/authorizer/controllers/authorizer.controller',
            '../../authorizer/src/app/modules/authorizer/services/authorizer.service',
            '../../authorizer/src/app/modules/keycloak/controllers/keycloak.controller',
            '../../authorizer/src/app/modules/keycloak/services/keycloak-http.service',
            '../../user-access/src/app/modules/user/controllers/user.controller',
            '../../user-access/src/app/modules/user/services/user.service',
            '../../user-access/src/app/modules/user/repositories/user.repository',
          ],
          depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }],
        },
      ],
    },
  },
];
