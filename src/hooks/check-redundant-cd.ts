import { checkRedundantCd } from "../lib/check-redundant-cd.js";

async function main(): Promise<void> {
  const chunks: string[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as string);
  }
  const input = JSON.parse(chunks.join("")) as {
    tool_input?: { command?: string };
  };
  const command = input?.tool_input?.command ?? "";

  const result = checkRedundantCd(command, process.cwd());
  if (result.block) {
    process.stderr.write(result.reason ?? "Blocked");
    process.exit(2);
  }

  process.exit(0);
}

main().catch((err: unknown) => {
  process.stderr.write(String(err));
  process.exit(1);
});
