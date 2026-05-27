# Feature Specification: Block Chained Git Commands Hook

**Feature Branch**: `002-block-chained-git-commands`

**Created**: 2026-05-27

**Status**: Draft

**Summary**: A Bash/PowerShell pre-execution hook that blocks (exit code 2) any command starting with `git ` that also contains `&& git `, so each chained git command receives its own permission prompt instead of being approved as a single compound expression. On block, the hook writes a structured stderr message listing each split-out git command in `<command>` tags, with a count and subcommand names the agent can use to detect misparses and recover.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Block Chained Git Commands With Recovery Hint (Priority: P1)

An AI agent attempts to execute a multi-step git workflow as a single combined shell command (e.g., `git add . && git commit -m "message"`). Without this hook, the combined command would require the user to grant permission for the entire compound expression at once. With the hook in place, the command is blocked (exit code 2) and the agent receives a structured stderr message it can parse to re-issue each git command individually, so each one goes through its own permission check.

The stderr message states the count of git commands found, names each subcommand, and lists each full command in `<command>` tags. The count and subcommand names exist so the agent can sanity-check the split: because matching is plain-text, `&& git` appearing inside a quoted argument can cause a misparse, and the agent needs enough information to notice and recover.

**Why this priority**: This is the entire feature — blocking combined git commands and giving the agent enough information to re-issue them one at a time.

**Independent Test**: Invoke a command string containing `&& git ` through the hook and verify it returns exit code 2 and writes the structured stderr message with correct count, subcommand names, and `<command>` entries.

**Acceptance Scenarios**:

1. **Given** an agent issues `git add file.ts && git commit -m "test: add E2E tests"`, **When** the hook evaluates the command, **Then** it returns exit code 2 and stderr reads:
   ```
   Run git commands separately to avoid causing extra permission checks.
   It looks like you just tried to run 2 git commands, "add" and "commit".
   Could you run them separately, perhaps as the following?
   <command>git add file.ts</command>
   <command>git commit -m "test: add E2E tests"</command>
   ```

2. **Given** an agent issues `git fetch && git rebase origin/main && git push`, **When** the hook evaluates the command, **Then** it is blocked; stderr names all three subcommands ("fetch", "rebase", "push"), the count reads 3, and all three `<command>` lines appear with original arguments intact.

3. **Given** an agent issues `echo "done" && git push`, **When** the hook evaluates the command, **Then** the hook allows it through, because the command does not start with `git `.

4. **Given** an agent issues `git push && echo "done"`, **When** the hook evaluates the command, **Then** the hook allows it through, because there is no `&& git ` pattern.

5. **Given** an agent issues `git add file.ts && git commit -m "message" && npm run test`, **When** the hook evaluates the command, **Then** it is blocked; `git add file.ts` is the first `<command>` entry, and `git commit -m "message" && npm run test` is the second `<command>` entry — unsplit, with the non-git tail preserved.

6. **Given** an agent issues `git add file.ts && git commit -m "test: add Playwright E2E config and app smoke\n    test"` (the commit message contains a newline), **When** the hook evaluates the command, **Then** `git add file.ts` is the first `<command>` entry and the entire `git commit -m "..."` with its multi-line argument is the second `<command>` entry — no further splitting after the newline.

---

### Edge Cases

- Single git command with no `&&`: allowed (exit code 0).
- Command does not start with `git ` (e.g., `npm install && git add package-lock.json`): allowed.
- Empty or whitespace-only command: allowed.
- `&& git` appears inside a quoted argument: the hook may produce a false positive and block. Accepted — the agent uses the structured `<command>` output to detect the misparse and recover.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The hook MUST intercept every Bash and PowerShell command before execution.
- **FR-002**: A command MUST be blocked when BOTH conditions are true: (1) the command starts with `git `, and (2) the substring `&& git ` appears at least once. Otherwise the command MUST be allowed through with exit code 0.
- **FR-003**: When blocking, the hook MUST return exit code 2 and write a structured message to standard error in this exact format:
  ```
  Run git commands separately to avoid causing extra permission checks.
  It looks like you just tried to run N git commands, "sub1"[, "sub2"][, and "subN"].
  Could you run them separately, perhaps as the following?
  <command>git sub1 [args]</command>
  [<command>git sub2 [args]</command> ...]
  ```
- **FR-004**: When producing `<command>` entries, the hook MUST split on `&& git ` left to right and stop at the first segment that either (a) contains a newline, or (b) is not a git command. That segment and all remaining content MUST be emitted as a single unsplit final `<command>` entry, preserving arguments as-is.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The hook adds no perceptible delay (under 100ms) to command evaluation for typical command string lengths (under 10,000 characters).
- **SC-002**: An AI agent reading the stderr output can extract and re-issue each command individually without additional context.
- **SC-003**: A false positive caused by `&& git` inside a quoted argument is recoverable — the agent can inspect the `<command>` output, recognize the misparse, and handle it.

## Assumptions

- The hook is integrated into the nosabokit Claude Code hook system, which supports returning exit code 2 to block a command. It runs in both Bash and PowerShell environments and may have separate script implementations for each, consistent with other hooks in the project (e.g., `remove-redundant-cd`).
- Matching is plain text on the raw command string — no shell parsing or quote-awareness.
