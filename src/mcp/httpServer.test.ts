import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { spawn, type ChildProcess } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const API_TOKEN = 'hivemind-test-token';
const PROJECT = 'network-mode-e2e';

let serverProcess: ChildProcess | null = null;
let tempBaseDir = '';
let mcpUrl = '';
let healthUrl = '';

async function getFreePort(): Promise<number> {
  const net = await import('net');
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to allocate free port'));
        return;
      }
      const { port } = address;
      server.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
    server.on('error', reject);
  });
}

async function waitForHealthy(url: string, timeoutMs = 10_000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry while server starts
    }
    await Bun.sleep(100);
  }

  throw new Error(`Timed out waiting for server health at ${url}`);
}

function parseToolJson<T>(result: unknown): T {
  if (!result || typeof result !== 'object') {
    throw new Error('Tool result did not return an object');
  }

  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  const text = content?.find((item) => item.type === 'text')?.text;
  if (!text) {
    throw new Error('Tool result did not include text content');
  }
  return JSON.parse(text) as T;
}

async function createClient(name: string): Promise<Client> {
  const client = new Client(
    {
      name,
      version: '0.1.0',
    },
    { capabilities: {} }
  );

  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    },
  });

  await client.connect(transport);
  return client;
}

describe('HTTP MCP server (network mode)', () => {
  beforeAll(async () => {
    const port = await getFreePort();
    mcpUrl = `http://127.0.0.1:${port}/mcp`;
    healthUrl = `http://127.0.0.1:${port}/health`;
    tempBaseDir = mkdtempSync(join(tmpdir(), 'hivemind-http-test-'));

    serverProcess = spawn('bun', ['run', 'src/mcp/httpServer.ts'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        HIVEMIND_API_TOKEN: API_TOKEN,
        HIVEMIND_BASE: tempBaseDir,
        HIVEMIND_NETWORK_MODE: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    await waitForHealthy(healthUrl);
  });

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
    serverProcess = null;

    if (tempBaseDir) {
      rmSync(tempBaseDir, { recursive: true, force: true });
      tempBaseDir = '';
    }
  });

  it('rejects unauthorized MCP requests', async () => {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'unauthorized-test', version: '0.1.0' },
        },
      }),
    });

    expect(response.status).toBe(401);
  });

  it('allows two separate clients to coordinate through one remote hivemind', async () => {
    const clientA = await createClient('network-client-a');
    const clientB = await createClient('network-client-b');

    try {
      const registerA = parseToolJson<{ agentId: string }>(
        await clientA.callTool({
          name: 'hivemind_register',
          arguments: { project: PROJECT, sessionId: 'session-a' },
        })
      );

      const registerB = parseToolJson<{ agentId: string }>(
        await clientB.callTool({
          name: 'hivemind_register',
          arguments: { project: PROJECT, sessionId: 'session-b' },
        })
      );

      const emitResult = parseToolJson<{ success: boolean; agentId: string }>(
        await clientA.callTool({
          name: 'hivemind_emit',
          arguments: {
            project: PROJECT,
            agentId: registerA.agentId,
            type: 'note',
            content: 'network-e2e-message',
          },
        })
      );
      expect(emitResult.success).toBe(true);
      expect(emitResult.agentId).toBe(registerA.agentId);

      const events = parseToolJson<{
        events: Array<{ content: string }>;
      }>(
        await clientB.callTool({
          name: 'hivemind_events',
          arguments: { project: PROJECT, limit: 20, agentId: registerB.agentId },
        })
      );

      expect(events.events.some((event) => event.content.includes('network-e2e-message'))).toBe(true);

      const status = parseToolJson<{
        activeAgents: Array<{ id: string }>;
      }>(
        await clientB.callTool({
          name: 'hivemind_status',
          arguments: { project: PROJECT, agentId: registerB.agentId },
        })
      );

      const activeAgentIds = status.activeAgents.map((agent) => agent.id);
      expect(activeAgentIds.includes(registerA.agentId)).toBe(true);
      expect(activeAgentIds.includes(registerB.agentId)).toBe(true);
    } finally {
      await clientA.close();
      await clientB.close();
    }
  });
});
