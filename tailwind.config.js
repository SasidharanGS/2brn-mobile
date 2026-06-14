/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Semantic theme tokens — resolved at runtime from CSS variables the
        // ThemeProvider injects per skin (modern/minimal) × mode (light/dark).
        // Use these (`bg-bg`, `text-fg`, `border-rule`, `bg-accent`, …) instead
        // of hardcoded slate/blue so a screen reskins itself with the toggle.
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        rule: 'var(--rule)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-strong': 'var(--accent-strong)',
        ink: {
          0: 'var(--ink-0)',
          1: 'var(--ink-1)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        // Back-compat alias: existing `bg-primary` / `text-primary` map to the
        // active accent during the screen-by-screen migration.
        primary: {
          DEFAULT: 'var(--accent)',
          500: 'var(--accent)',
          600: 'var(--accent-strong)',
          700: 'var(--accent-strong)',
        },
      },
    },
  },
  plugins: [],
}
