import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..", "..");

describe("plugin.json", () => {
  const raw = readFileSync(join(ROOT, ".claude-plugin", "plugin.json"), "utf-8");
  const manifest = JSON.parse(raw) as Record<string, unknown>;

  it("has required name field", () => {
    expect(typeof manifest.name).toBe("string");
    expect((manifest.name as string).length).toBeGreaterThan(0);
  });

  it("has required version field", () => {
    expect(typeof manifest.version).toBe("string");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("has required description field", () => {
    expect(typeof manifest.description).toBe("string");
    expect((manifest.description as string).length).toBeGreaterThan(0);
  });
});

describe("marketplace.json", () => {
  const raw = readFileSync(join(ROOT, ".claude-plugin", "marketplace.json"), "utf-8");
  const catalog = JSON.parse(raw) as Record<string, unknown>;

  it("has required name field", () => {
    expect(typeof catalog.name).toBe("string");
    expect((catalog.name as string).length).toBeGreaterThan(0);
  });

  it("has plugins array with at least one entry", () => {
    expect(Array.isArray(catalog.plugins)).toBe(true);
    expect((catalog.plugins as unknown[]).length).toBeGreaterThan(0);
  });

  it("each plugin entry has name and source", () => {
    for (const plugin of catalog.plugins as Record<string, unknown>[]) {
      expect(typeof plugin.name).toBe("string");
      expect(typeof plugin.source).not.toBe("undefined");
    }
  });
});

describe("hooks/hooks.json", () => {
  const raw = readFileSync(join(ROOT, "hooks", "hooks.json"), "utf-8");
  const config = JSON.parse(raw) as {
    hooks: {
      PreToolUse: Array<{ matcher: string; hooks: Array<{ type: string; command: string }> }>;
    };
  };

  it("has PreToolUse hooks for Bash", () => {
    const preToolUse = config.hooks.PreToolUse;
    expect(Array.isArray(preToolUse)).toBe(true);
    const bashEntry = preToolUse.find((e) => e.matcher === "Bash");
    expect(bashEntry).toBeDefined();
  });

  it("registers check-backslash-paths for Bash", () => {
    const bashEntry = config.hooks.PreToolUse.find((e) => e.matcher === "Bash");
    expect(bashEntry?.hooks).toHaveLength(1);
    const commands = bashEntry!.hooks.map((h) => h.command);
    expect(commands.some((c) => c.includes("check-backslash-paths"))).toBe(true);
  });

  it("registers check-redundant-cd for Bash|PowerShell", () => {
    const entry = config.hooks.PreToolUse.find((e) => e.matcher === "Bash|PowerShell");
    expect(entry).toBeDefined();
    expect(entry?.hooks).toHaveLength(1);
    const commands = entry!.hooks.map((h) => h.command);
    expect(commands.some((c) => c.includes("check-redundant-cd"))).toBe(true);
  });
});
