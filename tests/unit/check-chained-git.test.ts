import { describe, it, expect } from "vitest";
import { checkChainedGit } from "../../src/lib/check-chained-git";

describe("checkChainedGit", () => {
  // Scenario 1: two git commands — blocked
  it("blocks two chained git commands and names both subcommands", () => {
    const result = checkChainedGit('git add file.ts && git commit -m "test: add E2E tests"');
    expect(result.block).toBe(true);
    expect(result.reason).toContain("2 git commands");
    expect(result.reason).toContain('"add" and "commit"');
    expect(result.reason).toContain("<command>git add file.ts</command>");
    expect(result.reason).toContain('<command>git commit -m "test: add E2E tests"</command>');
  });

  // Scenario 2: three git commands — blocked
  it("blocks three chained git commands and names all subcommands with Oxford comma", () => {
    const result = checkChainedGit("git fetch && git rebase origin/main && git push");
    expect(result.block).toBe(true);
    expect(result.reason).toContain("3 git commands");
    expect(result.reason).toContain('"fetch", "rebase", and "push"');
    expect(result.reason).toContain("<command>git fetch</command>");
    expect(result.reason).toContain("<command>git rebase origin/main</command>");
    expect(result.reason).toContain("<command>git push</command>");
  });

  // Scenario 3: does not start with "git " — allowed
  it('allows a command that does not start with "git "', () => {
    const result = checkChainedGit('echo "done" && git push');
    expect(result.block).toBe(false);
  });

  // Scenario 4: no "&& git " substring — allowed
  it('allows a git command with no "&& git " pattern', () => {
    const result = checkChainedGit('git push && echo "done"');
    expect(result.block).toBe(false);
  });

  // Scenario 5: non-git tail preserved unsplit
  it("preserves non-git tail in second command entry unsplit", () => {
    const result = checkChainedGit('git add file.ts && git commit -m "message" && npm run test');
    expect(result.block).toBe(true);
    expect(result.reason).toContain("2 git commands");
    expect(result.reason).toContain("<command>git add file.ts</command>");
    expect(result.reason).toContain('<command>git commit -m "message" && npm run test</command>');
  });

  // Scenario 6: newline in commit message stops further splitting
  it("stops splitting at a segment containing a newline and emits as final entry", () => {
    const cmd =
      'git add file.ts && git commit -m "test: add Playwright E2E config and app smoke\n    test"';
    const result = checkChainedGit(cmd);
    expect(result.block).toBe(true);
    expect(result.reason).toContain("2 git commands");
    expect(result.reason).toContain("<command>git add file.ts</command>");
    expect(result.reason).toContain(
      '<command>git commit -m "test: add Playwright E2E config and app smoke\n    test"</command>',
    );
  });

  // Edge: single git command — allowed
  it("allows a single git command with no chaining", () => {
    const result = checkChainedGit("git status");
    expect(result.block).toBe(false);
  });

  // Edge: empty string — allowed
  it("allows an empty command string", () => {
    const result = checkChainedGit("");
    expect(result.block).toBe(false);
  });

  // Structural: block reason includes preamble and suggestion lines
  it("includes all three message lines in the block reason", () => {
    const result = checkChainedGit("git add . && git commit -m msg");
    expect(result.reason).toContain(
      "Run git commands separately to avoid causing extra permission checks.",
    );
    expect(result.reason).toContain("Could you run them separately, perhaps as the following?");
  });
});
