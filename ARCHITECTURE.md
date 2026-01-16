# Hivemind Architecture

Multi-agent coordination system for Claude Code sessions.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Sessions                         │
├─────────────┬─────────────┬─────────────┬─────────────┬─────┤
│   Agent 1   │   Agent 2   │   Agent 3   │   Agent N   │ ... │
│  (PID 1234) │  (PID 5678) │  (PID 9012) │             │     │
└──────┬──────┴──────┬──────┴──────┬──────┴─────────────┴─────┘
       │             │             │
       ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                     MCP Server (stdio)                       │
│  hivemind_register, hivemind_emit, hivemind_query, etc.     │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                           │
│  ~/.hivemind/claude_hivemind_{project}/hivemind.db          │
├─────────────┬───────────┬──────────┬──────────┬─────────────┤
│   agents    │  events   │  plans   │  tasks   │  worktrees  │
└─────────────┴───────────┴──────────┴──────────┴─────────────┘
                          ▲
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                    Coordinator (singleton)                   │
│  - Monitors agent PIDs                                       │
│  - Marks dead agents                                         │
│  - Runs indefinitely per project                            │
└─────────────────────────────────────────────────────────────┘
```

## Agent Lifecycle

Agents are tracked by their **process ID (PID)**, not heartbeats.

```
SessionStart Hook
       │
       ▼
┌──────────────────┐
│ Register Agent   │  ← stores process.ppid (Claude's PID)
│ with PID         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Agent Active     │  ← PID is alive
│                  │
└────────┬─────────┘
         │
         │  Claude session ends
         ▼
┌──────────────────┐
│ Coordinator      │  ← sweeps every 30s
│ detects PID dead │  ← 1-min grace period for new agents
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Agent Marked     │
│ Dead             │
└──────────────────┘
```

## Core Components

### 1. SessionStart Hook (`src/hooks/sessionStart.ts`)
- Runs when Claude starts
- Registers agent with `process.ppid` (Claude's PID)
- Starts coordinator if not running
- Outputs agent info to Claude's context

### 2. Coordinator (`src/coordinator/index.ts`)
- Singleton per project (PID file lock)
- Sweeps every 30 seconds
- Checks if agent PIDs are alive via `process.kill(pid, 0)`
- 1-minute grace period before killing new agents
- Runs indefinitely

### 3. MCP Tools (`src/mcp/tools/`)
- `hivemind_setup` - Initialize project database
- `hivemind_register` - Register agent
- `hivemind_emit` - Emit events for other agents
- `hivemind_query` - Query events
- `hivemind_status` - Get hivemind status
- `hivemind_reset` - Reset database (delete and recreate schema)

### 4. Database Schema

**agents** - Claude sessions
```sql
id, hex, label, status, pid, session_id,
current_plan_id, current_task_id, worktree_id,
context_summary, created_at
```

**events** - Communication log
```sql
id, hex, seq, timestamp, agent_id, plan_id, task_id,
worktree_id, branch, event_type, content, metadata
```

**plans** - High-level work items
```sql
id, hex, label, title, description, status, branch,
worktree_id, claude_session_id, created_at, created_by
```

**tasks** - Granular work items within plans
```sql
id, plan_hex, seq, label, plan_id, title, description,
status, branch, worktree_id, claimed_by, claimed_at,
completed_at, outcome, parent_task_id
```

**worktrees** - Git worktrees
```sql
id, hex, label, path, branch, commit_hash, is_main,
status, created_at, last_seen
```

## Data Flow

### Agent Registration
```
Claude starts → SessionStart hook → executeJoin()
  → executeSetup() (init DB)
  → executeRegister() (create agent with PID)
  → ensureCoordinator() (start if needed)
  → Output to Claude's context
```

### Event Communication
```
Agent emits event → hivemind_emit MCP tool
  → Insert into events table
  → Other agents query via hivemind_query
```

### Plan Sync
```
Claude enters plan mode → Creates file in ~/.claude/plans/
  → Plan watcher detects changes
  → Extract tasks from markdown (regex)
  → Reconcile tasks with database
  → Tasks linked to plan
```

## ID Format

All IDs use a consistent format: `{prefix}_{hex}[_{label}]`

- `agt_7a3f2b` - Agent
- `agt_7a3f2b_alice` - Agent with label
- `evt_91737a_00005` - Event (with sequence)
- `pln_5092cb` - Plan
- `tsk_5092cb_001` - Task (with sequence under plan)
- `wkt_1604e7` - Worktree

## Configuration

### Claude Settings (`.claude/settings.json`)
```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "bun run /path/to/hivemind/src/hooks/sessionStart.ts"
      }]
    }]
  }
}
```

### MCP Server
Registered globally via `claude mcp add`.

## Plan Lifecycle

Plans are **living documents**, not transient workflows. They persist as context even after all tasks complete.

```
~/.claude/plans/feature-auth.md          ~/.hivemind/.../hivemind.db
            │                                        │
            ▼                                        ▼
┌─────────────────────┐                  ┌─────────────────────┐
│  Plan File (md)     │  ──watcher──▶    │  Plan Record        │
│  - Context/notes    │                  │  status: active     │
│  - Task list        │                  ├─────────────────────┤
│  - Updated freely   │                  │  Tasks              │
└─────────────────────┘                  │  - pending (3)      │
                                         │  - in_progress (1)  │
                                         │  - done (5)         │
                                         └─────────────────────┘
```

### Why Plans Don't Auto-Complete

1. **Living context** - Users update plans with notes, discoveries, new tasks
2. **Multi-session** - Plans may span multiple Claude sessions
3. **Documentation** - Plan file serves as record of decisions made

### Finding Work

Agents find work by querying plans with pending tasks:
```
Plans with open work:
  pln_abc123 "Auth Refactor"     [3 pending, 1 in_progress, 2 done]
  pln_def456 "API Cleanup"       [1 pending, 0 in_progress, 8 done]
```

### Task States

```
pending ──claim──▶ pending (claimed) ──start──▶ in_progress ──complete──▶ done
                         │                            │
                         └──unclaim──▶ pending        │
                                                      │
                              (blocked tasks stay in_progress)
```

### Plan Cleanup

Plans can be:
- **Deleted** - Remove the `.md` file; watcher marks plan "complete"
- **Archived** - Keep file but move out of `~/.claude/plans/`
- **Left active** - Fine to keep plans with all tasks done as documentation

## Key Design Decisions

1. **PID-based lifecycle** - No heartbeats needed. Agents live as long as their process.

2. **Coordinator singleton** - One per project, runs forever, minimal overhead.

3. **Session ID lookup** - MCP tools can find agent by Claude's session ID.

4. **Grace period** - New agents get 1 minute before PID checking kicks in.

5. **Event-based communication** - Agents don't talk directly; they emit/query events.

6. **Plans as living docs** - Plans don't auto-complete; they persist as context. Find work by querying plans with pending tasks.
