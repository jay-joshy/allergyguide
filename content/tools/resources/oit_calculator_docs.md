+++
title = "Oral Immunotherapy Documentation"
date = 2025-11-23
draft = false

[extra]
keywords = "OIT"
toc = true
authors = ["Joshua Yu"]
+++

# Oral Immunotherapy Calculator

## 1. Executive Summary

Oral immunotherapy (OIT) involves a structured progressive introduction of a food. Existing tooling for generating OIT protocols for clinicians and patients are sparse and do not offer enough flexibility for the diversity of protocol phenotypes seen in clinical practice.

This tool is a free, open-source web application that helps quickly generate safe and customizable OIT protocols, with exports for both EMR and patient print-outs.

**Key Capabilities:**

- Generate protocols for OIT with configurable dose progressions with sensible defaults
- Support for solid and liquid foods
- Automatic dilution calculations
- Food A → Food B transitions at configurable thresholds
- Editable protocol tables, food characteristics, dilution strategy
- Real-time protocol validation with color-coded warnings
- ASCII export to clipboard and PDF export of plan for patients

**Remaining TODO! items**

- Add warning when target protein (mg) is too high (ie. >5000mg)
- Flesh out PDF export - at present time it only includes the protocol and custom notes
  - What information to provide to patients about OIT in general?

---

## 2. Background

### 2.1 The current landscape

OIT is an emerging approach to treating IgE-mediated food allergies, involving a progressive introduction of allergen through many 'steps', corresponding to a specific protein targets. A typical progression of protein doses / steps may be as follows, with 2-4 weeks between each step:

| Step | Protein (mg) |
| ---- | ------------ |
| 1    | 1            |
| 2    | 2.5          |
| 3    | 5            |
| 4    | 10           |
| 5    | 20           |
| 6    | 40           |
| 7    | 80           |
| 8    | 120          |
| 9    | 160          |
| 10   | 240          |
| 11   | 300          |

The goals of OIT can be achieved with many different protocols, and **there is substantial heterogeneity in how OIT is implemented across Canada and between individual physicians**. That variability may manifest in different forms of food (powders, whole, liquid), when/how dilution is used, how many total steps are taken, the protein target for each step, among others. While there is little evidence that specific dosing schedules are superior to others, the ability to create, edit, and adapt protocols for a patient’s specific situation is clearly important.

### 2.2 The problem

There is no easy, freely accessible resource to generate customizable EMR and patient friendly protocols that takes into account these variations. Many current practices rely on time-intensive and manual approaches to make protocols, with more room for human error.

### 2.3 Goal of project

A tool that can generate safe and customizable OIT protocols, with exports for both EMR and patient print-outs. It should offer configurable dose progressions with sensible defaults and the ability to dynamically edit protocols with built-in validation.

## 3. Key assumptions and defaults

### 3.1 Dosing Strategies

There is a large variety of dosing progressions used in the literature and clinical practice. For now, I have chosen to expose the following three settings to users (which are open for editing):

- **Standard** (11 steps): [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300] mg
- **Slow** (19 steps): [0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300] mg
- **Rapid** (7 steps): [5, 10, 20, 40, 80, 160, 300] mg

### 3.2 Phenotypes of OIT

We assume four major phenotypes of OIT:

1. Food A, with initial dilutions before the direct food is given. The transition usually occurs once the weight of undiluted food is easily measurable.

2. Food A, with dilutions all the way to maintenance dose.

3. Food A, without any dilutions. Usually not feasible especially with low dose steps; can be done if compounded by pharmacy but not widely available.

4. Food A -> Food B at a transition point. The formulation of food A could be either with dilutions only, mixed dilutions, or no dilutions.

### 3.3 Diliution

We assume the volume of a solid dissolved into the liquid (usually water) is negligible - _provided that the w/v remains < 5%_. For example: if 1 ml of a solution of 0.2g of peanut powder in 40ml of liquid is given, we assume that only 0.2g * 1/40 = 0.005g is actually ingested.

### 3.4 Defining a protocol

```ts
interface Food {
  name: string;
  type: FoodType;
  mgPerUnit: number;
}

enum Method {
  DILUTE = "DILUTE",
  DIRECT = "DIRECT",
}

enum DosingStrategy {
  STANDARD = "STANDARD",
  SLOW = "SLOW",
  RAPID = "RAPID",
}

interface Step {
  targetMg: number;
  method: Method;
  dailyAmount: number;
  dailyAmountUnit: Unit;
  mixFoodAmount?: number;
  mixWaterAmount?: number;
  food: "A" | "B";
}

interface Protocol {
  dosingStrategy: DosingStrategy;
  foodA: Food;
  foodAStrategy: FoodAStrategy;
  diThreshold: number;
  foodB?: Food;
  foodBThreshold?: { unit: Unit; amount: number };
  steps: Step[];
}
```

### 3.5 Default assumptions about measurements and accuracy

We assume several defaults, based on scales having a resolution of 0.01g and syringes used by parents to have a resolution of 0.1ml:

```ts
const SOLID_RESOLUTION: number = 2;
const LIQUID_RESOLUTION: number = 1;

interface ProtocolConfig {
  minMeasurableMass: number; // Minimal mass that is practically measurable by scale.
  minMeasurableVolume: number; // Minimal mass that is practically measurable by syringe.
  minServingsForMix: number; // Minimal servings for dilution mix (must be >= 1)
  PROTEIN_TOLERANCE: number; // allowable percent deviation of calculated actual protein target and targetmg. ie. 0.05. Understanding that in real life there is limited resolution of measurement so the actual protein content may be slightly different from the target to an allowable degree
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: number; // At what amount of Food A do you switch to direct dosing?
  DEFAULT_FOOD_B_THRESHOLD: number; // At what amount of Food B do you switch from Food A to Food B?
  MAX_SOLID_CONCENTRATION: number; // max g/ml w/v for solid diluted into liquids (default 0.05). Assume that if the solid concentration is above this threshold, then the solid contributes non-negligibly to the total volume of the mixture and calculated protein becomes inaccurate.
}

// Where defaults are:
  minMeasurableMass: 0.2, // assume that scales for patients have resolution of 0.01g
  minMeasurableVolume: 0.2, // assume that syringes used has resolution of 0.1ml
  minServingsForMix: 3, // want mixture to last at least 3 days
  PROTEIN_TOLERANCE: 0.05, // percent difference allowable
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: 0.2,
  DEFAULT_FOOD_B_THRESHOLD: 0.2,
  MAX_SOLID_CONCENTRATION: 0.05,
```

### 3.6 Editing a protocol - validation and unintended side effects

Because of the freedom provided to the user to edit a protocol, unintended side-effects inevitably can arise. Having a stringent set of graded checks for both critical (red) and milder (yellow) potential issues in addition to programmatically limiting certain choices is crucial for safe output.

Some examples of programmatically limiting invalid inputs include disallowing negative inputs, hiding input fields when not valid, not allowing deletion of the last step, limiting protein concentration to 150g per 100g serving of food.

The set of validation rules are documented [here](@/tools/resources/oit_calculator_validation.md): they are applied on each generation and edit of a protocol.

### 3.7 Pre-defined foods to search for

- Data for each food including protein content per 100g was obtained from Health Canada [(Canadian Nutrient File, Health Canada, 2015)](https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data/canadian-nutrient-file-about-us.html)
- However, CNF does not define what is a 'SOLID' vs 'LIQUID'
- We assume that for liquids that a 100g serving is essentially equilvalent to 100ml, _but this should be double checked in real life._

## 4. User workflow

1. User searches for Food A, which can be either a custom food or pre-defined food/existing protocol.

- If a protocol is selected, it is loaded 'as-is' - including with any mistakes.
- If a food is selected, defaults for dilution strategy, threshold, and dosing strategy are set and table is rendered. Defaults for custom food protein concentration and form are assumed.

2. User now has the option to edit Food A settings, dosing strategy, individual steps, and/or add a transition Food B.

- Food A settings: name, protein concentration, food type, dilution strategy and dilution threshold
- Step settings: target protein, daily amount, and mix amount (if dilution)

3. User reviews any warnings and edits as needed
4. User exports protocol to either clipboard or PDF for patient

---

# Technical Specification

## 1. File overview and stack

```txt
allergyguide/
├── templates/shortcodes/
│ └── oit_calculator.html 
│
├── static/
│ ├── ts/
│ │ └── oit_calculator.ts 
│ │
│ ├── js/
│ │ └── oit_calculator.js # Compiled js
│ │
│ └── tool_assets/
│ ├── typed_foods_rough.json # Food database (~500 foods) - TODO! needs fixing
│ └── oit_protocols.json # Pre-built protocol templates
│
├── sass/shortcodes/
│ └── _oit_calculator.scss 
│
└── content/tools/
  └── oit_calculator.md
```

---

**Stack**:

- TypeScript (ES2017 target)
- HTML5
- SCSS compiled to CSS by Zola

**Dependencies**:

- `decimal.js` - High-precision decimal arithmetic
- `fuzzysort` - Fuzzy search for food/protocol lookup
- `ascii-table3` - ASCII table generation
- `jspdf` - PDF generation
- `jspdf-autotable` - plugin for jsPDF

---

## 2. TypeScript Interfaces & Enums

```typescript
// ============================================
// ENUMS
// ============================================

enum DosingStrategy {
  STANDARD = "STANDARD",
  SLOW = "SLOW",
  RAPID = "RAPID",
}
enum FoodType {
  SOLID = "SOLID",
  LIQUID = "LIQUID",
}
enum Method {
  DILUTE = "DILUTE",
  DIRECT = "DIRECT",
}
enum FoodAStrategy {
  DILUTE_INITIAL = "DILUTE_INITIAL",
  DILUTE_ALL = "DILUTE_ALL",
  DILUTE_NONE = "DILUTE_NONE",
}
type Unit = "g" | "ml";
interface Food {
  name: string;
  type: FoodType;
  mgPerUnit: Decimal; // mg of protein per gram or ml of food. Canonical protein unit for calculations in the tool
}
interface Step {
  stepIndex: number;
  targetMg: Decimal;
  method: Method;
  dailyAmount: Decimal;
  dailyAmountUnit: Unit;
  mixFoodAmount?: Decimal;
  mixWaterAmount?: Decimal;
  servings?: Decimal;
  food: "A" | "B";
}
interface ProtocolConfig {
  minMeasurableMass: Decimal; // Minimal mass that is practically measurable by scale.
  minMeasurableVolume: Decimal; // Minimal mass that is practically measurable by syringe.
  minServingsForMix: Decimal; // Minimal servings for dilution mix (must be >= 1)
  PROTEIN_TOLERANCE: Decimal; // allowable percent deviation of calculated actual protein target and targetmg. ie. 0.05. Understanding that in real life there is limited resolution of measurement so the actual protein content may be slightly different from the target to an allowable degree
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: Decimal; // At what amount of Food A do you switch to direct dosing?
  DEFAULT_FOOD_B_THRESHOLD: Decimal; // At what amount of Food B do you switch from Food A to Food B?
  MAX_SOLID_CONCENTRATION: Decimal; //  max g/ml ratio for solid diluted into liquids (default 0.05). Assume that if the solid concentration is above this threshold, then the solid contributes non-negligibly to the total volume of the mixture.
}
interface Protocol {
  dosingStrategy: DosingStrategy;
  foodA: Food;
  foodAStrategy: FoodAStrategy;
  diThreshold: Decimal;
  foodB?: Food;
  foodBThreshold?: { unit: Unit; amount: Decimal };
  steps: Step[];
  config: ProtocolConfig;
}
interface Warning {
  severity: "red" | "yellow";
  code: string;
  message: string;
  stepIndex?: number;
}
interface Candidate {
  mixFoodAmount: Decimal;
  mixWaterAmount: Decimal;
  dailyAmount: Decimal;
  mixTotalVolume: Decimal;
  servings: Decimal;
}

// *Data are what the .json data files are loaded into first
interface FoodData {
  Food: string;
  "Food Group": string;
  "Mean value in 100g": number; // before use in calculations should be converted into Decimal
  Type: string; // SOLID or LIQUID
}
interface ProtocolData {
  name: string;
  dosing_strategy: string;
  food_a: {
    type: string;
    name: string;
    mgPerUnit: string;
  };
  food_a_strategy: string;
  di_threshold: string;
  food_b?: {
    type: string;
    name: string;
    mgPerUnit: string;
  };
  food_b_threshold?: string;
  table_di: any[]; // steps for protocol using dilution initial strategy
  table_dn: any[]; // steps for protocol using dilution none strategy
  table_da: any[]; // steps for protocol using dilution all strategy
  custom_note?: string;
}
```

---

## 3. Design Decisions & Invariants

- Canonical units (of note: in the UI the unit asked for is g of protein per either 100ml or 100g):
  - Solids: mg per gram (mg/g)
  - Liquids: mg per millilitre (mg/ml)
- Precision: Use Decimal for all arithmetic; format only for display/export.
- Serialization: Store Decimal fields as strings in JSON state for protocols and rehydrate on load.
- BOTH red and yellow warnings are non-blocking

## 4. Core Algorithms

### 4.1 Dilution Calculation Algorithm

**Asssumptions**

- As noted before, when diluting a solid into a liquid, solids are assumed to have zero volume.
- Default candidate options for various parameters used to calculate optimal dilutions. These are chosen based on ease of measurement by a patient / family - they are fairly arbitrary and reflect a range of measurements seen in my personal experience.

```txt
const SOLID_MIX_CANDIDATES = [
  0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 1, 2, 5, 10, 12, 14, 16, 18, 20, 25, 30
].map((num) => new Decimal(num));
const LIQUID_MIX_CANDIDATES = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 14, 16, 18, 20, 25, 30
].map((num) => new Decimal(num));
const DAILY_AMOUNT_CANDIDATES = [
  0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7, 9, 10, 11, 12,
].map((num) => new Decimal(num));
const MAX_MIX_WATER = new Decimal(500);
```

**Inputs and outputs:**

- @param P Target protein per dose, in mg
- @param food Food used for the dilution (determines unit logic)
- @param config Protocol configuration and constraints
- @returns Array of feasible, sorted Candidate items

**Algorithm:**

```ts
  const candidates: Candidate[] = [];
  const mixCandidates =
    food.type === FoodType.SOLID ? SOLID_MIX_CANDIDATES : LIQUID_MIX_CANDIDATES;

  // Calculate minimum dailyAmount to achieve `dailyAmount > P / (MAX_SOLID_CONCENTRATION × mgPerUnit)`
  // For ratio = mixFood / mixWaterAmount < MAX_SOLID_CONCENTRATION
  // Recall: mixWaterAmount = mixTotalVolume = dailyAmount × servings
  // & servings = (mixFood × mgPerUnit) / P
  // => ratio = P / (dailyAmount × mgPerUnit)
  // => MAX_SOLID_CONCENTRATION > P / (dailyAmount × mgPerUnit)
  // => dailyAmount > P / (MAX_SOLID_CONCENTRATION × mgPerUnit)
  const minDailyForLowConcentration =
    food.type === FoodType.SOLID
      ? P.dividedBy(config.MAX_SOLID_CONCENTRATION.times(food.mgPerUnit))
      : null;

  for (const mixFoodValue of mixCandidates) {
    const mixFood: Decimal = mixFoodValue;

    for (const dailyAmountValue of DAILY_AMOUNT_CANDIDATES) {
      const dailyAmount: Decimal = dailyAmountValue;

      // SOLID IN LIQUID - volume of solid is negligible
      if (food.type === FoodType.SOLID) {
        const totalMixProtein = mixFood.times(food.mgPerUnit);
        const servings = totalMixProtein.dividedBy(P);

        if (servings.lessThan(config.minServingsForMix)) continue;

        const mixTotalVolume = dailyAmount.times(servings);
        const mixWaterAmount = mixTotalVolume;

        // Validate constraints
        if (mixFood.lessThan(config.minMeasurableMass)) continue;
        if (dailyAmount.lessThan(config.minMeasurableVolume)) continue;
        if (mixWaterAmount.greaterThan(MAX_MIX_WATER)) continue;
        if (mixWaterAmount.lessThan(config.minMeasurableVolume)) continue;

        // Check protein tolerance
        const actualProteinPerMl = totalMixProtein.dividedBy(mixTotalVolume);
        const actualProteinDelivered = actualProteinPerMl.times(dailyAmount);
        if (
          actualProteinDelivered
            .dividedBy(P)
            .minus(1)
            .abs()
            .greaterThan(config.PROTEIN_TOLERANCE)
        )
          continue;

        candidates.push({
          mixFoodAmount: mixFood,
          mixWaterAmount,
          dailyAmount,
          mixTotalVolume,
          servings,
        });
      } else {
        // Liquid in liquid - volumes are additive
        const totalMixProtein = mixFood.times(food.mgPerUnit);
        const servings = totalMixProtein.dividedBy(P);

        if (servings.lessThan(config.minServingsForMix)) continue;

        const mixTotalVolume = dailyAmount.times(servings);
        const mixWaterAmount = mixTotalVolume.minus(mixFood);

        // test against constraints
        if (mixWaterAmount.lessThan(0)) continue;
        if (mixFood.lessThan(config.minMeasurableVolume)) continue;
        if (dailyAmount.lessThan(config.minMeasurableVolume)) continue;
        if (mixWaterAmount.greaterThan(MAX_MIX_WATER)) continue;
        if (mixWaterAmount.lessThan(config.minMeasurableVolume)) continue;

        const actualProteinPerMl = totalMixProtein.dividedBy(mixTotalVolume);
        const actualProteinDelivered = actualProteinPerMl.times(dailyAmount);
        if (
          actualProteinDelivered
            .dividedBy(P)
            .minus(1)
            .abs()
            .greaterThan(config.PROTEIN_TOLERANCE)
        )
          continue;

        candidates.push({
          mixFoodAmount: mixFood,
          mixWaterAmount,
          dailyAmount,
          mixTotalVolume,
          servings,
        });
      }
    }
  }

  // Sort candidates
  candidates.sort((a, b) => {
    // For SOLID: prioritize candidates meeting the low concentration constraint
    if (food.type === FoodType.SOLID && minDailyForLowConcentration) {
      const aMeetsRatio = a.dailyAmount.greaterThanOrEqualTo(
        minDailyForLowConcentration,
      );
      const bMeetsRatio = b.dailyAmount.greaterThanOrEqualTo(
        minDailyForLowConcentration,
      );

      if (aMeetsRatio && !bMeetsRatio) return -1;
      if (!aMeetsRatio && bMeetsRatio) return 1;
    }

    // Then apply remaining sort criteria
    let cmp = a.mixFoodAmount.comparedTo(b.mixFoodAmount);
    if (cmp !== 0) return cmp;
    cmp = a.dailyAmount.comparedTo(b.dailyAmount);
    if (cmp !== 0) return cmp;
    cmp = a.mixTotalVolume.comparedTo(b.mixTotalVolume);
    if (cmp !== 0) return cmp;
    return a.mixWaterAmount.comparedTo(b.mixWaterAmount);
  });

  return candidates;
}
```

### 4.2 Default protocol generation algorithm

Build a default protocol for Food A using the default dosing strategy.

**Inputs and outputs**

- @param food Food A
- @param config Protocol configuration and constraints
- @returns Protocol with Food A steps populated

**Algorithm:**

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
   - Find dilution candidates
   - Select best candidate
   - Create Step

   d. Else (direct dosing):
   - Create step with:
     - method = DIRECT
     - dailyAmount = neatMass
     - dailyAmountUnit = food type ("g" or "ml")
     - No mix parameters

3. Return Protocol object with all steps

### 4.3 Food B Addition

**Assumptions**:

- We have access to the global protocol state and therefore all defined steps
- foodB has already been selected and has mgPerUnit (mg per g or mg per ml) and type (SOLID/LIQUID)
- We have decided that Food B dosing is always DIRECT (no dilution) when transition happens

**Inputs:**

- @param protocol Protocol to modify (will be mutated)
- @param foodB Food B definition
- @param threshold Threshold to begin Food B, unit-specific amount (g/ml)

**Algorithm**

1. Calculate the mg of protein foodBThreshold corresponds to: foodBThreshold * foodB.mgPerUnit (mg). Term this `foodBmgThreshold`
2. Scanning through the steps of food A, once food A reaches a step `n` whose target protein is >= `foodBmgThreshold`, then step `n+1` will be food B. Importantly step `n+1` (food B's first step) will have the SAME protein target as step `n`.
3. Then append the remaining targets (the original sequence after n) but treat them as Food-B (direct dosing). Net result: protocol length increases by 1; the first Food-B step duplicates the previous Food-A protein target.

- the remaining post-transition targets come from the original protocol.steps target sequence

4. If there is no step of Food A where the target protein is >= `foodBmgThreshold`, then food B will not be added to the protocol and a yellow warning will be emitted to lower the threshold.

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

## 5. Component Specifications

### 5.1 Search Inputs

**Food A Search:**

- Functionality:
  - Fuzzy search both foods and protocols
  - Debounced (≈150ms)
  - Shows dropdown with results
  - Supports custom food creation

**Food B Search:**

- Functionality:
  - Fuzzy search foods only (not protocols)
  - Same search behavior as Food A, supports custom food creation
  - Clearing resets to Food A only and recalculates protocol

### 5.2 Food settings

**Food A Settings:**

- Name input (editable text)
- Protein concentration input (number + unit)
  - Unit label changes based on form (g/100g or g/100ml)
- Form toggles: [Solid] [Liquid]
  - Active button highlighted
- Dilution strategy toggles: [Initial dilution] [Dilution throughout] [No dilutions]. If not specified the default is [Initial dilution]
- Threshold input (only shown for "Initial dilution")
  - Unit: g or ml (based on form)

**Food B Settings:**

- Same as Food A except:
  - No dilution strategy (uses Food A strategy)

### 5.3 Dosing Strategy

- Three toggle buttons: [Standard] [Slow] [Rapid]
- Active button highlighted
- Displays centered in own row

### 5.4 Protocol Table

**Columns:**

1. Actions (+ and - buttons)
2. Step # (non-editable)
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
- Debounced updates (150ms)
- Recalculates protocol on blur

**Action Buttons:**

- (+) and (−) immediately to the left of the step number
- Clicking (+) inserts a copy of the current row after current (ie. if you press + on step 5, then step 5 remains the same, and a copy of step 5 is inserted after it); clicking (−) deletes the step.
- Inserting duplicates all editable fields of the current row including method and mix values.
- Deleting last step: disallow deletion if it would leave zero steps — enforce minimum 1 step.

**Unit Display:**

- Resolution for decimal places for solids and liquids defined by constants
- For SOLID foods: "Amount for mixture" must display with "g" (grams).
- For LIQUID foods: "Amount for mixture" must display with "ml" (milliliters).
- Unit is determined by the current food's type property
- Daily amount for dilutions always uses "ml"
- Daily amount for direct dosing uses food's unit (g or ml)

---

## 6. Editing behaviour

NOTE: If a built-in protocol is loaded that has both a Food A and a food B with custom target values, the loaded targets should be kept. use the existing target sequence for the post-transition portion. The validation check still runs.

### 6.1 Food settings modification

- Changes to food name immediately seen in table and exports
- Change in protein concentration triggers full recalculation of table
- User can toggle food type (solid/liquid), with recalculations if method is DILUTION
  - Form toggles: If you toggle a food's form (SOLID ⇄ LIQUID) the app converts existing daily and mix amounts using 1 g ≈ 1 ml and recomputes water (solid-in-liquid volume assumption changes accordingly). Ie. if step X has targetMg of 10mg, and mixAmount is 0.5g, waterAmount is 10ml, then once it is switched to liquid the mixAmount becomes 0.5ml, waterAmount becomes 9.5ml. Vise versa.
  - Recalculates entire protocol (method and mix parameters), but preserves existing target mg protein targets
- User can change dilution strategy
  - Recalculates methods and dilutions for all steps, _but preserves existing target mg protein targets_
- User can change dosing strategy
  - Clicking Standard/Slow/Rapid button triggers immediate recalculation and RESET of step # and protein targets
  - Changes step count (11/19/9). However, edge case if food B already selected; food B is added again with its associated settings preserved
  - Preserves Food A/B configuration
  - Loaded protocols are treated like a blank canvas: changing dosing strategy regenerates and overwrites loaded targets
- User can adjust thresholds for dilution of food A: table will recalculates DILUTE/DIRECT methods, upon edits of food A threshold _but preserve target mg_

### 6.2 What happens if a new food is loaded?

- Loading a new Food A resets and recalculates the entire protocol using the current dosing strategy and default Food A strategy/thresholds.
- Adding or changing Food B regenerates steps at and after the transition (with the duplicate transition dose); clearing Food B removes Food B steps and headers.

### 6.3 Changing dosing strategy

- Clicking a strategy button immediately regenerates the entire protocol and resets steps to default steps for that strategy
- All dilution parameters recalculated
- Table re-renders completely
- This is DIFFERENT from Food A strategy changes (which preserve custom targets)

### 6.4 Food B

Recompute the transition whenever any of these change:

- foodB selection
- foodBThreshold
- Food A mgPerUnit changes
- any targetMg in steps 1..current_transition_index: If user manually edited post-transition targets, preserve them until the next “recompute” event.
- Dosing strategy change

### 6.5: Step editing behaviour

- when editing target protein (P):
  - DIRECT steps: Editing targetMg recalculates dailyAmount.
  - DILUTE steps: keep dailyAmount and mixFoodAmount constant if possible; update mixWaterAmount
    - recompute servings = (mixFoodAmount × mgPerUnit) / targetMg; if servings < minServingsForMix OR mixWaterAmount > MAX_MIX_WATER, show Y/R as appropriate and still update dailyAmount = mixTotalVolume / servings (preserve mixFoodAmount). If constraints make it impossible (mixTotalVolume < dailyAmount), a warning is emitted
- when editing daily amount:
  - DIRECT: Recalculates target protein P for the step.
  - DILUTE: keep mixFoodAmount fixed; update mixWaterAmount
- when editing mixFoodAmount (only for dilutions): recompute mixWaterAmount to keep P and dailyAmount unchanged.
- User can add steps between existing steps
- User can remove steps (minimum 1 step)

---

## 7. Export Features

### 7.1 ASCII

Designed for easy input into EMR (not for patient). Assumes user can use a monospace font. So far cannot think of a nice space efficient way to display the steps that fits well with any font.

Example output:

```txt
Elmhurst Milked Almonds Unsweetened Beverage (Liquid). Protein: 20.0 mg/ml
Almonds (dry roasted, unblanched) (Solid). Protein: 210.0 mg/g

+------------------------------------------------------------------+
|           Elmhurst Milked Almonds Unsweetened Beverage           |
+------+---------+--------+--------------+-------------------------+
| Step | Protein | Method | Daily Amount |       Mix Details       |
+------+---------+--------+--------------+-------------------------+
|    1 | 1.0 mg  | DILUTE | 1 ml         | 1 ml food + 19 ml water |
|    2 | 2.5 mg  | DILUTE | 1 ml         | 1 ml food + 7 ml water  |
|    3 | 5.0 mg  | DILUTE | 1 ml         | 1 ml food + 3 ml water  |
|    4 | 10.0 mg | DIRECT | 0.5 ml       | N/A                     |
|    5 | 20.0 mg | DIRECT | 1 ml         | N/A                     |
|    6 | 40.0 mg | DIRECT | 2 ml         | N/A                     |
|    7 | 80.0 mg | DIRECT | 4 ml         | N/A                     |
+------+---------+--------+--------------+-------------------------+
--- TRANSITION TO: ---
+-------------------------------------------------------+
|           Almonds (dry roasted, unblanched)           |
+------+----------+--------+--------------+-------------+
| Step | Protein  | Method | Daily Amount | Mix Details |
+------+----------+--------+--------------+-------------+
|    8 | 80.0 mg  | DIRECT | 0.40 g       | N/A         |
|    9 | 120.0 mg | DIRECT | 0.60 g       | N/A         |
|   10 | 160.0 mg | DIRECT | 0.80 g       | N/A         |
|   11 | 240.0 mg | DIRECT | 1.10 g       | N/A         |
|   12 | 300.0 mg | DIRECT | 1.40 g       | N/A         |
+------+----------+--------+--------------+-------------+
========================================
NOTES
========================================
Make a new almond milk mixture at least every 3 days. Refrigerate and mix well before giving. Please purchase Elmhurst Milked Almonds Unsweetened Beverage with 5 grams of protein per 1 cup (250mL) serving.
```

### 7.2 PDF

See `exportPDF()` function.

## 8. Data Files

### 8.1 Food Database (`typed_foods_rough.json`)

Format:

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

- Loaded on initialization.
- Note: Type is not part of the original CNF 2015 files. There is an implicit assumption that 1g ~ 1ml in terms of serving size.

### 8.2 Protocol Templates (`oit_protocols.json`)

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

## 9. Compilation & Deployment

**Command:**

```bash
cd allergyguide
npm run build_oit
```
