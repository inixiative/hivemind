#!/usr/bin/env bun
/**
 * Hivemind CLI
 *
 * Usage:
 *   bun run src/cli.ts install           # One-time global setup
 *   bun run src/cli.ts init              # Register current project
 *   bun run src/cli.ts status            # Show project status
 *   bun run src/cli.ts join              # Join as an agent
 */

import { Command } from 'commander';
import { installCommand } from './cli/install';
import { initCommand } from './cli/init';
import { statusCommand } from './cli/status';
import { joinCommand } from './cli/join';

const program = new Command();

program
  .name('hivemind')
  .description('Multi-agent coordination system for Claude Code')
  .version('0.1.0');

program
  .command('install')
  .description('One-time setup: install dependencies and register MCP server')
  .action(installCommand);

program
  .command('init')
  .description('Register current project with hivemind')
  .option('-p, --project <name>', 'Project name (defaults to git repo name)')
  .option('--no-hooks', 'Skip session hook setup')
  .action(initCommand);

program
  .command('status')
  .description('Show hivemind status for the current project')
  .option('-p, --project <name>', 'Project name')
  .action(statusCommand);

program
  .command('join')
  .description('Join the hivemind as an agent')
  .option('-l, --label <label>', 'Agent label')
  .option('-c, --context <summary>', 'Context summary')
  .action(joinCommand);

program.parse();
