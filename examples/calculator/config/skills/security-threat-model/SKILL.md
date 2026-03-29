---
name: Threat Modeling
description: Creates threat models for features or system components, identifying attack surfaces and security controls
type: skill
---

# Skill: Threat Modeling

## Agent
security-expert

## Description
Create a threat model for a feature or system component, identifying attack surfaces and required security controls.

## Trigger
When a new feature is being designed and security implications need to be assessed upfront.

## Input
- Feature description or design document
- System context (where this fits in the architecture)
- User/consumer profile

## Process

1. **Identify Assets**
   - What data or functionality needs protection?
   - What's the impact if compromised?

2. **Map Attack Surface**
   - Public API endpoints and function signatures
   - Input channels and data flows
   - Error outputs and side channels

3. **Enumerate Threats (STRIDE)**
   - **S**poofing: Can inputs be forged?
   - **T**ampering: Can data be modified unexpectedly?
   - **R**epudiation: Are actions traceable?
   - **I**nformation Disclosure: Do errors leak internals?
   - **D**enial of Service: Can the feature be abused to degrade performance?
   - **E**levation of Privilege: Can the feature be used beyond its intended scope?

4. **Define Controls**
   - Input validation rules
   - Error handling requirements
   - Rate limiting or resource bounds
   - Monitoring and logging needs

## Output

```markdown
## Threat Model: {feature}

### Assets
| Asset | Sensitivity | Impact if Compromised |
|-------|------------|----------------------|
| {asset} | {level} | {impact} |

### Attack Surface
- {surface 1}: {description}
- {surface 2}: {description}

### Threats
| ID | Category | Threat | Severity | Mitigation |
|----|----------|--------|----------|------------|
| T1 | {STRIDE} | {description} | {sev} | {control} |

### Security Requirements
- [ ] {requirement 1}
- [ ] {requirement 2}
```
