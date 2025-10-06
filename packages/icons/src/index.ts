export type IconName = "arrowRight" | "logo" | "brand";

const icons: Record<IconName, string> = {
  arrowRight:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M13 5l7 7-7 7M5 12h14"/></svg>',
  logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>',
  brand:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="4"/></svg>'
};

export function getIcon(name: IconName): string {
  return icons[name] ?? "";
}

export default getIcon;