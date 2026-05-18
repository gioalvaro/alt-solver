module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: { node: true, browser: true, es2022: true },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['src/server/**/*.gs'],
      parser: 'espree',
      parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
      env: { browser: false, node: false },
      globals: {
        SpreadsheetApp: 'readonly',
        HtmlService: 'readonly',
        Session: 'readonly',
        Logger: 'readonly',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-undef': 'error',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
};
