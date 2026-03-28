import esbuild from "esbuild";
import process from "process";

const isProduction = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  outfile: "main.js",
  format: "cjs",
  target: "es2018",
  platform: "browser",
  sourcemap: isProduction ? false : "inline",
  minify: isProduction,
  logLevel: "info",
  treeShaking: true,
});

if (isProduction) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
