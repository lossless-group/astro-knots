/**
 * @module
 *
 * Frontmatter-only Open Graph backend.
 *
 * Skips network entirely. Returns a soft-fail for every URL — the consuming
 * component is expected to read author-supplied metadata from the directive's
 * own attributes (`title=`, `description=`, `image=`) instead of from the
 * cache.
 *
 * Useful for highly-curated content where the author wants exact control,
 * or for offline builds where any network call would be a regression.
 */

import type { OGBackend } from '../../types/index.js';

export const frontmatterOnly: OGBackend = async (url) => ({
  ok: false,
  error: `frontmatter-only: ${url} not fetched; supply metadata via directive attributes`,
});
