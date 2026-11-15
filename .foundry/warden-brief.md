# hivemind, for its Wardens

hivemind (`@inixiative/hivemind`) is multi-agent coordination for Claude Code over MCP: several
Claude sessions on one project share a SQLite event log, plans, tasks, agents and git worktrees.
It is paused (see the README): not maintained, likely to be revived, so prefer fixing what exists
over adding to it. It runs on Bun only (`bun:sqlite`, `Bun.serve`). There is no library API: the
surfaces are the `hivemind_*` MCP tools, the `hivemind` CLI and the SessionStart hook.

## Shape of the repository

- `src/mcp/core.ts` defines the 11 tools once; `src/mcp/tools/` has one file per tool (a tool
  def plus `executeX`). `server.ts` serves them over stdio (local mode), `httpServer.ts` over
  HTTP with a bearer token (network mode).
- `src/hooks/sessionStart.ts` registers the session's agent, locally or on a remote server.
- `src/coordinator/`: the per-project background process (liveness sweep, plan watcher), started
  by `hivemind_emit` through `ensureCoordinator`.
- `src/watcher/` + `src/llm/`: Claude plan files in `~/.claude/plans/` to plans and tasks (regex
  extraction, reconcile by title).
- Domain modules, one function per file, each taking the `bun:sqlite` Database first: `agents/`,
  `events/`, `plans/`, `tasks/`, `worktrees/`, `git/`, `ids/`, `datetime/`, `db/`
  (`getConnection`, `schema.sql`, `migrateDb`).
- `src/cli.ts` + `src/cli/` + `src/init/`: install, init (writes `.claude/settings.json` hooks
  and `.claude/CLAUDE.md`), status, watch, join.
- `src/utils/` and `src/test/multiAgentDemo.ts` are leftovers of a demo, not hivemind code.
- Check: `bun test src/` and `bunx tsc --noEmit`. No linter.

## Rules that hold everywhere

- Two liveness modes: local tracks agents by PID; network (`HIVEMIND_NETWORK_MODE`, set by
  `mcp:http`) tracks a `last_seen_at` lease that every tool call naming the agent renews. A
  change to agent lifecycle has to work in both.
- Events are the only channel between agents; agents never talk directly.
- Plans are living documents and never auto-complete.
- Timestamps are local `yyyy/mm/dd hh:mm:ss TZ` strings from `src/datetime`; ids come from
  `src/ids` (`{prefix}_{6hex}[_{label}]`).

## Words used here

agent, session, PID, lease, liveness mode, local mode, network mode, coordinator, sweep, event,
plan, plan file, task, claim, reconcile, worktree, project, hook.
