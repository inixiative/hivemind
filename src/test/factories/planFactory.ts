import type { Database } from 'bun:sqlite';
import { createPlan } from '../../plans/createPlan';
import type { Plan } from '../../plans/types';
import type { Agent } from '../../agents/types';
import { buildAgent } from './agentFactory';

export type PlanOverrides = {
  title?: string;
  label?: string;
  description?: string;
  branch?: string;
  agent?: Agent;
};

export type BuildPlanResult = {
  plan: Plan;
  agent: Agent;
};

export function buildPlan(db: Database, overrides: PlanOverrides = {}): BuildPlanResult {
  const { agent: existingAgent, ...planOverrides } = overrides;

  const agent = existingAgent ?? buildAgent(db).agent;

  const plan = createPlan(db, {
    title: planOverrides.title ?? 'Test Plan',
    label: planOverrides.label,
    description: planOverrides.description,
    branch: planOverrides.branch,
    created_by: agent.id,
  });

  return { plan, agent };
}
