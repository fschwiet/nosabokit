checkBackslashPaths is pseudocode for a pretool hook that prevents backslashes in paths.

```
function checkBackslashPaths(cmd: string): boolean {
  if (cmd.includes("<<")) return false; // skip heredocs
  if (/[A-Za-z]:\\[A-Za-z]/.test(cmd)) {
    blockForReason(
      "Windows backslash paths are mangled by Git Bash (\\g, \\s, etc. become escape sequences). " +
        "Use forward slashes instead (e.g. C:/Users/username/src/...). " +
        "PowerShell handles forward slashes fine on Windows."
    );
    return true;
  }
  return false;
}
```
