import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Reglas del PRD §16 y §24 convertidas en errores de lint (anti-patrones prohibidos).
export default tseslint.config(
  { ignores: ['dist', 'coverage', 'docs', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // NFR-FE-005 / FE-011: sin any
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // §24.7: un solo enfoque de enrutamiento, sin react-router-dom
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-router-dom',
              message: 'React Router v8: importar desde "react-router".',
            },
            { name: 'axios', message: 'PRD §16: fetch nativo encapsulado en lib/http.ts.' },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "TSTypeReference[typeName.right.name='FC']",
          message: 'FE-011: no usar React.FC; tipar las props con interface.',
        },
        {
          selector: "TSTypeReference[typeName.name='FC']",
          message: 'FE-011: no usar FC; tipar las props con interface.',
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: '§24.10: prohibido dangerouslySetInnerHTML.',
        },
        {
          selector: "JSXIdentifier[name='BrowserRouter']",
          message: 'FE-007: usar createBrowserRouter + RouterProvider.',
        },
        {
          selector: 'TSEnumDeclaration',
          message: 'PRD §16: usar uniones literales / z.enum en lugar de enum de TS.',
        },
      ],
      // §24.6: nunca localStorage ni cookies (el token vive en memoria/sessionStorage)
      'no-restricted-globals': [
        'error',
        { name: 'localStorage', message: '§24.6: prohibido localStorage.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: '§24.6: prohibido localStorage.' },
        { object: 'document', property: 'cookie', message: '§24.6: prohibido usar cookies.' },
      ],
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    files: ['src/test/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
    extends: [tseslint.configs.disableTypeChecked],
  },
)
