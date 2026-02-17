import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  setupTool,
  executeSetup,
  registerTool,
  executeRegister,
  emitEventTool,
  executeEmitEvent,
  queryTool,
  executeQuery,
  statusTool,
  executeStatus,
  resetTool,
  executeReset,
  claimTaskTool,
  executeClaimTask,
  startTaskTool,
  executeStartTask,
  completeTaskTool,
  executeCompleteTask,
  eventsTool,
  executeEvents,
  worktreeCleanupTool,
  executeWorktreeCleanup,
} from './tools/index';

type ToolExecutor = (args: unknown) => unknown;

export const HIVEMIND_TOOL_DEFS = [
  setupTool,
  registerTool,
  statusTool,
  eventsTool,
  emitEventTool,
  queryTool,
  claimTaskTool,
  startTaskTool,
  completeTaskTool,
  worktreeCleanupTool,
  resetTool,
];

const TOOL_EXECUTORS: Record<string, ToolExecutor> = {
  hivemind_setup: (args) => executeSetup(args as Parameters<typeof executeSetup>[0]),
  hivemind_register: (args) => executeRegister(args as Parameters<typeof executeRegister>[0]),
  hivemind_emit: (args) => executeEmitEvent(args as Parameters<typeof executeEmitEvent>[0]),
  hivemind_query: (args) => executeQuery(args as Parameters<typeof executeQuery>[0]),
  hivemind_status: (args) => executeStatus(args as Parameters<typeof executeStatus>[0]),
  hivemind_reset: (args) => executeReset(args as Parameters<typeof executeReset>[0]),
  hivemind_claim_task: (args) => executeClaimTask(args as Parameters<typeof executeClaimTask>[0]),
  hivemind_start_task: (args) => executeStartTask(args as Parameters<typeof executeStartTask>[0]),
  hivemind_complete_task: (args) => executeCompleteTask(args as Parameters<typeof executeCompleteTask>[0]),
  hivemind_events: (args) => executeEvents(args as Parameters<typeof executeEvents>[0]),
  hivemind_worktree_cleanup: (args) =>
    executeWorktreeCleanup(args as Parameters<typeof executeWorktreeCleanup>[0]),
};

export function executeToolByName(name: string, args: unknown): unknown {
  const executor = TOOL_EXECUTORS[name];
  if (!executor) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return executor(args);
}

export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'hivemind',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: HIVEMIND_TOOL_DEFS,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = executeToolByName(name, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: message }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
