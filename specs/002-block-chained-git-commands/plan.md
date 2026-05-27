# Implementation Plan: Block Chained Git Commands Hook

**Branch**: `002-block-chained-git-commands` | **Date**: 2026-05-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-block-chained-git-commands/spec.md`

## Summary

Add a `check-chained-git` PreToolUse hook that blocks any command matching both: (1) starts with `git `, and (2) contains `&& git `. When blocked, it returns exit code 2 and writes a structured stderr message that lists each split-out git command in `<command>` tags — giving AI agents enough context to re-issue commands individually. The hook is a plain-text string function with no I/O or shell parsing, consistent with the project's existing hook architecture.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, `"target": "ES2020"`, `"module": "NodeNext"`)

**Primary Dependencies**: Node.js 18+ (runtime); esbuild 0.25+ (bundler); Vitest 3+ (test runner); ESLint 9+ and Prettier 3+ (quality gates)

**Storage**: N/A — stateless hook with no persistence

**Testing**: Vitest (`npm test` / `npm run test:watch`)

**Target Platform**: Node.js 18+ (Claude Code plugin runtime, both Bash and PowerShell tool contexts)

**Project Type**: Claude Code plugin — PreToolUse hook (same pattern as `check-redundant-cd` and `check-backslash-paths`)

**Performance Goals**: <100ms per command evaluation (SC-001); typical command strings are well under 10,000 characters

**Constraints**: Pure function; no external I/O; plain-text matching on raw command string (no shell parsing, no quote awareness); stateless per invocation

**Scale/Scope**: One hook evaluates one command string per Claude tool invocation; no concurrency concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|---------|
| I — Automated Testing (NON-NEGOTIABLE) | ✅ PASS | `tests/unit/check-chained-git.test.ts` required; written TDD-first covering all 6 spec scenarios + edge cases |
| II — TypeScript-First | ✅ PASS | All new source files are `.ts`; tsconfig strict mode already enforced |
| III — Quality Gates | ✅ PASS | Prettier, ESLint, and tsc configs committed; `npm run check` verifies all three |
| IV — YAGNI | ✅ PASS | One lib function + one hook entry point; `CheckResult` defined locally per existing pattern; no shared utilities created without demonstrated need |

**All gates pass. No Complexity Tracking needed.**

*Post-Phase-1 re-check*: Design adds no new dependencies, abstractions, or project-level changes beyond the three new files, two modified files, and one updated JSON. Constitution still satisfied.

## Project Structure

### Documentation (this feature)

```text
specs/002-block-chained-git-commands/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output — algorithm and formatting decisions
├── contracts/
│   └── hook-interface.md  # Phase 1 output — stdin/stdout/exit-code contract
├── quickstart.md        # Phase 1 output — step-by-step implementation guide
├── checklists/
│   └── requirements.md  # Spec quality checklist (/speckit-specify output)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── check-backslash-paths.ts     (existing)
│   ├── check-redundant-cd.ts        (existing)
│   └── check-chained-git.ts         (NEW — pure logic, no I/O)
└── hooks/
    ├── check-backslash-paths.ts     (existing)
    ├── check-redundant-cd.ts        (existing)
    └── check-chained-git.ts         (NEW — stdin reader + exit handler)

tests/
└── unit/
    ├── check-backslash-paths.test.ts    (existing)
    ├── check-redundant-cd.test.ts       (existing)
    ├── plugin-structure.test.ts         (MODIFY — add check-chained-git registration test)
    └── check-chained-git.test.ts        (NEW — unit tests, written TDD-first)

hooks/
└── hooks.json          (MODIFY — add new Bash|PowerShell entry)

scripts/
└── build.mjs           (MODIFY — add "check-chained-git" to hooks array)

dist/
└── hooks/
    └── check-chained-git.js    (built output — not committed)
```

**Structure Decision**: Single project (no structural options needed). Follows the existing lib + hook + test pattern exactly. The build script already supports adding hooks by array entry.
