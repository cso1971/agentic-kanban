You are breaking down a high-level requirement (epic) into user stories using the Council of Agents.

## Source Issue

- **Project ID:** {{PROJECT_ID}}
- **Issue IID:** {{ISSUE_IID}}
- **Title:** {{ISSUE_TITLE}}
- **Description:**

{{ISSUE_DESCRIPTION}}

## GitLab Configuration

Use the `/glab` skill for all GitLab CLI operations. Each agent has its own GitLab token in the environment:

- **Coordinator**: `AGENT_COORDINATOR_TOKEN`
- **Product Analyst**: `AGENT_PRODUCT_ANALYST_TOKEN`
- **IT Architect**: `AGENT_IT_ARCHITECT_TOKEN`
- **QA Strategist**: `AGENT_QA_STRATEGIST_TOKEN`

Authenticate with the coordinator token by default. When a specific teammate needs to comment on the epic, use their corresponding token so the comment is attributed to the correct agent.

## Instructions

1. Authenticate using the `/glab` skill with `$AGENT_COORDINATOR_TOKEN` and `$GITLAB_HOST`.

1. If not already cloned, clone the repository containing the issue using `glab repo clone {{PROJECT_ID}}`, ensure default branch is clean.

1. Add the `epic` label to the original issue {{ISSUE_IID}} using glab.

1. Read the coordinator agent prompt from `@config/coordinators/round-robin/agent.md` and use it to organize a Council of Agents. The coordinator prompt contains placeholders that will already be replaced before invocation:

    - Replace `{TOPIC}` with {{TOPIC}}
    - Replace `{TOPIC_SLUG}` with {{TOPIC_SLUG}}
    - Replace `{TEAMMATES}` with Product Analyst, IT Architect, QA - Strategist
    - Replace `{ARTIFACT_DIR}` with {{ARTIFACT_DIR}}

   Follow the coordinator protocol for spawning teammates, running deliberation rounds, and reaching consensus.

1. Synthesize the council's output into a coherent set of user stories.

1. Create the user stories as new issues in the project using glab. Label each story with `story` and `Refinement` and link it to the epic issue #{{ISSUE_IID}} using `glab issue note {{ISSUE_IID}} --message "Related: #<new_issue_iid>"` or the appropriate glab linking mechanism.

1. For each council agent (Product Analyst, IT Architect, QA Strategist), add a comment on the epic issue {{ISSUE_IID}} summarizing that agent's perspective and recommendations. Use each agent's own token (`AGENT_PRODUCT_ANALYST_TOKEN`, `AGENT_IT_ARCHITECT_TOKEN`, `AGENT_QA_STRATEGIST_TOKEN`) so the comment is attributed to the correct GitLab user.

1. Return a summary of created stories.
