---
name: Security Audit
description: Performs security audits on code changes, identifying vulnerabilities and recommending mitigations
type: skill
---

# Skill: Security Audit

## Agent
security-expert

## Description
Perform a security audit on proposed code changes or existing code, identifying vulnerabilities and recommending mitigations.

## Trigger
When new code is proposed, a feature is being planned, or a security review is needed.

## Input
- Code changes or feature description
- Relevant source files
- Context about the feature's purpose and users

## Process

1. **Threat Modeling**
   - Identify assets (data, functions, APIs)
   - Identify threat actors and attack vectors
   - Map trust boundaries

2. **Vulnerability Assessment**
   - Review input handling and validation
   - Check error handling for information leakage
   - Assess numeric safety (overflow, NaN, Infinity)
   - Evaluate API surface for misuse potential

3. **Risk Classification**
   - Severity: Critical / High / Medium / Low
   - Likelihood: Certain / Likely / Possible / Unlikely
   - Priority = Severity × Likelihood

4. **Mitigation Recommendations**
   - Concrete, implementable fixes
   - Defensive coding patterns
   - Security test scenarios

## Output

```markdown
## Security Audit: {feature/component}

### Threat Model
- **Assets**: {what's being protected}
- **Threat Actors**: {who might exploit this}
- **Attack Vectors**: {how they'd exploit it}

### Findings

#### [SEV-{severity}] {finding title}
- **Risk**: {description of the vulnerability}
- **Exploit Scenario**: {how it could be exploited}
- **Mitigation**: {concrete fix}
- **Test**: {security test to verify the fix}

### Summary
| Severity | Count |
|----------|-------|
| Critical | {n}   |
| High     | {n}   |
| Medium   | {n}   |
| Low      | {n}   |
```

## Example

Input: "Audit the new `power(base, exponent)` function"

Output identifies risks like:
- [SEV-Medium] Large exponents can cause `Infinity` or performance degradation
- [SEV-Low] Negative fractional exponents produce `NaN` for negative bases
- Mitigation: validate exponent range, document behavior for edge cases
