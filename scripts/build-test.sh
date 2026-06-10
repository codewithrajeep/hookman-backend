#!/bin/bash

set -e

echo "🚀 Starting local validation..."

run_step() {
  local name="$1"
  local command="$2"

  echo ""
  echo "▶ $name"

  if eval "$command"; then
    echo "✅ $name passed"
  else
    echo "❌ $name failed"
    exit 1
  fi
}

run_step "Lint" "pnpm lint"
run_step "Type Check" "pnpm typecheck"
run_step "Build" "pnpm build"

echo ""
echo "🎉 Local validation completed successfully"