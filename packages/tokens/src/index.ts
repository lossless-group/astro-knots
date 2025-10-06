export type ColorScale = { [step: number]: string };
export interface Tokens {
  brandName?: string;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral?: ColorScale;
  };
}

export const tokens: Tokens = {
  colors: {
    primary: { 500: "#2563eb" },
    secondary: { 500: "#06b6d4" },
    accent: { 500: "#f59e0b" }
  }
};

export default tokens;