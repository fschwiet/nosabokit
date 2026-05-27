# Contract: PreToolUse Hook Interface

**Hook**: `check-chained-git`
**Registered for**: `Bash|PowerShell` tool calls

---

## Input

Claude Code invokes the hook by piping a JSON object to stdin:

```json
{
  "tool_input": {
    "command": "<the full command string the agent is about to run>"
  }
}
```

The hook reads stdin until EOF, then parses the JSON. If `tool_input` or `command` is absent, treat the command as an empty string (allow through).

---

## Output

### Allow (command passes)

- **Exit code**: `0`
- **Stderr**: empty
- **Stdout**: empty (ignored by Claude Code)

### Block (command intercepted)

- **Exit code**: `2`
- **Stderr**: structured message (see format below)
- **Stdout**: empty (ignored)

### Unexpected error

- **Exit code**: `1`
- **Stderr**: error description string
- **Stdout**: empty

---

## Block Message Format

```
Run git commands separately to avoid causing extra permission checks.
It looks like you just tried to run N git commands, "sub1"[, "sub2"[, and "subN"]].
Could you run them separately, perhaps as the following?
<command>git sub1 [args]</command>
[<command>git sub2 [args]</command>]
...
```

### Rules

| Field | Rule |
|-------|------|
| `N` | Integer count of `<command>` entries |
| List (N=2) | `"sub1" and "sub2"` |
| List (N≥3) | `"sub1", "sub2", and "subN"` (Oxford comma) |
| `<command>` entries | One per split segment; order preserved; arguments preserved as-is |

### Examples

**Two commands**:
```
Run git commands separately to avoid causing extra permission checks.
It looks like you just tried to run 2 git commands, "add" and "commit".
Could you run them separately, perhaps as the following?
<command>git add file.ts</command>
<command>git commit -m "test: add E2E tests"</command>
```

**Three commands**:
```
Run git commands separately to avoid causing extra permission checks.
It looks like you just tried to run 3 git commands, "fetch", "rebase", and "push".
Could you run them separately, perhaps as the following?
<command>git fetch</command>
<command>git rebase origin/main</command>
<command>git push</command>
```

---

## Block Conditions (FR-002)

A command is blocked if and only if BOTH:
1. The command string starts with `git ` (with a space)
2. The command string contains the substring `&& git ` (with spaces on both sides)

All other commands pass through (exit 0).

---

## Consistency with Existing Hooks

This contract is identical in structure to `check-redundant-cd` and `check-backslash-paths`. All hooks in this plugin share the same stdin JSON format, exit code semantics, and stderr messaging convention.
