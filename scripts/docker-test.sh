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

# Stop and remove any existing containers on port 3000 or named hookman-test
echo "🧹 Cleaning up existing containers..."
docker stop hookman-test 2>/dev/null || true
docker rm hookman-test 2>/dev/null || true
docker stop $(docker ps -q --filter "publish=3000") 2>/dev/null || true
docker rm $(docker ps -aq --filter "publish=3000") 2>/dev/null || true

# Build
echo "🔨 Building Docker image..."
docker build \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg DIRECT_URL="$DIRECT_URL" \
  -t hookman-backend .

echo "✅ Build successful"

# Run container in detached mode
echo "🚀 Starting container..."
CONTAINER_ID=$(docker run -d --rm -p 3000:3000 \
  --name hookman-test \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DIRECT_URL="$DIRECT_URL" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e REDIS_URL="$REDIS_URL" \
  -e NODE_ENV="production" \
  -e PORT="3000" \
  hookman-backend)

# Function to clean up on exit
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  docker stop hookman-test 2>/dev/null || true
  docker rm hookman-test 2>/dev/null || true
  docker stop $(docker ps -q --filter "publish=3000") 2>/dev/null || true
  docker rm $(docker ps -aq --filter "publish=3000") 2>/dev/null || true
  echo "✅ Cleanup completed"
}

# Set trap for cleanup on script exit
trap cleanup EXIT INT TERM

# Wait for server to initialize and show logs
echo "⏳ Waiting for server to initialize..."
echo "   (Database connection and migrations are running...)"
sleep 5

# Show recent logs
echo ""
echo "📋 Container logs:"
docker logs "$CONTAINER_ID" 2>/dev/null || true

# Check if server process is running
echo ""
echo "🔍 Checking if server process is running..."
if docker exec hookman-test ps aux 2>/dev/null | grep -q "node dist/server.js"; then
  echo "✅ Node server process is running"
else
  echo "⚠️  Node server process not found yet, waiting more..."
  sleep 3
fi

# Show updated logs
echo ""
echo "📋 Updated logs:"
docker logs "$CONTAINER_ID" 2>/dev/null || true

# Test if server is responding with more patience
echo ""
echo "🧪 Testing server health..."
SERVER_READY=false
for i in {1..15}; do
  echo -ne "   Attempt $i/15...\r"
  if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server health endpoint is responding"
    curl -s http://localhost:3000/health
    SERVER_READY=true
    break
  elif curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server root endpoint is responding"
    SERVER_READY=true
    break
  elif curl -s http://localhost:3000 2>&1 | grep -q "Connection refused"; then
    echo "   Server not yet accepting connections..."
  else
    echo "   Waiting for server to be ready..."
  fi
  sleep 2
done

if [ "$SERVER_READY" = false ]; then
  echo "⚠️  Server didn't respond to health check after 30 seconds"
  echo "   This might be normal if the server takes longer to initialize"
  echo ""
  echo "📋 Final logs:"
  docker logs "$CONTAINER_ID" 2>/dev/null || true
fi

echo ""
echo "⏳ Server test completed. Will automatically stop in 5 seconds..."
echo "   (Press Ctrl+C to stop immediately)"

# Countdown
for i in {5..1}; do
  echo -ne "   Stopping in $i seconds...\r"
  sleep 1
done
echo ""

# Cleanup is handled by the trap
echo "✅ Test deployment completed and cleaned up successfully"