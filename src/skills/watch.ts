/**
 * /hm:watch - Watch hivemind events
 *
 * Tails the events table to see what's happening.
 */

import { executeEvents } from '../mcp/tools/events';
import { getGitInfo } from '../git/getGitInfo';

export const watchSkill = {
  name: 'hm:watch',
  description: 'Watch recent hivemind events',
  prompt: `Show recent hivemind events for this project.

Call hivemind_events with limit=30 and present the results as a timeline:

Format each event as:
  [timestamp] [type] [agent] content

Event types to highlight:
- 🟢 task_claimed, task_started, task_completed - Task progress
- 💡 decision - Important decisions made
- ❓ question - Questions needing answers
- 📋 plan_created, tasks_synced - Plan updates
- 📝 note - General notes

Group events by time (last hour, earlier today, yesterday).

After showing events, remind the user they can:
- Use hivemind_events with 'since' param to get newer events
- Use hivemind_emit to share their own updates
`,
};

export function executeWatchSkill(options?: { limit?: number; since?: string }) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      error: 'Not in a git repository. Cannot determine project.',
    };
  }

  return executeEvents({
    project: gitInfo.repoName,
    limit: options?.limit ?? 30,
    since: options?.since,
  });
}
