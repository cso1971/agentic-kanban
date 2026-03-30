#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
REMOTE_USER="${DEPLOY_USER:-root}"
REMOTE_HOST="${DEPLOY_HOST:?Set DEPLOY_HOST (e.g. 1.2.3.4 or myserver.com)}"
REMOTE_DIR="${DEPLOY_DIR:-/opt/agentic-kanban}"
SSH_KEY="${DEPLOY_SSH_KEY:-}"

SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
[[ -n "$SSH_KEY" ]] && SSH_OPTS+=(-i "$SSH_KEY")

ssh_cmd() { ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$REMOTE_HOST" "$@"; }
scp_cmd() { scp "${SSH_OPTS[@]}" "$@" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"; }

# ── Step 1: Build images locally ──────────────────────────────
echo "▸ Building images..."
docker build -t agentic-kanban-server:latest -f Dockerfile.server .
docker build -t agentic-kanban-worker:latest -f Dockerfile.worker .

# ── Step 2: Save images to tar archives ───────────────────────
echo "▸ Saving images..."
docker save agentic-kanban-server:latest | gzip > /tmp/agentic-kanban-server.tar.gz
docker save agentic-kanban-worker:latest | gzip > /tmp/agentic-kanban-worker.tar.gz

# ── Step 3: Prepare remote directory ──────────────────────────
echo "▸ Preparing remote directory..."
ssh_cmd "mkdir -p $REMOTE_DIR"

# ── Step 4: Copy files to server ──────────────────────────────
echo "▸ Copying files to $REMOTE_HOST:$REMOTE_DIR..."
scp_cmd docker-compose.prod.yml
scp_cmd .env
scp_cmd /tmp/agentic-kanban-server.tar.gz
scp_cmd /tmp/agentic-kanban-worker.tar.gz

# Copy config directory
scp -r "${SSH_OPTS[@]}" examples/calculator/config "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/config"

# ── Step 5: Load images on remote ─────────────────────────────
echo "▸ Loading images on remote..."
ssh_cmd "docker load < $REMOTE_DIR/agentic-kanban-server.tar.gz && docker load < $REMOTE_DIR/agentic-kanban-worker.tar.gz"

# ── Step 6: Start services ────────────────────────────────────
echo "▸ Starting services..."
ssh_cmd "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml up -d"

# ── Cleanup local temp files ─────────────────────────────────
rm -f /tmp/agentic-kanban-server.tar.gz /tmp/agentic-kanban-worker.tar.gz

echo "✔ Deployed to $REMOTE_HOST"
echo "  Server: http://$REMOTE_HOST:\${SERVER_PORT:-4300}"
