import { FlatCompat } from '@eslint/eslintrc';
import { globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['apps/api/**/*.ts'],
  })),
  ...compat
    .extends('next/core-web-vitals')
    .map((config) => ({ ...config, files: ['apps/web/**/*.{js,jsx,ts,tsx}'] })),
  globalIgnores(['apps/api/dist/**', 'apps/web/.next/**', 'coverage/**']),
];
