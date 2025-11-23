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

---

## 1. Executive Summary

The OIT Calculator is a TypeScript-based web application designed to help generate safe, customizable oral immunotherapy protocols for food allergies. The tool automatically calculates dilution parameters, manages Food A → Food B transitions, validates protocols for safety, and exports formatted text.

**Key Capabilities:**

- Generate protocols for OIT
- Automatic dilution calculations
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
4. Transition from one form of a food (e.g., peanut powder) to another food (ie. whole peanuts)
5. Validate protocols for safety issues
6. Export protocols for patient charts
7. Easy customization of protocol tables

### 2.2 Core Concepts

**Dosing Strategies:**

- **Standard** (11 steps): [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300] mg
- **Slow** (19 steps): [0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300] mg
- **Rapid** (9 steps): [1, 2.5, 5, 10, 20, 40, 80, 160, 300] mg

**Dilution Methods:**

- **DILUTE**: Typically done when the target protein (mg) is very small (ie. the corresponding amount of food would be hard to measure with a scale or syringe). A more measureable amount of food is diluted with water, and a portion of the diluted mix is given to achieve the target protein dose.
- **DIRECT**: Patient consumes food directly (neat/undiluted)

**Food A Strategy** (how long to dilute):

- **DILUTE_INITIAL**: Dilute until doses become measurable, then switch to direct. This is the most common strategy for Food A.
- **DILUTE_ALL**: Dilute throughout entire protocol
- **DILUTE_NONE**: Never dilute, always direct dosing

**Food Types:**

- **SOLID**: Measured in grams (g) - e.g., peanut powder, whole peanuts
- **LIQUID**: Measured in milliliters (ml) - e.g., milk, liquid egg

### 2.3 Workflow

Selecting a pre-defined food or custom food

```
1. User searches for Food A. Defaults for dilution strategy, threshold, and dosing strategy are set and table is rendered. Defaults for custom food protein concentration and form are assumed.
2. User can configure Food A settings and have the table update automatically (see [editing behaviour](#fr-4-protocol-editing-key-section)):
   - Food name
   - Protein concentration (in the UI, expressed as g of protein per 100 (grams or ml) serving size of food)
   - Food type (solid/liquid)
   - Dilution strategy (initial/all/none)
   - Dilution threshold (when to stop diluting)
3. User can edit dosing strategy (Standard/Slow/Rapid). Standard dosing is default
4. [Optional] User adds Food B for transition:
   - Search for Food B
   - Once selected, table is re-rendered with a default transition threshold (this is editable)
5. In general: on each edit of the table, steps, or settings, table is revalidated and potential warnings are displayed
6. User reviews warnings and edits as needed
7. User exports protocol to clipboard
```

Selecting a protocol

```
1. User searches for a protocol within a pre-defined dataset. The exact specified protocol is rendered and validated.
2. As above, user is able to edit and tweak the protocol after as they see fit
```

---

### 2.4 Misc

Dilution assumptions:

- Solid-in-liquid: for simplicity we assume that solid contributes negligibly to final volume.
- Liquid-in-liquid: Volumes are additive.

Phenotypes supported:

1. Food A with initial dilutions then direct.
2. Food A with dilutions throughout.
3. Food A without any dilutions (often impractical early unless compounded).
4. Food A → Food B at some point (Food A may be diluted/undiluted before transition). Food B is assumed to always be given directly without dilution.

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
    └── OIT_CALCULATOR_COMPLETE_SPEC.md  # This file
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
   - Should use precision 20 and rounding ROUND_HALF_UP
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
  dailyAmount: Decimal; // Amount patient consumes daily. The protein in dailyAmount should very closely match targetMg
  dailyAmountUnit: Unit; // "g" or "ml"
  mixFoodAmount?: Decimal; // Food amount in mixture (for DILUTE only)
  mixWaterAmount?: Decimal; // Water amount in mixture (for DILUTE only)
  servings?: Decimal; // Number of servings mixture provides. May be fractional
}

interface ProtocolConfig {
  minMeasurableMass: Decimal; // Minimum a scale should measure (g). Usually we say 0.20g, easy for parents. Inclusive (≥)
  minMeasurableVolume: Decimal; // Minimum syringe can measure (ml). Usually we say 0.2ml, easy for parents with small syringe. Inclusive (≥)
  minServingsForMix: Decimal; // Minimum servings per mixture. inclusive (≥)
}

interface Protocol {
  dosingStrategy: DosingStrategy; // STANDARD/SLOW/RAPID
  foodA: Food; // Primary food
  foodAStrategy: FoodAStrategy; // When to dilute Food A
  diThreshold: Decimal; // At what neat amount (g or ml) of food A do we switch to simply giving it directly? Inclusive
  foodB?: Food; // Optional second food
  foodBThreshold?: { unit: Unit; amount: Decimal }; // At what neat amount (g or ml) of food B do we switch from food A to food B?
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
  minMeasurableMass: new Decimal(0.2), // 0.2 g (scale resolution) inclusive (≥)
  minMeasurableVolume: new Decimal(0.2), // 0.2 ml (syringe resolution) inclusive (≥)
  minServingsForMix: new Decimal(3), // Minimum 3 servings per mix inc.lusive (≥)
  PROTEIN_TOLERANCE_MG: new Decimal(0.5),
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

## 5.4 Design Decisions & Invariants

- Canonical units (of note: in the UI the unit asked for is g of protein per either 100ml or 100g):
  - Solids: mg per gram (mg/g)
  - Liquids: mg per millilitre (mg/ml)
  - Provide a function mgPer100ToMgPerUnit(uiValue, unit) to convert UI entries (g protein per 100 (g or ml) to canonical mg/unit.
- Precision: Use Decimal for all arithmetic; format only for display/export.
- Serialization: Store Decimal fields as strings in JSON state for protocols and rehydrate on load.
- BOTH red and yellow warnings are non-blocking
- When toggling a food’s form (SOLID ⇄ LIQUID), convert amounts assuming 1 g ≈ 1 ml and recompute water for mixes.

## 6. Core Algorithms

### 6.1 Dilution Calculation Algorithm

**Purpose:** Calculate optimal dilution parameters for unmeasurable doses.

**Input:**

- `P`: Target protein (mg) for a step; the protein contained per daily dose
- `food`: Food object with protein concentration
- `config`: Measurement constraints

**Output:**

- Array of valid `Candidate` objects, ranked by optimality

**Other**

- Internally food.mgPerUnit is mg protein per 1 gram (SOLID) or per 1 milliliter (LIQUID).
- For a candidate defined by mixFoodAmount and dailyAmount, compute totalMixProtein = mixFoodAmount × food.mgPerUnit. servings = totalMixProtein / P, mixTotalVolume = dailyAmount × servings.
- For SOLID assume solid volume negligible.
- Accept candidate only if measurable constraints hold and the actual protein delivered = (totalMixProtein / mixTotalVolume) × dailyAmount is within PROTEIN_TOLERANCE_MG (default 0.5 mg) of target P.
- Candidate ranking: smallest mixFoodAmount, then smallest dailyAmount, then smallest mixTotalVolume.
  - Use Decimal.compare strictly; if all keys equal, fallback to the candidate with smallest mixWaterAmount, then deterministic stable insertion order

**Algorithm:**

**Special Case - Solid Dilutions:**
For solid foods in liquid, assume solid volume is negligible.

- Mix total volume ≈ water volume
- Example: 0.2 g powder in 10 ml water ≈ 10 ml total

**Special Case - Liquid Dilutions:**
For liquid foods in water, volumes are additive:

- Mix total volume = food volume + water volume
- Example: 2 ml milk + 8 ml water = 10 ml total

```
// Inputs: P (mg), food.mgPerUnit (mg per g or mg per ml), config
// Candidates to iterate: mixFoodCandidates (g for SOLID / ml for LIQUID) and dailyAmountCandidates (ml)

function findDilutionCandidates(P, food, config) -> Candidate[] {
  const candidates = []
  const mixCandidates = food.type === SOLID ? SOLID_MIX_CANDIDATES : LIQUID_MIX_CANDIDATES
  for each mixFood in mixCandidates:
    for each dailyAmount in DAILY_AMOUNT_CANDIDATES:
      // Desired concentration in mg per ml
      C_required = P.dividedBy(dailyAmount)  // mg/ml

      // For SOLID:
      if food.type === SOLID:
        // We compute servings required to deliver total protein in the mix
        // mixFood (g) * food.mgPerUnit (mg/g) = total protein in mix (mg)
        totalMixProtein = mixFood.times(food.mgPerUnit)
        // servings = total protein / P (number of daily doses the mix supports)
        servings = totalMixProtein.dividedBy(P)
        if servings < config.minServingsForMix: continue

        // mixTotalVolume: approximate as dailyAmount * servings (ml)
        mixTotalVolume = dailyAmount.times(servings)

        // mixWaterAmount: assume solid volume negligible -> mixWater ~= mixTotalVolume
        mixWaterAmount = mixTotalVolume

        // Validate measurable constraints
        if mixFood < config.minMeasurableMass: continue
        if dailyAmount < config.minMeasurableVolume: continue
        if mixWaterAmount > MAX_MIX_WATER: continue
        if mixWaterAmount < config.minMeasurableVolume: continue

        // Calculate actual protein delivered per dailyAmount and check tolerance
        // actualProteinPerMl = totalMixProtein / mixTotalVolume  (mg/ml)
        actualProteinPerMl = totalMixProtein.dividedBy(mixTotalVolume)
        actualProteinDelivered = actualProteinPerMl.times(dailyAmount)
        if actualProteinDelivered.minus(P).abs().greaterThan(PROTEIN_TOLERANCE_MG): continue

        candidates.push({mixFoodAmount: mixFood, mixWaterAmount, dailyAmount, mixTotalVolume, servings})

      // For LIQUID:
      else:
        // mixFood is ml of food; compute totalMixProtein = mixFood * food.mgPerUnit (mg)
        totalMixProtein = mixFood.times(food.mgPerUnit)
        servings = totalMixProtein.dividedBy(P)
        if servings < config.minServingsForMix: continue
        mixTotalVolume = dailyAmount.times(servings)
        mixWaterAmount = mixTotalVolume.minus(mixFood)
        if mixWaterAmount.lessThan(0): continue  // invalid
        if mixFood < config.minMeasurableVolume: continue
        if dailyAmount < config.minMeasurableVolume: continue
        if mixWaterAmount.greaterThan(MAX_MIX_WATER): continue
        if mixWaterAmount.lessThan(config.minMeasurableVolume): continue

        actualProteinPerMl = totalMixProtein.dividedBy(mixTotalVolume)
        actualProteinDelivered = actualProteinPerMl.times(dailyAmount)
        if actualProteinDelivered.minus(P).abs().greaterThan(PROTEIN_TOLERANCE_MG): continue

        candidates.push({mixFoodAmount: mixFood, mixWaterAmount, dailyAmount, mixTotalVolume, servings})

  // Rank candidates: smallest mixFoodAmount, then smallest dailyAmount, then smallest mixTotalVolume
  sortCandidates(candidates)
  return candidates
}

Edge cases:
- If no valid solution is found, raise R3 (Dilution impossible).
```

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
      - Create Step 
 
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

**Function:** `addFoodBToProtocol(protocol: Protocol, foodB: Food, threshold: { unit: Unit; amount: Decimal })`

**Assumptions**:

- protocol.steps is an ordered array of Step objects already containing targetMg (Decimal) for every step
- foodB exists and has mgPerUnit (mg per g or mg per ml) and type (SOLID/LIQUID)Food B dosing is DIRECT (no dilution) when transition happens
- Food B dosing is DIRECT (no dilution) when transition happens
- we also have access to:
  - foodBThreshold is { unit: "g" | "ml", amount: Decimal } - it is the neat mass of food B that we deem easily measurable.
  - foodB.mgPerUnit

**Algorithm**

1. Calculate the mg of protein foodBThreshold corresponds to: foodBThreshold * foodB.mgPerUnit (mg). Term this `foodBmgThreshold`
2. Scanning through the steps of food A, once food A reaches a step `n` whose target protein is >= `foodBmgThreshold`, then step `n+1` will be food B. Importantly step `n+1` (food B's first step) will have the SAME protein target as step `n`.
3. Then append the remaining targets (the original sequence after n) but treat them as Food-B (direct dosing). Net result: protocol length increases by 1; the first Food-B step duplicates the previous Food-A protein target.

- the remaining post-transition targets come from the original protocol.steps target sequence

4. If there is no step of Food A where the target protein is >= `foodBmgThreshold`, then food B will not be added to the protocol and a yellow warning should be emitted to lower the threshold.

**Example**:
Food A - Powder X: 667mg of protein per g. Being given as dilution only for now.
Food B - Whole food X: 333 mg of protein per g. foodBThreshold is set as 0.2 g; this corresponds to a protein content of 67mg.

Once Food A reaches a step >= the target protein set by foodBThreshold (67mg), which is step 7 (`n`) in the example below, then food A will stop and food B will start. Importantly, food B's first step `n+1` will start at the exact same protein target as step `n`, which is 80mg in the example:

FOOD A:

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 0.2 g              | 133 ml            |
| 2    | 2.5          | Dilution | 1 ml         | 0.2 g              | 53 ml             |
| 3    | 5            | Dilution | 2 ml         | 0.2 g              | 53 ml             |
| 4    | 10           | Dilution | 1 ml         | 0.4 g              | 27 ml             |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 17 ml             |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 17 ml             |
| 7    | 80           | Dilution | 4 ml         | 0.5 g              | 17 ml             |

After step 7 is complete, transition to FOOD B:

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | ------ | ------------ | ------------------ | ----------------- |
| 8    | 80           | Direct | 0.24 g       | n/a                | n/a               |
| 9    | 120          | Direct | 0.36 g       | n/a                | n/a               |
| 10   | 160          | Direct | 0.48 g       | n/a                | n/a               |
| 11   | 240          | Direct | 0.72 g       | n/a                | n/a               |
| 12   | 300          | Direct | 0.9 g        | n/a                | n/a               |

**Editing behaviour**
Recompute the transition whenever any of these change:

- foodB selection
- foodBThreshold
- any targetMg in steps 1..current_transition_index: If user manually edited post-transition targets, preserve them until the next “recompute” event.
- Food A mgPerUnit changes
- Dosing strategy change

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
      message: `Row ${step.stepIndex} computed protein ${calculatedProtein} mg ≠ declared ${targetMg} mg.`,
      stepIndex: step.stepIndex
    });
  }

// R3: TBD

// R4: Below measurement resolution
for each step with method = DILUTE:
  if (mixFoodAmount < config.minMeasurableMass) OR
     (dailyAmount < config.minMeasurableVolume) OR
     (mixWaterAmount < config.minMeasurableVolume) {
    warnings.push({
      severity: "red",
      code: "R4",
      message: "Measured powder/volume below instrument resolution — impractical to prepare.",
      stepIndex: step.stepIndex
    });
  }

// Y1: Low servings
for each step with method = DILUTE:
  if (servings < config.minServingsForMix) {
    warnings.push({
      severity: "yellow",
      code: "Y1",
      message: `Dilution yields ${servings} servings (< configured minimum). Consider increasing mix food amount or mix volume.`,
      stepIndex: step.stepIndex
    });
  }

// Y2: Non-ascending steps
for (i = 1; i < steps.length; i++):
  if (steps[i].targetMg < steps[i-1].targetMg) {
    warnings.push({
      severity: "yellow",
      code: "Y2",
      message: `Steps must be ascending or equal — check step ${i+1} vs step ${i}.`,
      stepIndex: i + 1
    });
  }
```

---

## 7. User Interface Specification

### 7.1 Layout Structure

```
┌───────────────────────────────────────────────────┐
│ OIT Calculator                                    │
│ ┌────────────────────┐  ┌────────────────────┐    │
│ │ Food A Search      │  │ Food B Search      │    │
│ │ [Search input...]  │  │ [Search input...]  │    │
│ │                    │  │ [Clear Button]     │    │
│ │ Food A Settings:   │  │                    │    │
│ │ - Name             │  │ Food B Settings:   │    │
│ │ - Protein conc.    │  │ - Name             │    │
│ │ - Form (S/L)       │  │ - Protein conc.    │    │
│ │ - Dilution strat.  │  │ - Form (S/L)       │    │
│ │ - Threshold        │  │ - Threshold        │    │
│ └────────────────────┘  └────────────────────┘    │
│ ┌────────────────────────────────────────────┐    │
│ │ Dosing Strategy: [Standard] [Slow] [Rapid] │    │
│ └────────────────────────────────────────────┘    │
│ ┌─────────────────────────────┐  ┌──────────────┐ │
│ │ Export: [ASCII] [PDF]       │  │              │ │
│ │                             │  │  Warnings    │ │
│ │  Protocol Table             │  │  Sidebar     │ │
│ │  ┌─────┬────┬───────┬────┐  │  │              │ │
│ │  │ +/- │Step│Protein│... │  │  │  [Red/Yellow │ │
│ │  │─────┼────┼───────┼────│  │  │   warnings]  │ │
│ │  │ + - │ 1  │ 1mg   │... │  │  │              │ │
│ │  │ + - │ 2  │ 2.5mg │... │  │  │              │ │
│ │  │ ... │... │ ...   │... │  │  │              │ │
│ │  └─────┴────┴───────┴────┘  │  │              │ │
│ └─────────────────────────────┘  └──────────────┘ │
└───────────────────────────────────────────────────┘
```

### 7.2 Component Specifications

#### 7.2.1 Search Inputs

**Food A Search:**

- Input: `<input id="food-a-search">`
- Placeholder: "Search for foods or protocols..."
- Functionality:
  - Fuzzy search both foods and protocols
  - Debounced (≈150ms)
  - Shows dropdown with results
  - Supports custom food creation

**Food B Search:**

- Input: `<input id="food-b-search">`
- Placeholder: "Optionally, load another food to transition to ..."
- Button: "Clear" to remove Food B
- Functionality:
  - Fuzzy search foods only (not protocols)
  - Same search behavior as Food A, supports custom food creation
  - Clearing resets to Food A only and recalculates protocol

**Dropdown Results:**

- Shows up top 10 items in dropdown; remaining results up to 50 are virtualized/scrollable
- Format:
  ```
  [Food Name] - [Solid | Liquid] - Protein: 25.6 g/100 [g or ml]
  ```
- Protocol results prefixed with "Protocol: "
- Always include "Custom: <typed text>" as the first result to allow creating a custom food entry

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

- Clicking a strategy button immediately regenerates the entire protocol and resets steps to default steps for that strategy
- Step count changes (Standard=11, Slow=19, Rapid=9); _however, if Food B already selected, there will be one extra step - see [here](#63-food-b-addition-algorithm)_
- All dilution parameters recalculated
- Table re-renders completely
- This is DIFFERENT from Food A strategy changes (which preserve custom targets)

#### 7.2.4 Protocol Table

**Columns:**

1. Actions (+ and - buttons)
2. Step # (non-editable, bold)
3. Protein (mg) (editable input)
4. Method (DILUTE/DIRECT, non-editable)
5. Daily amount (editable input + unit)
6. Amount for mixture (editable input + unit) [dilution only]
7. Amount of water (non-editable, auto-calculated) [dilution only]

**Special Rows:**

- "[Name]" header row
- "[Name]" header row
  - Appears BEFORE first Food B step

**Editable Cells:**

- Input elements with class "editable"
- Width: 90px
- Debounced updates (150ms)
- Recalculates protocol on blur

**Action Buttons:**

- Place (+) and (−) immediately to the left of the step number (no separate Actions column).
- Clicking (+) inserts a copy of the current row after current (ie. if you press + on step 5, then step 5 remains the same, and a copy of step 5 is inserted after it); clicking (−) deletes the step.

- Inserting duplicates all editable fields of the current row including method and mix values.
- Deleting last step: disallow deletion if it would leave zero steps — enforce minimum 1 step.
- After insert/delete, reindex stepIndex and run full validation.

**CRITICAL - Unit Display:**

- Display formatting (for UI only): grams → 2 decimal places; ml → 1 decimal place (or integer when appropriate)
- For SOLID foods: "Amount for mixture" must display with "g" (grams). Resolution for UI is up to 0.01g
- For LIQUID foods: "Amount for mixture" must display with "ml" (milliliters). Resolution for UI is up to 0.1ml
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
- **FR-1.4:** Selecting a food populates settings with defaults
- **FR-1.5:** Selecting a protocol loads complete protocol
  - if a protocol is selected, it is loaded AS IS. That is: steps are NOT regenerated from scratch. If a built-in protocol has only 3 steps with incorrect doses for P, it WILL be loaded as such (but warnings will appear)

#### FR-2: Protocol Generation

- **FR-2.1:** System generates steps based on dosing strategy
- **FR-2.2:** System calculates dilutions automatically if dilution is set

#### FR-3: Food B Transition

See [here](#63-food-b-addition-algorithm)

- **FR-3.1:** User can add optional Food B
- **FR-3.2:** System finds transition point based on threshold
- **FR-3.3:** System recalculates remaining steps with Food B
- **FR-3.4:** User can clear Food B to revert to Food A only

NOTE: If a built-in protocol is loaded that has both a Food A and a food B with custom target values, the loaded targets should be kept. use the existing target sequence for the post-transition portion. The validation check still runs.

#### FR-4: Step editing behaviour

- **FR-4.1:** when editing target protein (P):
  - DIRECT steps: Editing targetMg recalculates dailyAmount.
  - DILUTE steps: keep dailyAmount and mixFoodAmount constant if possible; update mixWaterAmount
    - recompute servings = (mixFoodAmount × mgPerUnit) / targetMg; if servings < minServingsForMix OR mixWaterAmount > MAX_MIX_WATER, show Y/R as appropriate and still update dailyAmount = mixTotalVolume / servings (preserve mixFoodAmount). If constraints make it impossible (mixTotalVolume < dailyAmount), show R3
- **FR-4.2:** when editing daily amount:
  - DIRECT: Recalculates target protein P for the step.
  - DILUTE: keep mixFoodAmount fixed; update mixWaterAmount
- **FR-4.3:** when editing mixFoodAmount (only for dilutions): recompute mixWaterAmount to keep P and dailyAmount unchanged.
- **FR-4.4:** User can add steps between existing steps
- **FR-4.5:** User can remove steps (minimum 1 step)
- **FR-4.6:** Changes trigger immediate validation

#### FR-5: Settings Modification

- **FR-5.1:** User can change food name
- **FR-5.2:** User can change protein concentration
- **FR-5.3:** User can toggle food type (solid/liquid), with recalculations if method is DILUTION
  - Form toggles: If you toggle a food's form (SOLID ⇄ LIQUID) the app converts existing daily and mix amounts using 1 g ≈ 1 ml and recomputes water (solid-in-liquid volume assumption changes accordingly). Ie. if step X has targetMg of 10mg, and mixAmount is 0.5g, waterAmount is 10ml, then once it is switched to liquid the mixAmount becomes 0.5ml, waterAmount becomes 9.5ml. Vise versa.
  - Recalculates entire protocol (method and mix parameters), but preserves existing target mg protein targets
- **FR-5.4:** User can change dilution strategy
  - Preserves existing protein targets
  - Recalculates methods and dilutions for all steps, but preserves existing target mg protein targets
- **FR-5.5:** User can change dosing strategy
  - Clicking Standard/Slow/Rapid button triggers immediate recalculation and RESET of step # and protein targets
  - Changes step count (11/19/9). However, edge case if food B already selected; food B is added again with its associated settings preserved
  - Preserves Food A/B configuration
  - Loaded protocols are treated like a blank canvas: changing dosing strategy regenerates and overwrites loaded targets
- **FR-5.6:** User can adjust thresholds for dilution of food A, and for foodBThreshold
  - Recalculates DILUTE/DIRECT methods upon edits of food A threshold
  - Updates transition points for foodBThreshold as noted [here](#63-food-b-addition-algorithm)

#### What triggers recomputation of Food B transition

-

#### FR-6: Export

- **FR-6.1:** ASCII export copies formatted text to clipboard
- **FR-6.2:** Export includes all protocol details
- **FR-6.3:** PDF export shows "Not yet implemented" message

### 8.2 User Interactions

**Search Interactions:**

1. User types in search box
2. After 150ms delay, dropdown appears with results
3. User clicks result or presses Enter
4. Dropdown closes, settings populate
5. Protocol table updates

**Settings Interactions:**

1. User modifies setting (toggle, input, etc.)
2. Setting updates immediately (visual feedback)
3. Protocol recalculates (150ms debounce for inputs)
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

### 8.3 UI Flow Scenarios

Selection of pre-defined food

- After typing in the searchbar for Food A (e.g., "peanut butter"), select a food.
- The fields in food-a-container populate:
  - Name populated from database; protein (g) per 100 g/ml prefilled; form inferred from Type; strategy defaults to Initial dilution with threshold 0.2 g (or 0.2 ml for liquids).
  - Dosing Strategy defaults to STANDARD. Toggling to SLOW or RAPID recalculates the table.
  - The table populates automatically with default settings; then it is fully editable.

Selection of custom food

- Choose "Custom: <typed text>" from Food A search.
- Name is set to the typed string; default protein per 100 g/ml is 10 g; default form = Solid; strategy defaults to Initial dilution with 0.2 g threshold; dosing strategy = STANDARD.

Selection of built-in protocol

- Choose an entry prefixed with "Protocol:" in Food A search.
- The entire Protocol object (foods, concentrations, strategies, thresholds, steps) is loaded and rendered; remains fully editable.

What happens if a new food is loaded?

- Loading a new Food A resets and recalculates the entire protocol using the current dosing strategy and default Food A strategy/thresholds.
- Adding or changing Food B regenerates steps at and after the transition (with the duplicate transition dose); clearing Food B removes Food B steps and headers.

## 9. Validation System

### 9.1 Validation Rules

### Red Warnings (Critical Issues)

| Code | Description                            | Condition                      | Impact                                                    |
| ---- | -------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| R1   | Too few steps                          | `steps.length < 5`             | Protocol is too rapid for full OIT                        |
| R2   | Protein mismatch (Dilution)            | `                              | calculatedProtein - targetMg                              |
| R2   | Protein mismatch (Direct)              | `                              | calculatedProtein - targetMg                              |
| R5   | Insufficient protein in mix            | `servings < 1`                 | Mix doesn't contain enough protein to deliver target dose |
| R6   | Impossible dilution volume             | `mixTotalVolume < dailyAmount` | Cannot consume more than total mix volume                 |
| R7   | Invalid protein concentration (Food A) | `foodA.mgPerUnit <= 0`         | Food cannot be used for OIT                               |
| R7   | Invalid protein concentration (Food B) | `foodB.mgPerUnit <= 0`         | Food cannot be used for OIT                               |
| R8   | Invalid target protein                 | `targetMg <= 0`                | Target dose must be positive                              |
| R9   | Invalid daily amount                   | `dailyAmount <= 0`             | Daily dose must be positive                               |
| R9   | Invalid mix food amount                | `mixFoodAmount <= 0`           | Food amount must be positive                              |
| R9   | Invalid mix water amount               | `mixWaterAmount < 0`           | Water amount cannot be negative                           |

### Yellow Warnings (Practical Issues)

| Code | Description                                    | Condition                                             | Impact                                                                            |
| ---- | ---------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Y1   | Low servings                                   | `servings < minServingsForMix` AND `servings > 1`     | Mix may not last long enough; impractical                                         |
| Y2   | Non-ascending steps                            | `step[i].targetMg < step[i-1].targetMg`               | Doses should increase or stay equal                                               |
| Y3   | Impractical measurement (solid food in mix)    | `mixFoodAmount < minMeasurableMass` (dilution)        | Too small to measure accurately                                                   |
| Y3   | Impractical measurement (liquid food in mix)   | `mixFoodAmount < minMeasurableVolume` (dilution)      | Too small to measure accurately                                                   |
| Y3   | Impractical measurement (daily amount)         | `dailyAmount < minMeasurableVolume` (dilution)        | Too small to measure accurately                                                   |
| Y3   | Impractical measurement (water amount)         | `mixWaterAmount < minMeasurableVolume` (dilution)     | Too small to measure accurately                                                   |
| Y3   | Impractical measurement (solid direct)         | `dailyAmount < minMeasurableMass` (direct)            | Too small to measure accurately                                                   |
| Y3   | Impractical measurement (liquid direct)        | `dailyAmount < minMeasurableVolume` (direct)          | Too small to measure accurately                                                   |
| Y4   | High food-to-water ratio                       | `mixFoodAmount / mixWaterAmount > 0.05` (>1:20 ratio) | Volume assumption violated; may underestimate doses                               |
| Y5   | If no transition point can be found for food B | ...                                                   | Food B has no transition point. Decrease the threshold if you want to transition. |

TODO!

- Implement R3 during dilution generation. For example, around line 386 in the function generateDefaultProtocol() notes a warning should be emitted if no working dilution can be found.

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
OIT Protocol

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
  let text = `OIT Protocol\n\n`;

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
    "/tool_assets/typed_foods_rough.json",
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
    "mgPerUnit": "210"
  },
  "food_a_strategy": "DILUTE_INITIAL",
  "di_threshold": "0.2",
  "food_b": {
    "type": "SOLID",
    "name": "Roasted Peanut",
    "mgPerUnit": "250"
  },
  "food_b_threshold": "0.45",
  "table_di": [
    {
      "food": "Peanut Powder",
      "protein": "1",
      "method": "DILUTE",
      "daily_amount": "0.2",
      "mix_amount": "1",
      "water_amount": "2.5"
    },
    ...
]
```

**Notes:**

- Decimal numeric fields in protocol JSON are serialized as strings and must be rehydrated to Decimal in-app
- Protocols include pre-calculated table data (used for display only)

---

## 12. Compilation & Deployment

### 12.1 TypeScript Compilation

**Command:**

```bash
cd allergyguide
tsc static/ts/oit_calculator.ts --target ES2017 --lib ES2017,DOM --outDir static/js --skipLibCheck
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

### 13.1 Integration Test Cases

**Test 1: Loading protocol**

```
1. Load "Protocol: peanut powder"
2. Verify: protocol rendered matches the expected protocol (even if there are errors within the protocol (ie. the dosing numbers are incorrect))
```

**Test 2: Solid/Liquid Unit Display**

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

**Test 3: Validation Warnings**

```
1. Create protocol with 4 steps
2. Verify: Red warning R1 appears
3. Add steps to reach 7 total
4. Verify: R1 warning disappears
5. Edit mix amount below threshold
6. Verify: Red warning R4 appears
```

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

Of note, in the TS module, food data and protocols should be accessed through `tool_assets/typed_foods_rough.json` and `tool_assets/oit_protocols.json`; do not include `static/`

### A.2 Key Functions to consider

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

- Food A: Peanut Powder (210mg protein per g, solid)
- Dilution Strategy: Initial dilution only
- Dilution Threshold: 0.2 g
- Food B: Roasted Peanut (250mg protein per g, solid)
- Food B Threshold: 0.45 g
- Dosing Strategy: Standard

## Appendix C: Phenotype Examples and Numeric Tables

This appendix provides explicit numeric examples for the four phenotypes supported by the calculator. These tables align with clinical usage and help validate calculations.

### C.1 Food A with initial dilutions

Example: Solid X, 7 g protein per 30 g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 0.2 g              | 46.7 ml           |
| 2    | 2.5          | Dilution | 1 ml         | 0.2 g              | 18.7 ml           |
| 3    | 5            | Dilution | 1 ml         | 0.2 g              | 9.3 ml            |
| 4    | 10           | Dilution | 1 ml         | 0.2 g              | 4.7 ml            |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 5.8 ml            |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 5.8 ml            |
| 7    | 80           | Direct   | 0.3 g        | n/a                | n/a               |
| 8    | 120          | Direct   | 0.5 g        | n/a                | n/a               |
| 9    | 160          | Direct   | 0.7 g        | n/a                | n/a               |
| 10   | 240          | Direct   | 1 g          | n/a                | n/a               |
| 11   | 300          | Direct   | 1.3 g        | n/a                | n/a               |

Notes:

- For solid-in-liquid dilutions, solid volume is assumed negligible

### C.2 Food A with dilutions until maintenance

Example: Y powder, 1 g protein per 15 g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 0.5 ml       | 0.2 g              | 6.7 ml            |
| 2    | 2.5          | Dilution | 0.5 ml       | 0.2 g              | 2.7 ml            |
| 3    | 5            | Dilution | 1 ml         | 0.2 g              | 2.7 ml            |
| 4    | 10           | Dilution | 1 ml         | 0.2 g              | 1.3 ml            |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 1.7 ml            |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 1.7 ml            |
| 7    | 80           | Dilution | 4 ml         | 0.5 g              | 1.7 ml            |
| 8    | 120          | Dilution | 4 ml         | 2.0 g              | 4.4 ml            |
| 9    | 160          | Dilution | 4 ml         | 2.5 g              | 4.2 ml            |
| 10   | 240          | Dilution | 4 ml         | 4.0 g              | 4.4 ml            |
| 11   | 300          | Dilution | 4 ml         | 5.0 g              | 4.4 ml            |

### C.3 Food A without any dilutions

Example: X powder, 21 g protein per 100 g

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | ------ | ------------ | ------------------ | ---------------------- |
| 1    | 1            | Direct | 0.005 g      | n/a                | n/a                    |
| 2    | 2.5          | Direct | 0.012 g      | n/a                | n/a                    |
| 3    | 5            | Direct | 0.024 g      | n/a                | n/a                    |
| 4    | 10           | Direct | 0.048 g      | n/a                | n/a                    |
| 5    | 20           | Direct | 0.095 g      | n/a                | n/a                    |
| 6    | 40           | Direct | 0.19 g       | n/a                | n/a                    |
| 7    | 80           | Direct | 0.381 g      | n/a                | n/a                    |
| 8    | 120          | Direct | 0.571 g      | n/a                | n/a                    |
| 9    | 160          | Direct | 0.762 g      | n/a                | n/a                    |
| 10   | 240          | Direct | 1.143 g      | n/a                | n/a                    |
| 11   | 300          | Direct | 1.429 g      | n/a                | n/a                    |

### C.4 Food A → Food B transition

With this approach, the same dose is repeated at the transition point. For example, step 7 and 8 contain the same amount of protein.

Powder X: 20 g of protein per 30 g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 0.2 g              | 133 ml            |
| 2    | 2.5          | Dilution | 1 ml         | 0.2 g              | 53 ml             |
| 3    | 5            | Dilution | 2 ml         | 0.2 g              | 53 ml             |
| 4    | 10           | Dilution | 1 ml         | 0.4 g              | 27 ml             |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 17 ml             |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 17 ml             |
| 7    | 80           | Dilution | 4 ml         | 0.5 g              | 17 ml             |

After step 7 is complete, transition to:

Food X: 10 g of protein per 30 g

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | ------ | ------------ | ------------------ | ----------------- |
| 8    | 80           | Direct | 0.24 g       | n/a                | n/a               |
| 9    | 120          | Direct | 0.36 g       | n/a                | n/a               |
| 10   | 160          | Direct | 0.48 g       | n/a                | n/a               |
| 11   | 240          | Direct | 0.72 g       | n/a                | n/a               |
| 12   | 300          | Direct | 0.9 g        | n/a                | n/a               |
