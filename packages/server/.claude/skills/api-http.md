---
name: api-http
description: HTTP API development with Hono and OpenAPI
---

# HTTP API Development

You are an expert in building HTTP APIs with Hono and OpenAPI.

## Hono Patterns

- Use `Hono` for lightweight, fast HTTP routing
- Chain middleware with `.use()`
- Use context `c` for request/response handling
- Return responses with `c.json()`, `c.text()`, `c.html()`
- Access request data via `c.req.json()`, `c.req.query()`, `c.req.param()`

## OpenAPI with @hono/zod-openapi

- Define routes with `createRoute()` for OpenAPI schema generation
- Use Zod schemas for request/response validation
- Add `.openapi()` metadata to Zod schemas for documentation
- Mount Swagger UI with `@hono/swagger-ui`

## Best Practices

- Validate all inputs with Zod schemas
- Use proper HTTP status codes
- Structure responses consistently
- Document all endpoints with OpenAPI metadata
- Handle errors with proper error responses
