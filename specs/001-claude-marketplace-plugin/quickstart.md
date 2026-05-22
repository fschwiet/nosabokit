# Developer Quickstart

## Prerequisites

- Node.js LTS
- npm

## Setup

```shell
npm install
```

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm test` | Run unit tests with vitest |
| `npm run build` | Compile TypeScript and bundle hooks to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run format:check` | Check formatting with Prettier |
| `npm run typecheck` | Run `tsc --noEmit` |
| `npm run check` | Run all quality gates (lint + format + typecheck) |

## Project Structure

```text
.claude-plugin/
├── marketplace.json   ← marketplace catalog (this repo as marketplace)
└── plugin.json        ← plugin manifest

hooks/
└── hooks.json         ← PreToolUse hook definitions

src/
├── hooks/
│   ├── check-backslash-paths.ts   ← hook entry point (reads stdin, exits)
│   └── check-redundant-cd.ts     ← hook entry point (reads stdin, exits)
└── lib/
    ├── check-backslash-paths.ts   ← pure check logic (testable)
    └── check-redundant-cd.ts     ← pure check logic (testable)

dist/
└── hooks/
    ├── check-backslash-paths.js   ← bundled output (committed)
    └── check-redundant-cd.js     ← bundled output (committed)

tests/
└── unit/
    ├── check-backslash-paths.test.ts
    └── check-redundant-cd.test.ts
```

## Adding a New Hook

1. Write the pure logic in `src/lib/<hook-name>.ts`.
2. Write the hook entry point in `src/hooks/<hook-name>.ts` (reads stdin, calls lib, exits).
3. Add unit tests in `tests/unit/<hook-name>.test.ts`.
4. Run `npm run build` to produce `dist/hooks/<hook-name>.js`.
5. Add the hook to `hooks/hooks.json` pointing to the dist file.
6. Commit `dist/` changes.

## Quality Gates

All three gates must pass before merging:

```shell
npm run check   # runs eslint + prettier --check + tsc --noEmit
npm test        # runs vitest
```

CI enforces these on every PR.

## Releasing

Bump the `version` field in `.claude-plugin/plugin.json`, commit, and push. Claude Code uses the version to detect updates.
