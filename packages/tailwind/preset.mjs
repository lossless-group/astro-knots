import tokens from "@knots/tokens";

// Tailwind preset that extends theme using shared tokens
const preset = {
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        secondary: tokens.colors.secondary,
        accent: tokens.colors.accent,
        neutral: tokens.colors.neutral ?? { 50: "#f8fafc", 900: "#0f172a" }
      }
    }
  }
};

export default preset;