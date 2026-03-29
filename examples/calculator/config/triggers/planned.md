You are implementing a user story by working through its tasks, writing code, and creating a merge request.

## Source Issue

- **Project ID:** {{PROJECT_ID}}
- **Issue IID:** {{ISSUE_IID}}
- **Title:** {{ISSUE_TITLE}}
- **Description:**

{{ISSUE_DESCRIPTION}}

## GitLab Configuration

Use the `/glab` skill for all GitLab CLI operations.

Authenticate with `$AGENT_COORDINATOR_TOKEN` and `$GITLAB_HOST`.

## Instructions

1. Authenticate using the `/glab` skill with `$AGENT_COORDINATOR_TOKEN` and `$GITLAB_HOST`.

1. **Fetch the story and its tasks**: retrieve the full details of story #{{ISSUE_IID}} in project {{PROJECT_ID}} using glab. Then fetch all child issues (tasks) linked to this story. Collect each task's title, description, acceptance criteria, and status.

1. **Clone the repository**: clone the repository using `glab repo clone {{PROJECT_ID}}` and ensure you are on the default branch with a clean working tree.

1. **Create a feature branch using worktree**: inside the cloned repository, create a new git worktree for isolated development. Derive the branch name from the story title:
   - Use `feature/{{TOPIC_SLUG}}` if the story is a new feature
   - Use `fix/{{TOPIC_SLUG}}` if the story is a bug fix
   - Determine the type from the story's labels or description

   ```bash
   cd <cloned-repo-directory>
   git worktree add -b <branch-name> ../<branch-name> origin/main
   cd ../<branch-name>
   ```

1. **Implement the story**: work through each task in order, implementing the changes described in their acceptance criteria. For each task:

   - Read the task's description and acceptance criteria carefully
   - Review the existing code to understand current patterns and conventions
   - Implement the changes following project conventions (see `CLAUDE.md` in the repository)
   - Write tests covering happy paths, edge cases, and error scenarios
   - Run `bun test` to verify tests pass
   - Run `bun run typecheck` to verify type safety
   - Commit the changes with a clear message referencing the task: `feat: <description> (closes #<task_iid>)`

1. **Verify the full implementation**: after all tasks are implemented:
   - Run `bun test` — all tests must pass
   - Run `bun run typecheck` — no type errors
   - Run `bun run build` — build must succeed
   - Review the full diff to ensure consistency and completeness

1. **Push and create a merge request**: push the feature branch and create an MR:

   ```bash
   git push -u origin <branch-name>
   glab mr create --title "{{ISSUE_TITLE}}" --description "Implements story #{{ISSUE_IID}}\n\n## Changes\n<summary of what was implemented>\n\n## Tasks completed\n<list of task references>\n\nCloses #{{ISSUE_IID}}" --target-branch main
   ```

1. **Move the story to Review**: remove the `Planned` label and add the `Review` label to issue #{{ISSUE_IID}} using glab.

1. Return a summary of:
   - The merge request URL
   - What was implemented
   - Tasks completed
   - Test results
