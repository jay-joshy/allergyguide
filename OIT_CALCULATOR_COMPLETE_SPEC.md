# OIT Calculator - Complete Technical Specification

**Purpose:** Comprehensive specification for OIT (Oral Immunotherapy) Calculator web tool

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Project Structure](#project-structure)
4. [Technical Stack](#technical-stack)
5. [Data Models](#data-models)
6. [Core Algorithms](#core-algorithms)
7. [User Interface Specification](#user-interface-specification)
8. [Functional Requirements](#functional-requirements)
9. [Validation System](#validation-system)
10. [Export Features](#export-features)
11. [Data Files](#data-files)
12. [Compilation & Deployment](#compilation--deployment)
13. [Testing Criteria](#testing-criteria)
14. [Future Enhancements](#future-enhancements)

---

## 1. Executive Summary

The OIT Calculator is a TypeScript-based web application designed to help generate safe, customizable oral immunotherapy protocols for food allergies. The tool automatically calculates dilution parameters, manages Food A → Food B transitions, validates protocols for safety, and exports formatted text.

**Key Capabilities:**

- Generate protocols with 3 dosing strategies
- Automatic dilution calculations for unmeasurable doses
- Support for solid and liquid foods
- Food A → Food B transitions at configurable thresholds
- Real-time validation with color-coded warnings
- Editable protocol tables
- ASCII export to clipboard

---

## 2. System Overview

### 2.1 Purpose

Oral immunotherapy involves gradually increasing exposure to allergenic foods to build tolerance. The calculator helps clinicians:

1. Easily select appropriate foods and protein concentrations
2. Choose dosing strategies based on patient risk
3. Calculate dilutions when doses are too small to measure
4. Transition from processed forms (e.g., powder) to whole foods
5. Validate protocols for safety issues
6. Export protocols for patient charts
7. Easy customization of protocol tables

### 2.2 Core Concepts

**Dosing Strategies:**

- **Standard** (11 steps): [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300] mg
- **Slow** (19 steps): [0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300] mg
- **Rapid** (9 steps): [1, 2.5, 5, 10, 20, 40, 80, 160, 300] mg

**Dilution Methods:**

- **DILUTE**: Mix food with water to achieve measurable doses
- **DIRECT**: Patient consumes food directly (neat/undiluted)

**Food A Strategy** (how long to dilute):

- **DILUTE_INITIAL**: Dilute until doses become measurable, then switch to direct. This is the most common strategy for Food A.
- **DILUTE_ALL**: Dilute throughout entire protocol
- **DILUTE_NONE**: Never dilute, always direct dosing

**Food Types:**

- **SOLID**: Measured in grams (g) - e.g., peanut powder, whole peanuts
- **LIQUID**: Measured in milliliters (ml) - e.g., milk, liquid egg

### 2.3 Workflow

```
1. User searches for Food A (or loads protocol template). Defaults for dilution strategy, threshold, and dosing strategy are set and table is rendered.
2. User can configure Food A settings:
   - Food name
   - Protein concentration (in the UI, expressed as g of protein per 100 grams or ml serving size of food)
   - Food type (solid/liquid)
   - Dilution strategy (initial/all/none)
   - Dilution threshold (when to stop diluting)
3. [Optional] User adds Food B for transition:
   - Search for Food B
   - Once selected, table is re-rendered with a default transition threshold (this is editable)
4. User can edit dosing strategy (Standard/Slow/Rapid). Standard dosing is default
5. System generates protocol table with validation
6. User reviews warnings and edits as needed
7. User exports protocol to clipboard
```

---

## 3. Project Structure

```
allergyguide/
├── templates/shortcodes/
│   └── oit_calculator.html          # Zola shortcode template (HTML structure)
│
├── static/
│   ├── ts/
│   │   └── oit_calculator.ts        # TypeScript source
│   │
│   ├── js/
│   │   ├── oit_calculator.js        # Compiled JavaScript
│   │   └── decimal.js               # Decimal.js library (dependency)
│   │
│   └── tool_assets/
│       ├── typed_foods_rough.json   # Food database (~500 foods)
│       └── oit_protocols.json       # Pre-built protocol templates
│
├── sass/shortcodes/
│   └── _oit_calculator.scss         # Styling with dark/light modes
│
├── content/tools/
│   └── oit_calculator.md            # Page that embeds calculator
│
└── Documentation files:
    ├── OIT_CALCULATOR_COMPLETE_SPEC.md  # This file
    └── OIT_CALCULATOR_README.md         # lay reference
```

---

## 4. Technical Stack

### 4.1 Languages & Frameworks

- **TypeScript**: Source language (ES2017 target)
- **JavaScript**: Runtime language (ES2017+)
- **HTML5**: Structure
- **SCSS**: Styling with CSS custom properties
- **Zola**: Static site generator (templating)

### 4.2 Dependencies

**Required:**

1. **Decimal.js** (v10.4.3+)
   - Purpose: Arbitrary-precision decimal arithmetic
   - Why: Prevents floating-point errors in dose calculations (safety critical)
   - Location: `/static/js/decimal.js`
   - Example: `0.1 + 0.2 = 0.3` (not 0.30000000000000004)

2. **fuzzysort** (v3.1.0+)
   - Purpose: Fast fuzzy string matching for search
   - Why: Powers food/protocol search dropdown
   - Location: CDN (https://cdn.jsdelivr.net/npm/fuzzysort@3.1.0/fuzzysort.min.js)

**TypeScript Compiler:**

- Version: 3.0+
- No `tsconfig.json` required (uses CLI flags)

### 4.3 Browser Support

- **Minimum:** ES2017 support
- **Chrome:** 58+
- **Firefox:** 52+
- **Safari:** 10.1+
- **Edge:** 79+
- **IE11:** Not supported

---

## 5. Data Models

### 5.1 TypeScript Interfaces & Enums

```typescript
// ============================================
// ENUMS
// ============================================

enum DosingStrategy {
  STANDARD = "STANDARD", // 11 steps
  SLOW = "SLOW", // 19 steps
  RAPID = "RAPID", // 9 steps
}

enum FoodType {
  SOLID = "SOLID", // Measured in grams (g)
  LIQUID = "LIQUID", // Measured in milliliters (ml)
}

enum Method {
  DILUTE = "DILUTE", // Mix food with water
  DIRECT = "DIRECT", // Consume food neat/undiluted
}

enum FoodAStrategy {
  DILUTE_INITIAL = "DILUTE_INITIAL", // Dilute until measurable
  DILUTE_ALL = "DILUTE_ALL", // Dilute entire protocol
  DILUTE_NONE = "DILUTE_NONE", // Never dilute
}

// ============================================
// TYPE ALIASES
// ============================================

type Unit = "g" | "ml"; // Grams or milliliters

// ============================================
// INTERFACES
// ============================================

interface Food {
  name: string; // e.g., "Peanut Powder"
  type: FoodType; // SOLID or LIQUID
  mgPerUnit: Decimal; // Protein concentration (mg/g or mg/ml)
}

interface Step {
  stepIndex: number; // 1-based step number
  targetMg: Decimal; // Target protein dose (mg)
  method: Method; // DILUTE or DIRECT
  dailyAmount: Decimal; // Amount patient consumes daily
  dailyAmountUnit: Unit; // "g" or "ml"
  mixFoodAmount?: Decimal; // Food amount in mixture (for DILUTE only)
  mixWaterAmount?: Decimal; // Water amount in mixture (for DILUTE only)
  servings?: Decimal; // Number of servings mixture provides
}

interface ProtocolConfig {
  minMeasurableMass: Decimal; // Minimum scale can measure (g). Usually we say 0.2g, easy for parents.
  minMeasurableVolume: Decimal; // Minimum syringe can measure (ml). Usually we say 0.5ml, easy for parents with small syringe.
  minServingsForMix: Decimal; // Minimum servings per mixture
}

interface Protocol {
  dosingStrategy: DosingStrategy; // STANDARD/SLOW/RAPID
  foodA: Food; // Primary food
  foodAStrategy: FoodAStrategy; // When to dilute Food A
  diThreshold: Decimal; // When to stop diluting Food A (g or ml)
  foodB?: Food; // Optional second food
  foodBThreshold?: Decimal; // When to switch to Food B (g or ml)
  steps: Step[]; // Array of protocol steps
  config: ProtocolConfig; // Measurement constraints
}

interface Warning {
  severity: "red" | "yellow"; // Critical or caution
  code: string; // e.g., "R1", "Y2"
  message: string; // Human-readable description
  stepIndex?: number; // Optional step reference
}

interface Candidate {
  mixFoodAmount: Decimal; // Food amount for mixture (g or ml)
  mixWaterAmount: Decimal; // Water amount for mixture (ml)
  dailyAmount: Decimal; // Daily dose amount (ml)
  mixTotalVolume: Decimal; // Total mixture volume (ml)
  servings: Decimal; // Number of servings
}
```

### 5.2 Constants

```typescript
// Dosing strategy target protein values (mg)
const DOSING_STRATEGIES = {
  STANDARD: [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300],
  SLOW: [
    0.5,
    1,
    1.5,
    2.5,
    5,
    10,
    20,
    30,
    40,
    60,
    80,
    100,
    120,
    140,
    160,
    190,
    220,
    260,
    300,
  ],
  RAPID: [1, 2.5, 5, 10, 20, 40, 80, 160, 300],
};

// Dilution candidate values
const SOLID_MIX_CANDIDATES = [
  0.2,
  0.25,
  0.3,
  0.35,
  0.4,
  0.45,
  0.5,
  1,
  2,
  5,
  10,
]; // grams
const LIQUID_MIX_CANDIDATES = [0.5, 1, 2, 3, 4, 5, 10]; // ml
const DAILY_AMOUNT_CANDIDATES = [0.5, 1, 2, 3, 4, 5, 10]; // ml
const MAX_MIX_WATER = 250; // Maximum water in mixture (ml)

// Default configuration
const DEFAULT_CONFIG = {
  minMeasurableMass: new Decimal(0.2), // 0.2 g (scale resolution)
  minMeasurableVolume: new Decimal(0.5), // 0.5 ml (syringe resolution)
  minServingsForMix: new Decimal(3), // Minimum 3 servings per mix
};
```

### 5.3 Global State

```typescript
let currentProtocol: Protocol | null = null; // Active protocol
let foodsDatabase: FoodData[] = []; // Loaded food database
let protocolsDatabase: ProtocolData[] = []; // Loaded protocol templates
let fuzzySortPreparedFoods: any[] = []; // Preprocessed for search
let fuzzySortPreparedProtocols: any[] = []; // Preprocessed for search
```

---

## 6. Core Algorithms

### 6.1 Dilution Calculation Algorithm

**Purpose:** Calculate optimal dilution parameters for unmeasurable doses.

**Input:**

- `P`: Target protein (mg)
- `food`: Food object with protein concentration
- `config`: Measurement constraints

**Output:**

- Array of valid `Candidate` objects, ranked by optimality

**Algorithm:**

```
1. Determine candidate sets based on food type:
   - Solid: mixFoodCandidates = SOLID_MIX_CANDIDATES
   - Liquid: mixFoodCandidates = LIQUID_MIX_CANDIDATES
   - Both: dailyAmountCandidates = DAILY_AMOUNT_CANDIDATES

2. For each combination of (mixFoodAmount, dailyAmount):
   
   a. Calculate required protein in mixture:
      mixProteinMg = P / dailyAmount
   
   b. Calculate mixture total volume:
      - Solid: mixTotalVolume ≈ dailyAmount × servings (solid volume negligible)
      - Liquid: mixTotalVolume = mixFoodVolume + mixWaterVolume
   
   c. Calculate required water:
      mixWaterAmount = mixTotalVolume - mixFoodVolume
   
   d. Calculate servings:
      servings = mixTotalVolume / dailyAmount
   
   e. Validate constraints:
      - mixFoodAmount ≥ config.minMeasurableMass (or Volume)
      - dailyAmount ≥ config.minMeasurableVolume
      - mixWaterAmount ≤ MAX_MIX_WATER
      - mixWaterAmount ≥ config.minMeasurableVolume
      - servings ≥ config.minServingsForMix
      - Calculated protein matches target (within 0.5 mg)
   
   f. If valid, add to candidates array

3. Rank candidates by:
   - Primary: Smallest mixFoodAmount
   - Secondary: Smallest dailyAmount
   - Tertiary: Smallest mixTotalVolume

4. Return ranked candidates (best first)
```

**Special Case - Solid Dilutions:**
For solid foods in liquid, assume solid volume is negligible when solid:liquid ratio < 1:10. If this assumption is not met, emit warning, but do not exclude candidate:

- Mix total volume ≈ water volume
- Example: 0.2 g powder in 10 ml water ≈ 10 ml total

**Special Case - Liquid Dilutions:**
For liquid foods in water, volumes are additive:

- Mix total volume = food volume + water volume
- Example: 2 ml milk + 8 ml water = 10 ml total

### 6.2 Protocol Generation Algorithm

**Purpose:** Generate complete protocol from food and settings.

**Function:** `generateDefaultProtocol(food: Food, config: ProtocolConfig) -> Protocol`

**Algorithm:**

```
1. Get target protein values from selected dosing strategy:
   targetProteins = DOSING_STRATEGIES[currentProtocol.dosingStrategy]

2. For each target protein P:
   
   a. Calculate neat mass needed:
      neatMass = P / food.mgPerUnit
   
   b. Determine if dilution is needed:
      needsDilution = (neatMass < threshold) based on foodAStrategy
      
      - DILUTE_INITIAL: needsDilution if neatMass < diThreshold
      - DILUTE_ALL: always needsDilution = true
      - DILUTE_NONE: always needsDilution = false
   
   c. If needsDilution:
      - Call findDilutionCandidates(P, food, config)
      - Select best candidate
      - Create step with:
        * method = DILUTE
        * dailyAmount = candidate.dailyAmount
        * dailyAmountUnit = "ml"
        * mixFoodAmount = candidate.mixFoodAmount
        * mixWaterAmount = candidate.mixWaterAmount
        * servings = candidate.servings
   
   d. Else (direct dosing):
      - Create step with:
        * method = DIRECT
        * dailyAmount = neatMass
        * dailyAmountUnit = food type ("g" or "ml")
        * No mix parameters

3. Return Protocol object with all steps
```

### 6.3 Food B Addition Algorithm

**Purpose:** Add Food B transition to existing protocol.

**Function:** `addFoodBToProtocol(protocol: Protocol, foodB: Food, threshold: Decimal)`

**Algorithm:**

```
1. Find transition point:
   - Iterate through protocol.steps
   - For each step using Food A:
     * Calculate neatMassA = step.targetMg / protocol.foodA.mgPerUnit
     * If neatMassA ≥ threshold: transitionIndex = step.stepIndex
     * Break on first match

2. If no transition found (all doses < threshold):
   - Emit yellow warning, no need to use Food B.

3. Split protocol at transition:
   - stepsBeforeTransition = steps[0..transitionIndex-1]
   - targetProteinValues = steps[transitionIndex..end].map(s => s.targetMg)

4. Regenerate post-transition steps with Food B:
   - For each target protein in targetProteinValues:
     * Generate step using Food B (same algorithm as generateDefaultProtocol)
     * Food B Strategy is always going to be DIRECT / DILUTE_NONE.
   
5. Combine:
   - newSteps = stepsBeforeTransition + regeneratedSteps
   - protocol.steps = newSteps
   - protocol.foodB = foodB
   - protocol.foodBThreshold = threshold

5. IMPORTANT - Extra Step Creation:
   - When Food B is added, the protocol length increases by 1
   - The first Food B step uses the same protein as the previous directFood A step
   - Example: 11 Food A steps → Add Food B → 12 total steps
     - Step 5: 80mg Food A, Step 6: 80mg Food B (REPEATED step), ... Step 12: 300mg Food B
   - This is mainly for safety given new form of food - at transition, we pause at the same dose.
```

### 6.4 Validation Algorithm

**Purpose:** Check protocol for safety issues.

**Function:** `validateProtocol(protocol: Protocol) -> Warning[]`

**Validation Checks:**

```typescript
// R1: Too few steps
if (protocol.steps.length < 6) {
  warnings.push({
    severity: "red",
    code: "R1",
    message: "Protocol has fewer than 6 steps. Very rapid escalation may be unsafe."
  });
}

// R2: Protein mismatch (dilution calculation error)
for each step with method = DILUTE:
  calculatedProtein = (mixFoodAmount × food.mgPerUnit × dailyAmount) / mixTotalVolume
  delta = abs(calculatedProtein - step.targetMg)
  if (delta > 0.5) {
    warnings.push({
      severity: "red",
      code: "R2",
      message: `Step ${step.stepIndex}: Protein mismatch. Target ${targetMg}mg but calculated ${calculatedProtein}mg.`,
      stepIndex: step.stepIndex
    });
  }

// R3: Dilution impossible (no valid candidates found)
// This is detected during step generation, not validation

// R4: Below measurement resolution
for each step with method = DILUTE:
  if (mixFoodAmount < config.minMeasurableMass) OR
     (dailyAmount < config.minMeasurableVolume) OR
     (mixWaterAmount < config.minMeasurableVolume) {
    warnings.push({
      severity: "red",
      code: "R4",
      message: `Step ${step.stepIndex}: Amount below instrument resolution.`,
      stepIndex: step.stepIndex
    });
  }

// Y1: Low servings
for each step with method = DILUTE:
  if (servings < config.minServingsForMix) {
    warnings.push({
      severity: "yellow",
      code: "Y1",
      message: `Step ${step.stepIndex}: Only ${servings} servings. Consider increasing mix amounts.`,
      stepIndex: step.stepIndex
    });
  }

// Y2: Non-ascending steps
for (i = 1; i < steps.length; i++):
  if (steps[i].targetMg < steps[i-1].targetMg) {
    warnings.push({
      severity: "yellow",
      code: "Y2",
      message: `Step ${i+1}: Protein decreased from previous step.`,
      stepIndex: i + 1
    });
  }
```

---

## 7. User Interface Specification

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  OIT Calculator                                     │
│                                                     │
│  ┌────────────────────┐  ┌────────────────────┐     │
│  │ Food A Search      │  │ Food B Search      │     │
│  │ [Search input...]  │  │ [Search input...]  │     │
│  │                    │  │ [Clear Button]     │     │
│  │ Food A Settings:   │  │                    │     │
│  │ - Name             │  │ Food B Settings:   │     │
│  │ - Protein conc.    │  │ - Name             │     │
│  │ - Form (S/L)       │  │ - Protein conc.    │     │
│  │ - Dilution strat.  │  │ - Form (S/L)       │     │
│  │ - Threshold        │  │ - Threshold        │     │
│  └────────────────────┘  └────────────────────┘     │
│                                                     │
│  ┌────────────────────────────────────────────┐     │
│  │ Dosing Strategy: [Standard] [Slow] [Rapid] │     │
│  └────────────────────────────────────────────┘     │
│                                                     │
│  ┌─────────────────────────────┐  ┌──────────────┐  │
│  │ Export: [ASCII] [PDF]       │  │              │  │
│  │                             │  │  Warnings    │  │
│  │  Protocol Table             │  │  Sidebar     │  │
│  │  ┌────┬──────┬────┬─────┐   │  │              │  │
│  │  │Step│Protein│...│ +/- │   │  │  [Red/Yellow │  │
│  │  ├────┼──────┼────┼─────┤   │  │   warnings]  │  │
│  │  │ 1  │ 1mg  │... │ + - │   │  │              │  │
│  │  │ 2  │ 2.5mg│... │ + - │   │  │              │  │
│  │  │... │ ...  │... │ ... │   │  │              │  │
│  │  └────┴──────┴────┴─────┘   │  │              │  │
│  └─────────────────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 7.2 Component Specifications

#### 7.2.1 Search Inputs

**Food A Search:**

- Input: `<input id="food-a-search">`
- Placeholder: "Search for foods or protocols..."
- Functionality:
  - Fuzzy search both foods and protocols
  - Debounced (300ms)
  - Shows dropdown with results
  - Highlights matching text
  - Supports custom food creation

**Food B Search:**

- Input: `<input id="food-b-search">`
- Placeholder: "Optionally, load another food to transition to ..."
- Button: "Clear" to remove Food B
- Functionality:
  - Fuzzy search foods only (not protocols)
  - Same search behavior as Food A
  - Clearing resets to Food A only

**Dropdown Results:**

- Shows up to 10 results
- Format:
  ```
  [Food Name] - Type: Solid | Liquid - Protein: 25.6 g/100g
  ```
- Protocol results prefixed with "Protocol: "
- Custom option at top if no exact match

#### 7.2.2 Food Settings

**Food A Settings:**

- Name input (editable text)
- Protein concentration input (number + unit)
  - Unit label changes based on form (g/100g or g/100ml)
- Form toggles: [Solid] [Liquid]
  - Active button highlighted in blue
- Dilution strategy toggles: [Initial dilution] [Dilution throughout] [No dilutions]. If not specified the default is [Initial dilution]
- Threshold input (only shown for "Initial dilution")
  - Label: "Switch to direct dosing when neat amount ≥"
  - Unit: g or ml (based on form)

**Food B Settings:**

- Same as Food A except:
  - No dilution strategy (uses Food A strategy)
  - Threshold label: "Switch to Food B when Food A neat amount ≥"

#### 7.2.3 Dosing Strategy

- Three toggle buttons: [Standard] [Slow] [Rapid]
- Active button highlighted
- Displays centered in own row

**Expected Behavior:**

- Clicking a strategy button immediately regenerates the protocol
- Protocol resets to default steps for that strategy
- Step count changes (Standard=11, Slow=19, Rapid=9); _however, if Food B already selected, there will be one extra step_
- Protein targets update to match strategy
- All dilution parameters recalculated
- Table re-renders completely
- This is DIFFERENT from Food A strategy changes (which preserve custom targets)

#### 7.2.4 Protocol Table

**Columns:**

1. Step # (non-editable, bold)
2. Protein (mg) (editable input)
3. Method (DILUTE/DIRECT, non-editable)
4. Daily amount (editable input + unit)
5. Amount for mixture (editable input + unit) [dilution only]
6. Amount of water (non-editable, auto-calculated) [dilution only]
7. Actions (+ and - buttons)

**Special Rows:**

- "Food A: [Name]" header row (blue background)
- "Food B: [Name]" header row (blue background)
  - Appears BEFORE first Food B step

**Editable Cells:**

- Input elements with class "editable"
- Width: 90px
- Debounced updates (300ms)
- Recalculates protocol on blur

**Action Buttons:**

- "+" button: Insert step after current
- "-" button: Remove current step
- Hover effects: scale(1.1)

**CRITICAL - Unit Display:**

- For SOLID foods: "Amount for mixture" must display with "g" (grams)
- For LIQUID foods: "Amount for mixture" must display with "ml" (milliliters)
- Unit is determined by the current food's type property
- Daily amount for dilutions always uses "ml"
- Daily amount for direct dosing uses food's unit (g or ml)

#### 7.2.5 Warnings Sidebar

**No Warnings State:**

```
┌─────────────────────┐
│  ✓ No Issues Found  │
│  Protocol looks     │
│  good to go!        │
└─────────────────────┘
```

**With Warnings:**

```
┌─────────────────────────┐
│ Critical Issues (Red)   │
│                         │
│ • R1: Too few steps     │
│   Protocol has < 6...   │
│                         │
│ • R2: Step 3: Protein   │
│   mismatch...           │
└─────────────────────────┘
┌─────────────────────────┐
│ Cautions (Yellow)       │
│                         │
│ • Y1: Step 1: Only 2    │
│   servings...           │
└─────────────────────────┘
```

**Properties:**

- Sticky positioning (stays visible on scroll)
- Max height: calc(100vh - 2rem)
- Scrollable if content overflows

**Expected Behavior:**

- Updates automatically when protocol changes
- Shows green checkmark when no issues
- Groups warnings by severity (red first, then yellow)

#### 7.2.6 Export Buttons

- "Export ASCII" button: Copies formatted text to clipboard
- "Export PDF" button: Placeholder (shows alert "Not yet implemented")

**Expected Behavior:**

- ASCII export includes all protocol details
- Success message shown after clipboard copy
- PDF button gracefully indicates future feature

**ASCII Format:**

```
OIT Protocol

Food A: Peanut Powder (21% protein)
Dosing Strategy: STANDARD

Step 1 | 1.0 mg | DILUTE | 0.5 ml daily | Mix: 0.2 g + 10 ml water (20 servings)
Step 2 | 2.5 mg | DILUTE | 1.0 ml daily | Mix: 0.5 g + 10 ml water (10 servings)
...
```

### 7.3 Styling Specifications

**Color Scheme (Dark Mode):**

- Background: `#1a1a1a`
- Secondary BG: `#2a2a2a`
- Text: `#e0e0e0`
- Primary Blue: `#4a90e2`
- Red Warning: `#f05050`
- Yellow Warning: `#f0d000`

**Color Scheme (Light Mode):**

- Background: `#ffffff`
- Secondary BG: `#f5f5f5`
- Text: `#2a2a2a`
- Primary Blue: `#4a90e2`
- Red Warning: `#a00000`
- Yellow Warning: `#8a6000`

**Typography:**

- Font: System fonts (San Francisco, Segoe UI, Roboto)
- Base size: 1rem (16px)
- Headings: 1.1rem (bold)
- Small text: 0.85-0.9rem

---

## 8. Functional Requirements

### 8.1 Core Features

#### FR-1: Food Selection

- **FR-1.1:** User can search foods by name (fuzzy matching)
- **FR-1.2:** User can search protocols by name in the food A search-bar
- **FR-1.3:** User can create custom food with name, protein, type
- **FR-1.4:** Search shows dropdown with up to 10 results
- **FR-1.5:** Selecting food populates settings
- **FR-1.6:** Selecting protocol loads complete protocol

#### FR-2: Protocol Generation

- **FR-2.1:** System generates steps based on dosing strategy
- **FR-2.2:** System calculates dilutions automatically
- **FR-2.3:** System switches from DILUTE to DIRECT at threshold
- **FR-2.4:** System validates all steps for safety
- **FR-2.5:** Protocol updates in real-time when settings change

#### FR-3: Food B Transition

- **FR-3.1:** User can add optional Food B
- **FR-3.2:** System finds transition point based on threshold
- **FR-3.3:** System regenerates remaining steps with Food B
- **FR-3.4:** System maintains protein targets across transition
- **FR-3.5:** System adds 1 extra step when Food B added
  - Creates dose continuity by duplicating last Food A protein dose
  - Example: 11 steps → 12 steps (last Food A + new Food B at same dose)
  - Step 5: 80mg Food A, Step 6: 80mg Food B, ... Step 12: 300mg Food B
  - Header "Food B: [Name]" appears before first Food B step
- **FR-3.6:** User can clear Food B to revert to Food A only

#### FR-4: Protocol Editing

- **FR-4.1:** User can edit protein targets (recalculates step)
- **FR-4.2:** User can edit daily amounts (recalculates dilution)
- **FR-4.3:** User can edit mix food amounts (recalculates water)
- **FR-4.4:** Water amounts auto-update (non-editable)
- **FR-4.5:** User can add steps between existing steps
- **FR-4.6:** User can remove steps (minimum 1 step)
- **FR-4.7:** Changes trigger immediate validation

#### FR-5: Settings Modification

- **FR-5.1:** User can change food name
- **FR-5.2:** User can change protein concentration
- **FR-5.3:** User can toggle food type (solid/liquid)
  - Triggers unit conversion
  - Recalculates entire protocol, preserving existing protein targets
- **FR-5.4:** User can change dilution strategy
  - Preserves existing protein targets
  - Recalculates methods and dilutions
- **FR-5.5:** User can change dosing strategy
  - Clicking Standard/Slow/Rapid button triggers immediate recalculation
  - Resets to default protein targets for that strategy
  - Changes step count (11/19/9) * though for Food A -> Food B transition, recall that the step number does increase by 1
  - Regenerates entire protocol from scratch
  - Preserves Food A/B configuration
- **FR-5.6:** User can adjust thresholds
  - Recalculates DILUTE/DIRECT methods
  - Updates transition points

#### FR-6: Export

- **FR-6.1:** ASCII export copies formatted text to clipboard
- **FR-6.2:** User receives confirmation message
- **FR-6.3:** Export includes all protocol details
- **FR-6.4:** PDF export shows "Not yet implemented" message

### 8.2 User Interactions

**Search Interactions:**

1. User types in search box
2. After 300ms delay, dropdown appears with results
3. User clicks result or presses Enter
4. Dropdown closes, settings populate
5. Protocol table updates

**Settings Interactions:**

1. User modifies setting (toggle, input, etc.)
2. Setting updates immediately (visual feedback)
3. Protocol recalculates (300ms debounce for inputs)
4. Table re-renders
5. Warnings update

**Table Interactions:**

1. User clicks editable cell
2. Input field activates
3. User types new value
4. On blur or Enter: recalculate and update
5. On Escape: cancel edit

**Button Interactions:**

1. User clicks + or - button
2. Step added/removed immediately
3. Protocol recalculates
4. Table and warnings update

---

## 9. Validation System

### 9.1 Validation Rules

**Critical Errors (Red):**

| Code | Description         | Condition                         | Impact                     |
| ---- | ------------------- | --------------------------------- | -------------------------- |
| R1   | Too few steps       | steps.length < 6                  | Very rapid escalation      |
| R2   | Protein mismatch    | abs(calculated - target) > 0.5 mg | Dilution calculation error |
| R3   | Dilution impossible | No valid candidates found         | Cannot achieve target      |
| R4   | Below resolution    | Amount < instrument minimum       | Cannot measure accurately  |

**Cautions (Yellow):**

| Code | Description   | Condition                           | Impact                       |
| ---- | ------------- | ----------------------------------- | ---------------------------- |
| Y1   | Low servings  | servings < minServingsForMix        | Mix may not last long enough |
| Y2   | Non-ascending | step[i].protein < step[i-1].protein | Unusual dose decrease        |

### 9.2 Validation Timing

- **On protocol generation:** Full validation
- **On step edit:** Validate affected steps
- **On settings change:** Full validation
- **On step add/remove:** Full validation

### 9.3 Warning Display

**Severity Color Coding:**

- Red: `background: var(--oit-warning-red-bg)`, `border: var(--oit-warning-red-border)`
- Yellow: `background: var(--oit-warning-yellow-bg)`, `border: var(--oit-warning-yellow-border)`

**Warning Message Format:**

```
[Code]: [Step reference (if applicable)]: [Description]

Examples:
R1: Protocol has fewer than 6 steps. Very rapid escalation may be unsafe.
R2: Step 3: Protein mismatch. Target 5mg but calculated 4.2mg.
Y1: Step 1: Only 2 servings. Consider increasing mix amounts.
```

**No Warnings Message:**

```
✓ No Issues Found
Protocol looks good to go!
```

---

## 10. Export Features

### 10.1 ASCII Export Format

```
OIT Protocol - Generated [Date]

========================================
FOOD INFORMATION
========================================

Food A: [Name] ([Type])
Protein Concentration: [X] mg/[unit]
Dilution Strategy: [Strategy Name]
[If applicable] Dilution Threshold: [X] [unit]

[If Food B exists]
Food B: [Name] ([Type])
Protein Concentration: [X] mg/[unit]
Transition Threshold: [X] [unit]

========================================
DOSING STRATEGY
========================================
[STANDARD/SLOW/RAPID] ([X] steps)

========================================
PROTOCOL STEPS
========================================

[Food A header if applicable]

Step [N] | [X] mg | [METHOD] | [Y] [unit] daily [| Mix: [A] [unit] food + [B] ml water ([C] servings)]
...

[Food B header if transition exists]

Step [N] | [X] mg | [METHOD] | [Y] [unit] daily [| Mix: [A] [unit] food + [B] ml water ([C] servings)]
...

========================================
NOTES
========================================
- DILUTE steps: Mix food with water, give patient specified daily amount
- DIRECT steps: Patient consumes food directly (neat/undiluted)
- Always verify calculations before clinical use
```

### 10.2 Export Implementation

```typescript
function exportASCII() {
  const protocol = currentProtocol;
  const date = new Date().toLocaleDateString();

  let text = `OIT Protocol - Generated ${date}\n\n`;

  // Food information
  text += "========================================\n";
  text += "FOOD INFORMATION\n";
  text += "========================================\n\n";

  const foodAType = protocol.foodA.type === FoodType.SOLID ? "Solid" : "Liquid";
  const foodAUnit = protocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  text += `Food A: ${protocol.foodA.name} (${foodAType})\n`;
  text +=
    `Protein Concentration: ${protocol.foodA.mgPerUnit} mg/${foodAUnit}\n`;
  // ... continue formatting

  // Copy to clipboard
  navigator.clipboard.writeText(text);
  alert("Protocol copied to clipboard!");
}
```

---

## 11. Data Files

### 11.1 Food Database (`typed_foods_rough.json`)

**Format:**

```json
[
  {
    "Food": "Peanut, roasted",
    "Food Group": "Legumes",
    "Mean value in 100g": 25.8,
    "Type": "Solid"
  },
  {
    "Food": "Milk, whole",
    "Food Group": "Dairy",
    "Mean value in 100g": 3.2,
    "Type": "Liquid"
  }
]
```

**Loading:**

```typescript
async function loadDatabases() {
  const foodsResponse = await fetch(
    "/static/tool_assets/typed_foods_rough.json",
  );
  foodsDatabase = await foodsResponse.json();

  // Prepare for fuzzy search
  fuzzySortPreparedFoods = foodsDatabase.map(f => ({
    ...f,
    searchTarget: fuzzysort.prepare(f.Food),
  }));
}
```

### 11.2 Protocol Templates (`oit_protocols.json`)

Of note, some of the doses in the protocol templates are _intentionally wrong_.

**Format:**

```json
[
  {
  "name": "Protocol: peanut powder",
  "dosing_strategy": "STANDARD",
  "food_a": {
    "type": "SOLID",
    "name": "Peanut Powder",
    "protein_conc": 0.21
  },
  "food_a_strategy": "DILUTE_INITIAL",
  "di_threshold": 0.2,
  "food_b": {
    "type": "SOLID",
    "name": "Roasted Peanut",
    "protein_conc": 0.25
  },
  "food_b_threshold": 0.45,
  "table_di": [
    {
      "food": "Peanut Powder",
      "protein": 1,
      "method": "DILUTE",
      "daily_amount": 0.2,
      "mix_amount": 1,
      "water_amount": 2.5
    },
    ...
]
```

**Notes:**

- `protein_conc` is in decimal form (0.21 = 21% = 21g/100g)
- Protocols may include pre-calculated table data
- Protocol loading regenerates steps from scratch using current algorithms

---

## 12. Compilation & Deployment

### 12.1 TypeScript Compilation

**Command:**

```bash
cd allergyguide
tsc static/ts/oit_calculator.ts \
  --target ES2017 \
  --lib ES2017,DOM \
  --outDir static/js \
  --skipLibCheck
```

**Watch Mode (Development):**

```bash
tsc static/ts/oit_calculator.ts \
  --target ES2017 \
  --lib ES2017,DOM \
  --outDir static/js \
  --skipLibCheck \
  --watch
```

**Output:**

- Input: `static/ts/oit_calculator.ts`
- Output: `static/js/oit_calculator.js`

### 12.2 Zola Integration

**Shortcode Usage:**
In any markdown file:

```markdown
{{ oit_calculator() }}
```

**Build Process:**

1. Compile TypeScript → JavaScript
2. Run Zola build: `zola build`
3. Output includes compiled JS and HTML

### 12.3 File Dependencies

**Load Order:**

1. `decimal.js` (must load first)
2. `fuzzysort` (from CDN)
3. `oit_calculator.js`

**In HTML template:**

```html
<script src="/js/decimal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/fuzzysort@3.1.0/fuzzysort.min.js"></script>
<script src="/js/oit_calculator.js"></script>
```

---

## 13. Testing Criteria

### 13.1 Unit Test Cases

**Test 1: Dilution Calculation**

```
Input:
  P = 1 mg
  food = { type: SOLID, mgPerUnit: 210 (21%) }
  config = { minMeasurableMass: 0.2 g, minMeasurableVolume: 0.5 ml }

Expected Output:
  Candidate with:
    mixFoodAmount = 0.2 g
    dailyAmount = 1 ml
    mixWaterAmount ~= 10 ml
    servings ~= 10
```

**Test 2: Food B Transition with Extra Step**

```
Input:
  11-step protocol (Food A ending at 300mg)
  Add Food B with threshold = 0.45 g

Expected Output:
  12 total steps (protocol becomes 1 step longer)
  Steps 1-7: Food A (through 80mg)
  Steps 8-12: Food B (80mg, 120mg, 160mg, 240mg, 300mg). 
  
Key: First Food B step duplicates the previous Food A step's protein target.
```

**Test 3: Dosing Strategy Change**

```
Input:
  Protocol with STANDARD (11 steps)
  Click SLOW button

Expected Output:
  Protocol immediately regenerates with 19 steps
  Protein targets: [0.5, 1, 1.5, 2.5, ..., 300]
  Methods recalculated for each step
  Table updates automatically
  Food A/B configuration preserved
  
Then click RAPID:
  Protocol regenerates with 9 steps
  Protein targets: [1, 2.5, 5, 10, 20, 40, 80, 160, 300]
```

### 13.2 Integration Test Cases

**Test 4: Loading protocol**

```
1. Load "Protocol: peanut powder"
2. Verify: protocol rendered matches the expected protocol (even if there are errors within the protocol (ie. the dosing numbers are incorrect))
```

**Test 5: Solid/Liquid Unit Display**

```
1. Load peanut powder (solid)
2. View dilution steps
3. Verify: "Amount for mixture" shows "g" (e.g., "0.2 g")
4. Verify: Daily amount shows "ml" for dilutions
5. Toggle to Liquid type
6. Verify: "Amount for mixture" shows "ml" (e.g., "0.5 ml")
7. Toggle back to Solid
8. Verify: Units revert to "g" for mix amounts
```

**Test 6: Validation Warnings**

```
1. Create protocol with 4 steps
2. Verify: Red warning R1 appears
3. Add steps to reach 7 total
4. Verify: R1 warning disappears
5. Edit mix amount below threshold
6. Verify: Red warning R4 appears
```

### 13.3 Manual Testing Checklist

- [ ] Search finds foods by partial name
- [ ] Search finds protocols by name
- [ ] Custom food creation works
- [ ] All three dosing strategies generate correct step counts
- [ ] Dosing strategy buttons immediately recalculate protocol
- [ ] Dilution calculations are accurate (verify with calculator)
- [ ] Food B adds exactly 1 extra step
- [ ] First Food B step duplicates previous Food A protein dose
- [ ] Food B header appears before first Food B step
- [ ] Mix amounts show correct units (g for solid, ml for liquid)
- [ ] Daily amounts show ml for dilutions, food unit for direct
- [ ] Water amounts auto-calculate correctly
- [ ] Editing protein recalculates step
- [ ] Editing daily amount recalculates dilution
- [ ] button adds step after current
- [ ] button removes step
- [ ] Warnings update in real-time
- [ ] ASCII export copies to clipboard
- [ ] Dark/light mode styling works

---

## 14. Future Enhancements

### 15.1 Planned Features

**P1 - High Priority:**

- [ ] PDF export with formatted layout

**P2 - Medium Priority:**

- [ ] Protocol comparison view
- [ ] Patient progress tracking
- [ ] Print-friendly CSS improvements
- [ ] Undo/redo functionality

**P3 - Low Priority:**

- [ ] Multi-language support (i18n)

### 15.2 Technical Debt

- [ ] Add comprehensive unit tests
- [ ] Add TypeScript strict mode
- [ ] Refactor large functions (>100 lines)
- [ ] Add JSDoc comments for all public functions
- [ ] Improve error handling (try-catch blocks)
- [ ] Add logging for debugging
- [ ] Optimize re-render performance (memoization)

---

## Appendix A: Quick Reference

### A.1 File Paths

```
TypeScript source: allergyguide/static/ts/oit_calculator.ts 
Compiled JS: allergyguide/static/js/oit_calculator.js 
HTML template: allergyguide/templates/shortcodes/oit_calculator.html
SCSS: allergyguide/sass/shortcodes/_oit_calculator.scss
Food data: allergyguide/static/tool_assets/typed_foods_rough.json
Protocols: allergyguide/static/tool_assets/oit_protocols.json
Decimal.js: allergyguide/static/js/decimal.js
```

### A.2 Key Functions

```typescript
generateDefaultProtocol(food, config) -> Protocol
addFoodBToProtocol(protocol, foodB, threshold) -> void
findDilutionCandidates(P, food, config) -> Candidate[]
validateProtocol(protocol) -> Warning[]
renderProtocolTable() -> void
updateProtocol() -> void
exportASCII() -> void
```

### A.3 CSS Classes

```css
.oit_calculator           /* Main container */
.food-a-settings          /* Food A configuration panel */
.food-b-settings          /* Food B configuration panel */
.dosing-strategy-container /* Dosing strategy buttons */
.search-dropdown          /* Search results dropdown */
.toggle-btn.active        /* Active toggle button */
.warnings-container       /* Warnings sidebar */
.food-section-header      /* Food A/B header rows */
.editable                 /* Editable input cells */
```

### A.4 Data Flow

```
User Action → Event Listener → Update State → Recalculate → Re-render → Validate → Display
```

---

## Appendix B: Example Protocol

**Scenario:** Peanut powder OIT with transition to whole peanuts

**Settings:**

- Food A: Peanut Powder (21% protein, solid)
- Dilution Strategy: Initial dilution only
- Dilution Threshold: 0.2 g
- Food B: Roasted Peanut (25% protein, solid)
- Food B Threshold: 0.45 g
- Dosing Strategy: Standard
