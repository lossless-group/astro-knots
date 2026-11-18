/**
 * Markdown bodies for the changelog and context-v detail pages, rendered
 * through LFM (@lossless-group/lfm). Adapted from the context-vigilance-kit
 * splash.
 *
 * The content loaders store each entry's raw body and no rendered HTML, so
 * Astro's render() would return an empty page. Pages parse the body here with
 * parseMarkdown and render the MDAST tree via components/markdown/AstroMarkdown.astro,
 * so callouts, hex-code citations, code blocks and images all follow LFM.
 *
 * Links between notes work in any form: `[[Name]]`, `[[path/Name|alias]]`,
 * `[[Name#Heading]]`, and markdown links like `[alias](../path/Name.md)`. They're
 * resolved before parsing: a note published on this site links to its page;
 * anything else (a note from a repo that isn't rolled up, one not written
 * yet) stays as plain text. Code is left as written.
 */
import { getCollection } from 'astro:content';
import { parseMarkdown } from '@lossless-group/lfm';

type Index = Map<string, string>;
let index: Index | null = null;

const isPublished = (data: { publish?: unknown }) => data.publish !== false;

/** Lowercased name or id → site path (relative to BASE_URL). */
async function siteIndex(): Promise<Index> {
  if (index) return index;
  index = new Map();
  for (const e of await getCollection('context-v').catch(() => [])) {
    if (!isPublished(e.data as { publish?: unknown })) continue;
    const href = `context-v/${e.id}/`;
    const name = e.id.split('/').pop()!.toLowerCase();
    index.set(e.id.toLowerCase(), href);
    // Without its repo prefix (astro-knots/specs/X → specs/X), and by name alone.
    index.set(e.id.split('/').slice(1).join('/').toLowerCase(), href);
    if (!index.has(name)) index.set(name, href);
  }
  for (const e of await getCollection('changelog').catch(() => [])) {
    if (!isPublished(e.data as { publish?: unknown })) continue;
    const href = `changelog/${e.id}/`;
    index.set(e.id.toLowerCase(), href);
    const name = e.id.split('/').pop()!.toLowerCase();
    if (!index.has(name)) index.set(name, href);
  }
  return index;
}

/** Matches the renderer's fallback heading id (AstroMarkdown.astro). */
function headingId(heading: string): string {
  return heading.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

/** Code first, so a link shown as an example inside code is passed over. */
const LINK = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)|\[\[([^[\]\n]+?)\]\]|(?<!!)\[([^\]\n]*)\]\(((?![a-z][a-z0-9+.-]*:)[^)\s]*\.md(?:#[^)\s]*)?)\)/gi;

export async function resolveLinks(body: string): Promise<string> {
  const idx = await siteIndex();
  const base = import.meta.env.BASE_URL;
  const render = (target: string, alias?: string) => {
    const [rawPath, heading] = target.split('#');
    const path = rawPath.trim().replace(/^(\.\.?\/)+/, '').replace(/^\//, '').replace(/\.md$/i, '');
    const name = path.split('/').pop()!;
    const anchor = heading?.trim() ? `#${headingId(heading)}` : '';
    // No alias? Show the filename the way an alias would: - and _ as spaces.
    const label = (alias || name.replace(/[-_]+/g, ' ') || heading || '').trim();
    if (!path) return `[${label}](${anchor})`;
    const key = path.replace(/^context-v\//, '').toLowerCase();
    const href = idx.get(key) ?? idx.get(name.toLowerCase());
    return href ? `[${label}](${base}${href}${anchor})` : label;
  };
  return body.replace(LINK, (match, code, wiki, text, href) => {
    if (code) return match;
    if (href) return render(decodeURI(href), text);
    // Inside a table cell the pipe is written `\|`.
    const [target, ...alias] = wiki.replace(/\\\|/g, '|').split('|');
    return render(target, alias.join('|'));
  });
}

export async function renderable(body: string | undefined) {
  // The page header already shows the title, so drop a leading `# Title`,
  // looking past the "Rolled up from …" comment the rollup puts above it.
  const text = (body ?? '').replace(/^(\s*<!--[\s\S]*?-->)*\s*#\s+[^\n]*\n/, '');
  const tree = await parseMarkdown(await resolveLinks(text));
  const citations = ((tree as any)?.data?.citations?.ordered ?? []) as any[];
  return { tree, citations };
}
