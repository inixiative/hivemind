# Hivemind

Multi-agent coordination for Claude Code. Shared event log, plans, and tasks across multiple Claude sessions.

## Quick Start

```bash
bun install
bun run build
```

Add to Claude Code MCP config:
```json
{
  "mcpServers": {
    "hivemind": {
      "command": "bun",
      "args": ["run", "/path/to/hivemind/src/mcp/server.ts"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `hivemind_setup` | Initialize project |
| `hivemind_register` | Register this agent |
| `hivemind_heartbeat` | Send heartbeat |
| `hivemind_emit` | Emit event to log |
| `hivemind_query` | Query events |
| `hivemind_status` | Get status |

## ID Format

`{type}_{6hex}[_{label}]`

- `agt_7a3f2b_alice` - Agent
- `pln_e9d2c1_auth` - Plan
- `tsk_e9d2c1_001` - Task (inherits plan hex)
- `evt_f1a2b3_00001` - Event
- `wkt_a1b2c3` - Worktree

## Event Types

```
agent:register/heartbeat/unregister
plan:create/join/complete
task:create/claim/start/complete/block
decision, question, answer, note
```

## Database

Stored at `~/.hivemind/claude_hivemind_<project>/db.sqlite`

Tables: agents, plans, tasks, events, worktrees

## Timestamps

Format: `yyyy/mm/dd hh:mm:ss TZ`
