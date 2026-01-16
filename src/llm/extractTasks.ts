/**
 * Task extraction from plan markdown
 *
 * Two modes:
 * 1. Fast regex parsing (default) - handles common formats instantly
 * 2. LLM extraction (optional) - for complex plans, user-triggered
 */

import { spawn } from 'child_process';

export type ExtractedTask = {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'done';
};

/**
 * Fast regex-based task extraction
 * Handles common markdown patterns:
 * - [ ] pending task
 * - [x] completed task
 * - [ ] ~in progress~ (strikethrough = in progress)
 * ### 1. Numbered section headers
 * 1. Numbered list items
 */
export function extractTasksWithRegex(markdown: string): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Checkbox tasks: - [ ] task or - [x] task
    const checkboxMatch = line.match(/^[\s]*[-*]\s*\[([ xX])\]\s*(.+)$/);
    if (checkboxMatch) {
      const isDone = checkboxMatch[1].toLowerCase() === 'x';
      const title = checkboxMatch[2].trim();
      tasks.push({
        title: title.slice(0, 100),
        status: isDone ? 'done' : 'pending',
      });
      continue;
    }

    // Numbered section headers: ### 1. Task name or ## 1. Task name
    const sectionMatch = line.match(/^#{2,4}\s*\d+\.\s*(.+)$/);
    if (sectionMatch) {
      const title = sectionMatch[1].trim();
      // Skip if it looks like a file path or code
      if (!title.includes('/') && !title.includes('`')) {
        tasks.push({
          title: title.slice(0, 100),
          status: 'pending',
        });
      }
      continue;
    }

    // Top-level numbered list: 1. Task item (only at start of line)
    const numberedMatch = line.match(/^\d+\.\s+([A-Z][^.]+)$/);
    if (numberedMatch) {
      const title = numberedMatch[1].trim();
      tasks.push({
        title: title.slice(0, 100),
        status: 'pending',
      });
      continue;
    }
  }

  return tasks;
}

/**
 * LLM-based task extraction (slower, more accurate for complex plans)
 * Use extractTasksWithRegex() for real-time sync
 */
export async function extractTasksWithLLM(markdown: string): Promise<ExtractedTask[]> {
  const MAX_LENGTH = 4000;
  const truncated = markdown.length > MAX_LENGTH
    ? markdown.slice(0, MAX_LENGTH) + '\n\n[... truncated]'
    : markdown;

  const prompt = `I'm building a multi-agent coordination system. Extract implementation tasks from this plan as JSON array:
[{"title": "Task name", "status": "pending"}]

Plan:
${truncated}`;

  return new Promise((resolve, reject) => {
    const proc = spawn('claude', ['--print', '--output-format', 'text', prompt], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (err) => reject(new Error(`spawn failed: ${err.message}`)));

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`claude exited ${code}: ${stderr || stdout}`));
        return;
      }

      try {
        const match = stdout.match(/```(?:json)?\s*([\s\S]*?)```/) || stdout.match(/\[[\s\S]*\]/);
        const jsonStr = match ? (match[1] || match[0]).trim() : null;

        if (!jsonStr) {
          resolve([]);
          return;
        }

        const tasks = JSON.parse(jsonStr);
        resolve(tasks.map((t: any) => ({
          title: String(t.title || '').slice(0, 100),
          description: t.description,
          status: ['pending', 'in_progress', 'done'].includes(t.status) ? t.status : 'pending',
        })).filter((t: ExtractedTask) => t.title));
      } catch (err) {
        reject(new Error(`JSON parse failed: ${err}`));
      }
    });
  });
}

// Default export uses fast regex
export const extractTasksFromPlan = extractTasksWithRegex;
