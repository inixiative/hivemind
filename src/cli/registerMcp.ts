/**
 * Register hivemind MCP server with Claude Code
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { $ } from 'bun';

type RegisterResult = {
  success: boolean;
  message: string;
  alreadyRegistered?: boolean;
};

/**
 * Hivemind tools that should be auto-approved (structured operations)
 * These have predictable semantics and don't require human oversight
 */
const AUTO_APPROVED_TOOLS = [
  // Lifecycle
  'mcp__hivemind__hivemind_setup',
  'mcp__hivemind__hivemind_register',
  // Read-only queries
  'mcp__hivemind__hivemind_status',
  'mcp__hivemind__hivemind_events',
  'mcp__hivemind__hivemind_query',
  // Task management (structured operations)
  'mcp__hivemind__hivemind_claim_task',
  'mcp__hivemind__hivemind_start_task',
  'mcp__hivemind__hivemind_complete_task',
];

// NOT auto-approved (require human oversight):
// - hivemind_emit: allows arbitrary messages to other agents
// - hivemind_reset: destructive operation that wipes the database

/**
 * Register the hivemind MCP server using `claude mcp add`
 */
export async function registerMcpServer(hivemindRoot: string): Promise<RegisterResult> {
  const serverPath = join(hivemindRoot, 'src/mcp/server.ts');
  const command = `bun run ${serverPath}`;

  try {
    // Check if already registered
    const listResult = await $`claude mcp list 2>/dev/null`.text();

    if (listResult.includes('hivemind')) {
      return {
        success: true,
        message: 'already registered',
        alreadyRegistered: true,
      };
    }

    // Register the MCP server
    await $`claude mcp add --transport stdio hivemind -- ${command}`.quiet();

    return {
      success: true,
      message: `registered: hivemind -> ${command}`,
    };
  } catch (error) {
    // Check if claude CLI is available
    try {
      await $`which claude`.quiet();
    } catch {
      return {
        success: false,
        message: 'claude CLI not found. Install Claude Code first.',
      };
    }

    // Some other error
    const msg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `failed: ${msg}`,
    };
  }
}

/**
 * Check if hivemind MCP server is registered
 */
export async function isMcpRegistered(): Promise<boolean> {
  try {
    const result = await $`claude mcp list 2>/dev/null`.text();
    return result.includes('hivemind');
  } catch {
    return false;
  }
}

type PermissionResult = {
  success: boolean;
  message: string;
  added: string[];
  alreadyPresent: string[];
};

/**
 * Configure auto-approve permissions for hivemind tools
 * Adds structured tools to ~/.claude/settings.json permissions.allow
 */
export function configurePermissions(): PermissionResult {
  const claudeDir = join(homedir(), '.claude');
  const settingsPath = join(claudeDir, 'settings.json');

  // Ensure ~/.claude exists
  if (!existsSync(claudeDir)) {
    mkdirSync(claudeDir, { recursive: true });
  }

  // Load existing settings
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch {
      // Invalid JSON, start fresh
    }
  }

  // Ensure permissions.allow exists
  if (!settings.permissions) {
    settings.permissions = {};
  }
  const permissions = settings.permissions as Record<string, unknown>;

  if (!Array.isArray(permissions.allow)) {
    permissions.allow = [];
  }
  const allowList = permissions.allow as string[];

  // Track what we add
  const added: string[] = [];
  const alreadyPresent: string[] = [];

  for (const tool of AUTO_APPROVED_TOOLS) {
    if (allowList.includes(tool)) {
      alreadyPresent.push(tool);
    } else {
      allowList.push(tool);
      added.push(tool);
    }
  }

  // Write back if we added anything
  if (added.length > 0) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }

  return {
    success: true,
    message: added.length > 0
      ? `added ${added.length} permission rules`
      : 'permissions already configured',
    added,
    alreadyPresent,
  };
}
