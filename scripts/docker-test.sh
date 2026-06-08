#!/bin/bash

set -e

# Load env vars from .env file
if [ ! -f .env ]; then
  echo "❌ .env file not found"
  exit 1
fi

source .env

# Check required vars
required_vars=("DATABASE_URL" "DIRECT_URL" "JWT_SECRET" "REDIS_URL")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing required env var: $var"
    exit 1
  fi
done

echo "✅ All env vars loaded"

# Stop any existing container on port 3000
echo "🧹 Cleaning up existing containers on port 3000..."
docker stop $(docker ps -q --filter "publish=3000") 2>/dev/null || true

# Build
echo "🔨 Building Docker image..."
docker build \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg DIRECT_URL="$DIRECT_URL" \
  -t hookman-backend .

echo "✅ Build successful"

# Run
echo "🚀 Starting container..."
docker run --rm -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DIRECT_URL="$DIRECT_URL" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e REDIS_URL="$REDIS_URL" \
  -e NODE_ENV="production" \
  -e PORT="3000" \
  hookman-backend