# Calculator Example

A simple TypeScript arithmetic library providing the four fundamental operations.

## Project Structure

```
repository/
├── src/
│   ├── index.ts        # Public API: add, subtract, multiply, divide
│   └── index.test.ts   # Bun tests for all operations
├── package.json        # @agentic-kanban/example-calculator (private, bun-based)
├── tsconfig.json       # Extends monorepo base config
├── .gitlab-ci.yml      # CI pipeline: install → build → test on MRs
└── README.md
```

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript 5+
- **Test runner**: `bun test` (import from `bun:test`)
- **Type checker**: `tsgo --noEmit`
- **Build**: `bun build src/index.ts --outdir dist --target node`
- **CI**: GitLab CI, triggered on MR changes to `examples/calculator/**/*`

## Commands

```bash
cd repository
bun install              # Install dependencies
bun run build            # Build to dist/
bun test                 # Run tests (--pass-with-no-tests)
bun run typecheck        # Type check with tsgo
```

## Library API

All functions are pure, individually exported from `src/index.ts`:

| Function   | Signature                          | Throws                              |
|------------|------------------------------------|--------------------------------------|
| `add`      | `(a: number, b: number): number`   | Never                                |
| `subtract` | `(a: number, b: number): number`   | Never                                |
| `multiply` | `(a: number, b: number): number`   | Never                                |
| `divide`   | `(a: number, b: number): number`   | `Error("Cannot divide by zero")` when `b === 0` |

## Conventions

- **Single-file module**: all public functions in `src/index.ts`, tests in `src/index.test.ts`
- **Pure functions only**: no side effects, no state
- **Explicit types**: all params and returns annotated, no `any`
- **Error handling**: throw `Error` for mathematically undefined operations (e.g., division by zero); return a number for everything else
- **Naming**: short verb function names (`add`, `subtract`, etc.)
- **New functions** should follow the existing `(a: number, b: number): number` pattern unless there's a justified reason to deviate
- **Tests**: cover happy path, edge cases (zero, negative, decimal, large numbers), and error scenarios
