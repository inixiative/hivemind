# hivemind glossary

**Every term hivemind's region Wardens use, alphabetical, each with the region that holds it.**

<!-- Generated with the region Warden docs by the region pipeline's assemble.py. A term defined by two regions appears once per region. -->

---

## A

**agent**  
A Claude session's row in the agents table, id agt_{6hex}[_{label}]. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**agent status**  
active, idle or dead; getActiveAgents returns only active. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**agent-liveness**  
Class: deciding an agent is alive or dead, by PID locally or by lease in network mode. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**agent-registry**  
Class: agent records, register/reconnect, getAgent*/updateAgent*, hivemind_register and hivemind_status. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**agent:dead**  
Event the coordinator emits for a dead agent (reason lease_expired in network mode). *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**agent:register**  
Event emitted only when a new agent is created. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**agent_id 'system'**  
The agent_id emit records when the input gives none. *Region:* [Shared event log](event-log/knowledge.md)

**auto-approval**  
hivemind install allows every tool except hivemind_reset in ~/.claude/settings.json. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

## B

**blocked**  
Task state set only by blockTask, which no tool calls. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**blockTask / unclaimTask / assignTask**  
Helpers in src/tasks with no MCP tool and no emitted event. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**Bun only**  
Hivemind needs Bun (bun:sqlite, Bun.serve, Bun.sleep); Node is not supported. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**bun run mcp**  
Script that starts the stdio server (the default, local mode). *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**bun run mcp:http**  
Script that starts the HTTP server; needs HIVEMIND_API_TOKEN. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**bun test src/**  
The test suite (bun:test, in-memory shared DB from src/test/setup.ts); tsc is the type check. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**bun:sqlite**  
The only SQLite driver used; better-sqlite3 in package.json is an unused legacy dependency. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

## C

**claimed**  
Task state after hivemind_claim_task; its own status, owned by claimed_by. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**claimTask**  
Data call: sets claimed only where status is pending; returns null if taken or missing. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**claude mcp add**  
Claude Code command registerMcpServer runs to register the stdio server globally. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**.claude/CLAUDE.md**  
Project instructions init writes or appends, built by buildHivemindClaudeMd. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**.claude/settings.json**  
Project Claude settings where init writes the SessionStart hooks, only if none exist. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**CLAUDE_AGENT_LABEL**  
Optional label the hook gives the agent; it becomes part of the agent id. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**claude_hivemind_<project>**  
Per-project data directory; name lowercased, every character outside a-z0-9 replaced by _. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**cli**  
Class: the hivemind CLI commands status, watch and join, wired with commander in src/cli.ts. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**configurePermissions**  
Adds auto-approve entries for every hivemind tool except hivemind_reset to ~/.claude/settings.json. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**context_summary**  
Free-text note of what the agent knows; updateAgentContext. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**coordinator**  
Class: the per-project detached process that sweeps agents every 30 s and hosts the plan watcher. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**coordinator.pid / coordinator.lock**  
Files in the project data dir that keep one coordinator per project. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**createMcpServer**  
Builds the MCP Server named 'hivemind' with list-tools and call-tool handlers wired to core.ts. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

## D

**declared but not emitted**  
agent:unregister, worktree:switch, plan:join/leave/complete, task:unclaim/block/unblock: in src/events/types.ts, nothing emits them. *Region:* [Shared event log](event-log/knowledge.md)

**dev-runtime**  
Class: the Bun-only runtime and the dev checks bun test src/ and tsc. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**done**  
Task state after hivemind_complete_task, or when the task vanished from its plan file. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

## E

**emit**  
src/events function and the only writer of events; returns the event with its seq. *Region:* [Shared event log](event-log/knowledge.md)

**ensureCoordinator**  
Spawns the coordinator as a detached bun process unless one runs; called by hivemind_emit. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**ensureCoordinator**  
Called by hivemind_emit to start the per-project coordinator if it is not running (agents-and-liveness). *Region:* [Shared event log](event-log/knowledge.md)

**event**  
One row in the events table: id, hex, seq, timestamp, agent_id, plan_id, task_id, worktree_id, branch, event_type, content, metadata. *Region:* [Shared event log](event-log/knowledge.md)

**Event-based communication**  
Design rule: agents never talk directly; they emit and query events. *Region:* [Shared event log](event-log/knowledge.md)

**event-log**  
This class: the shared per-project event log, its writers, readers and event types. *Region:* [Shared event log](event-log/knowledge.md)

**event_type**  
Free string column; hivemind_emit accepts any type string. *Region:* [Shared event log](event-log/knowledge.md)

**evt_ id**  
Event id evt_{6hex} built from a 5-digit seq by makeEventId (storage-and-primitives). *Region:* [Shared event log](event-log/knowledge.md)

**execSync wrapper**  
A src/git function that runs one git command and returns null on failure. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**executeToolByName**  
Dispatches a tool name plus args to its executeX function; throws 'Unknown tool: <name>'. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**extractMarkdownSection**  
Helper in src/init/claudeConfig.ts that pulls the Hivemind Events section out of the repo CLAUDE.md. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**extractTasksFromPlan**  
The regex task extractor (same function as extractTasksWithRegex) used by plan sync. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

## F

**free-form types**  
decision, question, answer, context, note: the types agents themselves emit. *Region:* [Shared event log](event-log/knowledge.md)

## G

**getAgentLeaseTtlMs**  
The lease TTL in milliseconds, falling back to 180000 on bad values. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**getBranch**  
git branch --show-current, or null. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**getConnection**  
Returns the cached WAL bun:sqlite Database for a project, creating or migrating it on first use. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**getCoordinatorStatus**  
Reports whether the coordinator runs and its pid, without starting it. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**getCurrentProject**  
Resolves the project name from HIVEMIND_PROJECT or the working directory name. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**getCurrentWorktree**  
The git worktree containing a directory, defaulting to process.cwd(). *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**getEventsByPlan / getEventsByAgent / getEventsByBranch / getEventsByWorktree**  
Scoped history readers for one plan, agent, branch or worktree. *Region:* [Shared event log](event-log/knowledge.md)

**getEventsSince**  
Reads events after a seq (number) or after a timestamp (string), oldest first. *Region:* [Shared event log](event-log/knowledge.md)

**getGitInfo**  
One call returning isRepo, branch, repo name and root for a directory. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**getPendingTasks**  
Lists claimable pending tasks, optionally for one plan. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**getProjectPaths**  
Computes a project's projectDir, dbPath and other on-disk paths from its sanitized name. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**getRecentEvents**  
Reads the latest events, newest first (limit 50 by default). *Region:* [Shared event log](event-log/knowledge.md)

**getRepoName**  
Repo name from the origin remote URL, else the top-level directory name; the project name. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**getRepoRoot**  
git rev-parse --show-toplevel. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**getTasksByPlan**  
Lists every task of a plan in any status. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**getWorktrees**  
Live list of git worktrees from git worktree list --porcelain: path, branch, commit, isMain. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**git worktree**  
An extra checkout of the same repo in its own directory, listed by git worktree list. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**git-helpers**  
This class: the execSync git wrappers in src/git. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**grace period**  
New agents get 60 s before PID checks apply (local mode). *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

## H

**/health**  
Unauthenticated GET returning {ok, mode:'network', sessions}. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**hivemind CLI**  
The hivemind binary: install, init, status, watch, join (commander). *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**Hivemind Events**  
CLAUDE.md section on what to emit (under 80 chars, decisions and blockers, skip routine progress); init copies it into projects. *Region:* [Shared event log](event-log/knowledge.md)

**Hivemind Events section**  
The CLAUDE.md section on concise events that init copies into each project. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**hivemind init**  
Per-project setup: DB, SessionStart hooks in .claude/settings.json, .claude/CLAUDE.md; -p, --no-hooks. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**hivemind install**  
One-time machine setup: claude mcp add at user scope plus tool auto-approval. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**hivemind join**  
Register an agent by hand from the terminal with -l label and -c context. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**hivemind watch**  
Live tail that polls new events every second. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**hivemind-mcp**  
Package bin for the stdio server (dist/mcp/server.js); needs Bun. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**hivemind.db**  
The project's SQLite file: agents, worktrees, plans, tasks, events and sequences tables. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**hivemind_* tools**  
setup, register, emit, query, status, events, claim_task, start_task, complete_task, worktree_cleanup, reset. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**HIVEMIND_AGENT_LEASE_TTL_SECONDS**  
Lease length before an unrefreshed agent is marked dead, default 180. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**HIVEMIND_API_TOKEN**  
Bearer token required on every /mcp request; also needed by the remote SessionStart path. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**HIVEMIND_BASE**  
Env var and constant for the data root holding every project, default ~/.hivemind. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**hivemind_claim_task / hivemind_start_task / hivemind_complete_task**  
MCP tools (project, taskId, agentId) that move a task and emit task:claim, task:start, task:complete. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**hivemind_emit**  
MCP tool that writes an event for other agents and ensures the coordinator is running. *Region:* [Shared event log](event-log/knowledge.md)

**hivemind_events**  
MCP tool returning recent events (limit 20) with optional since, type and agentId filters. *Region:* [Shared event log](event-log/knowledge.md)

**HIVEMIND_NETWORK_MODE**  
Selects lease liveness when 1, true, yes or on; mcp:http sets it. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**HIVEMIND_NETWORK_MODE**  
Liveness toggle; startHttpMcpServer sets it to 1 when unset. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**hivemind_query**  
MCP tool filtering events by since, planId, agentId or branch (first given wins), limit 50. *Region:* [Shared event log](event-log/knowledge.md)

**hivemind_register**  
Tool that registers the calling agent, reconnecting by session id then PID; executeRegister. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**HIVEMIND_REMOTE_URL**  
When set, the hook calls hivemind_register and hivemind_status on a remote MCP server; needs HIVEMIND_API_TOKEN. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**hivemind_reset**  
MCP tool that wipes and recreates the database; needs confirm: true and is never auto-approved. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**hivemind_setup**  
MCP tool that initializes a project's database; returns needsInput in a git repo when useGit is unset. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**hivemind_status**  
Tool returning summary, metrics, worktrees, activity and recent events; executeStatus. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**HIVEMIND_TOOL_DEFS**  
Array in src/mcp/core.ts of all 11 tool definitions both servers return from list-tools. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**hivemind_worktree_cleanup**  
MCP tool (project, dryRun) removing records whose path no longer exists and emitting worktree:stale. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**hooks/session-start.sh**  
The plugin's hook script that runs the SessionStart hook. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

## I

**ids**  
Class: hivemind id minting, branding, validation and parsing. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**in_progress**  
Task state after hivemind_start_task. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**initializeDb**  
Creates project directories and a fresh database with the schema, bypassing the connection cache. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**initialPlanSync**  
One-time scan that syncs every existing plan file at coordinator start. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**install-and-init**  
Class: hivemind install (machine) and hivemind init (project) wiring hivemind into Claude Code. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**is_main**  
Flag for the repository's main worktree; getAllWorktrees lists it first. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**isGitRepo**  
Boolean: git rev-parse --is-inside-work-tree succeeds. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**isNetworkLivenessMode**  
Reads HIVEMIND_NETWORK_MODE and says which liveness mode is on. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**isStale**  
True when a timestamp is missing or older than a threshold (default 30 s). *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**isValidId**  
Full-format id check; isAgentId and its siblings check only the prefix. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

## L

**last_seen_at**  
Agent column holding the lease timestamp in network mode. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**living documents**  
Plans never auto-complete; they stay active as context after all tasks are done. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**local mode**  
Default stdio mode: agents tracked by PID, no heartbeats. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

## M

**markAgentDead**  
Sets an agent dead, clears its plan and task, releases claimed/in_progress tasks to pending. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**matchers startup, compact, resume**  
The three SessionStart matchers hivemind init writes hook entries for. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**/mcp**  
The bearer-authenticated streamable-HTTP MCP endpoint. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**mcp-session-id**  
Header naming an MCP session; each session gets its own transport and server. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**mcp-tools**  
Class: defining and dispatching the hivemind_* MCP tools in src/mcp/core.ts and src/mcp/tools/. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**mcp-transports**  
Class: serving the tools over stdio (src/mcp/server.ts) or streamable HTTP (src/mcp/httpServer.ts). *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**migrateDb**  
Idempotent compatibility migrations getConnection runs when it opens an existing database. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

## N

**network mode**  
HTTP mode: agents tracked by last_seen_at lease; PIDs not checked. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**network mode**  
One shared hivemind over HTTP; agents tracked by last_seen_at leases instead of PIDs. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**now**  
The current time as a stored-format timestamp string. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

## P

**parseDatetime**  
Turns a stored timestamp string back into a Date, or null. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**parseId**  
Splits any hivemind id into type, hex, sequence and label. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**pending**  
Task state: unclaimed and claimable. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**pid**  
Claude's process id (process.ppid) stored on the agent for local liveness. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**plan file**  
A markdown file in ~/.claude/plans/ written in Claude's plan mode; the source of a plan's tasks. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**plan hex**  
The 6-hex part of a plan id, inherited by its task ids (tsk_<planhex>_001). *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**plan status**  
active by default; complete when its file is deleted and the watcher had seen it. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**plan-sync**  
This class: plan files in ~/.claude/plans/ synced into plan and task records by the coordinator's watcher. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**PORT**  
HTTP port for network mode, default 8787; hostname defaults to 0.0.0.0. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**{prefix}_{6hex}[_{label}]**  
The id format; prefixes agt, pln, tsk, evt, wkt. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**process.ppid**  
Claude's PID, which the local hook path stores on the agent for PID liveness. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**project: frontmatter**  
Plan-file frontmatter key; files naming another project are skipped. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

## R

**reconcileTasks**  
Matches extracted tasks to DB tasks by lowercase title: create new, mark missing done, update status. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**reconnect**  
Reusing an existing active agent found by session id, then by PID, instead of creating one. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**registerWorktree**  
Inserts one worktree record. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**release on death**  
markAgentDead returns a dead agent's claimed and in_progress tasks to pending (agents-and-liveness). *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**removeWorktree**  
Deletes a record's DB row only, never the git worktree. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**resetDb**  
Deletes a project's database files and recreates them; backs hivemind_reset. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**runCoordinator**  
The coordinator process body: take the lock, sweep every 30 s, run the plan watcher. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**runSessionStartHook**  
The hook's entry in src/hooks/sessionStart.ts; reads stdin JSON, registers, reads status, prints context. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

## S

**sanitizeLabel**  
Lowercases a label, strips non-alphanumerics and truncates to 20 characters. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**schema.sql**  
The table definitions initializeDb applies to a new database. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**seq**  
Monotonic per-project event sequence number from the sequences table; the efficient polling cursor. *Region:* [Shared event log](event-log/knowledge.md)

**sequences**  
Table holding the counters for event and task sequence numbers. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**Server name 'hivemind'**  
The MCP server identity createMcpServer declares. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**session-start-hook**  
Class: the Claude Code SessionStart hook runSessionStartHook and its local and remote paths. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**session_id**  
Claude Code session id stored on the agent; changes on compaction (updateAgentSession). *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**session_id / cwd**  
Fields of the hook's stdin JSON; cwd gives the git repo, whose name is the project. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**SessionStart hook**  
Claude Code hook that registers the session as an agent and injects hivemind status into Claude's context. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**./setup.sh**  
Source-checkout installer; a wrapper for hivemind install. *Region:* [Claude Code hook, install and CLI](claude-code-integration/knowledge.md)

**startHttpMcpServer**  
startHttpMcpServer({port, hostname}): the Bun.serve streamable-HTTP MCP server. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**startPlanWatcher**  
Watches the plans directory with a debounce and syncs changed files; started by the coordinator. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**stdio server**  
src/mcp/server.ts: createMcpServer over a stdio transport; local mode, PID liveness. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**storage**  
Class: the per-project SQLite database, its location, schema, migration, setup and reset. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**subtask id**  
A task id with a dotted sequence, such as tsk_e9d2c1_001.1. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**syncPlanFile**  
Syncs one plan file: create the plan if new, extract tasks, reconcile, emit plan:create or plan:sync. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**syncWorktreesFromGit**  
Registers new git worktrees, refreshes known ones, returns the records; called by hivemind_register. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**system events**  
Namespaced types hivemind emits itself, such as task:claim and worktree:register. *Region:* [Shared event log](event-log/knowledge.md)

## T

**tasks**  
This class: task records, their states and the claim, start and complete workflow. *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**timestamps**  
Class: the local yyyy/mm/dd hh:mm:ss TZ timestamp format and its helpers. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**tool def + executeX**  
Each src/mcp/tools/ file exports a tool definition, an executeX function and its input/result types. *Region:* [MCP tools and transports](mcp-server/knowledge.md)

**touchAgent**  
Renews an agent's last_seen_at and sets it active; called by every tool that names the agent. *Region:* [Agents, liveness and coordinator](agents-and-liveness/knowledge.md)

**tsk_ id**  
Task id inheriting its plan's hex plus a 3-digit sequence; subtasks as 001.1 (storage-and-primitives). *Region:* [Plans and tasks](plans-and-tasks/knowledge.md)

**typed id**  
A branded string type (AgentId, PlanId, TaskId, EventId, WorktreeId) made by agentId, planId and friends. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

## U

**updateWorktreeCommit**  
Stores a record's current commit hash. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**updateWorktreeSeen**  
Refreshes a record's last_seen and marks it active. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

## W

**WAL**  
SQLite write-ahead journal mode, set on every connection so several sessions can share the file. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)

**wkt_ id**  
Worktree id {prefix}_{6hex}[_{label}] (storage-and-primitives). *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**worktree registry**  
The worktrees table of a project's hivemind DB. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**worktree:register**  
Event emitted by syncWorktreesFromGit for a newly registered worktree. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**worktree:stale**  
Event emitted by hivemind_worktree_cleanup for each removed record. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**WorktreeRecord**  
A stored row: wkt_ id, path, branch, commit_hash, is_main, status, last_seen. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

**worktrees**  
This class: hivemind's worktree registry, its git sync and cleanup. *Region:* [Git helpers and worktrees](git-and-worktrees/knowledge.md)

## Y

**yyyy/mm/dd hh:mm:ss TZ**  
The local timestamp format stored everywhere, e.g. 2025/01/15 09:14:32 PST. *Region:* [Storage, ids and timestamps](storage-and-primitives/knowledge.md)
