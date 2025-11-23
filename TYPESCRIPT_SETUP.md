# TypeScript Setup for OIT Calculator

## Architecture

- **Source**: TypeScript files in `static/ts/`
- **Output**: Bundled JavaScript in `static/js/`
- **Bundler**: esbuild (fast, minimal configuration)
- **Type Checking**: TypeScript compiler (tsc)

## Dependencies

### Runtime Dependencies (Bundled)

- `decimal.js` - High-precision decimal arithmetic
- `fuzzysort` - Fuzzy search for food/protocol lookup
- `ascii-table3` - ASCII table generation
- `jspdf` - PDF generation
- `jspdf-autotable`

### Dev Dependencies

- `typescript` - Type checking
- `esbuild` - Fast bundler

`npm install --save-dev esbuild typescript`

## Configuration Files

### `tsconfig.json`

Located in the project root. Configures TypeScript compiler options:

- Target: ES2017
- Strict type checking enabled
- Output directory: `static/js/`
- Source directory: `static/ts/`

### `package.json` Build Script

```json
"build": "esbuild static/ts/oit_calculator.ts --bundle --outfile=static/js/oit_calculator.js --format=iife --target=es2017 --minify"
```

## Development Workflow

### 1. Make changes to TypeScript source

Edit files in `static/ts/oit_calculator.ts`

### 2. Type check

```bash
npx tsc --noEmit
```

This checks for type errors without generating output files.

### 3. Build the bundle

```bash
npm run build
```

This:

- Bundles TypeScript and bundled dependencies (Decimal.js, fuzzysort)
- Excludes jsPDF AsciiTable and autoTable (loaded from CDN)
- Minifies the output
- Outputs to `static/js/oit_calculator.js`

## Adding New Dependencies

### To Bundle a runtime dependency

1. Install the package:

```bash
npm install package-name
```

2. Import in TypeScript:

```typescript
import something from "package-name";
```

3. Rebuild:

```bash
npm run build
```

The dependency will automatically be bundled into the output file.

## Migration from Manual Compilation

**Old workflow**:

```bash
tsc static/ts/oit_calculator.ts --target ES2017 --lib ES2017,DOM --outDir static/js --skipLibCheck
```

**New workflow**:

```bash
npm run build
```
