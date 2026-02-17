#!/usr/bin/env node
import { randomUUID } from 'crypto';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMcpServer } from './core';

type SessionState = {
  transport: WebStandardStreamableHTTPServerTransport;
};

const sessions = new Map<string, SessionState>();

function unauthorized(): Response {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'Missing or invalid bearer token',
    }),
    {
      status: 401,
      headers: { 'content-type': 'application/json' },
    }
  );
}

function badRequest(message: string): Response {
  return new Response(
    JSON.stringify({
      error: 'Bad Request',
      message,
    }),
    {
      status: 400,
      headers: { 'content-type': 'application/json' },
    }
  );
}

function requireBearerAuth(req: Request, expectedToken: string): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  return token.length > 0 && token === expectedToken;
}

async function createSessionTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
  let transport: WebStandardStreamableHTTPServerTransport;

  transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { transport });
    },
    onsessionclosed: (sessionId) => {
      sessions.delete(sessionId);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  const server = createMcpServer();
  await server.connect(transport);
  return transport;
}

async function handleMcpRequest(req: Request): Promise<Response> {
  const apiToken = process.env.HIVEMIND_API_TOKEN;
  if (!apiToken) {
    return badRequest('HIVEMIND_API_TOKEN is not configured on the server');
  }

  if (!requireBearerAuth(req, apiToken)) {
    return unauthorized();
  }

  const sessionId = req.headers.get('mcp-session-id');
  const existing = sessionId ? sessions.get(sessionId) : undefined;
  let transport = existing?.transport;

  if (req.method === 'POST') {
    let parsedBody: unknown;
    try {
      parsedBody = await req.json();
    } catch {
      return badRequest('Invalid JSON request body');
    }

    if (!transport) {
      if (!isInitializeRequest(parsedBody)) {
        return badRequest('Missing or invalid mcp-session-id for non-initialize request');
      }

      transport = await createSessionTransport();
    }

    return transport.handleRequest(req, { parsedBody });
  }

  if (!transport) {
    return badRequest('Missing or invalid mcp-session-id');
  }

  if (req.method === 'GET' || req.method === 'DELETE') {
    return transport.handleRequest(req);
  }

  return new Response('Method Not Allowed', { status: 405 });
}

async function closeAllSessions(): Promise<void> {
  const transports = [...sessions.values()].map((state) => state.transport);
  sessions.clear();

  for (const transport of transports) {
    try {
      await transport.close();
    } catch {
      // Ignore close errors on shutdown
    }
  }
}

export function startHttpMcpServer(config?: { port?: number; hostname?: string }) {
  // Network transport always uses lease-based liveness.
  if (!process.env.HIVEMIND_NETWORK_MODE) {
    process.env.HIVEMIND_NETWORK_MODE = '1';
  }

  const apiToken = process.env.HIVEMIND_API_TOKEN;
  if (!apiToken) {
    throw new Error('HIVEMIND_API_TOKEN is required for network mode');
  }

  const port = config?.port ?? Number(process.env.PORT || 8787);
  const hostname = config?.hostname ?? '0.0.0.0';

  const server = Bun.serve({
    hostname,
    port,
    fetch: async (req) => {
      const url = new URL(req.url);

      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            ok: true,
            mode: 'network',
            sessions: sessions.size,
          }),
          {
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      if (url.pathname !== '/mcp') {
        return new Response('Not Found', { status: 404 });
      }

      return handleMcpRequest(req);
    },
  });

  return server;
}

if (import.meta.main) {
  const server = startHttpMcpServer();
  console.log(`hivemind HTTP MCP listening on http://${server.hostname}:${server.port}/mcp`);

  const shutdown = async () => {
    await closeAllSessions();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
