// src/lib/check-redundant-cd.ts
import { resolve, normalize } from "path";
var CD_PATTERN = /^cd\s+("?)([^"&]+)\1\s*&&\s*(.+)$/s;
function normalizePath(p) {
  return normalize(resolve(p)).replace(/\\/g, "/").replace(/\/$/, "");
}
function checkRedundantCd(cmd, cwd) {
  const match = CD_PATTERN.exec(cmd);
  if (!match) {
    return { block: false };
  }
  const cdTarget = match[2].trim();
  const rest = match[3].trim();
  if (normalizePath(cdTarget) === normalizePath(cwd)) {
    return {
      block: true,
      reason: `Redundant cd \u2014 CWD is already ${cwd}. Just run: ${rest}`
    };
  }
  return { block: false };
}

// src/hooks/check-redundant-cd.ts
async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = JSON.parse(chunks.join(""));
  const command = input?.tool_input?.command ?? "";
  const result = checkRedundantCd(command, process.cwd());
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
