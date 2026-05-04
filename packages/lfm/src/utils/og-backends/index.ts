/**
 * @module
 *
 * Backend registry — maps `OGBackendName` config strings to backend modules.
 *
 * The `proxy` backend is reserved for a future self-hosted scraping proxy
 * (e.g. Browserless). Until that lands it falls through to `direct` so a
 * site that pre-emptively wired `backend: 'proxy'` continues to function
 * without an opaque crash at config-load time.
 */

import type { OGBackend, OGBackendName } from '../../types/index.js';
import { direct } from './direct.js';
import { openGraphIo } from './opengraph-io.js';
import { frontmatterOnly } from './frontmatter-only.js';

export function getBackend(name: OGBackendName): OGBackend {
  switch (name) {
    case 'direct':
      return direct;
    case 'opengraph-io':
      return openGraphIo;
    case 'frontmatter-only':
      return frontmatterOnly;
    case 'proxy':
      // Not yet implemented — fall back to direct rather than crashing.
      return direct;
  }
}

export { direct, openGraphIo, frontmatterOnly };
