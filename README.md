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

Hivemind supports two lifecycle modes:
- Local mode (stdio): agents are tracked by **PID** and the coordinator marks agents dead when their process exits.
- Network mode (HTTP): agents are tracked by **lease heartbeat** (`last_seen_at`) and the coordinator marks agents dead when lease TTL expires.

Session start registers the agent, then status/events/query/task/emit calls refresh liveness in network mode.

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
| `hivemind_emit` | Emit event to log | ✓ |
| `hivemind_reset` | Reset database | ✗ |

Tools marked ✓ are auto-approved after `./setup.sh`. Tools marked ✗ require confirmation.

## Server Modes

### Local mode (default, stdio)

Use this for single-machine/local Claude sessions:

```bash
bun run mcp
```

This preserves the existing MCP stdio behavior and local PID-based lifecycle.

### Network mode (shared MCP over HTTP)

Use this when multiple containers/processes need to share one hivemind:

```bash
HIVEMIND_API_TOKEN=replace-me \
PORT=8787 \
bun run mcp:http
```

The HTTP endpoint is:

```text
http://0.0.0.0:$PORT/mcp
```

Network mode requires:
- `Authorization: Bearer <HIVEMIND_API_TOKEN>` on MCP HTTP requests
- Lease/heartbeat lifecycle (`last_seen_at`) with TTL sweeping (no PID liveness reliance)

## Environment Variables

- `HIVEMIND_API_TOKEN`: required for `bun run mcp:http`
- `PORT`: HTTP port for network mode (default `8787`)
- `HIVEMIND_REMOTE_URL`: when set in hook/agent environments, session-start register/status calls go to remote MCP instead of local DB logic
- `HIVEMIND_AGENT_LEASE_TTL_SECONDS`: lease TTL for stale-agent sweep in network mode (default `180`)
- `HIVEMIND_NETWORK_MODE`: liveness mode toggle (`1/true` enables lease-based mode). `mcp:http` enables this automatically.
- `HIVEMIND_BASE`: base directory for project DB/state (defaults to `~/.hivemind`)

## Container-to-Container Example

Shared hivemind service container:

```bash
docker run --rm -p 8787:8787 \
  -e HIVEMIND_API_TOKEN=supersecret \
  ghcr.io/inixiative/hivemind:latest \
  bun run mcp:http
```

Implementer/subject/oracle containers (each agent):

```bash
export HIVEMIND_REMOTE_URL=http://hivemind:8787/mcp
export HIVEMIND_API_TOKEN=supersecret
```

With `HIVEMIND_REMOTE_URL` set, `src/hooks/sessionStart.ts` registers and fetches status through the remote service, enabling shared coordination across isolated containers.

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
