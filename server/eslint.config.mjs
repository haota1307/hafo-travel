import nx from '@nx/eslint-plugin';

const moduleBoundaries = {
  enforceBuildableLibDependency: true,
  allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
  depConstraints: [
    {
      sourceTag: '*',
      onlyDependOnLibsWithTags: ['*'],
    },
  ],
};

const appModuleBoundaries = {
  ...moduleBoundaries,
  allowCircularSelfDependency: true,
};

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
      '@nx/enforce-module-boundaries': ['error', moduleBoundaries],
    },
  },
  {
    basePath: import.meta.dirname,
    files: ['apps/*/{src,tests}/**/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': ['error', appModuleBoundaries],
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
    basePath: import.meta.dirname,
    files: ['apps/bff/tests/identity-http.spec.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          ...appModuleBoundaries,
          allow: [
            '@identity/auth/controllers/auth.controller',
            '@identity/auth/services/auth.service',
            '@identity/role/controllers/role.controller',
            '@identity/role/repositories/role.repository',
            '@identity/role/services/role.service',
            '@identity/user/controllers/user.controller',
            '@identity/user/repositories/user.repository',
            '@identity/user/services/user.service',
          ],
        },
      ],
    },
  },
];
