---
description: "Task list for Claude Marketplace Plugin implementation"
---

# Tasks: Claude Marketplace Plugin

**Input**: Design documents from `/specs/001-claude-marketplace-plugin/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/hook-interface.md ✅, quickstart.md ✅

**Tests**: All hook logic tasks MUST include test coverage per the project constitution (Principle I: Automated Testing). Tests MUST be written before implementation (TDD) per the Development Workflow.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths in all descriptions

---

## Phase 1: Setup (Project Toolchain)

**Purpose**: Initialize the Node.js/TypeScript project with all required tooling so quality gates can be run from day one.

- [ ] T001 Create directory structure: `src/hooks/`, `src/lib/`, `dist/hooks/`, `tests/unit/`, `hooks/`, `.claude-plugin/`
- [ ] T002 Create `package.json` with name `nosabokit`, scripts (`test`, `build`, `lint`, `format:check`, `typecheck`, `check`), and devDependencies: `typescript`, `vitest`, `esbuild`, `eslint`, `prettier`, `@types/node`
- [ ] T003 [P] Create `tsconfig.json` with `"strict": true`, `rootDir: "src"`, `outDir: "dist"`, target `ES2020`, module `CommonJS`
- [ ] T004 [P] Create `eslint.config.js` using flat config with TypeScript rules
- [ ] T005 [P] Create `.prettierrc` with project formatting rules
- [ ] T006 [P] Create `vitest.config.ts` pointing test include pattern to `tests/**/*.test.ts`
- [ ] T007 [P] Create `.gitignore` including `node_modules/` but explicitly NOT ignoring `dist/` (dist is committed per research Decision 2)
- [ ] T008 [P] Add esbuild bundle script `scripts/build.ts` (or inline in package.json `build` script) that produces `dist/hooks/check-backslash-paths.js` and `dist/hooks/check-redundant-cd.js` as self-contained bundles with `platform: "node"`, `bundle: true`, `format: "cjs"`

---

## Phase 2: Foundational (Plugin Infrastructure)

**Purpose**: Plugin manifest, marketplace catalog, and hooks configuration — the skeleton that Claude Code reads when installing the plugin. MUST be complete before user story work begins.

**⚠️ CRITICAL**: No user story implementation can be verified end-to-end until this phase is complete.

- [ ] T009 Create `.claude-plugin/plugin.json` per data-model.md: `name: "nosabokit"`, `description`, `version: "1.0.0"`, `author`
- [ ] T010 Create `.claude-plugin/marketplace.json` per data-model.md: `name: "nosabokit"`, `owner`, `plugins` array listing this plugin with `source: "."`
- [ ] T011 Create `hooks/hooks.json` with `PreToolUse` → `Bash` matcher → two `command` hooks invoking `node "${CLAUDE_PLUGIN_ROOT}/dist/hooks/check-backslash-paths.js"` and `node "${CLAUDE_PLUGIN_ROOT}/dist/hooks/check-redundant-cd.js"` (per contracts/hook-interface.md)

**Checkpoint**: Plugin scaffold is complete — Claude Code can discover the marketplace and install the plugin structure, though hook scripts are not yet implemented.

---

## Phase 3: User Story 1 - Install Plugin from GitHub URL (Priority: P1) 🎯 MVP

**Goal**: A user following the README can add this repo as a marketplace from its GitHub URL and install the plugin, activating the hooks.

**Independent Test**: Follow the README instructions from scratch and confirm the plugin appears as installed in Claude Code's plugin manager. (Hook scripts need not work yet — install path is the focus.)

### Tests for User Story 1

- [ ] T012 [US1] Write unit test in `tests/unit/plugin-structure.test.ts` that validates `plugin.json` and `marketplace.json` parse as valid JSON and contain required fields (`name`, `version`, `plugins`)

### Implementation for User Story 1

- [ ] T013 [US1] Write `README.md` documenting: (1) adding the marketplace via `/plugin marketplace add github:fschwiet/nosabokit`, (2) installing the plugin via `/plugin install nosabokit@nosabokit`, (3) verifying activation, (4) prerequisites (Claude Code with plugin support)

**Checkpoint**: User Story 1 is independently testable — the install flow documented in README.md can be followed and the plugin structure verified.

---

## Phase 4: User Story 2 - Block Backslash Paths (Priority: P2)

**Goal**: A `PreToolUse` hook intercepts Bash commands containing Windows backslash paths and blocks them with an actionable error message.

**Independent Test**: In a Claude Code session with the plugin active, trigger `ls C:\Users\name` and confirm Claude receives a block message telling it to use forward slashes. Confirm `cat << 'EOF'` with backslash content is NOT blocked.

### Tests for User Story 2 (write first — TDD)

> **Write tests FIRST, verify they FAIL before writing implementation**

- [ ] T014 [US2] Write unit tests in `tests/unit/check-backslash-paths.test.ts` covering: (a) `C:\Users\name` → blocked, (b) `D:\Projects\app` → blocked, (c) command with `<<` heredoc AND backslash → allowed, (d) forward-slash-only command → allowed, (e) empty command → allowed, (f) `C:\1digits` (no letter after backslash) → allowed

### Implementation for User Story 2

- [ ] T015 [P] [US2] Implement pure logic in `src/lib/check-backslash-paths.ts`: export `checkBackslashPaths(cmd: string): { block: boolean; reason?: string }` using regex `/[A-Za-z]:\\[A-Za-z]/` with heredoc skip for `<<`
- [ ] T016 [US2] Implement hook entry point in `src/hooks/check-backslash-paths.ts`: read stdin to string, parse JSON, extract `tool_input.command`, call `checkBackslashPaths`, write reason to `process.stderr` and `process.exit(2)` if blocked, else `process.exit(0)`
- [ ] T017 [US2] Run `npm run build` and commit generated `dist/hooks/check-backslash-paths.js`

**Checkpoint**: User Story 2 is independently testable — hook blocks Windows backslash paths and allows forward-slash and heredoc commands.

---

## Phase 5: User Story 3 - Block Redundant cd (Priority: P3)

**Goal**: A `PreToolUse` hook intercepts Bash commands of the form `cd <cwd> && <rest>` and blocks them with a message telling Claude to run `<rest>` directly.

**Independent Test**: In a Claude Code session with the plugin active, trigger `cd /code/nosabokit && npm test` (with `/code/nosabokit` as CWD) and confirm Claude receives a block message. Confirm `cd /other/path && npm test` is NOT blocked.

### Tests for User Story 3 (write first — TDD)

> **Write tests FIRST, verify they FAIL before writing implementation**

- [ ] T018 [US3] Write unit tests in `tests/unit/check-redundant-cd.test.ts` covering: (a) `cd /code/project && npm test` with matching CWD → blocked, message includes `npm test`, (b) `cd /other/path && git status` with different CWD → allowed, (c) plain `git status` (no cd) → allowed, (d) `cd "/code/project" && npm test` (quoted path) with matching CWD → blocked, (e) `cd /code/project/ && npm test` (trailing slash) with `/code/project` CWD → blocked (normalization), (f) `cd C:/code/project && npm test` with Windows-style CWD `C:/code/project` → blocked

### Implementation for User Story 3

- [ ] T019 [P] [US3] Implement pure logic in `src/lib/check-redundant-cd.ts`: export `checkRedundantCd(cmd: string, cwd: string): { block: boolean; reason?: string }` using regex `/^cd\s+("?)([^"&]+)\1\s*&&\s*(.+)$/s`, normalizing both paths via `path.resolve()` then `path.normalize()` before comparing
- [ ] T020 [US3] Implement hook entry point in `src/hooks/check-redundant-cd.ts`: read stdin, parse JSON, extract `tool_input.command`, call `checkRedundantCd(command, process.cwd())`, write reason to `process.stderr` and `process.exit(2)` if blocked, else `process.exit(0)`
- [ ] T021 [US3] Run `npm run build` and commit generated `dist/hooks/check-redundant-cd.js`

**Checkpoint**: User Story 3 is independently testable — hook blocks redundant cd prefixes matching CWD and allows all other commands.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, final integration verification, and release readiness.

- [ ] T022 [P] Run `npm run check` (lint + format + typecheck) and fix any violations before merge
- [ ] T023 [P] Run `npm test` and confirm all unit tests pass
- [ ] T024 Update `README.md` with: developer quickstart link (`specs/001-claude-marketplace-plugin/quickstart.md`), badge or status note, and link to hook behavior documentation
- [ ] T025 Verify end-to-end: follow README install steps, trigger a Windows backslash path command, and a redundant-cd command, and confirm both are blocked with correct messages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion
- **User Story 1 (Phase 3)**: Depends on Phase 2 — needs plugin.json and marketplace.json to exist
- **User Story 2 (Phase 4)**: Depends on Phase 2 — needs hooks.json wiring; can run in parallel with Phase 3
- **User Story 3 (Phase 5)**: Depends on Phase 2 — needs hooks.json wiring; can run in parallel with Phases 3 and 4
- **Polish (Phase 6)**: Depends on Phases 3, 4, and 5 all complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 only. Independently testable after T013.
- **User Story 2 (P2)**: Depends on Phase 2 only (not on US1). Independently testable after T017.
- **User Story 3 (P3)**: Depends on Phase 2 only (not on US1 or US2). Independently testable after T021.

### Within Each User Story

- Tests (T014, T018) MUST be written and confirmed FAILING before implementation (T015, T019)
- Pure lib logic before entry point (`src/lib/` before `src/hooks/`)
- Entry point before dist bundle (`src/hooks/` before `dist/hooks/`)
- All three must be done before end-to-end checkpoint

### Parallel Opportunities

- T003–T008 (Phase 1 toolchain files) can all run in parallel
- T009–T011 (Phase 2 manifests) can run in parallel with each other
- Phase 3, Phase 4, Phase 5 can run in parallel with each other once Phase 2 is complete
- T015 (lib) and T019 (lib) can run in parallel (different files)
- T022 and T023 (quality gates) can run in parallel

---

## Parallel Example: User Story 2 + User Story 3 (after Phase 2)

```text
# Can launch simultaneously once Phase 2 is done:

Thread A (US2):
  T014 → T015 → T016 → T017

Thread B (US3):
  T018 → T019 → T020 → T021
```

---

## Implementation Strategy

### MVP First (User Story 1 + one working hook)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 4 (US2): Backslash hook (the highest-value hook)
4. Complete Phase 3 (US1): README documents the working install
5. **STOP and VALIDATE**: Install from README, confirm backslash hook fires
6. Add US3 (redundant cd hook) as second increment

### Incremental Delivery

1. Setup + Foundational → plugin installable (no hooks yet)
2. Add US2 (backslash hook) → first working hook
3. Add US1 (README) → fully documented install
4. Add US3 (redundant cd hook) → second working hook
5. Polish → release ready

---

## Notes

- `[P]` tasks operate on different files with no shared state — safe to run concurrently
- `[Story]` labels trace tasks back to spec.md user stories for review
- `dist/` is committed to git — do NOT add it to `.gitignore`
- Tests in `tests/unit/` are fast, pure-function tests with no Claude Code dependency — can run locally with `npm test` without installing the plugin
- For TDD tasks (T014, T018): run `npm test` after writing tests to confirm they fail before writing implementation
