/**
 * hivemind install - One-time global setup
 *
 * Run from hivemind directory to:
 * 1. Install dependencies
 * 2. Register MCP server globally
 * 3. Configure permissions
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { $ } from 'bun';
import { registerMcpServer, configurePermissions } from './registerMcp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HIVEMIND_ROOT = join(__dirname, '../..');
const CLI_ENTRY = join(HIVEMIND_ROOT, 'src/cli.ts');


export async function installCommand() {
  console.log('hivemind install\n');

  // 1. Install dependencies
  console.log('[1/3] Dependencies');
  try {
    await $`cd ${HIVEMIND_ROOT} && bun install`.quiet();
    console.log('  installed');
  } catch (error) {
    console.error('  failed to install dependencies');
    process.exit(1);
  }

  // 2. Register MCP server
  console.log('\n[2/3] MCP Server');
  const mcpResult = await registerMcpServer(HIVEMIND_ROOT);
  console.log(`  ${mcpResult.message}`);

  if (!mcpResult.success) {
    process.exit(1);
  }

  // 3. Configure permissions (auto-approve structured tools)
  console.log('\n[3/3] Permissions');
  const permResult = configurePermissions();
  console.log(`  ${permResult.message}`);

  if (permResult.added.length > 0) {
    console.log('  auto-approved: status, events, query, claim/start/complete task');
    console.log('  requires approval: emit (ad-hoc messages)');
  }

  // Success
  console.log('\n---');
  console.log('Hivemind installed!');
  console.log('\nAdd this to your shell profile (~/.zshrc or ~/.bashrc):');
  console.log(`\n  alias hivemind='bun run ${CLI_ENTRY}'`);
  console.log('\nThen:');
  console.log('  cd <your-project>');
  console.log('  hivemind init');
}
