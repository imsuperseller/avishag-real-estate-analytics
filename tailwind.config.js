/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E195AB',
        'primary-light': '#FFCCE1',
        background: '#F2F9FF',
        highlight: '#FFF5D7',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}; 