import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as esbuild from 'esbuild';

// Get git commit hash
let commit_hash;
try {
  commit_hash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.error("Failed to find commit_hash", error)
  process.exit(1);
}

// Get tools versioning
if (!existsSync('./tools_versioning.json')) {
  console.error("tools_versioning.json not found");
  process.exit(1);
}
const toolVersioning = JSON.parse(readFileSync('./tools_versioning.json', 'utf-8'));

// ENTRY POINTS
const entryPoints = {};

// DEFINES
const define = {
  'import.meta.vitest': 'undefined',
  '__COMMIT_HASH__': JSON.stringify(commit_hash)
};

// Helper to track output filenames for Zola
const zolaData = {};

Object.keys(toolVersioning).forEach(toolName => {
  const version = toolVersioning[toolName];

  // Define a version constant specific to this tool (needed if want to access from JS/TS)
  define[`__VERSION_${toolName.toUpperCase()}__`] = JSON.stringify(version);

  // find TS script paths
  // either standalone ${toolName}.ts within ts/, or ts/${toolName}/main.ts
  // Assumes ts/ is at root
  let inputPath;
  if (existsSync(`ts/${toolName}/main.ts`)) {
    inputPath = `ts/${toolName}/main.ts`;
  }
  else if (existsSync(`ts/${toolName}.ts`)) {
    inputPath = `ts/${toolName}.ts`;
  }
  else {
    console.error(`Error: No source for ${toolName} in ts/`);
    process.exit(1);
  }

  // Output filename key example: oit_calculator.0.8.0-a1213b2c.js
  const outputName = `${toolName}.${version}-${commit_hash}`;
  // Map Output Name -> Input Path
  entryPoints[outputName] = inputPath;

  // Save for Zola
  zolaData[toolName] = {
    version: version,
    file: `${toolName}.${version}-${commit_hash}.js`, // filename for Zola to use
    hash: commit_hash
  };
});

// Run
try {
  console.log(`Building with commit hash: ${commit_hash}`);
  await esbuild.build({
    entryPoints: entryPoints,
    bundle: true,
    outdir: 'static/js/',
    format: 'esm',
    splitting: true,
    target: 'es2022',
    minify: true,
    sourcemap: true,
    chunkNames: 'chunks/[name]-[hash]',
    define: define,
    logLevel: 'info',
  })

  console.log("Tool versions built:", JSON.stringify(toolVersioning));
  // write data for Zola to pick up with internal shortcode
  writeFileSync('./static/js/tools_versioning.json', JSON.stringify(zolaData, null, 2));
  console.log("Created static/tools_versioning.json for Zola");
} catch (error) {
  console.error("build.mjs failed:", error)
  process.exit(1);
}
