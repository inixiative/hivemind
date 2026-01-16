/**
 * Reconcile extracted tasks with database
 * Plan file is source of truth - DB reflects what's in the file
 */

import type { Database } from 'bun:sqlite';
import { createTask } from '../tasks/createTask';
import { getTasksByPlan } from '../tasks/getTasksByPlan';
import { completeTask } from '../tasks/completeTask';
import { startTask } from '../tasks/startTask';
import { emit } from '../events/emit';
import type { Task } from '../tasks/types';
import type { ExtractedTask } from './extractTasks';

export type ReconcileResult = {
  created: Task[];
  updated: Task[];
  removed: Task[];
  unchanged: number;
};

/**
 * Reconcile extracted tasks with existing tasks in a plan
 *
 * - Tasks in file but not DB → create
 * - Tasks in DB but not file → mark done (removed)
 * - Tasks in both → update status if changed
 */
export function reconcileTasks(
  db: Database,
  planId: string,
  extracted: ExtractedTask[]
): ReconcileResult {
  const existing = getTasksByPlan(db, planId);
  const existingByTitle = new Map(existing.map((t) => [t.title.toLowerCase(), t]));
  const extractedTitles = new Set(extracted.map((t) => t.title.toLowerCase()));

  const created: Task[] = [];
  const updated: Task[] = [];
  const removed: Task[] = [];
  let unchanged = 0;

  // Process extracted tasks
  for (const ext of extracted) {
    const titleKey = ext.title.toLowerCase();
    const existingTask = existingByTitle.get(titleKey);

    if (existingTask) {
      // Task exists - check if status changed
      const dbStatus = existingTask.status;
      const extStatus = ext.status;

      // Map extracted status to DB status
      let needsUpdate = false;
      if (extStatus === 'done' && dbStatus !== 'done') {
        completeTask(db, existingTask.id);
        updated.push({ ...existingTask, status: 'done' });
        needsUpdate = true;
      } else if (extStatus === 'in_progress' && dbStatus !== 'in_progress') {
        startTask(db, existingTask.id);
        updated.push({ ...existingTask, status: 'in_progress' });
        needsUpdate = true;
      }

      if (!needsUpdate) {
        unchanged++;
      }
    } else {
      // New task - create it
      const task = createTask(db, {
        plan_id: planId,
        title: ext.title,
        description: ext.description,
      });

      // Emit task:create system event
      emit(db, {
        type: 'task:create',
        task_id: task.id,
        plan_id: planId,
        content: `Task created: ${task.title}`,
      });

      // Set initial status if not pending
      if (ext.status === 'in_progress') {
        startTask(db, task.id);
      } else if (ext.status === 'done') {
        completeTask(db, task.id);
      }

      created.push(task);
    }
  }

  // Tasks in DB but not in file → mark as done (removed from plan)
  for (const task of existing) {
    const titleKey = task.title.toLowerCase();
    if (!extractedTitles.has(titleKey) && task.status !== 'done') {
      completeTask(db, task.id);
      removed.push({ ...task, status: 'done' });
    }
  }

  return { created, updated, removed, unchanged };
}
