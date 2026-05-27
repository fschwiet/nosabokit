// src/lib/check-chained-git.ts
function extractSubcommand(segment) {
  const afterGit = segment.slice("git ".length);
  const spaceIdx = afterGit.search(/\s/);
  return spaceIdx === -1 ? afterGit : afterGit.slice(0, spaceIdx);
}
function buildEnglishList(items) {
  if (items.length === 1) {
    return `"${items[0]}"`;
  }
  if (items.length === 2) {
    return `"${items[0]}" and "${items[1]}"`;
  }
  const allButLast = items.slice(0, -1).map((s) => `"${s}"`);
  return `${allButLast.join(", ")}, and "${items[items.length - 1]}"`;
}
function collectEntries(rawParts) {
  const entries = [];
  for (let i = 0; i < rawParts.length; i++) {
    const segment = (i === 0 ? rawParts[i] : "git " + rawParts[i]).trimEnd();
    if (segment.includes("\n")) {
      const remaining = rawParts.slice(i + 1);
      const finalEntry = remaining.length > 0 ? segment + " && git " + remaining.join(" && git ") : segment;
      entries.push(finalEntry);
      break;
    }
    entries.push(segment);
  }
  return entries;
}
function buildMessage(entries) {
  const subcommands = entries.map(extractSubcommand);
  const list = buildEnglishList(subcommands);
  const count = entries.length;
  const commandLines = entries.map((e) => `<command>${e}</command>`).join("\n");
  return `Run git commands separately to avoid causing extra permission checks.
It looks like you just tried to run ${count} git commands, ${list}.
Could you run them separately, perhaps as the following?
` + commandLines;
}
function checkChainedGit(cmd) {
  if (!cmd.startsWith("git ") || !cmd.includes("&& git ")) {
    return { block: false };
  }
  const rawParts = cmd.split("&& git ");
  const entries = collectEntries(rawParts);
  return { block: true, reason: buildMessage(entries) };
}

// src/hooks/check-chained-git.ts
async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = JSON.parse(chunks.join(""));
  const command = input?.tool_input?.command ?? "";
  const result = checkChainedGit(command);
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
