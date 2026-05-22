import { describe, it, expect } from "vitest";
import { checkRedundantCd } from "../../src/lib/check-redundant-cd";

describe("checkRedundantCd", () => {
  it("blocks when cd target matches cwd", () => {
    const result = checkRedundantCd("cd /code/project && npm test", "/code/project");
    expect(result.block).toBe(true);
  });

  it("includes the remaining command in the block reason", () => {
    const result = checkRedundantCd("cd /code/project && npm test", "/code/project");
    expect(result.reason).toContain("npm test");
  });

  it("includes the cwd in the block reason", () => {
    const result = checkRedundantCd("cd /code/project && git status", "/code/project");
    expect(result.reason).toContain("/code/project");
  });

  it("allows when cd target is a different directory", () => {
    const result = checkRedundantCd("cd /other/path && git status", "/code/project");
    expect(result.block).toBe(false);
  });

  it("allows a plain command with no cd prefix", () => {
    const result = checkRedundantCd("git status", "/code/project");
    expect(result.block).toBe(false);
  });

  it("blocks when the path is quoted and matches cwd", () => {
    const result = checkRedundantCd('cd "/code/project" && npm test', "/code/project");
    expect(result.block).toBe(true);
  });

  it("blocks when cd target has trailing slash (normalized)", () => {
    const result = checkRedundantCd("cd /code/project/ && npm test", "/code/project");
    expect(result.block).toBe(true);
  });

  it("blocks Windows-style forward-slash paths that match cwd", () => {
    const result = checkRedundantCd("cd C:/code/project && npm test", "C:/code/project");
    expect(result.block).toBe(true);
  });

  it("allows an empty command", () => {
    const result = checkRedundantCd("", "/code/project");
    expect(result.block).toBe(false);
  });
});
