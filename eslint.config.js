// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat')

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'dist/*',
      '.expo/*',
      'android/*',
      'ios/*',
      'node_modules/*',
      'coverage/*',
      'babel.config.js',
      'metro.config.js',
    ],
  },
]
