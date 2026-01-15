import { getConnection } from '../../db/getConnection';
import { syncTodosToHivemind, type ClaudeTodo } from '../../bridge/todoBridge';
import { createPlan } from '../../plans/createPlan';
import { getActivePlans } from '../../plans/getActivePlans';
import { getBranch } from '../../git/getBranch';

export const syncTodosTool = {
  name: 'hivemind_sync_todos',
  description: 'Sync your current todo list with hivemind so other agents can see your plan.',
  inputSchema: {
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Project name',
      },
      agentId: {
        type: 'string',
        description: 'This agent\'s ID',
      },
      planName: {
        type: 'string',
        description: 'Name for the plan (creates new if doesn\'t exist)',
      },
      todos: {
        type: 'array',
        description: 'Array of todo items from TodoWrite',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            status: { type: 'string' },
            activeForm: { type: 'string' },
          },
        },
      },
    },
    required: ['project', 'agentId', 'planName', 'todos'],
  },
};

export type SyncTodosInput = {
  project: string;
  agentId: string;
  planName: string;
  todos: ClaudeTodo[];
};

export type SyncTodosResult = {
  planId: string;
  created: number;
  updated: number;
  message: string;
};

export function executeSyncTodos(input: SyncTodosInput): SyncTodosResult {
  const db = getConnection(input.project);
  const branch = getBranch() ?? undefined;

  // Find or create plan by name
  const activePlans = getActivePlans(db);
  let plan = activePlans.find((p) => p.title === input.planName || p.label === input.planName);

  if (!plan) {
    plan = createPlan(db, {
      title: input.planName,
      branch,
      createdBy: input.agentId,
      label: input.planName.toLowerCase().replace(/\s+/g, '-').slice(0, 20),
    });
  }

  const result = syncTodosToHivemind(db, plan.id, input.todos, input.agentId);

  return {
    planId: plan.id,
    created: result.created.length,
    updated: result.updated.length,
    message: result.message,
  };
}
