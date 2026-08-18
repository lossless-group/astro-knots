/**
 * Tiny frontmatter splitter + minimal YAML parser scoped to our changelog +
 * context-v frontmatter shape. Intentionally not a general YAML parser —
 * Astro Knots tech hierarchy: "fewer dependencies is always better." We control
 * the frontmatter format, so we parse only what we author.
 *
 * Supports:
 * - Top-level `key: value` lines
 * - Quoted strings ("..." or '...') with simple escape handling
 * - YAML block-style arrays (`key:` followed by indented `  - item` lines)
 * - YAML flow-style arrays (`key: [a, b, c]`)
 * - Booleans (`true`/`false`/`yes`/`no`)
 * - Numbers (integers and floats)
 * - Bare/unquoted scalars (left as strings — zod schemas in content.config.ts
 *   coerce dates and other types where needed)
 *
 * Does NOT support:
 * - Nested mappings beyond one level (keys inside keys)
 * - Anchors, aliases, tags
 * - Multi-line block scalars (`|`, `>`)
 */

/**
 * YAML block scalar header: `|`, `>`, with optional chomping (`-`/`+`) and an
 * optional explicit indent digit — e.g. `>-`, `|2`, `>2-`.
 */
const BLOCK_SCALAR_RE = /^([|>])([0-9]*)([-+]?)$/;

/**
 * Read an indented text block beneath a block-scalar header and fold it per the
 * YAML rules we actually use.
 *
 *   `|`  literal — newlines preserved
 *   `>`  folded  — lines joined with a single space
 *   `-`  strip   — no trailing newline (what every lede/summary in this tree uses)
 *
 * Returns null when there is no indented body, so the caller can fall through.
 */
function readIndentedBlock(
  lines: string[],
  start: number,
  style: string,
  chomp: string,
): { text: string | null; consumed: number } {
  const collected: string[] = [];
  let i = start;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { collected.push(''); i++; continue; }
    if (!/^[ \t]/.test(line)) break;   // dedent ends the block
    collected.push(line.replace(/^[ \t]+/, ''));
    i++;
  }
  while (collected.length && collected[collected.length - 1] === '') collected.pop();
  if (collected.length === 0) return { text: null, consumed: 0 };
  let text = style === '|' ? collected.join('\n') : collected.join(' ').replace(/\s+/g, ' ').trim();
  if (chomp === '+') text += '\n';
  return { text, consumed: i - start };
}

const FENCE_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/;

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  body: string;
}

export function parseFrontmatter(text: string): ParsedFrontmatter {
  const match = text.match(FENCE_RE);
  if (!match) {
    return { data: {}, body: text };
  }
  const [, fmText, body] = match;
  return { data: parseYamlSubset(fmText), body };
}

function parseYamlSubset(text: string): Record<string, unknown> {
  const lines = text.split(/\r?\n/);
  const data: Record<string, unknown> = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    if (line.startsWith(' ') || line.startsWith('\t')) {
      i++;
      continue;
    }

    const colonIdx = findKeyColon(line);
    if (colonIdx < 0) {
      i++;
      continue;
    }

    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    if (rest === '' || BLOCK_SCALAR_RE.test(rest)) {
      const { items, consumed } = readIndentedArray(lines, i + 1);
      if (items !== null) {
        data[key] = items;
        i += 1 + consumed;
        continue;
      }
      // Not a list. If a block-scalar header was given, the indented body is
      // text — fold it rather than dropping the value on the floor.
      const bs = rest.match(BLOCK_SCALAR_RE);
      if (bs) {
        const { text, consumed: used } = readIndentedBlock(lines, i + 1, bs[1], bs[3]);
        if (text !== null) {
          data[key] = text;
          i += 1 + used;
          continue;
        }
      }
      data[key] = null;
      i++;
      continue;
    }

    data[key] = parseScalarOrFlow(rest);
    i++;
  }

  return data;
}

function findKeyColon(line: string): number {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\' && (inSingle || inDouble)) {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === ':' && !inSingle && !inDouble) {
      const next = line[i + 1];
      if (next === undefined || next === ' ' || next === '\t' || next === '\r') return i;
    }
  }
  return -1;
}

interface ArrayReadResult {
  items: string[] | null;
  consumed: number;
}

function readIndentedArray(lines: string[], startIdx: number): ArrayReadResult {
  const items: string[] = [];
  let i = startIdx;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const m = line.match(/^(\s+)-\s+(.*)$/);
    if (!m) break;
    items.push(unquote(m[2].trim()));
  }
  return items.length > 0
    ? { items, consumed: i - startIdx }
    : { items: null, consumed: 0 };
}

function parseScalarOrFlow(raw: string): unknown {
  const stripped = stripTrailingComment(raw).trim();

  if (stripped.startsWith('[') && stripped.endsWith(']')) {
    const inner = stripped.slice(1, -1).trim();
    if (inner === '') return [];
    return splitFlowList(inner).map((s) => parseScalarOrFlow(s.trim()));
  }

  if (
    (stripped.startsWith('"') && stripped.endsWith('"')) ||
    (stripped.startsWith("'") && stripped.endsWith("'"))
  ) {
    return unquote(stripped);
  }

  const lower = stripped.toLowerCase();
  if (lower === 'true' || lower === 'yes' || lower === 'on') return true;
  if (lower === 'false' || lower === 'no' || lower === 'off') return false;
  if (lower === 'null' || lower === '~' || lower === '') return null;

  if (/^-?\d+$/.test(stripped)) return Number(stripped);
  if (/^-?\d+\.\d+$/.test(stripped)) return Number(stripped);

  return stripped;
}

function stripTrailingComment(s: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\' && (inSingle || inDouble)) {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble && (i === 0 || s[i - 1] === ' ' || s[i - 1] === '\t')) {
      return s.slice(0, i);
    }
  }
  return s;
}

function splitFlowList(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\' && (inSingle || inDouble)) {
      buf += ch + (s[++i] ?? '');
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if ((ch === '[' || ch === '{') && !inSingle && !inDouble) depth++;
    else if ((ch === ']' || ch === '}') && !inSingle && !inDouble) depth--;
    else if (ch === ',' && depth === 0 && !inSingle && !inDouble) {
      out.push(buf);
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim() !== '') out.push(buf);
  return out;
}

function unquote(s: string): string {
  if (s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
  }
  if (s.startsWith("'") && s.endsWith("'")) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
}
