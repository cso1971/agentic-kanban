# Skill: Generate Architecture Diagram

## Agent
it-architect

## Description
Generate a C4 or component diagram in Mermaid format to visualize system architecture.

## Trigger
When a visual representation of system components is needed.

## Input
- System or component to diagram
- Level of detail (context, container, component)
- Specific focus areas (optional)

## Output
A Mermaid diagram with explanation.

## Example Output

```mermaid
graph TB
    subgraph "External"
        U[User]
        EXT[External API]
    end

    subgraph "System Boundary"
        API[API Gateway]
        SVC1[Service A]
        SVC2[Service B]
        DB[(Database)]
        Q[Message Queue]
    end

    U --> API
    API --> SVC1
    API --> SVC2
    SVC1 --> DB
    SVC1 --> Q
    Q --> SVC2
    SVC2 --> EXT
```

## Guidelines
- Use clear, descriptive labels
- Show data flow direction
- Group related components
- Include external dependencies
- Add notes for complex interactions
