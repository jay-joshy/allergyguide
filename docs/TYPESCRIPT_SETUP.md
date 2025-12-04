# TypeScript Architecture & Setup

For certain shortcodes, we use **TypeScript** and **esbuild** instead of writing vanilla JS.

`tsconfig.json` exists in root.

## Directory Structure

```text
static/
├── ts/                        
│   ├── tabs.ts                # Standalone script 
│   └── oit_calculator/        # Complex Project 
│       ├── main.ts            # Entry point 
│       └── blah.ts            # other code
│
└── js/                        # output (where shortcodes look)
    ├── tabs.js                # Generated from navbar_toggle.ts
    ├── oit_calculator.js      # Generated from oit_calculator/main.ts
    └── chunks/                # Shared code (e.g. libraries used by multiple scripts)
        ├── chunk-A234.js
        └── ...
```

## Build System

- **Bundler**: `esbuild`
- **Glue**: `build.mjs`
- **Type Checking**: `tsc`

### `package.json` Scripts

```json
...,
"scripts": {
  "check:ts": "tsc --noEmit",
  "build:ts": "npm run check:ts && node build.mjs"
},
...
```

### `build.mjs` Configuration

To compile a TypeScript file, it must be explicitly listed in the `entryPoints` array within `build.mjs`.

```mjs
// ENTRY POINTS
// Format: "OutputFileName=InputSourceFile"
// Creates static/js/{OutputFileName}.js
// example for single TS file: `tabs=static/ts/tabs.ts`
// example for TS folder proj: `oit_calculator=static/ts/oit_calculator/main.ts`
const entryPoints = [
  "oit_calculator=static/ts/oit_calculator/main.ts",
].join(' ');
```

## Workflow: Adding New TS Code

Of note, `netlify.toml` contains a build command for the site that will generate the JS code:

```toml
command = "npm run build -- '--base-url /' || (npm ci && npm run abridge -- '--base-url /')"
```

So when you run `npm run build:ts` locally, don't commit the JS. It's not bad if you do but a bit of a waste of time.

### Scenario A: Adding a Simple Script (e.g., a Toggle)

Assumes you have a shortcode file already that references the script in `/js`

1. **Create File**: Create `static/ts/my_script.ts`.
2. **Add to `build.mjs`**: add `"my_script=static/ts/my_script.ts"` to the `entryPoints` array.
3. **Build**: Run `npm run build:ts`, and then test the code (zola build, zola serve, etc.)

### Scenario B: Adding a more complex tool

1. **Create Folder**: Create `static/ts/proj_name/`.
2. **Create Entry**: Create `static/ts/proj_name/main.ts`.
3. **Add Modules**: Add other files (`types.ts`, `logic.ts`).
4. **Add to `build.mjs`**: Add `"proj_name=static/ts/proj_name/main.ts"` to `entryPoints`.
5. **Build**: Run `npm run build:ts`.
   - _Note:_ Only `main.ts` becomes a JS file. The helper files are bundled inside it.

## Dependencies

### Runtime Dependencies

Dependencies are installed via `npm` and bundled automatically by esbuild. Code splitting is enabled, so if two projects use the same library (e.g., `decimal.js`), it will be extracted into a shared chunk in `static/js/chunks/` to avoid duplication.

### Dev Dependencies

- `typescript`
- `esbuild`
- `@types/node`

E.g. `npm install --save-dev esbuild typescript`
