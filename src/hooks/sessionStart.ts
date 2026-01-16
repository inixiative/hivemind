/**
 * Session start hook - auto-join hivemind when starting a Claude session
 *
 * Installation: Add to .claude/settings.json:
 *   "hooks": {
 *     "SessionStart": [{
 *       "matcher": "startup",
 *       "hooks": [{ "type": "command", "command": "bun run /path/to/hivemind/src/hooks/sessionStart.ts" }]
 *     }]
 *   }
 *
 * Claude Code passes JSON via stdin with session_id, transcript_path, cwd, etc.
 */

import { executeRegister } from '../mcp/tools/register';
import { executeStatus } from '../mcp/tools/status';
import { getGitInfo } from '../git/getGitInfo';

type HookInput = {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
};

function readStdinSync(): string {
  try {
    // Bun supports reading stdin synchronously
    const chunks: Buffer[] = [];
    const fd = 0; // stdin
    const buf = Buffer.alloc(1024);
    let bytesRead: number;

    // Non-blocking check for stdin data
    const fs = require('fs');
    try {
      while ((bytesRead = fs.readSync(fd, buf, 0, buf.length, null)) > 0) {
        chunks.push(buf.subarray(0, bytesRead));
      }
    } catch {
      // No more data or stdin not ready
    }

    return Buffer.concat(chunks).toString('utf-8');
  } catch {
    return '';
  }
}

export function runSessionStartHook(input?: HookInput) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return;
  }

  const sessionId = input?.session_id;
  const label = process.env.CLAUDE_AGENT_LABEL;

  try {
    // process.ppid is Claude's process (or close to it in the process tree)
    const pid = process.ppid;

    const result = executeRegister({
      project: gitInfo.repoName,
      label,
      sessionId,
      pid,
    });

    // Get status to show other agents
    const status = executeStatus({ project: gitInfo.repoName });
    const otherAgents = status.activeAgents?.filter((a: any) => a.id !== result.agentId) || [];

    // Output agent info for Claude's context
    const lines = [
      `hivemind: ${result.agentId} joined ${gitInfo.repoName}`,
    ];

    if (result.branch) {
      lines[0] += ` (${result.branch})`;
    }

    // Include session_id so Claude can use it for MCP calls
    if (sessionId) {
      lines.push(`  session: ${sessionId}`);
    }

    if (otherAgents.length > 0) {
      lines.push(`  active: ${otherAgents.map((a: any) => a.id).join(', ')}`);
    }

    console.log(lines.join('\n'));
  } catch (error) {
    console.error(`hivemind error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// CLI entry point
if (import.meta.main) {
  // Read hook input from stdin (Claude Code passes JSON)
  const stdin = readStdinSync();
  let input: HookInput | undefined;

  if (stdin.trim()) {
    try {
      input = JSON.parse(stdin);
    } catch {
      // Not valid JSON, ignore
    }
  }

  runSessionStartHook(input);
}
