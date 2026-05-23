# Data Model: Claude Marketplace Plugin

## Entities

### Plugin Manifest (`.claude-plugin/plugin.json`)

Defines this repository as a Claude Code plugin.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Unique plugin identifier (`nosabokit`) |
| `description` | string | yes | One-line description shown in plugin manager |
| `version` | string | yes | Semantic version (`1.0.0`) |
| `author.name` | string | no | Author display name |

```json
{
  "name": "nosabokit",
  "description": "artisanal bespoke claude plugin",
  "version": "1.0.0",
  "author": { "name": "fschwiet" }
}
```

---

### Marketplace Catalog (`.claude-plugin/marketplace.json`)

Defines this repository as a Claude Code marketplace that lists its own plugin.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Marketplace identifier (`nosabokit`) |
| `owner.name` | string | yes | Owner display name |
| `plugins[]` | array | yes | List of plugins distributed by this marketplace |
| `plugins[].name` | string | yes | Plugin name (matches `plugin.json` name) |
| `plugins[].source` | string or object | yes | Path or external source for the plugin |
| `plugins[].description` | string | no | Plugin description shown in marketplace listing |

```json
{
  "name": "nosabokit",
  "owner": { "name": "fschwiet" },
  "plugins": [
    {
      "name": "nosabokit",
      "source": "./",
      "description": "artisanal bespoke claude plugin"
    }
  ]
}
```

---

### Hooks Configuration (`hooks/hooks.json`)

Declares the `PreToolUse` hooks that run before every `Bash` tool call.

| Field | Type | Description |
|-------|------|-------------|
| `hooks.PreToolUse[].matcher` | string | Tool name pattern to match (`Bash`) |
| `hooks.PreToolUse[].hooks[].type` | string | Hook type (`command`) |
| `hooks.PreToolUse[].hooks[].command` | string | Shell command to execute; `${CLAUDE_PLUGIN_ROOT}` is expanded |

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/dist/hooks/check-backslash-paths.js\""
          },
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/dist/hooks/check-redundant-cd.js\""
          }
        ]
      }
    ]
  }
}
```

---

### Hook Script — Check Backslash Paths (`src/hooks/check-backslash-paths.ts`)

Reads the Bash command from stdin JSON and blocks it if it contains a Windows-style backslash path.

**Input** (stdin): `{ "tool_input": { "command": "<bash command string>" } }`

**Behavior**:
- If `command` contains `<<` (heredoc): exit 0 (pass through)
- If `command` matches `/[A-Za-z]:\\[A-Za-z]/`: write block reason to stderr, exit 2
- Otherwise: exit 0

---

### Hook Script — Check Redundant cd (`src/hooks/check-redundant-cd.ts`)

Reads the Bash command from stdin JSON and blocks it if it redundantly `cd`s to the current directory.

**Input** (stdin): `{ "tool_input": { "command": "<bash command string>" } }`

**Behavior**:
- If `command` matches `/^cd\s+("?)([^"&]+)\1\s*&&\s*(.+)$/s` AND the cd target normalizes to CWD: write block reason (including the `rest` command) to stderr, exit 2
- Otherwise: exit 0

**CWD source**: `process.cwd()` (set by Claude Code to the project directory)

---

## State

Both hooks are stateless. Each invocation reads from stdin and exits without side effects.

## Dependencies

| Package | Role | Scope |
|---------|------|-------|
| `typescript` | Compilation | devDependency |
| `vitest` | Unit testing | devDependency |
| `esbuild` | Bundling to single-file JS | devDependency |
| `@types/node` | Node.js type definitions | devDependency |
| `eslint` | Linting (constitution gate) | devDependency |
| `prettier` | Formatting (constitution gate) | devDependency |

No runtime dependencies.
