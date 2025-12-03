import { execSync } from 'child_process';

// Get git commit hash
const commit_hash = execSync('git rev-parse --short HEAD').toString().trim();
console.log(`Building with commit hash: ${commit_hash}`);

// esbuild command with the define flag
const command = `esbuild static/ts/**/*.ts --bundle --outdir=static/js/ --format=esm --splitting --target=es2022 --minify --chunk-names=chunks/[name]-[hash] --define:import.meta.vitest=undefined --define:__COMMIT_HASH__='${JSON.stringify(commit_hash)}'`

// Run
execSync(command, { stdio: 'inherit' });
