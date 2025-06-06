import eslintPlugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{ts,tsx,js}'],
    ignores: ['backups/**'],
    languageOptions: {
      parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': eslintPlugin,
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'double'],
    },
  },
];
