# Skill: Implement Feature

## Agent
typescript-developer

## Description
Implement a feature from a user story, including code changes, tests, and a merge request.

## Trigger
When a task or story is ready for implementation.

## Input
- User story with acceptance criteria
- Related tasks and subtasks
- Repository and branch information

## Process

1. **Understand the Requirement**
   - Read the story and all linked tasks
   - Review acceptance criteria
   - Identify affected files and functions

2. **Review Existing Code**
   - Read current implementation in `src/index.ts`
   - Review existing tests in `src/index.test.ts`
   - Understand patterns and conventions

3. **Implement**
   - Write the new function(s) following existing patterns
   - Explicit type annotations on all parameters and returns
   - Consistent error handling (throw for undefined operations)
   - Named exports, pure functions, no side effects

4. **Write Tests**
   - Happy path with typical inputs
   - Edge cases: zero, negative, decimal, large numbers
   - Special values: NaN, Infinity (if applicable)
   - Error scenarios with `expect().toThrow()`

5. **Verify**
   - `bun test` — all tests pass
   - `bun run typecheck` — no type errors
   - `bun run build` — build succeeds

6. **Create Merge Request**
   - Descriptive title referencing the story
   - Description with what changed and why
   - Link to the original story/issue

## Output

A merge request containing:
- Implementation in `src/index.ts`
- Tests in `src/index.test.ts`
- All checks passing (test, typecheck, build)
