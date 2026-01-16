// Tool definitions
export { setupTool, executeSetup } from './setup';
export type { SetupInput, SetupResult } from './setup';

export { registerTool, executeRegister } from './register';
export type { RegisterInput, RegisterResult } from './register';

export { emitEventTool, executeEmitEvent } from './emitEvent';
export type { EmitEventInput, EmitEventResult } from './emitEvent';

export { queryTool, executeQuery } from './query';
export type { QueryInput, QueryResult } from './query';

export { statusTool, executeStatus } from './status';
export type { StatusInput, StatusResult } from './status';

export { resetTool, executeReset } from './reset';
export type { ResetInput, ResetResult } from './reset';

// Task management
export {
  claimTaskTool,
  executeClaimTask,
  startTaskTool,
  executeStartTask,
  completeTaskTool,
  executeCompleteTask,
} from './tasks';
export type { ClaimTaskInput, StartTaskInput, CompleteTaskInput } from './tasks';

// Events tailing
export { eventsTool, executeEvents } from './events';
export type { EventsInput, EventsResult } from './events';

// Note: Plan/task creation happens via file watcher on ~/.claude/plans/
// Agents claim/complete tasks via MCP tools above
