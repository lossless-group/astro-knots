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
      backgroundColor: theme("colors.primary.DEFAULT"),
      color: "#fff"
    },
    ".btn-secondary": {
      backgroundColor: theme("colors.secondary.DEFAULT"),
      color: "#fff"
    },
    ".btn-accent": {
      backgroundColor: theme("colors.accent.DEFAULT"),
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