// Callout type registry — single source of truth for the (default label, icon,
// alias set) of every callout type LFM can produce. Pure data, no JSX/CSS.
//
// To add a new callout type:
//   1. Add an entry to `CALLOUT_TYPES` below.
//   2. Add a corresponding `.ak-callout--{key}` rule in `callout.css` setting
//      `--callout-accent` to a named-token color from `theme.css`.
//
// Anything not in this map (e.g., `> [!unknown]`) falls back to `note`.

export interface CalloutTypeMeta {
  // Human-readable default label. Used when the markdown author omits a title.
  label: string;
  // Inline SVG path content (the `<path d="..."/>` bits inside a 24x24 viewBox).
  // Single-color line-style icons; stroke is set on the wrapper <svg> element.
  iconPaths: string;
}

const I = {
  // Lucide-style 24x24 single-stroke icons. Kept inline so callouts have zero
  // runtime icon dependencies. Each value is the inner SVG content only.
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14a5 5 0 1 0-6.18 0c.61.49 1.09 1.27 1.09 2v2h4v-2c0-.73.48-1.51 1.09-2Z"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  triangle: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  octagon: '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2"/>',
  beaker: '<path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/>',
  question: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
};

// Canonical type keys → metadata. Aliases (warn, tldr, hint, etc.) are
// mapped onto these via `resolveCalloutType()` below.
export const CALLOUT_TYPES = {
  note:      { label: 'Note',      iconPaths: I.pencil },
  info:      { label: 'Info',      iconPaths: I.info },
  tip:       { label: 'Tip',       iconPaths: I.lightbulb },
  success:   { label: 'Success',   iconPaths: I.check },
  warning:   { label: 'Warning',   iconPaths: I.triangle },
  danger:    { label: 'Danger',    iconPaths: I.octagon },
  quote:     { label: 'Quote',     iconPaths: I.quote },
  example:   { label: 'Example',   iconPaths: I.beaker },
  question:  { label: 'Question',  iconPaths: I.question },
  important: { label: 'Important', iconPaths: I.bell },
} satisfies Record<string, CalloutTypeMeta>;

export type CalloutType = keyof typeof CALLOUT_TYPES;

// Aliases — author-friendly synonyms that route to a canonical type.
const ALIASES: Record<string, CalloutType> = {
  warn:        'warning',
  caution:     'warning',
  attention:   'warning',
  fail:        'danger',
  failure:     'danger',
  error:       'danger',
  bug:         'danger',
  hint:        'tip',
  check:       'success',
  done:        'success',
  todo:        'note',
  abstract:    'info',
  summary:     'info',
  tldr:        'info',
  faq:         'question',
  help:        'question',
};

export function resolveCalloutType(raw: string | undefined | null): CalloutType {
  if (!raw) return 'note';
  const key = raw.toLowerCase().trim();
  if (key in CALLOUT_TYPES) return key as CalloutType;
  if (key in ALIASES) return ALIASES[key];
  return 'note';
}

export function getCalloutMeta(type: CalloutType): CalloutTypeMeta {
  return CALLOUT_TYPES[type];
}
