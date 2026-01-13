/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apex-dark': '#1a1a1a',
        'apex-darker': '#0d0d0d',
        'apex-accent': '#0ea5e9',
      }
    },
  },
  plugins: [],
}
