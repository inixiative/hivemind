# Hivemind

Multi-agent coordination for Claude Code. Shared event log, plans, and tasks across multiple Claude sessions.

## Installation

### From npm (recommended)

```bash
npm install -g @inixiative/hivemind
```

Then add to Claude Code:

```bash
claude mcp add hivemind -- hivemind-mcp
```

Or manually add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "hivemind": {
      "command": "hivemind-mcp"
    }
  }
}
```

### From source

```bash
git clone https://github.com/inixiative/hivemind.git
cd hivemind
./setup.sh
```

Restart Claude Code and hivemind is active.

On startup, Claude receives context about the hivemind state:
```
hivemind: agt_7a3f2b joined myproject (main)
  session: abc123-def456
  active: agt_c4d5e6_alice
```

This info goes into Claude's system context (not printed to terminal). Claude knows its agent ID and can see other active agents.

## How It Works

Agents are tracked by **process ID (PID)**, not heartbeats:
- SessionStart hook registers agent with Claude's PID
- Coordinator monitors PIDs every 30 seconds
- When Claude exits, coordinator detects dead PID and marks agent dead
- No polling or heartbeats required

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Tools

| Tool | Description | Auto |
|------|-------------|------|
| `hivemind_status` | Get status (agents, plans, events) | ✓ |
| `hivemind_events` | Get recent events | ✓ |
| `hivemind_query` | Query events with filters | ✓ |
| `hivemind_claim_task` | Claim a task | ✓ |
| `hivemind_start_task` | Mark task in progress | ✓ |
| `hivemind_complete_task` | Mark task done | ✓ |
| `hivemind_worktree_cleanup` | Clean up stale worktrees | ✓ |
| `hivemind_setup` | Initialize project | ✓ |
| `hivemind_register` | Register this agent | ✓ |
| `hivemind_emit` | Emit event to log | ✗ |
| `hivemind_reset` | Reset database | ✗ |

Tools marked ✓ are auto-approved after `./setup.sh`. Tools marked ✗ require confirmation.

## CLI

```bash
hivemind install    # One-time global setup
hivemind init       # Register current project
hivemind status     # Show project status
hivemind watch      # Live tail of events
hivemind join       # Join as an agent
```

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
