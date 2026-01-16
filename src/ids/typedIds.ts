/**
 * Typed ID utility for compile-time type safety
 *
 * Creates a "typed" string by adding a phantom type property.
 * The __model property only exists at compile-time and has zero runtime cost.
 */
export type Id<Model> = string & { readonly __model: Model };

// Define all hivemind entity ID types
export const HivemindIdType = {
  Agent: 'AgentId',
  Plan: 'PlanId',
  Task: 'TaskId',
  Event: 'EventId',
  Worktree: 'WorktreeId',
} as const;

export type HivemindIdType = (typeof HivemindIdType)[keyof typeof HivemindIdType];

// Typed ID aliases
export type AgentId = Id<typeof HivemindIdType.Agent>;
export type PlanId = Id<typeof HivemindIdType.Plan>;
export type TaskId = Id<typeof HivemindIdType.Task>;
export type EventId = Id<typeof HivemindIdType.Event>;
export type WorktreeId = Id<typeof HivemindIdType.Worktree>;

// Core helper functions
export const createId = <M extends HivemindIdType>(raw: string): Id<M> => raw as Id<M>;

// Convenience creator functions (for casting existing strings)
export const agentId = (id: string): AgentId => id as AgentId;
export const planId = (id: string): PlanId => id as PlanId;
export const taskId = (id: string): TaskId => id as TaskId;
export const eventId = (id: string): EventId => id as EventId;
export const worktreeId = (id: string): WorktreeId => id as WorktreeId;

// Type guards for runtime validation
export const isAgentId = (id: string): id is AgentId => id.startsWith('agt_');
export const isPlanId = (id: string): id is PlanId => id.startsWith('pln_');
export const isTaskId = (id: string): id is TaskId => id.startsWith('tsk_');
export const isEventId = (id: string): id is EventId => id.startsWith('evt_');
export const isWorktreeId = (id: string): id is WorktreeId => id.startsWith('wkt_');

// Extract the ID type from any hivemind ID
export type ExtractIdType<T> = T extends AgentId
  ? typeof HivemindIdType.Agent
  : T extends PlanId
    ? typeof HivemindIdType.Plan
    : T extends TaskId
      ? typeof HivemindIdType.Task
      : T extends EventId
        ? typeof HivemindIdType.Event
        : T extends WorktreeId
          ? typeof HivemindIdType.Worktree
          : never;
