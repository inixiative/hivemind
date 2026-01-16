# Hivemind

Multi-agent coordination system for Claude Code.

## Development

```bash
bun install
bun test
bun run src/cli.ts status hivemind
```

## Hivemind Events

Emit concise events to coordinate. **Under 80 chars.** Map, not territory.

```
hivemind_emit type=decision content="Redis for cache, Postgres for persistence"
hivemind_emit type=context content="API rate limit: 100/min per key"
hivemind_emit type=note content="003 done, starting 004"
```

**Emit for:** architectural decisions, discoveries others need, blockers, questions.

**Skip:** routine progress, obvious steps, anything verbose.
