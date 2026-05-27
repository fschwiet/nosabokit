---
description: "Task list for Block Chained Git Commands Hook"
---

# Tasks: Block Chained Git Commands Hook

**Input**: Design documents from `specs/002-block-chained-git-commands/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, contracts/hook-interface.md ✅, quickstart.md ✅

**Tests**: All tasks MUST include test coverage per the project constitution (Principle I: Automated Testing). Tests MUST be written before implementation (TDD).

**Organization**: One user story; tasks are ordered TDD-first within the story phase.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: Which user story this task belongs to — `[US1]` throughout

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire the new hook into the build system and registration config before writing any logic.

- [x] T001 [P] Add `"check-chained-git"` to the `hooks` array in `scripts/build.mjs`
- [x] T002 [P] Add a new `PreToolUse` entry with matcher `"Bash|PowerShell"` and command `node "${CLAUDE_PLUGIN_ROOT}/dist/hooks/check-chained-git.js"` in `hooks/hooks.json`

**Checkpoint**: Build script and hook registration are updated. Running `npm run build` will bundle the new hook once its source exists.

---

## Phase 2: User Story 1 — Block Chained Git Commands With Recovery Hint (Priority: P1) 🎯 MVP

**Goal**: An agent issuing a multi-step git command string (e.g. `git add . && git commit -m "..."`) receives exit code 2 and a structured stderr message listing each split-out `<command>` so it can re-issue them individually.

**Independent Test**: Run `echo '{"tool_input":{"command":"git add . && git commit -m \"test\""}}' | node dist/hooks/check-chained-git.js`; verify exit code is 2 and stderr contains two `<command>` entries with the correct count and subcommand names.

### Tests for User Story 1 (MANDATORY — write first, verify they FAIL before T005–T006)

- [x] T003 [P] [US1] Add `registers check-chained-git for Bash|PowerShell` test to the `hooks/hooks.json` describe block in `tests/unit/plugin-structure.test.ts` (depends on T002 to pass)
- [x] T004 [US1] Create `tests/unit/check-chained-git.test.ts` with unit tests covering all six spec scenarios and edge cases:
  - Scenario 1: `git add file.ts && git commit -m "..."` → blocked; 2 commands; stderr lists `"add" and "commit"`; two `<command>` entries
  - Scenario 2: `git fetch && git rebase origin/main && git push` → blocked; 3 commands; stderr lists `"fetch", "rebase", and "push"`; three `<command>` entries
  - Scenario 3: `echo "done" && git push` → allowed (does not start with `git `)
  - Scenario 4: `git push && echo "done"` → allowed (no `&& git ` substring)
  - Scenario 5: `git add file.ts && git commit -m "msg" && npm run test` → blocked; 2 entries; second entry is `git commit -m "msg" && npm run test` (non-git tail preserved unsplit)
  - Scenario 6: `git add file.ts && git commit -m "multi\nline"` → blocked; 2 entries; newline stops further splitting
  - Edge: single `git status` → allowed
  - Edge: empty string → allowed

### Implementation for User Story 1

- [x] T005 [US1] Implement `checkChainedGit(cmd: string): CheckResult` in `src/lib/check-chained-git.ts`:
  - Export `CheckResult` interface (`block: boolean; reason?: string`)
  - Guard: return `{ block: false }` if `cmd` does not start with `"git "` or does not contain `"&& git "`
  - Split `cmd` on `"&& git "` left to right; reconstruct each segment (`i===0` keeps as-is; subsequent get `"git "` prepended)
  - Collect entries scanning left to right; if a segment contains `\n`, combine it with all remaining raw parts (re-joined with `" && git "`) as the final entry and stop
  - Extract subcommand: first whitespace-delimited token after `git ` from each entry
  - Build English list with Oxford comma (`"sub1" and "sub2"` for N=2; `"sub1", "sub2", and "subN"` for N≥3)
  - Format stderr message per the contract in `contracts/hook-interface.md` and return `{ block: true, reason: message }`
- [x] T006 [US1] Implement hook entry point `src/hooks/check-chained-git.ts`:
  - Read stdin chunks until EOF, join, JSON-parse as `{ tool_input?: { command?: string } }`
  - Extract `command = input?.tool_input?.command ?? ""`
  - Call `checkChainedGit(command)`
  - On `result.block`: `process.stderr.write(result.reason ?? "Blocked")` then `process.exit(2)`
  - Otherwise: `process.exit(0)`
  - Catch unexpected errors: write to stderr, `process.exit(1)`

**Checkpoint**: `npm test` passes all tests in `check-chained-git.test.ts` and `plugin-structure.test.ts`. The independent test (manual invocation via stdin) returns exit 2 with correct stderr.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final build verification, quality gates, and version bump.

- [x] T007 Run `npm run build`; verify `dist/hooks/check-chained-git.js` is produced alongside existing hook bundles
- [x] T008 Run `npm run check` (ESLint + Prettier + `tsc --noEmit`); fix any issues reported
- [x] T009 Bump patch version in `.claude-plugin/plugin.json` to reflect the new hook addition

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T001 and T002 are parallel
- **User Story 1 (Phase 2)**: T003 depends on T002 to pass (but can be written before). T004 is independent. T005 depends on T004 (TDD). T006 depends on T005 (imports lib)
- **Polish (Phase 3)**: T007–T009 depend on all Phase 2 tasks complete

### Within User Story 1

```
T003 (structure test) ──────────────────────────────────────► passes after T002
T004 (unit tests, write + verify FAIL) ── T005 (lib impl) ── T006 (hook entry)
```

T003 and T004 can be written in parallel (different files, no shared state).

### Parallel Opportunities

| Parallel Batch | Tasks |
|----------------|-------|
| Phase 1 parallel | T001, T002 |
| Test writing parallel | T003, T004 |
| Post-build polish | T007, T008, T009 (sequential for clarity; T009 independent) |

---

## Parallel Example: User Story 1

```text
# Write tests in parallel first:
Task T003: "Add plugin-structure test for check-chained-git registration"
Task T004: "Create tests/unit/check-chained-git.test.ts with all scenarios"

# After tests written and confirmed failing:
Task T005: "Implement checkChainedGit in src/lib/check-chained-git.ts"

# After T005 passes tests:
Task T006: "Implement hook entry point in src/hooks/check-chained-git.ts"
```

---

## Implementation Strategy

### MVP (this entire feature is one user story)

1. Complete Phase 1: Setup (T001, T002 in parallel)
2. Write failing tests (T003, T004 in parallel) — confirm they fail
3. Implement lib (T005) — confirm T004 passes
4. Implement hook entry point (T006) — confirm T003 + manual test pass
5. **STOP and VALIDATE**: `npm test` all green; run manual stdin test
6. Polish (T007–T009)

---

## Notes

- `[P]` tasks touch different files — safe to parallelize
- `[US1]` maps all logic tasks to the single user story
- TDD order is strict: T004 must exist and fail before T005 is written
- `checkChainedGit` in `src/lib/` must be a pure function (no I/O, no side effects) — all stdin/stdout/exit logic lives exclusively in `src/hooks/check-chained-git.ts`
- See `research.md` for the split algorithm details and `contracts/hook-interface.md` for the exact stderr format
