# OIT Calculator Architecture

## Directory Structure

```text
oit_calculator/
├── main.ts                 # entry point: initializes appstate and delegates setup 
├── constants.ts            # configuration 
├── types.ts                # shared interfaces and enums
├── utils.ts                # generic helpers (formatting, escaping)
├── core/                   # pure logic (should not alter any global state or DOM)
│   ├── calculator.ts       # math for dilutions and step generation
│   ├── protocol.ts         # protocol manipulation 
│   ├── validator.ts        # red/yellow rule checking
│   └── search.ts           # fuzzy search 
├── state/                  
│   ├── appstate.ts         # immutable global app config (loaded data)
│   ├── protocolstate.ts    # observable state container for active protocol
│   └── instances.ts        # singleton instances that can be shared amongst other modules
├── data/
│   └── loader.ts           # json fetching and parsing
├── export/                 
│   └── exports.ts          # pdf (jspdf) and ascii generation logic
├── tests/                  
│   └── core/               
└── ui/                     
    ├── renderers.ts        # big renderer etc needs to be broken up
    ├── events.ts           # controller layer: most (not all) global event delegation + inputs
    ├── actions.ts          # bit of glue with logic connecting ui to state, mainly search / selection of foods/protocols
    ├── searchui.ts         # search input events, dropdown rendering
    ├── modals.ts           # clickwrap, modal logic
    └── exports.ts          # export ui
```

## Patterns

### Unidirectional Data Flow

1. **Event:** DOM interaction (ie input)
2. **Delegate:** `ui/events.ts` (or specific UI modules) catches the event that bubbles up
3. **Action:** a handler calls a 'pure' func from `core/protocol.ts` to calculate _new_ protocol data
4. **State Update:** new object is passed to `protocolState.setProtocol()`
5. **Notify:** `ProtocolState` notifies subscribers (Renderers)
6. **Render:** `ui/renderers.ts` updates DOM to match new state

### HTML DOM Patching

- **Structure Check:** check if the DOM structure (number of rows, existence of settings blocks) matches state
- **Patching:** renderer iterates through elements and updates only changed values (attributes, text content, input values) using `patch*` methods
- **Rebuild:** `innerHTML` full HTML replacement is triggered when the structure changes (ie, adding a step, switching food types)

### Event Delegation and Initialization

- Listeners are attached once to container elements (`.food-a-container`, `.output-container table`) via `initGlobalEvents`
- Specific feature listeners (Search, Export) are initialized in their respective modules (`initSearchEvents`, `initExportEvents`) called by `main.ts`
- Input events use **Debouncing** (150ms-300ms) to prevent excessive recalculations

## Known Issues / Design Decisions

- **Clear Button Behavior:** "Clear Food B" button is destructive and resets steps that were converted to Food B back to Food A steps (recalculating based on Food A settings); ? in future make it so that if steps are deleted and the food B is cleared, that the number of steps / targetMgs are preserved?

## Roadmap

- Unit testing flush out
- Undo redo (helpful for user + also tracking how protocol was made for debugging)
- UI refactor
- New warnings:
  - duplicate steps food X -> food X
- ? refresh button
