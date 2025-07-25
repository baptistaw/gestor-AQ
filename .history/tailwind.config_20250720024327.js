/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./frontend/**/*.{html,ts,tsx}",
    "./components/**/*.{html,ts,tsx}",
    "./backend/src/**/*.{ts,tsx}",     // si interpolas clases en el SSR
  ],
  theme: { extend: {} },
  plugins: [],
};
