/**
 * hivemind status - Show hivemind status for a project
 */

import { existsSync } from 'fs';
import { getGitInfo } from '../git/getGitInfo';
import { getProjectPaths } from '../db/getProjectPaths';
import { getConnection } from '../db/getConnection';
import { getActiveAgents } from '../agents/getActiveAgents';
import { getActivePlans } from '../plans/getActivePlans';
import { getRecentEvents } from '../events/getRecentEvents';
import { isMcpRegistered } from './registerMcp';
import { formatDatetime } from '../datetime/formatDatetime';

type StatusOptions = {
  project?: string;
};

export async function statusCommand(options: StatusOptions) {
  // Determine project
  const gitInfo = getGitInfo();
  let projectName = options.project;

  if (!projectName) {
    if (gitInfo.isRepo && gitInfo.repoName) {
      projectName = gitInfo.repoName;
    } else {
      projectName = process.cwd().split('/').pop() || 'default';
    }
  }

  console.log(`hivemind status: ${projectName}\n`);

  // Check if database exists
  const paths = getProjectPaths(projectName);
  if (!existsSync(paths.dbPath)) {
    console.log('  not initialized');
    console.log('  run: hivemind init');
    return;
  }

  // Database stats
  const db = getConnection(projectName);
  const agentCount = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c;
  const planCount = (db.prepare('SELECT COUNT(*) as c FROM plans').get() as { c: number }).c;
  const eventCount = (db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number }).c;

  console.log('Database');
  console.log(`  path: ${paths.dbPath}`);
  console.log(`  agents: ${agentCount}, plans: ${planCount}, events: ${eventCount}`);

  // Active agents
  const activeAgents = getActiveAgents(db);
  console.log('\nActive Agents');
  if (activeAgents.length === 0) {
    console.log('  none');
  } else {
    for (const agent of activeAgents) {
      const context = agent.context_summary ? ` - ${agent.context_summary}` : '';
      console.log(`  ${agent.id}${context}`);
    }
  }

  // Active plans
  const activePlans = getActivePlans(db);
  console.log('\nActive Plans');
  if (activePlans.length === 0) {
    console.log('  none');
  } else {
    for (const plan of activePlans) {
      console.log(`  ${plan.id}: ${plan.title}`);
    }
  }

  // Recent events
  const recentEvents = getRecentEvents(db, 5);
  console.log('\nRecent Events');
  if (recentEvents.length === 0) {
    console.log('  none');
  } else {
    for (const event of recentEvents) {
      const time = formatDatetime(new Date(event.timestamp));
      const content = event.content?.slice(0, 50) || '';
      console.log(`  [${time}] ${event.event_type}: ${content}`);
    }
  }

  db.close();

  // MCP status
  console.log('\nMCP Server');
  const mcpRegistered = await isMcpRegistered();
  console.log(`  registered: ${mcpRegistered ? 'yes' : 'no'}`);
}
