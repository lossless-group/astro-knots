// ============================================================================
// Mode Switcher Utility — canonical 3-mode implementation.
// Modes: 'light' | 'dark' | 'vibrant'
//
// Pattern reference (copy into your site's src/utils/, do not import directly).
// Source: packages/ui/theme-mode/utils/mode-switcher.js
// Spec:   context-v/blueprints/Maintain-Themes-Mode-Across-CSS-Tailwind.md §4
//
// Behavior:
// - Persists selection in localStorage under 'mode'.
// - Sets `data-mode` on <html>; adds Tailwind `dark` class for dark + vibrant
//   (both use dark backgrounds).
// - SSR-safe (guards window/document access).
// - Emits a 'mode-change' CustomEvent on `window` for reactive UI.
// - Exposes `window.modeSwitcher` so non-ESM scripts can call it.
// ============================================================================

const VALID_MODES = ['light', 'dark', 'vibrant'];

export class ModeSwitcher {
  constructor() {
    this.currentMode = this.getStoredMode() || this.getSystemPreference();
    this.applyMode(this.currentMode, true);
  }

  getStoredMode() {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('mode');
    return VALID_MODES.includes(stored) ? stored : null;
  }

  getSystemPreference() {
    if (typeof window === 'undefined') return 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  storeMode(mode) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mode', mode);
    }
  }

  applyMode(mode, initialLoad = false) {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const next = VALID_MODES.includes(mode) ? mode : 'dark';

    html.setAttribute('data-mode', next);

    // Tailwind's `dark` utility class — kept on for both dark and vibrant
    // since both use dark backgrounds.
    if (next === 'dark' || next === 'vibrant') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    if (!initialLoad) {
      this.currentMode = next;
      this.storeMode(next);
    }
    this.dispatchModeChange(next);
  }

  dispatchModeChange(mode) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mode-change', { detail: { mode } }));
    }
  }

  /**
   * Cycle: light → dark → vibrant → light.
   * For pinning a specific mode use setMode().
   */
  toggleMode() {
    const idx = VALID_MODES.indexOf(this.currentMode);
    const next = VALID_MODES[(idx + 1) % VALID_MODES.length];
    this.applyMode(next);
    return next;
  }

  setMode(mode) {
    if (!VALID_MODES.includes(mode)) {
      console.warn(`[mode-switcher] Invalid mode: ${mode}. Valid: ${VALID_MODES.join(', ')}`);
      return this.currentMode;
    }
    this.applyMode(mode);
    return mode;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  getValidModes() {
    return [...VALID_MODES];
  }
}

export const modeSwitcher = new ModeSwitcher();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    modeSwitcher.applyMode(
      modeSwitcher.getStoredMode() || modeSwitcher.getSystemPreference(),
      true
    );
  });
}

if (typeof window !== 'undefined') {
  window.modeSwitcher = window.modeSwitcher || modeSwitcher;
}
