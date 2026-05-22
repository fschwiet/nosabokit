# Contract: Claude Code Hook Interface

## Overview

Each hook script is a Node.js program invoked by Claude Code before a `Bash` tool call executes. The script receives context on stdin, performs its check, and communicates its decision via exit code and stderr.

## Input

Claude Code pipes a JSON object to stdin:

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "<the bash command string Claude is about to run>"
  }
}
```

The hook may safely ignore all fields except `tool_input.command`.

## Output

| Exit code | Meaning | What Claude Code does |
|-----------|---------|----------------------|
| `0` | No decision — pass through | Normal permission flow continues |
| `2` | Block — abort the tool call | Feeds stderr text back to Claude as an error |

Stdout is ignored when exit code is `2`. Stderr text becomes the error message Claude sees and uses to self-correct.

## Block Message Format

When blocking (exit 2), the hook writes a single human-readable line to stderr:

```
<Reason for blocking>. <Correction hint>.
```

Examples:
- `Windows backslash paths are mangled by Git Bash (\g, \s, etc. become escape sequences). Use forward slashes instead (e.g. C:/Users/name/src/...). PowerShell handles forward slashes fine on Windows.`
- `Redundant cd — CWD is already /code/myproject. Just run: git status`

## Environment

Claude Code sets the following environment variables when invoking hook scripts:

| Variable | Value |
|----------|-------|
| `CLAUDE_PLUGIN_ROOT` | Absolute path to the installed plugin directory |
| `CLAUDE_PROJECT_DIR` | Absolute path to the user's project |
| `PWD` / `process.cwd()` | Same as `CLAUDE_PROJECT_DIR` |

## Node.js Skeleton

```typescript
import { createInterface } from "readline";

async function main(): Promise<void> {
  const chunks: string[] = [];
  for await (const line of createInterface({ input: process.stdin })) {
    chunks.push(line);
  }
  const input = JSON.parse(chunks.join("\n"));
  const command: string = input?.tool_input?.command ?? "";

  if (shouldBlock(command)) {
    process.stderr.write(blockMessage(command));
    process.exit(2);
  }

  process.exit(0);
}

main();
```
