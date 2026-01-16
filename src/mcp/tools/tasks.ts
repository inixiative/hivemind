/**
 * Task management MCP tools
 * - Claim tasks to work on
 * - Complete tasks when done
 */

import { getConnection } from '../../db/getConnection';
import { getTask } from '../../tasks/getTask';
import { claimTask } from '../../tasks/claimTask';
import { completeTask } from '../../tasks/completeTask';
import { startTask } from '../../tasks/startTask';
import { emit } from '../../events/emit';

// ─────────────────────────────────────────────────────────────
// Claim Task
// ─────────────────────────────────────────────────────────────

export const claimTaskTool = {
  name: 'hivemind_claim_task',
  description: 'Claim a task to work on. Other agents will see you own this task.',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string', description: 'Project name' },
      taskId: { type: 'string', description: 'Task ID to claim' },
      agentId: { type: 'string', description: 'Your agent ID' },
    },
    required: ['project', 'taskId', 'agentId'],
  },
};

export type ClaimTaskInput = {
  project: string;
  taskId: string;
  agentId: string;
};

export function executeClaimTask(input: ClaimTaskInput): {
  success: boolean;
  message: string;
} {
  const db = getConnection(input.project);

  const task = getTask(db, input.taskId);
  if (!task) {
    return { success: false, message: `Task ${input.taskId} not found` };
  }

  if (task.status === 'done') {
    return { success: false, message: `Task ${input.taskId} is already done` };
  }

  if (task.claimed_by && task.claimed_by !== input.agentId) {
    return { success: false, message: `Task ${input.taskId} is claimed by ${task.claimed_by}` };
  }

  const result = claimTask(db, input.taskId, input.agentId);
  if (!result) {
    return { success: false, message: `Failed to claim task ${input.taskId}` };
  }

  emit(db, {
    type: 'task:claim',
    content: `${input.agentId} claimed: ${task.title}`,
    agent_id: input.agentId,
    task_id: input.taskId,
    plan_id: task.plan_id,
  });

  return { success: true, message: `Claimed task: ${task.title}` };
}

// ─────────────────────────────────────────────────────────────
// Start Task (mark in progress)
// ─────────────────────────────────────────────────────────────

export const startTaskTool = {
  name: 'hivemind_start_task',
  description: 'Mark a task as in progress. Call after claiming when you begin work.',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string', description: 'Project name' },
      taskId: { type: 'string', description: 'Task ID to start' },
      agentId: { type: 'string', description: 'Your agent ID' },
    },
    required: ['project', 'taskId', 'agentId'],
  },
};

export type StartTaskInput = {
  project: string;
  taskId: string;
  agentId: string;
};

export function executeStartTask(input: StartTaskInput): {
  success: boolean;
  message: string;
} {
  const db = getConnection(input.project);

  const task = getTask(db, input.taskId);
  if (!task) {
    return { success: false, message: `Task ${input.taskId} not found` };
  }

  if (task.status === 'done') {
    return { success: false, message: `Task ${input.taskId} is already done` };
  }

  startTask(db, input.taskId);

  emit(db, {
    type: 'task:start',
    content: `${input.agentId} started: ${task.title}`,
    agent_id: input.agentId,
    task_id: input.taskId,
    plan_id: task.plan_id,
  });

  return { success: true, message: `Started task: ${task.title}` };
}

// ─────────────────────────────────────────────────────────────
// Complete Task
// ─────────────────────────────────────────────────────────────

export const completeTaskTool = {
  name: 'hivemind_complete_task',
  description: 'Mark a task as done.',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string', description: 'Project name' },
      taskId: { type: 'string', description: 'Task ID to complete' },
      agentId: { type: 'string', description: 'Your agent ID' },
    },
    required: ['project', 'taskId', 'agentId'],
  },
};

export type CompleteTaskInput = {
  project: string;
  taskId: string;
  agentId: string;
};

export function executeCompleteTask(input: CompleteTaskInput): {
  success: boolean;
  message: string;
} {
  const db = getConnection(input.project);

  const task = getTask(db, input.taskId);
  if (!task) {
    return { success: false, message: `Task ${input.taskId} not found` };
  }

  if (task.status === 'done') {
    return { success: false, message: `Task ${input.taskId} is already done` };
  }

  const result = completeTask(db, input.taskId);
  if (!result) {
    return { success: false, message: `Failed to complete task ${input.taskId}` };
  }

  emit(db, {
    type: 'task:complete',
    content: `${input.agentId} completed: ${task.title}`,
    agent_id: input.agentId,
    task_id: input.taskId,
    plan_id: task.plan_id,
  });

  return { success: true, message: `Completed task: ${task.title}` };
}
