# nosabokit

A Claude Code plugin that provides two pre-tool hooks for safer command execution on Windows:

1. **Block backslash paths** — Prevents Bash commands that contain Windows-style backslash paths (e.g. `C:\Users\name`), which Git Bash silently mangles into escape sequences. Suggests using forward slashes instead.
2. **Block redundant `cd`** — Prevents commands of the form `cd <current-dir> && <rest>`, which add unnecessary permission prompts without changing the working directory.

## Installation

### Step 1 — Add the marketplace

In Claude Code, run:

```
/plugin marketplace add github:fschwiet/nosabokit
```

When prompted, trust the marketplace.

### Step 2 — Install the plugin

```
/plugin install nosabokit@nosabokit
```

### Step 3 — Verify activation

After installation, Claude Code will run both hooks before every Bash command. You can verify by asking Claude to run a command with a Windows backslash path — it should be blocked with a message like:

> Windows backslash paths are mangled by Git Bash (\g, \s, etc. become escape sequences). Use forward slashes instead (e.g. C:/Users/name/src/...). PowerShell handles forward slashes fine on Windows.

## Prerequisites

- Claude Code with plugin support
- Node.js (any LTS version) available in the shell environment used by Claude Code

## Hook behavior

### check-backslash-paths

Blocks any Bash command matching `[A-Za-z]:\[A-Za-z]` (a drive-letter colon backslash letter pattern). Heredoc commands (`<<`) are exempt.

### check-redundant-cd

Blocks commands matching `cd <target> && <rest>` when `<target>` resolves to the current working directory. Reports the `<rest>` command so Claude can run it directly.

## Development

See [`specs/001-claude-marketplace-plugin/quickstart.md`](specs/001-claude-marketplace-plugin/quickstart.md) for the developer setup guide.
