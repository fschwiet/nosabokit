# Research: Block Chained Git Commands Hook

**Feature branch**: `002-block-chained-git-commands`
**Date**: 2026-05-27

---

## Decision 1: Split Algorithm

**Decision**: Split on the literal substring `&& git ` left to right using `String.split()`. Each part after the first receives a `git ` prefix to restore the full command form. Scan left to right, collecting command entries. Stop early if a segment contains a newline character — that segment and all remaining unsplit content are emitted as a single final `<command>` entry.

**Algorithm (pseudocode)**:

```
function splitGitCommands(cmd: string): string[]
  rawParts = cmd.split('&& git ')           // e.g. ["git add .", "commit -m \"msg\"", "push"]
  entries = []

  for i, part in rawParts:
    segment = (i === 0 ? part : 'git ' + part).trimEnd()

    if segment contains '\n':
      // Reconstruct this segment + all remaining raw parts as one final entry
      remaining = rawParts.slice(i + 1).join(' && git ')
      finalEntry = remaining.length > 0 ? segment + ' && git ' + remaining : segment
      entries.push(finalEntry)
      break

    entries.push(segment)

  return entries
```

**Rationale**: `String.split()` is O(n) and operates entirely on the already-in-memory command string, satisfying SC-001 (<100ms). The newline-stop rule handles the multi-line commit message scenario (Scenario 6) and prevents false further splits inside multi-line arguments. The "is not a git command" FR-004 condition is handled implicitly: because the command must start with `git ` (FR-002 gate), and splits are on `&& git `, all emitted segments are git commands by construction.

**Alternatives considered**:
- Shell-aware parsing (quote tracking, escape handling): Rejected — spec explicitly requires plain-text matching (Assumptions). Adds complexity with no correctness benefit for the defined use cases.
- Regex split: Rejected — `String.split()` on a literal string is simpler and sufficient.

---

## Decision 2: English List Formatting

**Decision**: Build the subcommand list using Oxford comma style.

| Count | Format |
|-------|--------|
| 1     | `"sub1"` |
| 2     | `"sub1" and "sub2"` |
| 3+    | `"sub1", "sub2", and "subN"` |

**Derived from**: Spec Scenario 1 (`"add" and "commit"`) and Scenario 2 (`"fetch", "rebase", and "push"`).

**Rationale**: Direct match to the specified output format. Oxford comma is unambiguous at 3+ items.

---

## Decision 3: Subcommand Extraction

**Decision**: Extract the first whitespace-delimited token after `git ` from each segment (e.g., `git commit -m "foo"` → `"commit"`).

**Rationale**: Git subcommands are always a single word token following `git `. No deeper parsing needed. Edge case: if the token is empty (malformed segment), emit `""` — the spec does not define recovery for this and it should not occur given the FR-002 preconditions.

---

## Decision 4: Hook Registration

**Decision**: Register the new hook in `hooks/hooks.json` under `PreToolUse` with matcher `"Bash|PowerShell"`, consistent with how `check-redundant-cd` is registered (it also needs to intercept both shells).

**Rationale**: The chained-git hook must fire for both Bash and PowerShell tool invocations. `check-backslash-paths` only fires for Bash (Windows backslash paths are a Bash-specific issue). `check-chained-git` is shell-agnostic — the block decision depends solely on the command string content.

**Hook ordering**: The new hook should be a separate entry in the `Bash|PowerShell` array. It may share the same matcher entry as `check-redundant-cd` (as a second item in its `hooks` array) or be its own entry. Use a separate entry for independent lifecycle management.

---

## Decision 5: Shared `CheckResult` Type

**Decision**: Define `CheckResult` locally in `src/lib/check-chained-git.ts`, identical to the pattern in `check-redundant-cd.ts` and `check-backslash-paths.ts`. Do not extract to a shared module.

**Rationale**: YAGNI (Constitution Principle IV). No current requirement to share this type. All existing lib files define it locally. Extraction would add a dependency without demonstrated need.

---

## Decision 6: Build Script Update

**Decision**: Add `"check-chained-git"` to the `hooks` array in `scripts/build.mjs`. esbuild bundles each hook entrypoint independently.

**Rationale**: Follows exact pattern of existing hooks. Output lands at `dist/hooks/check-chained-git.js`.
