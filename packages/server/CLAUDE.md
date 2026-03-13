# @agentic-kanban/server

HTTP API server for agents.

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (ESM)
- **Framework**: Hono
- **Validation**: Zod
- **API Docs**: OpenAPI via @hono/zod-openapi + Swagger UI

## Commands

```bash
bun run dev          # Dev server with watch mode
bun run start        # Production server
bun run typecheck    # Type check
```

## Structure

- `src/server.ts` - Main server entrypoint

## API Patterns

- Use `@hono/zod-openapi` for route definitions with OpenAPI schemas
- Validate request/response with Zod schemas
- Swagger UI available for API documentation

## Skills

Skills are defined in `.claude/skills/`.
