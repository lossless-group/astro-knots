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

export function brandConfigToCSSVars(config: BrandConfig): string {
  return `:root[data-brand="${config.name.toLowerCase()}"]{--primary:${config.colors.primary};--secondary:${config.colors.secondary};--accent:${config.colors.accent};--color-primary-500:${config.colors.primary};--color-secondary-500:${config.colors.secondary};--color-accent-500:${config.colors.accent};}`;
}