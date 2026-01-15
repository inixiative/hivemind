// Skill definitions and executors
export { joinSkill, executeJoin } from './join';
export type { JoinInput } from './join';

export { statusSkill, executeStatusSkill } from './status';

export { saySkill, executeSay } from './say';
export type { SayInput } from './say';

export { askSkill, executeAsk } from './ask';
export type { AskInput } from './ask';

export { logSkill, executeLog } from './log';
export type { LogInput } from './log';

// All skills for registration
export const allSkills = [
  { name: 'hm:join', description: 'Join the hivemind for this project' },
  { name: 'hm:status', description: 'Show current hivemind status' },
  { name: 'hm:say', description: 'Say something to other agents' },
  { name: 'hm:ask', description: 'Ask a question to other agents' },
  { name: 'hm:log', description: 'View recent events' },
];
