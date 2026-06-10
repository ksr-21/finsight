/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#4F46E5',
        'secondary': '#10B981',
        'background': '#F3F4F6',
        'card': '#FFFFFF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'primary-dark': '#6366F1',
        'secondary-dark': '#34D399',
      },
    },
  },
  plugins: [],
}
