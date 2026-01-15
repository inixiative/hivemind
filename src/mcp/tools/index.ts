// Tool definitions
export { setupTool, executeSetup } from './setup';
export type { SetupInput, SetupResult } from './setup';

export { registerTool, executeRegister } from './register';
export type { RegisterInput, RegisterResult } from './register';

export { heartbeatTool, executeHeartbeat } from './heartbeat';
export type { HeartbeatInput, HeartbeatResult } from './heartbeat';

export { emitEventTool, executeEmitEvent } from './emitEvent';
export type { EmitEventInput, EmitEventResult } from './emitEvent';

export { queryTool, executeQuery } from './query';
export type { QueryInput, QueryResult } from './query';

export { statusTool, executeStatus } from './status';
export type { StatusInput, StatusResult } from './status';

export { syncTodosTool, executeSyncTodos } from './syncTodos';
export type { SyncTodosInput, SyncTodosResult } from './syncTodos';
