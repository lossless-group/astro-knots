// ============================================================================
// Theme Switcher Utility — canonical brand-theme axis.
//
// Pattern reference (copy into your site's src/utils/, do not import directly).
// Source: packages/ui/theme-mode/utils/theme-switcher.js
// Spec:   context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md §3
//
// Behavior:
// - Persists selection in localStorage under 'theme'.
// - Sets `data-theme` attribute and `theme-{name}` class on <html>.
// - SSR-safe.
// - Emits a 'theme-change' CustomEvent on `window`.
//
// CONFIGURATION — every site adapts the VALID_THEMES list below:
// - Single-brand sites: leave as ['default'] (toggle becomes no-op).
// - Multi-brand sites: add brand keys, e.g. ['default', 'water', 'matter'].
// ============================================================================

const VALID_THEMES = ['default'];

export class ThemeSwitcher {
  constructor() {
    this.currentTheme = this.getStoredTheme() || 'default';
    this.applyTheme(this.currentTheme, true);
  }

  getStoredTheme() {
    if (typeof window === 'undefined') return 'default';
    const stored = localStorage.getItem('theme');
    return VALID_THEMES.includes(stored) ? stored : 'default';
  }

  storeTheme(theme) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  applyTheme(theme, initialLoad = false) {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;

    VALID_THEMES.forEach((t) => html.classList.remove(`theme-${t}`));
    html.removeAttribute('data-theme');

    const next = VALID_THEMES.includes(theme) ? theme : 'default';
    html.setAttribute('data-theme', next);
    html.classList.add(`theme-${next}`);

    if (!initialLoad) {
      this.currentTheme = next;
      this.storeTheme(next);
    }
    this.dispatchThemeChange(next);
  }

  dispatchThemeChange(theme) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme } }));
    }
  }

  /**
   * Cycle through registered themes in order. No-op for single-theme sites.
   */
  toggleTheme() {
    const idx = VALID_THEMES.indexOf(this.currentTheme);
    const next = VALID_THEMES[(idx + 1) % VALID_THEMES.length];
    this.applyTheme(next);
    return next;
  }

  getCurrentTheme() {
    if (typeof document === 'undefined') return this.currentTheme;
    const html = document.documentElement;
    return VALID_THEMES.find((t) => html.classList.contains(`theme-${t}`)) || 'default';
  }

  setTheme(theme) {
    if (!VALID_THEMES.includes(theme)) {
      console.warn(`[theme-switcher] Invalid theme: ${theme}. Valid: ${VALID_THEMES.join(', ')}`);
      return this.currentTheme;
    }
    this.applyTheme(theme);
    return theme;
  }

  getValidThemes() {
    return [...VALID_THEMES];
  }
}

export const themeSwitcher = new ThemeSwitcher();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    themeSwitcher.applyTheme(themeSwitcher.getStoredTheme(), true);
    setTimeout(() => {
      document.documentElement.classList.add('theme-transition');
    }, 0);
  });
}

if (typeof window !== 'undefined') {
  window.themeSwitcher = window.themeSwitcher || themeSwitcher;
}
