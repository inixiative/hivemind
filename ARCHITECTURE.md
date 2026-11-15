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
│        MCP Server (stdio, or HTTP in network mode)           │
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
│  - Checks agent PIDs (local) or leases (network)             │
│  - Marks dead agents, runs the plan watcher                  │
│  - Runs indefinitely per project                            │
└─────────────────────────────────────────────────────────────┘
```

## Agent Lifecycle

There are two liveness modes, chosen by `HIVEMIND_NETWORK_MODE` (`1`, `true`, `yes` or `on`; `bun run mcp:http` sets it if unset). See `src/agents/livenessMode.ts`.

- **Local mode (default, stdio):** agents are tracked by their **process ID (PID)**. The diagram below shows this mode.
- **Network mode (HTTP):** agents are tracked by a **lease**. `last_seen_at` is set on register and refreshed by every register, status, events, query, emit and task call that names the agent (`touchAgent`). The coordinator marks an agent dead when `last_seen_at` (or `created_at`) is older than `HIVEMIND_AGENT_LEASE_TTL_SECONDS` (default 180), and emits `agent:dead` with reason `lease_expired`. PIDs are not checked.

Marking an agent dead releases its `claimed` and `in_progress` tasks back to `pending` and clears its current plan and task.

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
- Runs when Claude starts, resumes or compacts (matchers `startup`, `resume`, `compact`)
- Reads the hook's stdin JSON (`session_id`, `cwd`); the project is the git repo name
- Locally: registers the agent with `process.ppid` (Claude's PID) through `executeRegister`, then reads `executeStatus`
- With `HIVEMIND_REMOTE_URL` set (needs `HIVEMIND_API_TOKEN`): calls `hivemind_register` and `hivemind_status` on the remote MCP server instead
- An optional label comes from `CLAUDE_AGENT_LABEL`
- Outputs agent info to Claude's context
- Does not start the coordinator (see below)

### 2. Coordinator (`src/coordinator/index.ts`)
- Singleton per project (`coordinator.pid` and `coordinator.lock` in the project data dir)
- Started as a detached `bun` process by `ensureCoordinator` (`src/coordinator/spawn.ts`), which `hivemind_emit` calls on every emit; nothing else starts it
- Sweeps every 30 seconds
- Local mode: checks if agent PIDs are alive via `process.kill(pid, 0)`, with a 1-minute grace period for new agents; agents without a PID are left alone
- Network mode: marks agents whose lease expired
- Starts the plan watcher
- Runs indefinitely

### 3. MCP Tools (`src/mcp/tools/`)
Defined once in `src/mcp/core.ts` (`HIVEMIND_TOOL_DEFS`, `executeToolByName`, `createMcpServer`) and served over stdio (`src/mcp/server.ts`) or HTTP (`src/mcp/httpServer.ts`).

- `hivemind_setup` - Initialize project database
- `hivemind_register` - Register agent (reconnects by session ID, then PID)
- `hivemind_emit` - Emit events for other agents
- `hivemind_query` - Query events (by since, plan, agent or branch)
- `hivemind_status` - Get hivemind status
- `hivemind_events` - Get recent events
- `hivemind_claim_task`, `hivemind_start_task`, `hivemind_complete_task` - Task workflow
- `hivemind_worktree_cleanup` - Find and clean up stale worktrees
- `hivemind_reset` - Reset database (delete and recreate schema)

### 4. HTTP Server (`src/mcp/httpServer.ts`)
- `bun run mcp:http`; listens on `PORT` (default 8787), hostname `0.0.0.0`
- `GET /health` returns `{ ok, mode: 'network', sessions }`
- `/mcp` requires `Authorization: Bearer <HIVEMIND_API_TOKEN>`; each MCP session (`mcp-session-id`) gets its own streamable HTTP transport

### 5. Database Schema

**agents** - Claude sessions
```sql
id, hex, label, status, pid, session_id, last_seen_at,
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
Claude starts → SessionStart hook
  → executeRegister() (init DB if needed, create or reconnect agent with PID)
  → executeStatus()
  → Output to Claude's context
```

### Event Communication
```
Agent emits event → hivemind_emit MCP tool
  → ensureCoordinator() (start if needed)
  → Insert into events table
  → Other agents query via hivemind_query
```

### Plan Sync
```
Claude enters plan mode → Creates file in ~/.claude/plans/
  → Plan watcher (in the coordinator) detects changes
  → Skips files whose `project:` frontmatter names another project
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
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "bun run /path/to/hivemind/src/hooks/sessionStart.ts"
      }]
    }]
  }
}
```

`hivemind init` writes one such entry for each of the matchers `startup`, `compact` and `resume`, and only when the project has no SessionStart hooks yet.

### MCP Server
Registered globally via `claude mcp add` (`hivemind install`).

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
pending ──claim──▶ claimed ──start──▶ in_progress ──complete──▶ done
                     │                                   ▲
                     └──────────────complete─────────────┘
```

`claimed` is its own status. Claim only succeeds on a `pending` task. A dead agent's `claimed` and `in_progress` tasks go back to `pending`. The schema and `src/tasks/` also have `blocked` (`blockTask`) and `unclaimTask`, but no MCP tool calls them. When a task disappears from its plan file, reconciliation marks it `done`.

```
```

### Plan Cleanup

Plans can be:
- **Deleted** - Remove the `.md` file; the watcher marks the plan "complete" (only for files it has seen since the coordinator started)
- **Archived** - Keep file but move out of `~/.claude/plans/`
- **Left active** - Fine to keep plans with all tasks done as documentation

## Key Design Decisions

1. **PID-based lifecycle locally, leases over the network** - Locally no heartbeats are needed: agents live as long as their process. In network mode each tool call renews the agent's lease.

2. **Coordinator singleton** - One per project, runs forever, minimal overhead.

3. **Session ID lookup** - MCP tools can find agent by Claude's session ID.

4. **Grace period** - New agents get 1 minute before PID checking kicks in (local mode).

5. **Event-based communication** - Agents don't talk directly; they emit/query events.

6. **Plans as living docs** - Plans don't auto-complete; they persist as context. Find work by querying plans with pending tasks.
