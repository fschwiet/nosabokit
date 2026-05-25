checkRedundantCd is pseudcode for a pretool hook that prevents redundant cd operations which can trigger unnecessary permission checks.

```
function checkRedundantCd(cmd: string, cwd: string): boolean {
  const m = cmd.match(/^cd\s+("?)([^"&]+)\1\s*&&\s*(.+)$/s);
  if (!m) return false;

  const cdTarget = m[2].trim();
  const rest = m[3].trim();

  if (normalizePath(cdTarget) === normalizePath(cwd)) {
    blockForReason(`Redundant cd — CWD is already ${cwd}. Just run: ${rest}`);
    return true;
  }
  return false;
}
```

Here is a log entry that shows a sample of a tool use intended to be blocked. Note that the case of the path matches what is being reported as the cwd, so matching different cases is not believed to be important:

```
{
  "parentUuid": "bfb9119f-0c08-42bb-9734-c1c1580b0514",
  "isSidechain": false,
  "message": {
    "model": "claude-sonnet-4-6",
    "id": "msg_01P51asyAi7TRJncQiz4SCR7",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "tool_use",
        "id": "toolu_01Jjk4sV659hLBhvJXp8Rcad",
        "name": "PowerShell",
        "input": {
          "command": "cd C:\\code\\nosabokit && npm test 2>&1",
          "description": "Run vitest unit tests",
          "timeout": 60000
        },
        "caller": {
          "type": "direct"
        }
      }
    ],
    "stop_reason": "tool_use",
    "stop_sequence": null,
    "stop_details": null,
    "usage": {
      "input_tokens": 3,
      "cache_creation_input_tokens": 216,
      "cache_read_input_tokens": 99289,
      "output_tokens": 148,
      "server_tool_use": {
        "web_search_requests": 0,
        "web_fetch_requests": 0
      },
      "service_tier": "standard",
      "cache_creation": {
        "ephemeral_1h_input_tokens": 216,
        "ephemeral_5m_input_tokens": 0
      },
      "inference_geo": "",
      "iterations": [
        {
          "input_tokens": 3,
          "output_tokens": 148,
          "cache_read_input_tokens": 99289,
          "cache_creation_input_tokens": 216,
          "cache_creation": {
            "ephemeral_5m_input_tokens": 0,
            "ephemeral_1h_input_tokens": 216
          },
          "type": "message"
        }
      ],
      "speed": "standard"
    },
    "diagnostics": null
  },
  "requestId": "req_011CbJR6zwYgcNJpUD8eoJRh",
  "type": "assistant",
  "uuid": "bb3c58e0-e1a3-489e-8487-24bf1f7df31c",
  "timestamp": "2026-05-22T22:43:48.740Z",
  "userType": "external",
  "entrypoint": "cli",
  "cwd": "C:\\code\\nosabokit",
  "sessionId": "b3b1904d-df7c-4b60-bb37-b738c1b13f9e",
  "version": "2.1.148",
  "gitBranch": "001-claude-marketplace-plugin"
}
```

For powershell at least we also need to handle a ';' separator:

```
{
  "command": "cd C:\\code\\gradoglot; .\\gradlew.bat testDebugUnitTest 2>&1",
  "description": "Run unit tests via Gradle wrapper",
  "timeout": 300000
}
```
