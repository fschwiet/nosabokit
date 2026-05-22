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
