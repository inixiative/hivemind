/**
 * hivemind init - Register a project with hivemind
 *
 * Run from a project directory to:
 * 1. Create database in ~/.hivemind/<project>/
 * 2. Set up .claude/settings.json hooks
 * 3. Add CLAUDE.md instructions
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getGitInfo } from '../git/getGitInfo';
import { initializeDb } from '../db/initializeDb';
import { getProjectPaths } from '../db/getProjectPaths';
import { initClaudeConfig } from '../init/claudeConfig';
import { isMcpRegistered } from './registerMcp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HIVEMIND_ROOT = join(__dirname, '../..');

type InitOptions = {
  project?: string;
  hooks?: boolean;
};

export async function initCommand(options: InitOptions) {
  // Determine project name
  const gitInfo = getGitInfo();
  let projectName = options.project;

  if (!projectName) {
    if (gitInfo.isRepo && gitInfo.repoName) {
      projectName = gitInfo.repoName;
    } else {
      projectName = process.cwd().split('/').pop() || 'default';
    }
  }

  console.log(`hivemind init: ${projectName}\n`);

  // 1. Initialize database
  console.log('[1/2] Database');
  const paths = getProjectPaths(projectName);
  const db = initializeDb(projectName);

  // Get stats
  const agentCount = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c;
  const planCount = (db.prepare('SELECT COUNT(*) as c FROM plans').get() as { c: number }).c;
  const eventCount = (db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number }).c;
  db.close();

  console.log(`  path: ${paths.dbPath}`);
  if (agentCount > 0 || planCount > 0) {
    console.log(`  stats: ${agentCount} agents, ${planCount} plans, ${eventCount} events`);
  } else {
    console.log('  status: created');
  }

  // 2. Set up Claude config (hooks + CLAUDE.md)
  if (options.hooks !== false) {
    console.log('\n[2/2] Claude Config');
    const projectRoot = gitInfo.root || process.cwd();
    const configResult = initClaudeConfig(projectRoot, projectName, HIVEMIND_ROOT);

    if (configResult.created.length > 0) {
      console.log(`  created: ${configResult.created.join(', ')}`);
    }
    if (configResult.updated.length > 0) {
      console.log(`  updated: ${configResult.updated.join(', ')}`);
    }
    if (configResult.created.length === 0 && configResult.updated.length === 0) {
      console.log('  status: already configured');
    }
  } else {
    console.log('\n[2/2] Claude Config (skipped)');
  }

  // Check if MCP is set up globally
  const mcpReady = await isMcpRegistered();

  // Success
  console.log('\n---');
  if (mcpReady) {
    console.log('Project registered! Restart Claude Code to activate.');
    console.log('\nNext session will:');
    console.log('  - Auto-register as a hivemind agent');
    console.log('  - Have hivemind MCP tools available');
  } else {
    console.log('Project registered, but MCP not set up globally.');
    console.log('\nRun `hivemind install` first to set up MCP tools.');
  }
}
