import { execSync } from 'child_process';

export type SpawnOptions = {
  /** Working directory for the new agent */
  cwd?: string;
  /** Initial prompt/task for the agent */
  prompt?: string;
  /** Label for the new agent */
  label?: string;
  /** Session ID to resume */
  sessionId?: string;
  /** Open in new iTerm tab */
  newTab?: boolean;
  /** Project name */
  project?: string;
};

/**
 * Spawn a new Claude agent in a new iTerm tab
 *
 * Uses AppleScript to open a new tab and run claude with the given options.
 */
export function spawnAgent(options: SpawnOptions = {}): { success: boolean; message: string } {
  const {
    cwd = process.cwd(),
    prompt,
    label,
    sessionId,
    newTab = true,
    project,
  } = options;

  // Build claude command
  const parts = ['claude'];

  if (sessionId) {
    parts.push('--resume', sessionId);
  }

  if (prompt) {
    // Escape the prompt for shell
    const escapedPrompt = prompt.replace(/'/g, "'\\''");
    parts.push('-p', `'${escapedPrompt}'`);
  }

  const claudeCmd = parts.join(' ');

  // Build full command with cd and optional hivemind join
  let fullCmd = `cd '${cwd}'`;

  // If we have project and label, inject hivemind context
  if (project && label) {
    fullCmd += ` && export HIVEMIND_PROJECT='${project}' && export HIVEMIND_LABEL='${label}'`;
  }

  fullCmd += ` && ${claudeCmd}`;

  if (newTab) {
    // Use AppleScript to open new iTerm tab
    const appleScript = `
      tell application "iTerm"
        tell current window
          create tab with default profile
          tell current session
            write text "${fullCmd.replace(/"/g, '\\"')}"
          end tell
        end tell
      end tell
    `;

    try {
      execSync(`osascript -e '${appleScript.replace(/'/g, "'\\''")}'`);
      return {
        success: true,
        message: `Spawned agent${label ? ` "${label}"` : ''} in new iTerm tab`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to spawn: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  } else {
    // Just return the command to run
    return {
      success: true,
      message: `Run this command: ${fullCmd}`,
    };
  }
}
