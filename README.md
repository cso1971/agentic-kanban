# Agentic Kanban

AI agents that work your GitLab Kanban board. Move an issue to a column, a webhook fires, and a Claude agent picks it up automatically.

```
GitLab Webhook → Server (Hono) → Queue (BullMQ/Redis) → Worker → Agent (claude CLI)
                    ↕                                                    ↕
                 UI (React)                                     Session Store (JSONL)
```

## Getting Started

```bash
mise install
pnpm install
pnpm run docker:up
```

Grab a GitLab token and seed the example project:

```bash
pnpm run cli local get-gitlab-token
pnpm run cli local register-runner
pnpm run example:setup
```

Then open:

- **GitLab** — http://localhost:8090
- **Dashboard** — http://localhost:4301

## How It Works

You configure rules that map board events to prompts. When an issue is moved or labeled in GitLab, the matching prompt is sent to a `claude` CLI subprocess. The agent works the issue and its session is stored as JSONL so you can inspect or replay it later.

## Production Deployment

Build Docker images locally and deploy to a remote server via SSH:

```bash
DEPLOY_HOST=your-server.com ./scripts/deploy.sh
```

| Variable | Default | Description |
|----------|---------|-------------|
| `DEPLOY_HOST` | *(required)* | Server hostname or IP |
| `DEPLOY_USER` | `root` | SSH user |
| `DEPLOY_DIR` | `/opt/agentic-kanban` | Remote install path |
| `DEPLOY_SSH_KEY` | — | Path to SSH private key |

The script builds the server and worker images, transfers them to the remote host, loads them, and starts the stack with `docker-compose.prod.yml`. The remote server needs Docker and Docker Compose installed.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture, commands, and tech stack details.

