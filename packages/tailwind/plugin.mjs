import tailwindPlugin from "tailwindcss/plugin";

// Tailwind plugin for shared components/utilities
const plugin = tailwindPlugin(function ({ addComponents, addUtilities, theme }) {
  const components = {
    ".btn": {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 0.875rem",
      borderRadius: "0.375rem",
      backgroundColor: theme("colors.primary.500"),
      color: "#fff"
    },
    ".btn-secondary": {
      backgroundColor: theme("colors.secondary.500"),
      color: "#fff"
    },
    ".btn-accent": {
      backgroundColor: theme("colors.accent.500"),
      color: "#111827"
    }
  };

  const utilities = {
    ".text-balance": { textWrap: "balance" }
  };

  addComponents(components);
  addUtilities(utilities);
});

export default plugin;