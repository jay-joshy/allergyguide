import { execSync } from 'child_process';

// Get git commit hash
const commit_hash = execSync('git rev-parse --short HEAD').toString().trim();
console.log(`Building with commit hash: ${commit_hash}`);

// DEFINES
const defines = [
  `--define:import.meta.vitest=undefined`,
  `--define:__COMMIT_HASH__='${JSON.stringify(commit_hash)}'`
].join(' ');

// ENTRY POINTS
// Format: "OutputFileName=InputSourceFile"
// Creates static/js/{OutputFileName}.js
// example for single TS file: `tabs=static/ts/tabs.ts`
// example for TS folder proj: `oit_calculator=static/ts/oit_calculator/main.ts`
const entryPoints = [
  "oit_calculator=static/ts/oit_calculator/main.ts",
].join(' ');

// esbuild command 
const command = `esbuild ${entryPoints} --bundle --outdir=static/js/ --format=esm --splitting --target=es2022 --minify --sourcemap --chunk-names=chunks/[name]-[hash] ${defines}`;

// Run
try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.log("build.mjs failed:", error)
  process.exit(1);
}
