-- Hivemind Schema
-- Timestamps: yyyy/mm/dd hh:mm:ss TZ

-- Agents: active Claude instances
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,                    -- agt_7a3f2b or agt_7a3f2b_alice
  hex TEXT NOT NULL,                      -- 7a3f2b
  label TEXT,                             -- alice (optional)
  status TEXT DEFAULT 'active',           -- active/idle/dead
  pid INTEGER,                            -- listener process ID
  session_id TEXT,                        -- for claude --resume
  current_plan_id TEXT,                   -- pln_e9d2c1_auth
  current_task_id TEXT,                   -- tsk_e9d2c1_001
  worktree_id TEXT,                       -- wkt_a1b2c3
  context_summary TEXT,                   -- what this agent knows
  created_at TEXT NOT NULL,

  FOREIGN KEY (current_plan_id) REFERENCES plans(id),
  FOREIGN KEY (current_task_id) REFERENCES tasks(id),
  FOREIGN KEY (worktree_id) REFERENCES worktrees(id)
);

-- Worktrees: git worktrees being used
CREATE TABLE IF NOT EXISTS worktrees (
  id TEXT PRIMARY KEY,                    -- wkt_a1b2c3
  hex TEXT NOT NULL,                      -- a1b2c3
  label TEXT,                             -- feature-auth (optional)
  path TEXT NOT NULL UNIQUE,              -- /path/to/worktree
  branch TEXT,                            -- feature/auth
  commit_hash TEXT,                       -- current commit hash
  is_main INTEGER DEFAULT 0,              -- 1 if main worktree
  status TEXT DEFAULT 'active',           -- active/stale
  created_at TEXT NOT NULL,
  last_seen TEXT
);

-- Plans: coordinated work streams
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,                    -- pln_e9d2c1_auth
  hex TEXT NOT NULL,                      -- e9d2c1
  label TEXT,                             -- auth (optional)
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',           -- active/paused/complete
  branch TEXT,                            -- associated git branch
  worktree_id TEXT,                       -- associated worktree
  claude_session_id TEXT,                 -- claude --resume session ID
  created_at TEXT NOT NULL,
  created_by TEXT,                        -- agt_7a3f2b

  FOREIGN KEY (created_by) REFERENCES agents(id),
  FOREIGN KEY (worktree_id) REFERENCES worktrees(id)
);

-- Tasks: atomic units of work within plans
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,                    -- tsk_e9d2c1_001_jwt
  plan_hex TEXT NOT NULL,                 -- e9d2c1 (inherited from plan)
  seq TEXT NOT NULL,                      -- 001 or 001.1
  label TEXT,                             -- jwt (optional)
  plan_id TEXT NOT NULL,                  -- pln_e9d2c1_auth
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',          -- pending/claimed/in_progress/blocked/done
  branch TEXT,                            -- feature/auth (can differ from plan branch)
  worktree_id TEXT,                       -- wkt_a1b2c3 (where task is being worked)
  claimed_by TEXT,                        -- agt_7a3f2b
  claimed_at TEXT,
  completed_at TEXT,
  outcome TEXT,
  parent_task_id TEXT,                    -- for subtasks

  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (worktree_id) REFERENCES worktrees(id),
  FOREIGN KEY (claimed_by) REFERENCES agents(id),
  FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
);

-- Events: append-only log of all activity
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,                    -- evt_f1a2b3_00001
  hex TEXT NOT NULL,                      -- f1a2b3
  seq INTEGER NOT NULL,                   -- 1, 2, 3...
  timestamp TEXT NOT NULL,
  agent_id TEXT NOT NULL,                 -- agt_7a3f2b
  plan_id TEXT,                           -- pln_e9d2c1_auth (optional)
  task_id TEXT,                           -- tsk_e9d2c1_001 (optional)
  worktree_id TEXT,                       -- wkt_a1b2c3 (optional)
  branch TEXT,                            -- feature/auth (optional, git context)
  event_type TEXT NOT NULL,               -- decision/claim/complete/etc
  content TEXT,                           -- event-specific content
  metadata TEXT,                          -- JSON blob

  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (worktree_id) REFERENCES worktrees(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_plan ON agents(current_plan_id);
CREATE INDEX IF NOT EXISTS idx_agents_worktree ON agents(worktree_id);

CREATE INDEX IF NOT EXISTS idx_worktrees_path ON worktrees(path);
CREATE INDEX IF NOT EXISTS idx_worktrees_branch ON worktrees(branch);
CREATE INDEX IF NOT EXISTS idx_worktrees_status ON worktrees(status);

CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_by ON plans(created_by);
CREATE INDEX IF NOT EXISTS idx_plans_worktree ON plans(worktree_id);

CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_claimed_by ON tasks(claimed_by);
CREATE INDEX IF NOT EXISTS idx_tasks_branch ON tasks(branch);
CREATE INDEX IF NOT EXISTS idx_tasks_worktree ON tasks(worktree_id);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent_id);
CREATE INDEX IF NOT EXISTS idx_events_plan ON events(plan_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_worktree ON events(worktree_id);
CREATE INDEX IF NOT EXISTS idx_events_branch ON events(branch);

-- Sequence counter for events
CREATE TABLE IF NOT EXISTS sequences (
  name TEXT PRIMARY KEY,
  value INTEGER DEFAULT 0
);

INSERT OR IGNORE INTO sequences (name, value) VALUES ('events', 0);
