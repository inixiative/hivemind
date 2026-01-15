import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  setupTool,
  executeSetup,
  registerTool,
  executeRegister,
  heartbeatTool,
  executeHeartbeat,
  emitEventTool,
  executeEmitEvent,
  queryTool,
  executeQuery,
  statusTool,
  executeStatus,
  syncTodosTool,
  executeSyncTodos,
} from './tools/index';

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

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      setupTool,
      registerTool,
      heartbeatTool,
      emitEventTool,
      queryTool,
      statusTool,
      syncTodosTool,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'hivemind_setup':
        result = executeSetup(args as Parameters<typeof executeSetup>[0]);
        break;
      case 'hivemind_register':
        result = executeRegister(args as Parameters<typeof executeRegister>[0]);
        break;
      case 'hivemind_heartbeat':
        result = executeHeartbeat(args as Parameters<typeof executeHeartbeat>[0]);
        break;
      case 'hivemind_emit':
        result = executeEmitEvent(args as Parameters<typeof executeEmitEvent>[0]);
        break;
      case 'hivemind_query':
        result = executeQuery(args as Parameters<typeof executeQuery>[0]);
        break;
      case 'hivemind_status':
        result = executeStatus(args as Parameters<typeof executeStatus>[0]);
        break;
      case 'hivemind_sync_todos':
        result = executeSyncTodos(args as Parameters<typeof executeSyncTodos>[0]);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
