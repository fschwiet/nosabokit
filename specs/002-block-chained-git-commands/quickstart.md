# Quickstart: Implementing check-chained-git

This guide walks through adding the `check-chained-git` hook to the nosabokit plugin.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/check-chained-git.ts` | Pure logic — no I/O, no side effects |
| `src/hooks/check-chained-git.ts` | Hook entry point — reads stdin, calls lib, exits |
| `tests/unit/check-chained-git.test.ts` | Vitest unit tests (write first — TDD) |

## Files to Modify

| File | Change |
|------|--------|
| `scripts/build.mjs` | Add `"check-chained-git"` to the `hooks` array |
| `hooks/hooks.json` | Add a new `PreToolUse` entry for `Bash\|PowerShell` |
| `tests/unit/plugin-structure.test.ts` | Add test asserting the new hook is registered |

---

## Step 1: Write Tests First (TDD)

Create `tests/unit/check-chained-git.test.ts` with tests for each spec scenario before writing any implementation:

- Scenario 1: `git add file.ts && git commit -m "..."` → blocked, 2 commands
- Scenario 2: `git fetch && git rebase origin/main && git push` → blocked, 3 commands  
- Scenario 3: `echo "done" && git push` → allowed (does not start with `git `)
- Scenario 4: `git push && echo "done"` → allowed (no `&& git ` pattern)
- Scenario 5: `git add file.ts && git commit -m "..." && npm run test` → blocked, 2 entries; second entry preserves `&& npm run test` tail
- Scenario 6: multi-line commit message → blocked, 2 entries; newline stops further splitting
- Edge: single git command → allowed
- Edge: empty string → allowed

---

## Step 2: Implement the Library Function

`src/lib/check-chained-git.ts` exports:

```typescript
export interface CheckResult {
  block: boolean;
  reason?: string;
}

export function checkChainedGit(cmd: string): CheckResult
```

The function:
1. Returns `{ block: false }` if `cmd` does not start with `"git "` or does not contain `"&& git "`.
2. Splits on `"&& git "` and collects command entries (see `research.md` for the algorithm).
3. Builds the stderr message from entries and returns `{ block: true, reason: message }`.

---

## Step 3: Implement the Hook Entry Point

`src/hooks/check-chained-git.ts` follows the same pattern as `check-redundant-cd.ts`:
- Read stdin chunks, join, JSON-parse
- Extract `input?.tool_input?.command ?? ""`
- Call `checkChainedGit(command)`
- On block: `process.stderr.write(result.reason)` then `process.exit(2)`
- Otherwise: `process.exit(0)`

---

## Step 4: Update Build Script

In `scripts/build.mjs`, add `"check-chained-git"` to the `hooks` array:

```javascript
const hooks = ["check-backslash-paths", "check-redundant-cd", "check-chained-git"];
```

---

## Step 5: Register the Hook

In `hooks/hooks.json`, add a new entry to `PreToolUse`:

```json
{
  "matcher": "Bash|PowerShell",
  "hooks": [
    {
      "type": "command",
      "command": "node \"${CLAUDE_PLUGIN_ROOT}/dist/hooks/check-chained-git.js\""
    }
  ]
}
```

---

## Step 6: Update Plugin Structure Tests

In `tests/unit/plugin-structure.test.ts`, add a test in the `hooks/hooks.json` describe block:

```typescript
it("registers check-chained-git for Bash|PowerShell", () => {
  const entries = config.hooks.PreToolUse.filter((e) => e.matcher === "Bash|PowerShell");
  const commands = entries.flatMap((e) => e.hooks.map((h) => h.command));
  expect(commands.some((c) => c.includes("check-chained-git"))).toBe(true);
});
```

---

## Step 7: Build and Verify

```bash
npm test           # all tests pass
npm run build      # dist/hooks/check-chained-git.js produced
npm run check      # ESLint + Prettier + tsc all pass
```

---

## Key Invariants

- `checkChainedGit` is a pure function — no stdin/stdout/stderr access, no `process.exit`
- The hook entry point is the only place with side effects
- `CheckResult` is defined locally (not shared) — consistent with existing hooks
