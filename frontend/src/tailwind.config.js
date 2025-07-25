// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // TODOS los lugares donde escribes clases Tailwind
    "./frontend/**/*.{html,js,ts,jsx,tsx}",
    "./backend/views/**/*.ejs",          // ← si usas vistas del backend
    "./components/**/*.{ts,tsx,jsx,js}", // ← tus componentes separados
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",  // azul Tailwind‑500, ejemplo
      },
    },
  },
  plugins: [],
};
