/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    ...['emerald', 'amber', 'gray', 'sky'].flatMap(c => [
      `text-${c}-600`, `text-${c}-700`, `text-${c}-800`,
      `bg-${c}-50`, `bg-${c}-100`,
    ]),
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
      },
    },
  },
  plugins: [],
}

