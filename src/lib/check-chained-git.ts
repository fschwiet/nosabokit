export interface CheckResult {
  block: boolean;
  reason?: string;
}

function extractSubcommand(segment: string): string {
  // segment is "git <subcommand> [args...]" — extract the first word after "git "
  const afterGit = segment.slice("git ".length);
  const spaceIdx = afterGit.search(/\s/);
  return spaceIdx === -1 ? afterGit : afterGit.slice(0, spaceIdx);
}

function buildEnglishList(items: string[]): string {
  if (items.length === 1) {
    return `"${items[0]}"`;
  }
  if (items.length === 2) {
    return `"${items[0]}" and "${items[1]}"`;
  }
  const allButLast = items.slice(0, -1).map((s) => `"${s}"`);
  return `${allButLast.join(", ")}, and "${items[items.length - 1]}"`;
}

function collectEntries(rawParts: string[]): string[] {
  const entries: string[] = [];

  for (let i = 0; i < rawParts.length; i++) {
    const segment = (i === 0 ? rawParts[i] : "git " + rawParts[i]).trimEnd();

    if (segment.includes("\n")) {
      // This segment and all remaining content become a single final entry
      const remaining = rawParts.slice(i + 1);
      const finalEntry =
        remaining.length > 0 ? segment + " && git " + remaining.join(" && git ") : segment;
      entries.push(finalEntry);
      break;
    }

    entries.push(segment);
  }

  return entries;
}

function buildMessage(entries: string[]): string {
  const subcommands = entries.map(extractSubcommand);
  const list = buildEnglishList(subcommands);
  const count = entries.length;
  const commandLines = entries.map((e) => `<command>${e}</command>`).join("\n");

  return (
    `Run git commands separately to avoid causing extra permission checks.\n` +
    `It looks like you just tried to run ${count} git commands, ${list}.\n` +
    `Could you run them separately, perhaps as the following?\n` +
    commandLines
  );
}

export function checkChainedGit(cmd: string): CheckResult {
  if (!cmd.startsWith("git ") || !cmd.includes("&& git ")) {
    return { block: false };
  }

  const rawParts = cmd.split("&& git ");
  const entries = collectEntries(rawParts);

  return { block: true, reason: buildMessage(entries) };
}
