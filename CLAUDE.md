# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agentic Kanban — a monorepo that orchestrates AI agents via a GitLab-integrated Kanban workflow. Agents are spawned as `claude` CLI subprocesses, triggered by GitLab webhooks, and processed through a BullMQ job queue.

## Commands

```bash
# Setup
pnpm install                      # Install dependencies
pnpm run docker:up                # Start all containers (Redis, GitLab, GitLab Runner)
pnpm run docker:infra             # Start only Redis + GitLab
pnpm run example:setup            # Setup calculator example project in GitLab

# Development
pnpm run dev                      # Dev mode for all packages (turbo)
pnpm run build                    # Build all packages
pnpm run typecheck                # Type check all (uses tsgo --noEmit)
pnpm run test                     # Run all tests (bun test)
pnpm run generate                 # Generate OpenAPI types for UI

# Single package test
cd packages/core && bun test      # Run tests for a specific package

# Linting
pnpm run biome:ci                 # Check lint + format (CI mode, errors on warnings)
pnpm run biome:fix                # Auto-fix lint + format issues

# CLI
pnpm run cli                      # Run the CLI
pnpm run cli local get-gitlab-token --env .env  # Get GitLab token
```

## Architecture

```
GitLab Webhook → Server (Hono) → Queue (BullMQ/Redis) → Worker → Agent (claude CLI subprocess)
                    ↕                                                    ↕
                 UI (React)                                     Session Store (JSONL)
```

**Packages:**

| Package | Role |
|---------|------|
| `core` | Agent runtime: spawns `claude` CLI, manages sessions (JSONL logs), loads config (JSON rules + Markdown prompts) |
| `server` | Hono HTTP API with OpenAPI schema, BullBoard dashboard, webhook endpoint, config/session routes |
| `worker` | BullMQ worker consuming `agent-jobs` queue, calls `agent.run()` |
| `queue` | BullMQ queue singleton, template-based enqueuer (replaces `{{PROJECT_ID}}`, `{{ISSUE_TITLE}}`, etc.) |
| `gitlab` | GitLab setup automation: groups, projects, users, boards, webhooks via @gitbeaker/rest |
| `cli` | Commander-based CLI for running agents and GitLab setup |
| `ui` | React 19 + TanStack Router/Query dashboard, API types generated from OpenAPI schema |

**Key design decisions:**
- Agents are subprocess-based (`claude` CLI), not SDK-imported — session management is file-based with JSONL streaming
- Config is a rules engine: `{event, action, label} → prompt` mapping in JSON, with prompts as Markdown files
- Agent sessions stored at `AGENT_STORE_DIR` (default `.agent-sessions/`) with `session.json`, `messages.jsonl`, and `artifacts/`

## Tech Stack

- **Runtime**: Bun
- **Monorepo**: pnpm workspaces + Turborepo
- **Language**: TypeScript ESM
- **Type checking**: `tsgo --noEmit`
- **Linter/Formatter**: Biome (sorted Tailwind classes enforced, no non-null assertions, no unused imports)
- **Git hooks**: lefthook

## Environment

Copy `.env.template` to `.env`. Key variables: `GITLAB_HOST`, `GITLAB_TOKEN`, `REDIS_URL`, `SERVER_PORT`, `SERVER_AGENT_CONFIG`, `WORKER_CONCURRENCY`.
