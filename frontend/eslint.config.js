import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const noParentImports = {
  group: ['../*', '../**', './*/**', './*/*'],
  message: 'Use @/ for cross-directory imports; ./ is only for the same directory.',
}

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'no-restricted-imports': ['error', { patterns: [noParentImports] }],
    },
  },
  ...[
    ['src/components/features/**/*.{ts,tsx}', ['@/pages/**']],
    ['src/components/common/**/*.{ts,tsx}', ['@/pages/**', '@/components/features/**']],
    ['src/components/ui/**/*.{ts,tsx}', ['@/pages/**', '@/components/features/**']],
    ['src/hooks/**/*.{ts,tsx}', ['@/pages/**', '@/components/**']],
    ['src/services/**/*.{ts,tsx}', ['@/pages/**', '@/components/**', '@/hooks/**', 'react', 'react-dom']],
    ['src/lib/**/*.{ts,tsx}', ['@/pages/**', '@/components/**', '@/hooks/**', '@/services/**', 'react', 'react-dom']],
  ].map(([files, group]) => ({
    files: [files],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noParentImports, { group, message: 'Respect the frontend layer dependency rules.' }] }],
    },
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/services/**'],
    rules: {
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Network calls belong in services/.' }],
    },
  },
)
