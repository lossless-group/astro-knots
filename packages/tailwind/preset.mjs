// Tailwind preset that extends theme using CSS variables
const preset = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "var(--primary)", 500: "var(--primary)" },
        secondary: { DEFAULT: "var(--secondary)", 500: "var(--secondary)" },
        accent: { DEFAULT: "var(--accent)", 500: "var(--accent)" },
        neutral: { 50: "#f8fafc", 900: "#0f172a" }
      }
    }
  }
};

export default preset;