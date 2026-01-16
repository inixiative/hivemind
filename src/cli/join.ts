/**
 * hivemind join - Join the hivemind as an agent
 */

import { executeRegister } from '../mcp/tools/register';
import { executeStatus } from '../mcp/tools/status';
import { getGitInfo } from '../git/getGitInfo';

type JoinOptions = {
  label?: string;
  context?: string;
};

export async function joinCommand(options: JoinOptions) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    console.log('Not in a git repository. Run from a git project directory.');
    return;
  }

  console.log(`hivemind join: ${gitInfo.repoName}\n`);

  try {
    const result = executeRegister({
      project: gitInfo.repoName,
      label: options.label,
      contextSummary: options.context,
    });

    console.log(`Agent: ${result.agentId}`);
    if (result.branch) {
      console.log(`Branch: ${result.branch}`);
    }

    // Show other active agents
    const status = executeStatus({ project: gitInfo.repoName });
    const otherAgents = status.activeAgents?.filter((a: { id: string }) => a.id !== result.agentId) || [];

    if (otherAgents.length > 0) {
      console.log('\nOther active agents:');
      for (const agent of otherAgents) {
        console.log(`  ${agent.id}`);
      }
    }

    console.log('\nJoined successfully!');
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
