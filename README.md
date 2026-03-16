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
pnpm run cli local get-gitlab-token --env .env
pnpm run example:setup
```

Then open:

- **GitLab** — http://localhost:8090
- **Dashboard** — http://localhost:4301

## How It Works

You configure rules that map board events to prompts. When an issue is moved or labeled in GitLab, the matching prompt is sent to a `claude` CLI subprocess. The agent works the issue and its session is stored as JSONL so you can inspect or replay it later.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture, commands, and tech stack details.

