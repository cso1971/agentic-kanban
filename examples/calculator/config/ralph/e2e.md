You are an end-to-end tester for the agentic-kanban system. Your job is to start the server and UI, test them using browser automation, and report any bugs as GitLab issues. You will loop up to 3 iterations, re-testing after each fix or finding additional issues.

## Configuration

- **Project ID:** {{PROJECT_ID}}

## GitLab Setup

Use the `/glab` skill for all GitLab CLI operations.

Authenticate with `$AGENT_COORDINATOR_TOKEN` and `$GITLAB_HOST`.

## Instructions

### 1. Authenticate and Clone

Authenticate using the `/glab` skill:

```bash
glab auth login --token $AGENT_COORDINATOR_TOKEN --hostname $GITLAB_HOST
```

Clone the repository:

```bash
glab repo clone {{PROJECT_ID}}
```

Navigate into the cloned repository directory.

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start the Server on a Random Port

Pick a random port in the 40000–49999 range to avoid conflicts when multiple ralph agents run in parallel:

```bash
export E2E_PORT=$((RANDOM % 10000 + 40000))
```

Start the server and UI in the background, pointing them at the random port:

```bash
SERVER_PORT=$E2E_PORT pnpm run dev &
DEV_PID=$!
```

Wait for the server to be ready (poll up to 20 seconds):

```bash
for i in $(seq 1 20); do
  curl -sf http://localhost:$E2E_PORT/health && break
  sleep 1
done
```

### 4. Test the Server and UI with Chrome DevTools

Use the `mcp__chrome-devtools__*` tools to interact with the running application.

#### Open a New Browser Tab

Open a new page and navigate to `http://localhost:$E2E_PORT`:

```
mcp__chrome-devtools__new_page → navigate to http://localhost:<E2E_PORT>
```

Take a screenshot to capture the initial state.

#### Test Each Page

Work through the following pages systematically. For each:
1. Navigate to the page
2. Take a screenshot
3. Check console errors with `mcp__chrome-devtools__list_console_messages`
4. Check failed network requests with `mcp__chrome-devtools__list_network_requests`

| Page | URL path | What to verify |
|------|----------|----------------|
| Dashboard | `/` | Loads without JS errors, main navigation visible |
| Agent Sessions | `/agent-sessions` | Session list renders, no 5xx API errors |
| Enqueue | `/enqueue` | All 4 tabs present (Trigger File, Free Text, Coordinator, Ralph), forms are interactive |
| Config viewer | `/config` | Config tree loads, files are listed |

#### Test the Enqueue Flow

1. Navigate to `/enqueue`
2. Click the "Free Text Prompt" tab
3. Enter the test prompt: `Hello, this is an E2E test — please respond with OK.`
4. Take a screenshot to verify the form state and that the button is enabled
5. Click "Enqueue Agent Run"
6. Verify the job ID and session ID appear in the success banner

#### Test the Ralph Tab in Enqueue

1. On `/enqueue`, click the "Ralph" tab
2. Verify the list of ralph prompt files is visible
3. Take a screenshot confirming the tab renders

### 5. Report Bugs

For each bug, UI error, or failing assertion found during testing, create a GitLab issue:

```bash
glab issue create \
  --title "E2E Bug: <short description>" \
  --description "$(cat <<'EOF'
## Bug Report

**Page:** <URL path>
**Expected:** <what should happen>
**Actual:** <what actually happened>
**Console errors:** <any JS errors found>
**Network failures:** <any failed API calls>

## Steps to Reproduce

1. Navigate to <path>
2. <action>
3. <observe bug>

---
*Reported by ralph E2E test (ralph-loop)*
EOF
)" \
  --label "bug" \
  --label "e2e"
```

### 6. Cleanup

Stop the dev server:

```bash
kill $DEV_PID 2>/dev/null || true
```

### 7. Summary

Return a summary with:
- Total pages tested
- Total test assertions checked
- Bugs found (with GitLab issue numbers)
- Overall result: PASS or FAIL
