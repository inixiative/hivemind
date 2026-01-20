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

**One event per accomplishment.** If you complete 3 tasks, emit 3 notes:
\`\`\`
hivemind_emit type=note content="Added Redis caching layer"
hivemind_emit type=note content="Updated API rate limiting to 100/min"
hivemind_emit type=note content="Fixed auth token refresh bug"
\`\`\`

Not one combined note. Other agents need granular visibility.

**Event types:**
- \`decision\` - Architectural choices others should know
- \`context\` - Discovered constraints, gotchas
- \`note\` - Task completions, progress updates
- \`question\` - When blocked and need input

**Skip:** routine progress on obvious steps, verbose explanations.`;

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
 * Build the CLAUDE.md content with project name and optional custom events section
 */
export function buildHivemindClaudeMd(projectName: string, customEventsSection?: string): string {
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

## Plan Mode

When creating plan files in ~/.claude/plans/, **always start with frontmatter**:

\`\`\`yaml
---
project: ${projectName}
---
\`\`\`

This ensures plans are synced to the correct hivemind project database.
`;
}

/**
 * Settings.json hooks for auto-registration
 *
 * SessionStart matchers:
 * - startup: New session
 * - resume: --resume, --continue, /resume
 * - clear: /clear command
 * - compact: Auto or manual compact (new session ID assigned)
 *
 * We register on all events to handle compaction gracefully.
 * The hook checks PID to reuse existing agent when session ID changes.
 */
export function getHivemindHooks(hivemindRoot: string) {
  const sessionStartCommand = {
    type: 'command',
    command: `bun run ${hivemindRoot}/src/hooks/sessionStart.ts`,
  };

  return {
    hooks: {
      SessionStart: [
        // Handle new sessions
        {
          matcher: 'startup',
          hooks: [sessionStartCommand],
        },
        // Handle compaction (session ID changes, but PID stays same)
        {
          matcher: 'compact',
          hooks: [sessionStartCommand],
        },
        // Handle resume scenarios
        {
          matcher: 'resume',
          hooks: [sessionStartCommand],
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
  project: string,
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

  // Build the hivemind instructions (with project name and custom or default events section)
  const hivemindClaudeMd = buildHivemindClaudeMd(project, customEventsSection);

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
