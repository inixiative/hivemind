# Hivemind

Multi-agent coordination for Claude Code. Shared event log, plans, and tasks across multiple Claude sessions.

## Quick Start

```bash
./setup.sh
```

That's it. Restart Claude Code and hivemind is active.

On startup you'll see:
```
hivemind: agt_7a3f2b joined myproject (main)
  session: abc123-def456
  active: agt_c4d5e6_alice
```

## How It Works

Agents are tracked by **process ID (PID)**, not heartbeats:
- SessionStart hook registers agent with Claude's PID
- Coordinator monitors PIDs every 30 seconds
- When Claude exits, coordinator detects dead PID and marks agent dead
- No polling or heartbeats required

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Tools

| Tool | Description |
|------|-------------|
| `hivemind_setup` | Initialize project |
| `hivemind_register` | Register this agent |
| `hivemind_emit` | Emit event to log |
| `hivemind_query` | Query events |
| `hivemind_status` | Get status |
| `hivemind_reset` | Reset database (for schema changes) |

## ID Format

`{type}_{6hex}[_{label}]`

- `agt_7a3f2b_alice` - Agent
- `pln_e9d2c1_auth` - Plan
- `tsk_e9d2c1_001` - Task (inherits plan hex)
- `evt_f1a2b3_00001` - Event
- `wkt_a1b2c3` - Worktree

## Event Types

```
agent:register/unregister
plan:create/join/complete
task:create/claim/start/complete/block
decision, question, answer, note
```

## Database

Stored at `~/.hivemind/claude_hivemind_{project}/hivemind.db`

Tables: agents, plans, tasks, events, worktrees

## Timestamps

Format: `yyyy/mm/dd hh:mm:ss TZ`
