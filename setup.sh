#!/bin/bash
# Hivemind setup - wrapper for `hivemind install`

set -e

HIVEMIND_DIR="$(cd "$(dirname "$0")" && pwd)"

# Run the CLI install command
exec bun run "$HIVEMIND_DIR/src/cli.ts" install "$@"
