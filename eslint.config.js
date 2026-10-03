import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'

export default [
  { ignores: ['dist/', 'node_modules/', 'playwright-report/', 'test-results/', 'coverage/'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: ts.parser } },
    // Tip denetimini vue-tsc yapar; tarayıcı globalleri için no-undef gereksiz.
    rules: { 'no-undef': 'off' },
  },
]
