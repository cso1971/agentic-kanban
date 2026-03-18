# Skill: Refine Requirements

## Agent
requirement-engineer

## Description
Analyze and refine vague or incomplete requirements into actionable items.

## Trigger
When requirements are unclear, too broad, or missing details.

## Input
- Raw requirement or feature request
- Available context

## Process

1. **Identify Gaps**
   - What information is missing?
   - What assumptions are being made?
   - What terms need clarification?

2. **Ask Clarifying Questions**
   - Who is the target user?
   - What is the expected behavior?
   - What are the edge cases?
   - What are the constraints?

3. **Break Down**
   - Split large requirements into smaller pieces
   - Identify dependencies between pieces
   - Prioritize by value and complexity

4. **Document**
   - Write clear, testable requirements
   - List assumptions explicitly
   - Define scope boundaries

## Output

```markdown
## Refined Requirement: {title}

### Original Request
> {original text}

### Clarifying Questions
1. {question} → {answer if known, or "TBD"}
2. {question} → {answer if known, or "TBD"}

### Assumptions
- {assumption 1}
- {assumption 2}

### Scope
**In Scope:**
- {item}

**Out of Scope:**
- {item}

### Breakdown
1. {sub-requirement 1} - {complexity}
2. {sub-requirement 2} - {complexity}

### Dependencies
- {dependency}

### Risks
- {risk} - {mitigation}
```

## Example

Input: "We need better search"

Output identifies questions like:
- What content should be searchable?
- What does "better" mean (faster, more relevant, more filters)?
- Who uses search and for what purpose?
