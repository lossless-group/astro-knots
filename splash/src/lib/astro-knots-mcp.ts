// Setup copy for astro-knots-mcp (mcps/astro-knots-mcp), shown in the
// homepage's "Build a site" section. Keep in step with the Worker's own
// landing page (worker/landing.ts in that repo).

export const MCP_REPO = 'lossless-group/astro-knots-mcp';
export const MCP_REPO_URL = `https://github.com/${MCP_REPO}`;

// The link MCP's URL, once the Worker is deployed. Empty hides the MCP step,
// so the page never shows a server that doesn't answer yet.
export const MCP_URL = '';

export const INSTALL = {
  claudeCode: [
    `claude plugin marketplace add ${MCP_REPO}`,
    'claude plugin install astro-knots@astro-knots-mcp',
  ],
  codex: [
    `codex plugin marketplace add ${MCP_REPO}`,
    '/plugins   → install Astro Knots',
    '/hooks     → trust its hook',
  ],
};

export function setupPrompt(mcpUrl: string = MCP_URL): string {
  const lines = [
    "Set me up with Astro Knots, so you can help me build a website that follows The Lossless Group's patterns: Astro with Svelte, Lossless Flavored Markdown, tests, three color modes, and share images and SEO done right.",
    '',
    'Step 1. Install the Astro Knots plugin (its skills, plus a check that runs on every edit). Use whichever applies:',
    `- Claude Code: run  ${INSTALL.claudeCode[0]}  and then  ${INSTALL.claudeCode[1]}  then tell me to restart the session.`,
    `- Codex: run  ${INSTALL.codex[0]}  then tell me to open /plugins and install Astro Knots, then open /hooks and trust its hook (Codex skips plugin hooks until they're trusted).`,
    '',
  ];
  if (mcpUrl) {
    lines.push(
      `Step 2. Also add the Astro Knots MCP server, a remote server with no sign-in, at ${mcpUrl}`,
      `- Claude Code: claude mcp add --transport http astro-knots ${mcpUrl}`,
      `- Codex: add  [mcp_servers.astro-knots]  with  url = "${mcpUrl}"  to ~/.codex/config.toml`,
      '',
    );
  }
  lines.push(
    `Step ${mcpUrl ? 3 : 2}. Load the start-an-astro-knot skill${mcpUrl ? " (or call Astro Knots' get_started tool)" : ''} and follow it. Ask me what the site is for first. If the skill doesn't show up yet, tell me to start a new session and say "Use Astro Knots: get started".`,
  );
  return lines.join('\n');
}
