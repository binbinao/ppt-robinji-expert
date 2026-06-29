#!/bin/bash
set -e
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT/ppt-robinji"
exec npx tsx scripts/verify-success-metrics.ts
