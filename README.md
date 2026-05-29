# nosabokit

A Claude Code plugin where I can accumulate some claude configurations I care about.

1. **Block backslash paths** — Prevents Bash commands that contain Windows-style backslash paths (e.g. `C:\Users\name`), which Git Bash silently mangles into escape sequences. Suggests using forward slashes instead.
2. **Block redundant `cd`** — Prevents commands of the form `cd <current-dir> && <rest>`, which add unnecessary permission prompts without changing the working directory.
3. **Block chained git commands** - Prevents commands like 'git add file.ts && git commit -m "test: add E2E tests"' asking the agent to run them individually.
4. MCP server context7 - a happy accident, when you import a claude plugin it's .mcp.json gets picked up as well.

Review the unit tests to see what variations the hooks are built to catch and the output they produce.
   
## Prerequisites

- Claude Code with plugin support
- Node.js (any LTS version) available in the shell environment used by Claude Code

## Installation

### Step 1 — Add the marketplace

In Claude Code, run:

```
/plugin marketplace add fschwiet/nosabokit
```

When prompted, trust the marketplace.

### Step 2 — Install the plugin

```
/plugin install nosabokit@nosabokit
```

### Step 3 — Verify activation

Use these prompts to confirm all three hook behaviors. Replace `C:/code/nosabokit` with your own working directory in each prompt.

**1. Bash backslash path is blocked:**

> Run the bash command "ls C:\code\nosabokit" and tell me the output

Expected: blocked with a message about backslash paths being mangled by Git Bash.

**2. Bash redundant cd is blocked:**

> Run the bash command "cd C:/code/nosabokit && ls" and tell me the output

Expected: blocked with a message saying the cd is redundant and suggesting to just run `ls`.

**3. PowerShell redundant cd is blocked:**

> Run the PowerShell command "cd C:/code/nosabokit && ls" and tell me the output

Expected: blocked with the same redundant cd message.

## Development

See [`specs/001-claude-marketplace-plugin/quickstart.md`](specs/001-claude-marketplace-plugin/quickstart.md) for the developer setup guide.
