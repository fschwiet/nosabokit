const BACKSLASH_PATH_PATTERN = /[A-Za-z]:\\[A-Za-z]/;

const BLOCK_REASON =
  "Windows backslash paths are mangled by Git Bash (\\g, \\s, etc. become escape sequences). " +
  "Use forward slashes instead (e.g. C:/Users/name/src/...). " +
  "PowerShell handles forward slashes fine on Windows.";

export interface CheckResult {
  block: boolean;
  reason?: string;
}

export function checkBackslashPaths(cmd: string): CheckResult {
  if (cmd.includes("<<")) {
    return { block: false };
  }
  if (BACKSLASH_PATH_PATTERN.test(cmd)) {
    return { block: true, reason: BLOCK_REASON };
  }
  return { block: false };
}
