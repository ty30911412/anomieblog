/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 使用 next/font 注入的 CSS 變數
        serif: ['var(--font-noto-serif-tc)', 'Georgia', 'serif'],
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        paper: '#fdfbf7',
        ink: {
          50:  '#f5f2eb',
          100: '#e8e4dc',
          200: '#d1cdc5',
          300: '#b0aba0',
          400: '#8f887c',
          500: '#70695d',
          600: '#575148',
          700: '#423d36',
          800: '#36312d',
          900: '#26221f',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
