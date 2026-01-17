/**
 * Plan Watcher - watches ~/.claude/plans/ for plan mode files
 *
 * When Claude enters plan mode, it creates markdown files like:
 *   ~/.claude/plans/purrfect-watching-lamport.md
 *
 * This watcher detects new/changed plans and syncs them to hivemind.
 * Uses LLM (Claude CLI) to extract tasks from markdown.
 */

import { watch, existsSync, readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import { getConnection } from '../db/getConnection';
import { createPlan } from '../plans/createPlan';
import { getPlan } from '../plans/getPlan';
import { updatePlanStatus } from '../plans/updatePlanStatus';
import { emit } from '../events/emit';
import { extractTasksFromPlan } from '../llm/extractTasks';
import { reconcileTasks } from '../llm/reconcileTasks';

const CLAUDE_PLANS_DIR = join(homedir(), '.claude', 'plans');

// Track known plan files to detect deletions
const knownFiles = new Map<string, string>(); // filename -> plan_id

// Debounce
const lastSync = new Map<string, number>();
const DEBOUNCE_MS = 1000;

/**
 * Parse plan title from markdown content
 * Looks for first # heading
 */
function parsePlanTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Parse project from YAML frontmatter
 * Looks for: ---\nproject: Name\n---
 */
function parseProjectFromPlan(content: string): string | null {
  // Match YAML frontmatter block and extract project field
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const projectMatch = frontmatter.match(/^project:\s*(.+?)\s*$/m);
  return projectMatch ? projectMatch[1].trim() : null;
}

/**
 * Sync a single plan file to hivemind
 * Uses LLM to extract tasks, then reconciles with DB
 */
export async function syncPlanFile(
  project: string,
  filename: string
): Promise<{ success: boolean; planId?: string; message: string }> {
  if (!filename.endsWith('.md')) {
    return { success: false, message: 'Not a markdown file' };
  }

  // Debounce
  const now = Date.now();
  const last = lastSync.get(filename) ?? 0;
  if (now - last < DEBOUNCE_MS) {
    return { success: false, message: 'Debounced' };
  }
  lastSync.set(filename, now);

  const filePath = join(CLAUDE_PLANS_DIR, filename);
  if (!existsSync(filePath)) {
    // File was deleted - mark plan as complete
    const planId = knownFiles.get(filename);
    if (planId) {
      const db = getConnection(project);
      updatePlanStatus(db, planId, 'complete');
      knownFiles.delete(filename);
      return { success: true, planId, message: `Plan ${planId} marked complete (file deleted)` };
    }
    return { success: false, message: 'File not found' };
  }

  // Read and parse
  const content = readFileSync(filePath, 'utf-8');

  // Check if plan belongs to a different project
  const planProject = parseProjectFromPlan(content);
  if (planProject && planProject !== project) {
    return { success: false, message: `Skipping (belongs to ${planProject})` };
  }

  const title = parsePlanTitle(content) || basename(filename, '.md');

  const db = getConnection(project);

  // Check if plan already exists
  let plan = getPlan(db, knownFiles.get(filename) || '');
  const isNew = !plan;

  if (!plan) {
    // Create new plan
    plan = createPlan(db, {
      title,
      description: content.slice(0, 500),
      label: basename(filename, '.md'),
    });

    knownFiles.set(filename, plan.id);

    emit(db, {
      type: 'plan:create',
      content: `New plan: ${title}`,
      plan_id: plan.id,
    });
  }

  // Extract tasks using LLM
  let tasks;
  try {
    tasks = await extractTasksFromPlan(content);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, planId: plan.id, message: `LLM extraction failed: ${msg}` };
  }

  // Reconcile tasks with DB
  const result = reconcileTasks(db, plan.id, tasks);

  const summary = [
    isNew ? 'Created plan' : 'Updated plan',
    `: ${title}`,
    ` (${result.created.length} new,`,
    ` ${result.updated.length} updated,`,
    ` ${result.removed.length} removed,`,
    ` ${result.unchanged} unchanged)`,
  ].join('');

  if (result.created.length > 0 || result.updated.length > 0 || result.removed.length > 0) {
    emit(db, {
      type: 'plan:sync',
      content: summary,
      plan_id: plan.id,
    });
  }

  return {
    success: true,
    planId: plan.id,
    message: summary,
  };
}

/**
 * Initial sync - scan existing plan files
 */
export async function initialPlanSync(project: string): Promise<void> {
  if (!existsSync(CLAUDE_PLANS_DIR)) {
    return;
  }

  const files = readdirSync(CLAUDE_PLANS_DIR).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    try {
      const result = await syncPlanFile(project, file);
      if (result.success && result.message !== 'Debounced') {
        console.log(`[plan-watcher] ${result.message}`);
      }
    } catch (err) {
      console.error(`[plan-watcher] Error syncing ${file}:`, err);
    }
  }
}

/**
 * Start watching the plans directory
 */
export function startPlanWatcher(options: {
  project: string;
  verbose?: boolean;
}): { stop: () => void } {
  const { project, verbose = false } = options;

  if (!existsSync(CLAUDE_PLANS_DIR)) {
    console.log(`[plan-watcher] Plans directory not found: ${CLAUDE_PLANS_DIR}`);
    return { stop: () => {} };
  }

  console.log(`[plan-watcher] Watching ${CLAUDE_PLANS_DIR}`);

  // Initial sync (async, don't block)
  initialPlanSync(project).catch((err) => {
    console.error('[plan-watcher] Initial sync error:', err);
  });

  // Start watching
  const watcher = watch(CLAUDE_PLANS_DIR, (event, filename) => {
    if (!filename || !filename.endsWith('.md')) return;

    // Small delay for file to finish writing, then async sync
    setTimeout(async () => {
      try {
        const result = await syncPlanFile(project, filename);

        if (verbose || (result.success && result.message !== 'Debounced')) {
          console.log(`[plan-watcher] ${result.message}`);
        }
      } catch (err) {
        console.error(`[plan-watcher] Error syncing ${filename}:`, err);
      }
    }, 500); // Longer delay for LLM call
  });

  return {
    stop: () => {
      watcher.close();
      console.log('[plan-watcher] Stopped');
    },
  };
}
