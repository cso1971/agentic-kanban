---
name: Bun
description: Use when building JavaScript/TypeScript applications, setting up HTTP servers, running tests, bundling code, or managing packages. Reach for this skill when you need to execute code, install dependencies, build for production, or test applications with a single unified toolkit.
metadata:
    mintlify-proj: bun
    version: "1.0"
---

# Bun Skill Reference

## Product summary

Bun is an all-in-one JavaScript/TypeScript toolkit that replaces Node.js, npm, and bundlers with a single executable. It includes a fast runtime (powered by JavaScriptCore), package manager, test runner, and bundler—all optimized for speed and modern JavaScript. Key files: `bunfig.toml` (configuration), `package.json` (scripts and dependencies), `bun.lock` (lockfile). Primary CLI commands: `bun run`, `bun install`, `bun test`, `bun build`. See https://bun.com/docs for comprehensive documentation.

## When to use

- **Running code**: Execute `.js`, `.ts`, `.jsx`, `.tsx` files directly without compilation steps
- **Package management**: Install, add, remove, or update npm packages faster than npm/yarn
- **Testing**: Write and run Jest-compatible tests with TypeScript support built-in
- **Building**: Bundle JavaScript/TypeScript for browsers or servers with a native bundler
- **HTTP servers**: Create fast HTTP servers with `Bun.serve()` and built-in routing
- **File I/O**: Read/write files with optimized APIs (`Bun.file()`, `Bun.write()`)
- **Scripts**: Run `package.json` scripts with ~28x faster startup than npm
- **Monorepos**: Manage workspaces with shared dependencies and workspace linking

## Quick reference

### Core commands

| Task | Command |
|------|---------|
| Run a file | `bun run index.ts` or `bun index.ts` |
| Run a script | `bun run dev` (from package.json) |
| Install dependencies | `bun install` |
| Add a package | `bun add lodash` |
| Add dev dependency | `bun add -d typescript` |
| Remove a package | `bun remove lodash` |
| Run tests | `bun test` |
| Build for production | `bun build ./index.ts --outdir ./dist` |
| Watch mode | `bun --watch run index.ts` or `bun build --watch` |
| List scripts | `bun run` (no args) |

### Configuration file (bunfig.toml)

Located at project root or `~/.bunfig.toml`. Optional; Bun works without it.

```toml
[install]
optional = true          # install optional dependencies
dev = true              # install dev dependencies
peer = true             # install peer dependencies
production = false      # production mode (skip devDeps)
linker = "hoisted"      # "hoisted" or "isolated"

[test]
root = "."              # test root directory
coverage = false        # enable coverage reporting
timeout = 5000          # per-test timeout in ms
randomize = false       # randomize test order

[run]
shell = "system"        # "system" or "bun"
bun = false             # alias node to bun in scripts
silent = false          # suppress command output

[define]
"process.env.API_URL" = "'https://api.example.com'"
```

### File types supported

| Extension | Behavior |
|-----------|----------|
| `.ts`, `.tsx` | TypeScript + JSX, transpiled on-the-fly |
| `.js`, `.jsx` | JavaScript + JSX, transpiled on-the-fly |
| `.json`, `.jsonc` | Parsed and inlined as objects |
| `.toml`, `.yaml` | Parsed and inlined as objects |
| `.html` | Imported as Response or string |
| `.css` | Bundled into single CSS file |
| `.wasm`, `.node` | Supported by runtime; treated as assets in bundler |

### Package manager flags

| Flag | Purpose |
|------|---------|
| `--save-text-lockfile` | Generate text `bun.lock` instead of binary |
| `--frozen-lockfile` | Fail if lockfile and package.json disagree |
| `--production` | Skip dev dependencies |
| `--dry-run` | Preview changes without installing |
| `--optional` | Add as optional dependency |
| `-d` / `--dev` | Add as dev dependency |
| `--peer` | Add as peer dependency |

### Bundler options

| Option | Purpose |
|--------|---------|
| `--outdir` | Output directory for bundles |
| `--target browser\|bun\|node` | Execution environment |
| `--format esm\|cjs` | Module format (default: esm) |
| `--splitting` | Enable code splitting for shared chunks |
| `--minify` | Minify output |
| `--sourcemap linked\|inline\|external` | Sourcemap generation |
| `--external <pkg>` | Mark package as external (not bundled) |
| `--watch` | Rebuild on file changes |

### Test runner flags

| Flag | Purpose |
|------|---------|
| `--watch` | Re-run tests on file changes |
| `--timeout <ms>` | Per-test timeout (default: 5000) |
| `--concurrent` | Run tests in parallel |
| `--retry <n>` | Retry failed tests |
| `--bail` | Stop after first failure |
| `--coverage` | Generate coverage report |
| `-t <pattern>` | Filter tests by name |
| `--update-snapshots` | Update snapshot files |

## Decision guidance

### When to use `bun run` vs `bun <file>`

| Scenario | Use |
|----------|-----|
| Running a package.json script | `bun run dev` |
| Running a file directly | `bun index.ts` |
| Ambiguous name (could be script or file) | `bun run <name>` (prioritizes scripts) |
| Passing flags to script | `bun run dev --flag` (flags after script name) |

### When to use `bun install` vs `bun add`

| Scenario | Use |
|----------|-----|
| Install all dependencies from package.json | `bun install` |
| Add a new package | `bun add lodash` |
| Add dev-only package | `bun add -d typescript` |
| Update existing packages | `bun update` |
| Remove a package | `bun remove lodash` |

### When to bundle vs run directly

| Scenario | Use |
|----------|-----|
| Development, fast iteration | `bun run` (no bundling) |
| Production deployment | `bun build` (bundle once, deploy) |
| Browser/client code | `bun build --target browser` |
| Server code | `bun build --target bun` or run directly |
| Single executable | `bun build --compile` |

### Linker strategy: hoisted vs isolated

| Strategy | Use when |
|----------|----------|
| `hoisted` (default for single packages) | You want a flat node_modules; compatible with Node.js tools |
| `isolated` (default for workspaces) | You have monorepos; each package has its own node_modules |

## Workflow

### 1. Start a new project
```bash
bun init my-app
cd my-app
# Choose template: Blank, React, or Library
```

### 2. Set up dependencies
```bash
bun install                    # Install from package.json
bun add express               # Add a package
bun add -d @types/node        # Add dev dependency
```

### 3. Create and run code
```bash
# Write code in index.ts
bun run index.ts              # Execute directly
# Or add to package.json scripts and run:
bun run dev
```

### 4. Build for production
```bash
bun build ./index.ts --outdir ./dist --minify
# For a single executable:
bun build ./cli.ts --compile --outfile mycli
```

### 5. Test your code
```bash
# Write tests in *.test.ts files
bun test                      # Run all tests
bun test --watch             # Watch mode
bun test --coverage          # Generate coverage
```

### 6. Configure if needed
Create `bunfig.toml` at project root for Bun-specific settings. Most projects work without it.

## Common gotchas

- **Flag placement**: Bun flags go immediately after `bun`, not at the end. Use `bun --watch run dev`, not `bun run dev --watch`.
- **Script vs file ambiguity**: `bun run` prioritizes package.json scripts over files. Use `bun run ./file.ts` (with `./`) to force file execution.
- **TypeScript without types**: Install `@types/bun` and configure `tsconfig.json` with `"lib": ["ESNext"]` to avoid type errors on the `Bun` global.
- **Auto-install disabled in production**: Set `install.auto = "disable"` in bunfig.toml for CI/CD to prevent runtime package installation.
- **Lockfile format**: Binary `bun.lockb` is default (faster); use `--save-text-lockfile` for git-friendly text format.
- **Node.js compatibility incomplete**: Not all Node.js APIs are implemented. Check the [compatibility page](/runtime/nodejs-compat) for details.
- **Bundler is not a type checker**: Use `tsc` separately for type checking; `bun build` only transpiles.
- **External imports in bundles**: Marked external packages are left as import statements; ensure they're available at runtime.
- **Test file discovery**: Only files matching `*.test.ts`, `*_test.ts`, `*.spec.ts`, `*_spec.ts` are auto-discovered.
- **Workspace linking**: Use `"workspace:*"` in package.json to reference other workspace packages; run `bun install` from root.

## Verification checklist

Before submitting work with Bun:

- [ ] Code runs without errors: `bun run index.ts` (or your entry point)
- [ ] All tests pass: `bun test` (or `bun test --coverage` if coverage is required)
- [ ] Dependencies are declared: `bun install` completes without errors
- [ ] Configuration is valid: `bunfig.toml` syntax is correct (if used)
- [ ] Build succeeds: `bun build` completes without errors
- [ ] No TypeScript errors: Install `@types/bun` if using Bun globals
- [ ] Scripts in package.json are correct: `bun run` lists expected scripts
- [ ] Lockfile is committed: `bun.lock` or `bun.lockb` is in version control
- [ ] Environment variables are set: `.env` file exists or CI/CD provides them
- [ ] No deprecated patterns: Avoid `require()` in favor of `import` (ESM)

## Resources

- **Comprehensive navigation**: https://bun.com/docs/llms.txt — Full page-by-page listing for agent navigation
- **Runtime API**: https://bun.com/docs/runtime — Execute code, file I/O, HTTP servers, environment variables
- **Package Manager**: https://bun.com/docs/pm/cli/install — Install, add, remove, and manage packages
- **Bundler**: https://bun.com/docs/bundler — Bundle code for browsers and servers
- **Test Runner**: https://bun.com/docs/test — Write and run Jest-compatible tests

---

> For additional documentation and navigation, see: https://bun.com/docs/llms.txt