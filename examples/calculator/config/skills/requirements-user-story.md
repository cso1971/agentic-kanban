# Skill: Write User Story

## Agent
requirement-engineer

## Description
Create a well-formed user story with acceptance criteria from a feature description.

## Trigger
When a new feature or requirement needs to be documented.

## Input
- Feature description or request
- Target user/persona (optional)
- Business context (optional)

## Output
A complete user story with acceptance criteria.

## Template

```markdown
## User Story: {title}

**As a** {role/persona}
**I want** {feature/capability}
**So that** {benefit/value}

### Acceptance Criteria

- [ ] **Given** {precondition}
      **When** {action}
      **Then** {expected outcome}

- [ ] **Given** {precondition}
      **When** {action}
      **Then** {expected outcome}

### Notes
- {assumptions}
- {constraints}
- {dependencies}

### Definition of Done
- [ ] Code complete and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
```

## Example

Input: "Users should be able to reset their password"

Output:
```markdown
## User Story: Password Reset

**As a** registered user
**I want** to reset my password via email
**So that** I can regain access to my account if I forget my password

### Acceptance Criteria

- [ ] **Given** I am on the login page
      **When** I click "Forgot Password"
      **Then** I see a form to enter my email

- [ ] **Given** I submit a valid email
      **When** the system processes my request
      **Then** I receive a password reset link within 5 minutes

- [ ] **Given** I click the reset link
      **When** I enter a new valid password
      **Then** my password is updated and I can log in
```
