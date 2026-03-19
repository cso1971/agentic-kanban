You are planning the implementation of a user story by running a technical council to break it into tasks.

## Source Issue

- **Project ID:** {{PROJECT_ID}}
- **Issue IID:** {{ISSUE_IID}}
- **Title:** {{ISSUE_TITLE}}
- **Description:**

{{ISSUE_DESCRIPTION}}

## GitLab Configuration

Use the `/glab` skill for all GitLab CLI operations. Each agent has its own GitLab token in the environment:

- **Coordinator**: `AGENT_COORDINATOR_TOKEN`
- **Security Expert**: `AGENT_SECURITY_EXPERT_TOKEN`
- **TypeScript Developer**: `AGENT_TYPESCRIPT_DEVELOPER_TOKEN`

Authenticate with the coordinator token by default. When a specific teammate needs to comment on the story, use their corresponding token so the comment is attributed to the correct agent.

## Instructions

1. Authenticate using the `/glab` skill with `$AGENT_COORDINATOR_TOKEN` and `$GITLAB_HOST`.

1. **Fetch the story**: retrieve the full details of issue #{{ISSUE_IID}} in project {{PROJECT_ID}} using glab, including its description, labels, and any linked issues.

1. **Fetch the parent epic**: identify the parent epic of this story (look for links, references, or the `epic` label in related issues). Fetch the epic's full details — title, description, and acceptance criteria — to understand the broader context.

1. **Fetch connected stories**: find all sibling stories linked to the same parent epic. Fetch their titles, descriptions, and current status to understand what other work is planned alongside this story.

1. **Clone the repository**: clone the repository containing the issue using `glab repo clone {{PROJECT_ID}}` so the TypeScript Developer can inspect the actual codebase during the council.

1. Read the coordinator agent prompt from `config/coordinators/round-robin/agent.md` and use it to organize a Council of Agents. The coordinator prompt contains placeholders:

    - Replace `{TOPIC}` with: "Plan the implementation of story #{{ISSUE_IID}}: {{ISSUE_TITLE}}. Break it into concrete implementation tasks."
    - Replace `{TOPIC_SLUG}` with {{TOPIC_SLUG}}
    - Replace `{TEAMMATES}` with Security Expert, TypeScript Developer
    - Replace `{ARTIFACT_DIR}` with {{ARTIFACT_DIR}}

   Provide each teammate with the full context gathered above: the story details, the parent epic, and the connected stories.

   The **TypeScript Developer** should review the cloned repository to understand existing code patterns, conventions, and structure before responding in the council. They should reference actual code in their analysis.

   Follow the coordinator protocol for spawning teammates, running deliberation rounds, and reaching consensus.

1. Synthesize the council's output into a set of concrete implementation **tasks**. Each task should be:
   - Small enough to implement in a single focused session
   - Have clear acceptance criteria
   - Reference specific files, functions, or code patterns from the repository
   - Include security considerations identified by the Security Expert

1. Create the tasks as new issues in the project using glab. For each task:
   - Label it with `task`
   - Set the story #{{ISSUE_IID}} as its parent using `glab issue create --parent-issue {{ISSUE_IID}}` or link it via `glab issue note {{ISSUE_IID}} --message "Child task: #<new_task_iid>"`
   - Include the acceptance criteria and implementation notes in the task description

1. For each council agent (Security Expert, TypeScript Developer), add a comment on the story issue #{{ISSUE_IID}} summarizing that agent's perspective and recommendations. Use each agent's own token (`AGENT_SECURITY_EXPERT_TOKEN`, `AGENT_TYPESCRIPT_DEVELOPER_TOKEN`) so the comment is attributed to the correct GitLab user.

1. **Move the story to Planned**: remove the `Ready` label and add the `Planned` label to issue #{{ISSUE_IID}} using glab.

1. Return a summary of created tasks.
