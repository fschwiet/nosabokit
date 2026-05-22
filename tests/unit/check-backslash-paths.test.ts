import { describe, it, expect } from "vitest";
import { checkBackslashPaths } from "../../src/lib/check-backslash-paths";

describe("checkBackslashPaths", () => {
  it("blocks a command with a Windows drive-letter backslash path", () => {
    const result = checkBackslashPaths("ls C:\\Users\\name");
    expect(result.block).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it("blocks a command with a different drive letter", () => {
    const result = checkBackslashPaths("cat D:\\Projects\\app\\file.txt");
    expect(result.block).toBe(true);
  });

  it("includes helpful message about forward slashes", () => {
    const result = checkBackslashPaths("ls C:\\Users\\name");
    expect(result.reason).toContain("forward slashes");
  });

  it("allows a command containing a heredoc even with backslashes", () => {
    const result = checkBackslashPaths("cat << 'EOF'\nC:\\Users\\name\nEOF");
    expect(result.block).toBe(false);
  });

  it("allows a command with forward-slash paths only", () => {
    const result = checkBackslashPaths("ls C:/Users/name");
    expect(result.block).toBe(false);
  });

  it("allows an empty command", () => {
    const result = checkBackslashPaths("");
    expect(result.block).toBe(false);
  });

  it("does not block when digit follows backslash (not a letter)", () => {
    // Pattern requires [A-Za-z] after the backslash
    const result = checkBackslashPaths("echo C:\\1digit");
    expect(result.block).toBe(false);
  });

  it("blocks regardless of surrounding context", () => {
    const result = checkBackslashPaths("cd C:\\code\\project && npm test");
    expect(result.block).toBe(true);
  });
});
