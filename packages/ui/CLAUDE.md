# @agentic-kanban/ui

React frontend for the agents dashboard.

## Tech Stack

- **Runtime**: Bun + Vite
- **Language**: TypeScript (ESM)
- **Framework**: React 19
- **Styling**: Tailwind CSS v4
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query + openapi-fetch
- **API Types**: Generated from OpenAPI schema

## Commands

```bash
bun run dev          # Dev server
bun run build        # Production build
bun run typecheck    # Type check
bun run generate     # Generate API types from OpenAPI schema (requires server running on :4300)
```

## Structure

- `src/api/schema.d.ts` - Generated OpenAPI types

## Patterns

- Use TanStack Query for server state management
- Use `openapi-react-query` for type-safe API calls
- Tailwind v4 uses CSS-based configuration (no tailwind.config.js)

## Skills

Skills are defined in `.claude/skills/`.
