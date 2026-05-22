// src/lib/check-backslash-paths.ts
var BACKSLASH_PATH_PATTERN = /[A-Za-z]:\\[A-Za-z]/;
var BLOCK_REASON = "Windows backslash paths are mangled by Git Bash (\\g, \\s, etc. become escape sequences). Use forward slashes instead (e.g. C:/Users/name/src/...). PowerShell handles forward slashes fine on Windows.";
function checkBackslashPaths(cmd) {
  if (cmd.includes("<<")) {
    return { block: false };
  }
  if (BACKSLASH_PATH_PATTERN.test(cmd)) {
    return { block: true, reason: BLOCK_REASON };
  }
  return { block: false };
}

// src/hooks/check-backslash-paths.ts
async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = JSON.parse(chunks.join(""));
  const command = input?.tool_input?.command ?? "";
  const result = checkBackslashPaths(command);
  if (result.block) {
    process.stderr.write(result.reason ?? "Blocked");
    process.exit(2);
  }
  process.exit(0);
}
main().catch((err) => {
  process.stderr.write(String(err));
  process.exit(1);
});
