/**
 * hivemind watch - Live tail of events
 */

import { getConnection } from '../db/getConnection';
import { getRecentEvents } from '../events/getRecentEvents';
import { getGitInfo } from '../git/getGitInfo';

const EVENT_ICONS: Record<string, string> = {
  'task:claim': '🎯',
  'task:start': '▶️',
  'task:complete': '✅',
  'task:block': '🚫',
  'decision': '💡',
  'question': '❓',
  'answer': '💬',
  'note': '📝',
  'context': '📋',
  'agent:register': '👋',
  'agent:unregister': '👋',
  'plan:create': '📊',
  'plan:sync': '🔄',
};

function formatEvent(event: {
  seq: number;
  timestamp: string;
  agent_id: string | null;
  event_type: string;
  content: string | null;
}): string {
  const icon = EVENT_ICONS[event.event_type] || '•';
  const time = event.timestamp.split(' ')[1]; // Just the time part
  const agent = event.agent_id?.replace('agt_', '') || 'system';
  const content = event.content ? ` ${event.content}` : '';

  return `${icon} [${time}] ${agent} ${event.event_type}${content}`;
}

export async function watchCommand(options: { project?: string }) {
  let project = options.project;

  if (!project) {
    const gitInfo = getGitInfo();
    if (!gitInfo.isRepo || !gitInfo.repoName) {
      console.error('Not in a git repository. Use --project <name>');
      process.exit(1);
    }
    project = gitInfo.repoName;
  }

  const db = getConnection(project);
  let lastSeq = 0;

  // Get initial last seq
  const initial = getRecentEvents(db, 1);
  if (initial.length > 0) {
    lastSeq = initial[0].seq;
  }

  console.log(`👁️  Watching hivemind events for: ${project}`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Poll loop
  const POLL_INTERVAL = 1000; // 1 second

  while (true) {
    try {
      const stmt = db.prepare(`
        SELECT * FROM events
        WHERE seq > ?
        ORDER BY seq ASC
      `);
      const newEvents = stmt.all(lastSeq) as Array<{
        seq: number;
        timestamp: string;
        agent_id: string | null;
        event_type: string;
        content: string | null;
      }>;

      for (const event of newEvents) {
        console.log(formatEvent(event));
        lastSeq = event.seq;
      }
    } catch {
      // DB might be locked, just retry
    }

    await Bun.sleep(POLL_INTERVAL);
  }
}
