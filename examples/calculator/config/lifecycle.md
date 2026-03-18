# Lifecycle: Development Pipeline

A structured workflow for managing work items from requirements through delivery.

## Columns

### Requirements
Raw requirements or feature requests. Not yet analyzed or broken down.

### Breakdown
Requirements being broken down into actionable work items and user stories.

### Refinement
Work items being refined with acceptance criteria, estimates, and technical details.

### Ready
Items fully refined and ready to be picked up for implementation.

### Planned
Items assigned and scheduled for implementation.

### Review
Merge requests under code review, awaiting approval or feedback resolution.

### Test
Items implemented and undergoing testing and validation.

### Done
Items that are completed, tested, and accepted.

## Work Item States

```
┌──────────────┐    ┌───────────┐    ┌────────────┐    ┌───────┐    ┌─────────┐    ┌────────┐    ┌──────┐    ┌──────┐
│ Requirements │ -> │ Breakdown │ -> │ Refinement │ -> │ Ready │ -> │ Planned │ -> │ Review │ -> │ Test │ -> │ Done │
└──────────────┘    └───────────┘    └────────────┘    └───────┘    └─────────┘    └────────┘    └──────┘    └──────┘
```

## Transitions

| From         | To          | Trigger                              |
|--------------|-------------|--------------------------------------|
| Requirements | Breakdown   | Requirement accepted for analysis    |
| Breakdown    | Refinement  | Stories created from breakdown        |
| Refinement   | Ready       | Acceptance criteria defined           |
| Ready        | Planned     | Item scheduled for implementation    |
| Planned      | Review      | MR created, awaiting code review     |
| Review       | Test        | Code review approved                 |
| Review       | Planned     | Review feedback requires rework      |
| Test         | Done        | Testing passed and accepted          |
| Test         | Review      | Issues found, rework needed          |

## WIP Limits

- **Planned**: Max 1 item per agent
- **Review**: Max 3 items total
- **Test**: Max 3 items total

## Labels

- `blocked` - Item cannot progress
- `urgent` - High priority item
- `spike` - Research/investigation task
