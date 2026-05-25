import { resolve, normalize } from "path";

const CD_PATTERN = /^cd\s+("?)([^"&;]+)\1\s*(?:&&|;)\s*(.+)$/s;

export interface CheckResult {
  block: boolean;
  reason?: string;
}

function normalizePath(p: string): string {
  return normalize(resolve(p)).replace(/\\/g, "/").replace(/\/$/, "");
}

export function checkRedundantCd(cmd: string, cwd: string): CheckResult {
  const match = CD_PATTERN.exec(cmd);
  if (!match) {
    return { block: false };
  }

  const cdTarget = match[2].trim();
  const rest = match[3].trim();

  if (normalizePath(cdTarget) === normalizePath(cwd)) {
    return {
      block: true,
      reason: `Redundant cd — CWD is already ${cwd}. Just run: ${rest}`,
    };
  }

  return { block: false };
}
