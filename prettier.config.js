export default {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  plugins: ['prettier-plugin-organize-imports'],
  overrides: [
    {
      files: '*.jsonc',
      options: {
        trailingComma: 'none',
      },
    },
  ],
}
