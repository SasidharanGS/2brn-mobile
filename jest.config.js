module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?(?:(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|native-base|react-native-svg|nativewind|react-native-css-interop|react-native-markdown-display|react-native-reanimated|expo(-.*)?|@expo/.*|@testing-library))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  // A modest global floor — a regression backstop, not a target. The UI / native /
  // context layers can't be unit-tested on this RN 0.85 stack (RTL render() is
  // unavailable — see docs/DECISIONS.md), so coverage is concentrated in the pure-logic
  // modules. Raise these as more logic is pushed into testable units.
  coverageThreshold: {
    global: { statements: 30, branches: 25, functions: 25, lines: 30 },
  },
}
