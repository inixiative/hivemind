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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { executeRegister, type RegisterResult } from '../mcp/tools/register';
import { executeStatus, type StatusResult } from '../mcp/tools/status';
import { getGitInfo } from '../git/getGitInfo';

type HookInput = {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
};

function getTextContent(result: unknown, errorPrefix: string): string {
  if (!result || typeof result !== 'object') {
    throw new Error(`${errorPrefix} returned invalid payload`);
  }

  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  const text = content?.find((item) => item?.type === 'text')?.text;

  if (!text) {
    throw new Error(`${errorPrefix} returned no text content`);
  }

  return text;
}

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

export async function runSessionStartHook(input?: HookInput) {
  // Use cwd from hook input (Claude's actual working directory), not process.cwd()
  const gitInfo = getGitInfo(input?.cwd);

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return;
  }

  const sessionId = input?.session_id;
  const label = process.env.CLAUDE_AGENT_LABEL;

  try {
      const remoteUrl = process.env.HIVEMIND_REMOTE_URL?.trim();
      let result: RegisterResult;
      let status: StatusResult;

      if (remoteUrl) {
        const token = process.env.HIVEMIND_API_TOKEN?.trim();
        if (!token) {
          throw new Error('HIVEMIND_API_TOKEN is required when HIVEMIND_REMOTE_URL is set');
        }

        const client = new Client(
          {
            name: 'hivemind-session-start',
            version: '0.1.0',
          },
          { capabilities: {} }
        );

        const transport = new StreamableHTTPClientTransport(new URL(remoteUrl), {
          requestInit: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });

        await client.connect(transport);
        try {
          const registerCall = await client.callTool({
            name: 'hivemind_register',
            arguments: {
              project: gitInfo.repoName,
              label,
              sessionId,
              cwd: input?.cwd,
            },
          });

          const registerText = getTextContent(registerCall, 'Remote hivemind_register');
          result = JSON.parse(registerText) as RegisterResult;

          const statusCall = await client.callTool({
            name: 'hivemind_status',
            arguments: {
              project: gitInfo.repoName,
              agentId: result.agentId,
              sessionId,
            },
          });

          const statusText = getTextContent(statusCall, 'Remote hivemind_status');
          status = JSON.parse(statusText) as StatusResult;
        } finally {
          await client.close();
        }
      } else {
        // process.ppid is Claude's process (or close to it in the process tree)
        const pid = process.ppid;

        result = executeRegister({
          project: gitInfo.repoName,
          label,
          sessionId,
          pid,
          cwd: input?.cwd,
        });

        // Get status to show other agents
        status = executeStatus({ project: gitInfo.repoName });
      }

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

  await runSessionStartHook(input);
}
