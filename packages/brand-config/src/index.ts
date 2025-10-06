export interface BrandConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  assets?: {
    logoLight?: string;
    logoDark?: string;
    favicon?: string;
  };
}

export const water: BrandConfig = {
  name: "Water Foundation",
  colors: {
    primary: "#2563eb",
    secondary: "#06b6d4",
    accent: "#f59e0b"
  },
  assets: {
    logoLight: "/logos/logo-light.svg",
    logoDark: "/logos/logo-dark.svg",
    favicon: "/favicon.svg"
  }
};

export default { water };