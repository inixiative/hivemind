import type Database from 'better-sqlite3';
import { createTask } from '../tasks/createTask';
import { getTasksByPlan } from '../tasks/getTasksByPlan';
import { completeTask } from '../tasks/completeTask';
import { startTask } from '../tasks/startTask';
import type { Task } from '../tasks/types';

/**
 * A Claude todo item (from TodoWrite)
 */
export type ClaudeTodo = {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
};

/**
 * Sync Claude's TodoWrite items to hivemind tasks
 *
 * Matches by task title (content). Creates new tasks for new todos,
 * updates status for existing ones.
 */
export function syncTodosToHivemind(
  db: Database.Database,
  planId: string,
  todos: ClaudeTodo[],
  agentId: string
): { created: Task[]; updated: Task[]; message: string } {
  const existingTasks = getTasksByPlan(db, planId);
  const tasksByTitle = new Map(existingTasks.map((t) => [t.title, t]));

  const created: Task[] = [];
  const updated: Task[] = [];

  for (const todo of todos) {
    const existing = tasksByTitle.get(todo.content);

    if (existing) {
      // Update status if changed
      if (todo.status === 'completed' && existing.status !== 'done') {
        const result = completeTask(db, existing.id);
        if (result) updated.push(result);
      } else if (todo.status === 'in_progress' && existing.status === 'claimed') {
        startTask(db, existing.id);
        updated.push({ ...existing, status: 'in_progress' });
      }
    } else {
      // Create new task
      const task = createTask(db, {
        planId,
        title: todo.content,
        description: todo.activeForm,
      });
      created.push(task);

      // If already in_progress or completed, update status
      if (todo.status === 'in_progress') {
        startTask(db, task.id);
      } else if (todo.status === 'completed') {
        completeTask(db, task.id);
      }
    }
  }

  return {
    created,
    updated,
    message: `Synced ${todos.length} todos: ${created.length} created, ${updated.length} updated`,
  };
}

/**
 * Convert hivemind tasks to Claude todo format
 */
export function tasksToTodos(tasks: Task[]): ClaudeTodo[] {
  return tasks.map((task) => ({
    content: task.title,
    status:
      task.status === 'done'
        ? 'completed'
        : task.status === 'in_progress'
          ? 'in_progress'
          : 'pending',
    activeForm: task.description ?? task.title,
  }));
}
