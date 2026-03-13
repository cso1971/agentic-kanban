# Skill: Create Architecture Decision Record

## Agent
it-architect

## Description
Create an Architecture Decision Record (ADR) to document a significant architectural decision.

## Trigger
When a technical decision needs to be documented for future reference.

## Input
- Decision title
- Context/problem statement
- Options considered

## Output
An ADR document in markdown format.

## Template

```markdown
# ADR-{number}: {title}

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
{Describe the problem or situation requiring a decision}

## Decision
{State the decision that was made}

## Options Considered

### Option 1: {name}
- **Pros**: ...
- **Cons**: ...

### Option 2: {name}
- **Pros**: ...
- **Cons**: ...

## Consequences

### Positive
- ...

### Negative
- ...

## References
- ...
```

## Example

```
Create an ADR for choosing PostgreSQL as our primary database.
Context: We need a relational database for our new service.
Options: PostgreSQL, MySQL, CockroachDB
```
