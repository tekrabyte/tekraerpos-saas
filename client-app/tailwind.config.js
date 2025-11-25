/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Opsional: Anda bisa menambahkan custom font size di sini jika perlu
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        'html': { fontSize: '12px' },
        'body': { fontSize: '12px' },
      });
    }
  ],
}