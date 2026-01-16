#!/bin/bash
# Hivemind SessionStart hook - auto-register agent when Claude starts
# Reads JSON from stdin, outputs context for Claude

exec bun run "${CLAUDE_PLUGIN_ROOT}/src/hooks/sessionStart.ts"
