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
        CardService: 'readonly',
        Session: 'readonly',
        Logger: 'readonly',
        ScriptApp: 'readonly',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        // Apps Script auto-loads every .gs file into a single global
        // namespace; ESLint runs per-file so cross-file calls look
        // undefined. Disable no-undef for .gs and rely on Apps Script's
        // runtime to catch genuine missing references.
        'no-undef': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
};
