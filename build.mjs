// Builds the Spicetify custom app into dist/.
//   node build.mjs           production build (minified)
//   node build.mjs --watch   rebuild on change (with source maps)
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import esbuild from "esbuild";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const watch = process.argv.includes("--watch");

function copyStatic() {
  mkdirSync("dist", { recursive: true });
  copyFileSync("manifest.json", "dist/manifest.json");
  copyFileSync("src/style.css", "dist/style.css");
}

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/index.tsx"],
  outfile: "dist/index.js",
  bundle: true,
  format: "iife",
  // Spicetify calls the global render() of a custom app.
  globalName: "PlattenspielerApp",
  footer: { js: "var render = PlattenspielerApp.render;" },
  target: ["chrome100"],
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  legalComments: "none",
  define: { __VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    {
      name: "copy-static",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length) return;
          copyStatic();
          console.log(`Built v${pkg.version} at ${new Date().toLocaleTimeString()}`);
        });
      },
    },
  ],
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(options);
}
