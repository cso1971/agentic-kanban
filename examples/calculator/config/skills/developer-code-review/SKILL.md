# Skill: Code Review

## Agent
typescript-developer

## Description
Review code changes for correctness, convention compliance, type safety, and test coverage.

## Trigger
When code has been written or modified and needs review before merging.

## Input
- Code diff or file contents
- Related user story or acceptance criteria
- Project conventions reference

## Process

1. **Correctness Check**
   - Does the code do what the story says?
   - Are edge cases handled?
   - Are error paths correct?

2. **Convention Compliance**
   - Does the code follow existing patterns?
   - Are naming conventions respected?
   - Is the code consistent with surrounding code?

3. **Type Safety**
   - Are all inputs and outputs typed?
   - No `any` types or unsafe casts?
   - Are generics used appropriately?

4. **Test Coverage**
   - Does every acceptance criterion have a test?
   - Are edge cases tested?
   - Are error scenarios tested?

5. **Simplicity**
   - Is this the simplest correct implementation?
   - Any unnecessary abstractions?
   - Any dead code?

## Output

```markdown
## Code Review: {feature/PR}

### Summary
{overall assessment — approve, request changes, or needs discussion}

### Findings

#### {file}:{line} — [{severity}] {title}
{description of the issue}
**Suggestion**: {concrete fix}

### Checklist
- [ ] Correctness verified
- [ ] Conventions followed
- [ ] Types are sound
- [ ] Tests are comprehensive
- [ ] No unnecessary complexity
```
