# Research: Claude Marketplace Plugin

## Decision 1: Repository as Combined Marketplace + Plugin

**Decision**: This repository serves as both a Claude Code marketplace and the plugin it distributes. The `.claude-plugin/` directory contains both `marketplace.json` (marketplace catalog) and `plugin.json` (plugin manifest).

**Rationale**: The spec requires users to "install the marketplace and plugin from a github url." Hosting both in one repo means a single GitHub URL covers the whole install flow: add this repo as a marketplace, then install the plugin listed in it.

**Alternatives considered**:
- Separate marketplace repo: Adds unnecessary indirection with no benefit for a single-plugin distribution.
- Plugin-only (no marketplace): Users would need to configure `extraKnownMarketplaces` in `settings.json` manually, which is less discoverable.

---

## Decision 2: Hook Implementation as TypeScript → Bundled Node.js

**Decision**: Hook logic is written in TypeScript (`src/hooks/`), compiled and bundled into standalone JS files (`dist/hooks/`) using esbuild. The `hooks/hooks.json` invokes the compiled files via `node "${CLAUDE_PLUGIN_ROOT}/dist/hooks/<name>.js"`. The `dist/` directory is committed to the repository so no build step is required during plugin installation.

**Rationale**: The constitution requires TypeScript for all new code and vitest for tests. Bundling to single-file JS with esbuild means installed plugins have no runtime npm dependencies. Committing `dist/` lets Claude Code install the plugin from GitHub without requiring a post-install build.

**Alternatives considered**:
- Pure bash scripts: Cannot be tested with vitest; conflicts with the TypeScript-first constitution.
- `tsx` / `ts-node` at runtime: Adds a runtime dependency not guaranteed to be present on the user's machine; slower startup.
- Shell wrappers delegating to Node.js: Adds an unnecessary layer; `node` can be invoked directly from `hooks.json`.

---

## Decision 3: Hook Input and Block Mechanism

**Decision**: Hooks read `tool_input.command` from JSON on stdin. To block a command, the script writes a human-readable reason to stderr and exits with code 2. Allowed commands exit with code 0.

**Rationale**: This is the documented Claude Code hook contract. Exit code 2 causes Claude Code to treat stderr as the error message and abort the tool call. Exit code 0 passes control to the normal permission flow.

**Alternatives considered**:
- JSON output with `permissionDecision: "deny"`: Supported but more verbose; stderr + exit 2 is simpler and equally effective.

---

## Decision 4: CWD Source for Redundant-cd Hook

**Decision**: The redundant-cd hook obtains the current working directory via `process.cwd()` in Node.js, which Claude Code sets to the project directory when running hooks.

**Rationale**: `CLAUDE_PROJECT_DIR` is available as an environment variable in hook scripts and equals the project working directory. `process.cwd()` in Node.js reflects the same value without requiring additional env var parsing.

**Alternatives considered**:
- Parse `CLAUDE_PROJECT_DIR` env var: Equivalent value; `process.cwd()` is more idiomatic in Node.js.

---

## Decision 5: Path Normalization for Redundant-cd Comparison

**Decision**: Before comparing the `cd` target to CWD, both are normalized by converting backslashes to forward slashes and lowercasing (for case-insensitive Windows comparison). Trailing slashes are stripped.

**Rationale**: On Windows, `C:\code\project` and `C:/code/project` represent the same path. Case is also irrelevant on Windows. Normalization prevents false negatives where the path is equivalent but not identical as a string.

**Alternatives considered**:
- `path.resolve()`: Requires knowing the base directory; `process.cwd()` is already resolved, so normalization is sufficient.
