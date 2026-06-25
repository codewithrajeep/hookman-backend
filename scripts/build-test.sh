#!/bin/bash

set -e

echo "Starting local validation..."
START_TIME=$(date +%s)

# Check for .env file
if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Some tests may fail."
fi

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

# Optional: Add these if you have the scripts
# run_step "Format Check" "pnpm format:check"
# run_step "Tests" "pnpm test"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo ""
echo "⏱️  Completed in ${DURATION}s"
echo "Local validation completed successfully"