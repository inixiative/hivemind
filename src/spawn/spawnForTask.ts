import type Database from 'better-sqlite3';
import { spawnAgent, type SpawnOptions } from './spawnAgent';
import { getTask } from '../tasks/getTask';
import { assignTask } from '../tasks/assignTask';
import { registerAgent } from '../agents/registerAgent';
import { emit } from '../events/emit';

export type SpawnForTaskOptions = {
  /** The task ID to spawn an agent for */
  taskId: string;
  /** Label for the new agent (defaults to task label) */
  label?: string;
  /** Working directory (defaults to cwd) */
  cwd?: string;
  /** Project name */
  project: string;
};

/**
 * Spawn a new agent to work on a specific task
 *
 * Creates a new agent, assigns the task to it, and spawns a new iTerm tab
 * with context about the task.
 */
export function spawnForTask(
  db: Database.Database,
  options: SpawnForTaskOptions
): { success: boolean; agentId?: string; message: string } {
  const task = getTask(db, options.taskId);

  if (!task) {
    return {
      success: false,
      message: `Task not found: ${options.taskId}`,
    };
  }

  // Pre-register the agent so we have an ID to assign
  const label = options.label ?? task.label ?? undefined;
  const agent = registerAgent(db, {
    label,
    contextSummary: `Assigned to task: ${task.title}`,
    worktreeId: task.worktree_id ?? undefined,
  });

  // Assign task to new agent
  assignTask(db, options.taskId, agent.id);

  // Emit event
  emit(db, {
    agentId: agent.id,
    planId: task.plan_id,
    taskId: task.id,
    branch: task.branch ?? undefined,
    type: 'task:claim',
    content: `Spawned agent ${agent.id} for task: ${task.title}`,
  });

  // Build prompt with task context
  const prompt = `You are agent ${agent.id} in hivemind project "${options.project}".

Your assigned task (${task.id}):
Title: ${task.title}
${task.description ? `Description: ${task.description}` : ''}
Plan: ${task.plan_id}
${task.branch ? `Branch: ${task.branch}` : ''}

Start by calling hivemind_register to confirm your presence, then begin work on this task.
When done, use hivemind_emit with type "task:complete" to mark it done.`;

  const result = spawnAgent({
    cwd: options.cwd,
    prompt,
    label,
    project: options.project,
  });

  return {
    ...result,
    agentId: agent.id,
  };
}
