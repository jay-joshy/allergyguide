# TypeScript Setup for OIT Calculator

This document describes the TypeScript setup for the OIT Calculator tool in this Zola static site.

## Overview

The project uses TypeScript with bundling to get full type safety and modern development features while maintaining compatibility with the Zola static site generator.

## Architecture

- **Source**: TypeScript files in `static/ts/`
- **Output**: Bundled JavaScript in `static/js/`
- **Bundler**: esbuild (fast, minimal configuration)
- **Type Checking**: TypeScript compiler (tsc)

## Dependencies

### Runtime Dependencies (Bundled)
- `decimal.js` - High-precision decimal arithmetic
- `fuzzysort` - Fuzzy search for food/protocol lookup

### CDN Dependencies (Not Bundled)
- `jspdf` - PDF generation (loaded from CDN in HTML)
- `jspdf-autotable` - Table plugin for jsPDF (loaded from CDN in HTML)
- `ascii-table` - ASCII table generation (loaded from CDN in HTML)

### Dev Dependencies
- `typescript` - Type checking
- `esbuild` - Fast bundler
- `jspdf` - Installed as dev dependency for type definitions only (not bundled)

## Configuration Files

### `tsconfig.json`
Located in the project root. Configures TypeScript compiler options:
- Target: ES2017
- Strict type checking enabled
- Output directory: `static/js/`
- Source directory: `static/ts/`

### `package.json` Build Script
```json
"build": "esbuild static/ts/oit_calculator.ts --bundle --outfile=static/js/oit_calculator.js --format=iife --target=es2017 --minify --external:jspdf --external:jspdf-autotable"
```

The `--external` flags tell esbuild not to bundle jsPDF packages, as they're loaded from CDN.

## Development Workflow

### 1. Make changes to TypeScript source
Edit files in `static/ts/oit_calculator.ts`

### 2. Type check (optional but recommended)
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
- Excludes jsPDF (loaded from CDN)
- Minifies the output
- Outputs to `static/js/oit_calculator.js` (~75KB)

### 4. Test in browser
Open your Zola site and test the OIT calculator functionality.

## Type Safety Benefits

### Before (Using CDNs with `declare const`)
```typescript
declare const Decimal: any;
declare const fuzzysort: any;
// No autocomplete, no type checking
```

### After (Using proper imports and type definitions)
```typescript
import Decimal from "decimal.js";
import fuzzysort from "fuzzysort";
// jsPDF types available via global type definitions
// Full autocomplete and type checking for all!
```

## Import Patterns

### Bundled npm packages
```typescript
import Decimal from "decimal.js";
import fuzzysort from "fuzzysort";
```

### CDN-loaded packages with type definitions
jsPDF and AsciiTable are loaded via CDN but have type definitions in `static/ts/types/cdn-globals.d.ts`:

```typescript
// types/cdn-globals.d.ts
import type { jsPDF as jsPDFType } from 'jspdf';

declare global {
  const jsPDF: {
    jsPDF: typeof jsPDFType;
  };
  const AsciiTable: any;
}
```

This gives you type checking for CDN-loaded libraries without bundling them.

## Type Workarounds

Some jsPDF functionality isn't fully typed in the type definitions:

```typescript
// Create jsPDF instance from CDN global
const doc = new jsPDF.jsPDF({ unit: "pt", format: "letter" });

// autoTable is added by jspdf-autotable plugin but not in types
(doc as any).autoTable({...});

// lastAutoTable is runtime property
yPosition = (doc as any).lastAutoTable.finalY + 20;

// internal is not fully typed
const pageCount = (doc as any).internal.getNumberOfPages();
```

These `as any` casts are necessary due to incomplete type definitions for the jsPDF plugins.

## Build Output

The bundled file includes:
- All TypeScript code compiled to JavaScript
- Bundled npm dependencies (Decimal.js, fuzzysort)
- Minified for production
- IIFE format (works in browsers without module system)

**Size**: ~75KB minified (jsPDF loaded separately from CDN)

## HTML Integration

The HTML template loads (in order):
1. AsciiTable from CDN
2. jsPDF from CDN
3. jspdf-autotable from CDN
4. The bundled JavaScript file

```html
<!-- CDN libraries -->
<script src="https://cdn.jsdelivr.net/npm/ascii-table@0.0.9/ascii-table.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/5.0.2/jspdf.plugin.autotable.min.js"></script>

<!-- Bundled application code -->
<script src="/js/oit_calculator.js"></script>
```

**Why use CDN for jsPDF?**
- Reduces bundle size significantly (75KB vs 896KB)
- jsPDF is cached separately by browsers
- Still get full type checking via dev dependency

## Adding New Dependencies

### To Bundle a Dependency

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

### To Use a CDN Dependency (with types)

1. Add the `<script>` tag to HTML template
2. Install package as dev dependency for types:
```bash
npm install --save-dev package-name
```

3. Create type definitions in `static/ts/types/cdn-globals.d.ts`:
```typescript
import type { SomeType } from 'package-name';

declare global {
  const PackageName: typeof SomeType;
}
```

4. Add `--external:package-name` to build script in package.json
5. Rebuild:
```bash
npm run build
```

## Troubleshooting

### Type errors during build
Run type checking separately to see detailed errors:
```bash
npx tsc --noEmit
```

### Bundle size too large
- Check if you're importing unnecessary dependencies
- Consider code splitting if needed
- Use `--analyze` flag with esbuild to see what's included

### Runtime errors after build
- Check browser console for errors
- Verify all CDN scripts are loaded before your bundle
- Make sure `AsciiTable` is available globally

## Migration from Manual Compilation

**Old workflow**:
```bash
tsc static/ts/oit_calculator.ts --target ES2017 --lib ES2017,DOM --outDir static/js --skipLibCheck
```

**New workflow**:
```bash
npm run build
```

**Benefits**:
- ✅ Full type checking (no `--skipLibCheck`)
- ✅ Critical dependencies bundled (Decimal.js, fuzzysort)
- ✅ Smaller bundle size (75KB vs 896KB)
- ✅ jsPDF cached separately by browser
- ✅ Version control for dependencies
- ✅ Autocomplete in editor for all libraries

## CI/CD Integration

Add to your build process:
```bash
npm install
npm run build
# Then run Zola build
```

## Future Improvements

1. **Add watch mode for development**:
   ```json
   "dev": "esbuild static/ts/oit_calculator.ts --bundle --outfile=static/js/oit_calculator.js --format=iife --target=es2017 --watch"
   ```

2. **Bundle CDN dependencies** (if preferred):
   - Remove `--external:package-name` from build script
   - Move package from devDependencies to dependencies
   - Remove CDN script tag from HTML
   - Import normally in TypeScript
   - Note: This will increase bundle size

3. **Add source maps** for easier debugging:
   ```bash
   --sourcemap
   ```

4. **Split bundles** if file gets too large (vendor vs app code)