---
name: glab CLI
description: Domain knowledge for interacting with GitLab using the glab CLI for issues, MRs, and workflows
type: skill
---

# glab CLI — GitLab Command-Line Reference

> Domain knowledge for interacting with GitLab using the `glab` CLI.
> Use this skill when agents need to authenticate, manage issues, create merge requests, or automate GitLab workflows.

---

## Authentication

Always authenticate before running any glab command. Use the host from the `GITLAB_HOST` environment variable and the appropriate agent token.

```bash
glab auth login --token $AGENT_TOKEN --hostname $GITLAB_HOST
```

To verify authentication:

```bash
glab auth status --hostname $GITLAB_HOST
```

### Multiple Identities

When actions must be attributed to a specific agent, re-authenticate with that agent's token before the action:

```bash
glab auth login --token $AGENT_SECURITY_EXPERT_TOKEN --hostname $GITLAB_HOST
glab issue note 42 --message "Security review complete."
```

---

## Repository

### Clone

```bash
glab repo clone <project-id-or-path>
# e.g. glab repo clone 5
# e.g. glab repo clone mygroup/myproject
```

### View Project Info

```bash
glab repo view
```

---

## Issues

### Create an Issue

```bash
glab issue create \
  --title "Implement power function" \
  --description "Add a power(base, exponent) function..." \
  --label "task" \
  --label "security"
```

With a parent issue (child task):

```bash
glab issue create \
  --title "Add input validation for power()" \
  --description "Validate exponent range..." \
  --label "task" \
  --parent-issue 42
```

**Note**: `--parent-issue` links the new issue as a child of the specified issue IID. If not available in your glab version, use a note to link manually:

```bash
glab issue note 42 --message "Child task: #<new_issue_iid>"
```

### View an Issue

```bash
glab issue view <iid>
glab issue view 42
```

### List Issues

```bash
# All open issues
glab issue list

# Filter by label
glab issue list --label "story"
glab issue list --label "task" --label "Ready"

# Filter by state
glab issue list --state opened
glab issue list --state closed
```

### Update Issue Labels

Add a label:

```bash
glab issue update <iid> --label "Planned"
```

Remove a label:

```bash
glab issue update <iid> --unlabel "Ready"
```

Move an issue between board columns (label swap):

```bash
glab issue update <iid> --unlabel "Ready" --label "Planned"
```

### Close an Issue

```bash
glab issue close <iid>
```

### Add a Comment (Note)

```bash
glab issue note <iid> --message "Implementation complete. See MR !5."
```

For multi-line comments use a heredoc:

```bash
glab issue note <iid> --message "$(cat <<'EOF'
## Security Review

- No critical vulnerabilities found
- Input validation covers all edge cases
- Recommend adding rate limiting in future iteration
EOF
)"
```

### Link Issues

Relate a child to a parent:

```bash
glab issue note <parent_iid> --message "Child task: #<child_iid>"
```

---

## Merge Requests

### Create a Merge Request

```bash
glab mr create \
  --title "feat: add power function" \
  --description "Implements story #42" \
  --source-branch "feature/add-power-function" \
  --target-branch "main"
```

With a longer description:

```bash
glab mr create \
  --title "feat: add power function" \
  --description "$(cat <<'EOF'
## Summary
Implements story #42 — adds `power(base, exponent)` to the calculator library.

## Changes
- Added `power()` function in `src/index.ts`
- Added tests covering happy path, edge cases, and error scenarios
- Validates exponent range to prevent Infinity results

## Tasks completed
- Closes #43 (implement power function)
- Closes #44 (add input validation)
- Closes #45 (write tests)

Closes #42
EOF
)" \
  --target-branch "main"
```

### View a Merge Request

```bash
glab mr view <iid>
glab mr view 5
```

### List Merge Requests

```bash
glab mr list
glab mr list --state opened
glab mr list --label "needs-review"
```

### Approve / Merge

```bash
glab mr approve <iid>
glab mr merge <iid>
```

---

## Labels

### List Labels

```bash
glab label list
```

### Create a Label

```bash
glab label create "task" --color "#428BCA" --description "Implementation task"
```

---

## CI/CD Pipelines

### View Pipeline Status

```bash
glab ci status
glab ci view
```

### List Recent Pipelines

```bash
glab ci list
```

### View a Specific Job

```bash
glab ci view <job-id>
```

---

## Common Workflow Patterns

### Move Issue Across Board (Label Swap)

```bash
glab issue update <iid> --unlabel "Ready" --label "Planned"
```

### Create Tasks Under a Story

```bash
# Create the task
TASK_IID=$(glab issue create \
  --title "Implement power() function body" \
  --description "..." \
  --label "task" \
  --parent-issue 42 2>&1 | grep -oP '#\K\d+')

# Or if --parent-issue is not supported, link manually
glab issue note 42 --message "Child task: #$TASK_IID"
```

### Branch + MR Workflow

```bash
# Create worktree with feature branch
git worktree add -b feature/my-feature ../worktree-my-feature origin/main
cd ../worktree-my-feature

# ... implement changes ...

# Push and create MR
git push -u origin feature/my-feature
glab mr create \
  --title "feat: my feature" \
  --description "Implements #42" \
  --target-branch main
```

### Attribute Actions to Different Agents

```bash
# Coordinator creates the tasks
glab auth login --token $AGENT_COORDINATOR_TOKEN --hostname $GITLAB_HOST
glab issue create --title "Task 1" --label "task" --parent-issue 42

# Security Expert comments
glab auth login --token $AGENT_SECURITY_EXPERT_TOKEN --hostname $GITLAB_HOST
glab issue note 42 --message "Security review: no critical findings."

# Developer comments
glab auth login --token $AGENT_TYPESCRIPT_DEVELOPER_TOKEN --hostname $GITLAB_HOST
glab issue note 42 --message "Implementation plan confirmed. Estimated 3 functions to add."
```

---

## Flags Reference

### Global Flags

| Flag | Description |
|------|-------------|
| `--hostname` | GitLab hostname (overrides config) |
| `--repo` | Repository in `OWNER/REPO` format |
| `-o, --output` | Output format: `text`, `json` |

### Issue Create Flags

| Flag | Description |
|------|-------------|
| `--title` | Issue title (required) |
| `--description` | Issue body/description |
| `--label` | Add a label (repeatable) |
| `--assignee` | Assign to a user |
| `--milestone` | Set milestone |
| `--confidential` | Mark as confidential |
| `--parent-issue` | Parent issue IID (creates child link) |

### MR Create Flags

| Flag | Description |
|------|-------------|
| `--title` | MR title (required) |
| `--description` | MR body |
| `--source-branch` | Source branch (default: current) |
| `--target-branch` | Target branch (default: project default) |
| `--label` | Add a label (repeatable) |
| `--assignee` | Assign to a user |
| `--milestone` | Set milestone |
| `--squash-before-merge` | Squash commits on merge |
| `--remove-source-branch` | Delete branch after merge |

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `glab: command not found` | glab not installed | Install via `brew install glab` or check PATH |
| `401 Unauthorized` | Token expired or wrong | Re-run `glab auth login` with correct token |
| `404 Not Found` on issue | Wrong project context | Use `--repo` flag or `cd` into the cloned repo |
| `--parent-issue` not recognized | Older glab version | Use `glab issue note` to link manually instead |
| Labels not appearing on board | Label doesn't exist in project | Create the label first with `glab label create` |
