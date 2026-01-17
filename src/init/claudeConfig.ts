/**
 * Claude Code configuration for hivemind
 *
 * When `hivemind init` runs, it sets up:
 * 1. .claude/settings.json - SessionStart hook for auto-registration
 * 2. .claude/CLAUDE.md - Behavioral instructions for agents
 *
 * Projects can customize agent behavior by adding a `## Hivemind Events`
 * section to their root CLAUDE.md - it gets extracted and injected.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Default events instructions (used if project doesn't define custom ones)
 */
const DEFAULT_EVENTS_SECTION = `## Events

Keep events **under 80 chars**. Map, not territory.

\`\`\`
hivemind_emit type=decision content="Redis for cache, Postgres for persistence"
hivemind_emit type=context content="API rate limit: 100/min per key"
hivemind_emit type=note content="finished auth refactor, starting tests"
\`\`\`

**Emit for:** architectural decisions, discoveries others need, blockers.

**Skip:** routine progress, obvious steps, verbose explanations.`;

/**
 * Extract a markdown section by heading from content
 * Returns the section content (including heading) or null if not found
 */
export function extractMarkdownSection(
  content: string,
  heading: string
): string | null {
  // Match ## Heading through end of section (next ## or EOF)
  // Split into lines and find section boundaries
  const lines = content.split('\n');
  const startPattern = new RegExp(`^## ${heading}\\s*$`, 'i');

  let startIdx = -1;
  let endIdx = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (startIdx === -1 && startPattern.test(lines[i])) {
      startIdx = i;
    } else if (startIdx !== -1 && /^## /.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  if (startIdx === -1) return null;

  return lines.slice(startIdx, endIdx).join('\n').trim();
}

/**
 * Build the CLAUDE.md content, optionally with custom events section
 */
export function buildHivemindClaudeMd(customEventsSection?: string): string {
  const eventsSection = customEventsSection || DEFAULT_EVENTS_SECTION;

  return `# Hivemind Agent Instructions

You are part of a **hivemind** - a coordinated group of Claude agents working together.

## Lifecycle

Your lifecycle is tracked by PID - no heartbeats needed. When you exit, hivemind automatically marks you as inactive.

## MCP Tools - USE THESE

**\`hivemind_status\`** - CALL THIS FIRST when you start a session. Shows active agents, what they're working on, and recent events. Prevents duplicate work.

**\`hivemind_emit\`** - Share important context with other agents. Use for:
- \`type=decision\` - Architectural choices others should know
- \`type=context\` - Discovered constraints (rate limits, gotchas)
- \`type=question\` - When you're blocked and need input

**\`hivemind_query\`** - Ask questions about the hivemind state.

${eventsSection}

## Coordination Protocol

1. **Session start**: Run \`hivemind_status\` to see who's online and what's happening
2. **Architectural decisions**: Emit with \`type=decision\` so others know
3. **Blockers**: Emit with \`type=question\` - another agent may have context
4. **Focus on work**: The system tracks your lifecycle automatically
`;
}

/**
 * Settings.json hooks for auto-registration
 */
export function getHivemindHooks(hivemindRoot: string) {
  return {
    hooks: {
      SessionStart: [
        {
          hooks: [
            {
              type: 'command',
              command: `bun run ${hivemindRoot}/src/hooks/sessionStart.ts`,
            },
          ],
        },
      ],
    },
  };
}

/**
 * Initialize Claude Code configuration for hivemind
 */
export function initClaudeConfig(
  projectRoot: string,
  _project: string,
  hivemindRoot: string
): { created: string[]; updated: string[] } {
  const claudeDir = join(projectRoot, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');
  const claudeMdPath = join(claudeDir, 'CLAUDE.md');
  const projectClaudeMdPath = join(projectRoot, 'CLAUDE.md');

  const created: string[] = [];
  const updated: string[] = [];

  // Ensure .claude directory exists
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
    created.push('.claude/');
  }

  // Create or update settings.json
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch {
      // Invalid JSON, start fresh
    }
  }

  const hooks = getHivemindHooks(hivemindRoot);
  const existingHooks = settings.hooks as Record<string, unknown> | undefined;

  if (!existingHooks?.SessionStart) {
    settings.hooks = { ...existingHooks, ...hooks.hooks };
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    updated.push('.claude/settings.json');
  }

  // Extract custom events section from project's root CLAUDE.md (if exists)
  let customEventsSection: string | undefined;
  if (existsSync(projectClaudeMdPath)) {
    const projectClaudeMd = readFileSync(projectClaudeMdPath, 'utf-8');
    const extracted = extractMarkdownSection(projectClaudeMd, 'Hivemind Events');
    if (extracted) {
      customEventsSection = extracted;
    }
  }

  // Build the hivemind instructions (with custom or default events section)
  const hivemindClaudeMd = buildHivemindClaudeMd(customEventsSection);

  // Create or update .claude/CLAUDE.md
  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, hivemindClaudeMd);
    created.push('.claude/CLAUDE.md');
  } else {
    // Check if hivemind instructions are already there
    const existing = readFileSync(claudeMdPath, 'utf-8');
    if (!existing.includes('Hivemind Agent Instructions')) {
      // Append hivemind instructions
      writeFileSync(claudeMdPath, existing + '\n\n' + hivemindClaudeMd);
      updated.push('.claude/CLAUDE.md');
    }
  }

  return { created, updated };
}
