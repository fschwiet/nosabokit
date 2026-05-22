import { build } from "esbuild";

const hooks = ["check-backslash-paths", "check-redundant-cd"];

for (const hook of hooks) {
  await build({
    entryPoints: [`src/hooks/${hook}.ts`],
    outfile: `dist/hooks/${hook}.js`,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    sourcemap: false,
  });
}

console.log("Build complete: dist/hooks/");
