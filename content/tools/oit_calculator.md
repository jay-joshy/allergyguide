+++
title = "OIT Calculator"
description = "Generate EMR and patient ready protocols for oral immunotherapy to any food."
date = 2025-11-08
draft = false

[taxonomies]
tags = ["tools"]
[extra]
keywords = "immunotherapy"
toc = true
authors = ["Joshua Yu"]
+++

</br>
</br>

{{ oit_calculator() }}

# OIT Calculator:

## Background and rationale:

Oral immunotherapy (OIT) is an emerging approach to treating IgE-mediated food allergies. It involves a structured progressive introduction of a food through many 'steps', each corresponding to a particular protein target: most commonly, the last step (the maintenance dose) is 300mg of food protein.

A typical 'standard' progression of protein doses / steps is as follows, with 2-4 weeks between each step:

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

The goals of OIT can be achieved with many different protocols: there is substantial heterogeneity in how OIT is implemented across Canada and between individual physicians. That variability manifests in different forms of food (powders, whole, liquid), when dilution is used, how many total steps are taken, the protein target for each step, among others. For example, for a very high-risk patient there may be a 'slow' dose progression starting from 0.5mg to 300mg in 20 steps instead of 11; in the setting of anti-IgE biologics, the steps may be reduced in a 'rush/rapid' strategy. While there is little evidence that specific dosing schedules are superior to others, the ability to create, edit, and adapt protocols for a patient’s specific situation is clearly important.

However, there is no easy, accessible resource to generate customizable EMR and patient friendly protocols that takes into account these myriad variations, and many current practices rely on time-intensive and manual approaches to make protocols with more room for human error.

## Important facts about OIT

1. Foods for OIT can be liquids or solids
2. The protein content of each food is required information. For example, peanut butter has ~23g of protein per 100g of peanut butter, or 230mg of protein per g of peanut butter. Milk has about 9 grams of protein per 250ml, or 36mg of protein per ml of milk
3. At initial steps, the amount of protein is so small that often the food requires dilution first.

- With solids diluted into liquids, we assume the solid contributes negligibly to the final volume as long as the ratio between grams of food and ml of water is <1:10. For example: if 1 ml of a solution of 0.2g of peanut powder in 40ml of liquid is given, we assume that only 0.2g * 1/40 = 0.005g is actually ingested
- With liquids diluted into liquids, we assume the liquid contributes to the final volume. For example: if 1 ml of a solution of made of 0.2 ml of milk + 39.8 ml of water is given, only 0.2 ml * (1/(0.2+39.8)) = 0.005ml of actual milk is given

4. There are four 'phenotypes' of OIT:

- Food A with initial dilutions before the direct food is given. This is the most common strategy. The transition occurs once the weight of undiluted food is easily measurable. Ie. Steps 1-3 are peanut powder diluted in water, then steps 4 - maintenance are powder only.
- Food A with dilutions all the way to maintenance dose. More useful if parents want something they can measure once and then more easily give for a few days, instead of weighing something every day. Can often be cumbersome at higher doses.
- Food A without any dilutions. Usually not feasible especially in the first low dose steps (weight would be very hard to measure); can be done if compounded by pharmacy but not widely available.
- Food A -> Food B at some point. The formulation of food A could be either with dilutions only, mixed dilutions, or no dilutions. Ie. Steps 1-5 are cod powder diluted in water, then steps 6 - maintenance are cooked cod once weight of food is easily measurable. Another example is steps 1-2 are code powder diluted in water, 3-5 are powder only, and 6 onwards is cooked cod.

Examples of the phenotypes in table form:

#### Food A with initial dilutions

Liquid X, 8g protein per 250ml

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 1 ml               | 31 ml             |
| 2    | 2.5          | Dilution | 1 ml         | 1 ml               | 11.8 ml           |
| 3    | 5            | Dilution | 1 ml         | 1 ml               | 5.4 ml            |
| 4    | 10           | Direct   | 0.3 ml       | n/a                | n/a               |
| 5    | 20           | Direct   | 0.6 ml       | n/a                | n/a               |
| 6    | 40           | Direct   | 1.3 ml       | n/a                | n/a               |
| 7    | 80           | Direct   | 2.5 ml       | n/a                | n/a               |
| 8    | 120          | Direct   | 3.8 ml       | n/a                | n/a               |
| 9    | 160          | Direct   | 5 ml         | n/a                | n/a               |
| 10   | 240          | Direct   | 7.5 ml       | n/a                | n/a               |
| 11   | 300          | Direct   | 9.4 ml       | n/a                | n/a               |

Solid X, 7g protein per 30g

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

#### Food A with dilutions until maintenance

Y powder, 1g protein per 15g

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

#### Food A without any dilutions

X powder, 21g protein per 100g

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

OR if the food is a liquid:

X milk, 1g protein per 250 ml

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture (mL) |
| ---- | ------------ | ------ | ------------ | ------------------ | ---------------------- |
| 1    | 1            | Direct | 0.3 ml       | n/a                | n/a                    |
| 2    | 2.5          | Direct | 0.6 ml       | n/a                | n/a                    |
| 3    | 5            | Direct | 1.3 ml       | n/a                | n/a                    |
| 4    | 10           | Direct | 2.5 ml       | n/a                | n/a                    |
| 5    | 20           | Direct | 5.0 ml       | n/a                | n/a                    |
| 6    | 40           | Direct | 10.0 ml      | n/a                | n/a                    |
| 7    | 80           | Direct | 20.0 ml      | n/a                | n/a                    |
| 8    | 120          | Direct | 30.0 ml      | n/a                | n/a                    |
| 9    | 160          | Direct | 40.0 ml      | n/a                | n/a                    |
| 10   | 240          | Direct | 60.0 ml      | n/a                | n/a                    |
| 11   | 300          | Direct | 75.0 ml      | n/a                | n/a                    |

#### Food A -> Food B

With this approach, the same dose is repeated at the transition point. For example, step 7 and 8 contain the same amount of protein:

Powder X: 20g of protein per 30g

| Step | Protein (mg) | Method   | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | -------- | ------------ | ------------------ | ----------------- |
| 1    | 1            | Dilution | 1 ml         | 0.2 g              | 133 ml            |
| 2    | 2.5          | Dilution | 1 ml         | 0.2 g              | 53 ml             |
| 3    | 5            | Dilution | 2 ml         | 0.2 g              | 53 ml             |
| 4    | 10           | Dilution | 1 ml         | 0.4 g              | 27 ml             |
| 5    | 20           | Dilution | 1 ml         | 0.5 g              | 17 ml             |
| 6    | 40           | Dilution | 2 ml         | 0.5 g              | 17 ml             |
| 7    | 80           | Dilution | 4 ml         | 0.5 g              | 17 ml             |

after step 7 is complete, transitions to:

Food X: 10g of protein per 30g

| Step | Protein (mg) | Method | Daily amount | Amount for mixture | Water for mixture |
| ---- | ------------ | ------ | ------------ | ------------------ | ----------------- |
| 8    | 80           | Direct | 0.24 g       | n/a                | n/a               |
| 9    | 120          | Direct | 0.36 g       | n/a                | n/a               |
| 10   | 160          | Direct | 0.48 g       | n/a                | n/a               |
| 11   | 240          | Direct | 0.72 g       | n/a                | n/a               |
| 12   | 300          | Direct | 0.9 g        | n/a                | n/a               |

4. Different phenotypes of how OIT is offered suit different patients and families: flexibility to switch easily is an advantage

## Defining an OIT protocol - what information is required?

Recall that:

- Food A may be given either 1) diluted for all steps, 2) not diluted (neat) for all steps, or 3) diluted initially for the first few steps until the undiluted form is easily measurable with a kitchen scale
- Food A may OPTIONALLY transition to another form of the food, called Food B. For example, Salmon powder (Food A) diluted/undiluted/both for 7 steps before cooked salmon (Food B) is given for step 8 until maintenance

Therefore, a complete OIT protocol must contain the following information (expressed in TypeScript here):

```ts
type Unit = "g" | "ml";

enum Method {
  DILUTE = "DILUTE",
  DIRECT = "DIRECT",
}
enum FoodType {
  SOLID = "SOLID",
  LIQUID = "LIQUID",
}

enum DosingStrategy {
  STANDARD = "STANDARD", // Mg steps: 1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300
  SLOW = "SLOW", // Mg steps: 0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300
  RAPID = "RAPID", // Mg steps: 1, 2.5, 5, 10, 20, 40, 80, 160, 300
}

interface Food {
  name: string;
  type: FoodType;
  // canonical: mg protein per canonical unit (g for solids, ml for liquids)
  mgPerUnit: Decimal; // mg/g or mg/ml
}

interface Step {
  stepIndex: number;
  targetMg: Decimal;
  method: Method;
  dailyAmount: Decimal; // g or ml depending on context
  dailyAmountUnit: Unit;
  mixFoodAmount?: Decimal; // g or ml of food used in the mix (if DILUTE)
  mixWaterAmount?: Decimal; // total volume of water to add to create dilution (if DILUTE)
  servings?: Decimal; // mixWaterAmount / dailyAmount IF solid; for liquids, (mixWaterAmount + mixFoodAmount) / dailyAmount
}

interface Protocol {
  dosingStrategy: DosingStrategy;
  foodA: Food;
  foodAStrategy: "DILUTE_INITIAL" | "DILUTE_ALL" | "DILUTE_NONE";
  diThreshold: Decimal; // canonical unit (g or ml) for switching from dilute->direct, applies if foodAStrategy is DILUTE_INITIAL
  foodB?: Food;
  foodBThreshold?: { unit: Unit; amount: Decimal }; // once you can measure the food in either (g) or (ml) reliably on a scale or syringe as defined by the threshold, transition to foodB
  steps: Step[];
  config: {
    minMeasurableMass: Decimal; // default 0.1 g
    minMeasurableVolume: Decimal; // default 0.2 ml
    minServingsForMix: number; // default 3
  };
}
```

## How are default initial steps calculated?

Notation:

- `P` = desired protein (mg) for a step
- `C` = concentration mg per gram (solid) or mg per ml (liquid)
- `m` = mass (g OR ml) of food required if used neat: `m = P / C` (if solids, g; if liquids, ml if C is mg/ml)

Example solids: C = 233.333 mg/g, P=1 mg → m ≈ 0.004 g
Example liquids: C = 4 mg/ml, P=20 mg → m = 20 / 4 = 5 ml

### If foodAStrategy is DILUTION_NONE

- method is set as DIRECT
- dailyAmount = m

### How to determine when dilutions are required?

1. Compute the neat mass for P: `P / food.mgPerUnit`
2. If:

- food.type == "SOLID" and m < config.minMeasurableMass, then dilution is required
- food.type == "LIQUID" and m < config.minMeasurableVolume, then dilution is required

diThreshold refers to a threshold on the neat mass (m = P/C); i.e. once the required mass for a given P is ≥ threshold we switch to DIRECT

#### If dilutions are required, how to calculate default daily volume, mixFoodAmount, mixWaterAmount?

Goal: choose a measurable mixFoodAmount and mixWaterAmount so that giving dailyAmount (ml) yields desired P mg, subject to constraints.

**The function should be easily replaceable in the future in case an alternative algorithm is chosen**.

Function arguments:

- P (target protein (mg))
- food.mgPerUnit (mg/g or mg/ml)
- config with minMeasurableMass, minMeasurableVolume, minServingsForMix

Process:

1. Have preset candidate mixFoodAmount sets:

- If SOLID: [0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5, 10] g (expandable)
- If LIQUID: [0.5, 1, 2, 3, 4, 5, 10] ml (expandable)

2. Candidate dailyAmount (ml) set: [0.5, 1, 2, 3, 4, 5, 10] (prefer smallest amount if possible)

3. For each (mixFoodAmount, dailyAmount):

- Assume: mixTotalVolume = mixWaterAmount IF solid, else mixTotalVolume = mixFoodAmount + mixWaterAmount

- mixProteinMg = mixFoodAmount * food.mgPerUnit
- P = dailyAmount * (mixProteinMg / mixTotalVolume)
  - Therefore:
  - mixTotalVolume = dailyAmount * (mixProteinMg / P)
  - mixWaterAmount = dailyAmount * (mixProteinMg / P) - mixFoodAmount if food.type is liquid, else: mixWaterAmount = dailyAmount * (mixProteinMg / P)
- servings = mixTotalVolume / dailyAmount
- Accept candidate if:
  - mixFoodAmount >= minMeasurableMass or minMeasurableVolume depending on food type
  - servings >= minServingsForMix (default 3)
  - mixWaterAmount <= 250 ml (practical cap)

4. Rank accepted solutions by:

- smallest mixFoodAmount >= threshold then smallest dailyAmount
- then smallest mixVolumeMl

5. Return best solution or throw/flag red if none found.
   Edge cases:

- If mixTotalVolume < dailyAmount (impossible), red flag warning. If initial search fails, attempt larger mixFoodAmount values (up to a practical limit) and re-check.
- If no valid solution: raise red flag

## Validation of table

Because the user can edit the default protocol once generated and many possible permutations arise, there should be checks computed to ensure the protocol remains valid. Warnings can arise, ranked as yellow or red. Validation is re-run on every change.

Warning information should be internally represented as: { severity, code, message, stepIndex? }

### Yellow

- Y1 Dilution yields fewer than minServingsForMix servings. Message: "Dilution yields X servings (< configured minimum). Consider increasing mix food amount or mix volume."
- Y2 Steps not strictly ascending by targetMg. Message: "Steps must be ascending — check step N vs step N-1."
- Y3 Total steps exceed maxSteps (default 25). Message: "Protocol has N steps (> maxSteps)."

### Red

- R1 Too few steps (total steps < 6). Message: "Protocol has only N steps (<6). This is very rapid."
- R2 Protein mismatch: computed protein from provided measured amounts does not equal declared targetMg beyond tolerance. Message: "Row N computed protein X mg ≠ declared Y mg."
- R3 Dilution impossible: no valid dilution candidate meets measurement constraints. Precision threshold for R3 Protein mismatch: abs(delta) > 0.5 mg => R3. Message: "Unable to create a measurable dilution for P mg with current constraints."
- R4 Measured mixFoodAmount or mixWaterAmount below instrument resolution (e.g., mixFoodAmount < 0.1 g, mixWaterAmount < 0.2 ml). Message: "Measured powder/volume below instrument resolution — impractical to prepare."
- TODO later: doubling violation

## OIT calculator technical implementation

Generate editable, clinician-facing OIT protocols that handle solids and liquids, dilution calculations, Food A → Food B transitions, and validation warnings (yellow and red severity). Protocols must be reproducible, transparent, and include checks/asserts for potentially dangerous configurations.

### Platform

- Tool will be hosted on a webpage on a website built with Zola, the static site generator that uses HTML, JS (will implement code in TS then compile to JS), and SCSS
- No PHI will be collected; tool is open-sourced too
- Files:
  - oit_calculator.html (shortcode wrapper / markup)
  - oit_calculator.ts → compiled to oit_calculator.js
  - oit_calculator.scss → compiled CSS
  - typed_foods_rough.json and protocols.json in static/tool_assets/ (can be accessed ie. by `fetch("/tool_assets/typed_foods_rough.json")`)
- The zola project already has decimal.js included, as well as fuzzysort.min.js

### Scope

- STANDARD dosing strategy (11 steps), slow dosing, and rapid dosing.
- Client-side only (no persistence): no PHI will be collected.
- Searchable food list and protocol list.
- Table-based protocol with editable cells and validation checks with each edit and recomputation.
- Fleshed out exports (ASCII/PDF) are out-of-scope for initial release (TODO) - however, there should be a small scaffold for filler functions for later implementation
- Designed with landscape desktop screens in mind, not phone for now

### Basic UX

Rough outline:

```html
<div class="oit_calculator">
	<div class=settings-container>
		<div class="food-a-container">
			<div class="search-container">
				<input type="text" id="food-a-search" placeholder="Search for foods or protocols..." class="search-input">
			</div>
		</div>
		<div class="food-b-container">
			<div class="search-container">
				<input type="text" id="food-b-search" placeholder="Optionally, load another food to transition to ..." class="search-input">
				<button id="clear-food-b" class="clear-food-b">Clear</button>
			</div>
		</div>
	</div>
	<div class="dosing-strategy-container">
	</div>
	<div class="output-container">
		<table></table>
		<div class="warnings-container"></div>
	</div>
</div>
```

The top half of the tool is the settings-container, which will contain the settings to select Food A and optionally Food B. These are in separate child containers, food-a-container and food-b-container. Both these containers have their own search bars to look through a repository of foods (name, protein content, and type (solid/liquid)).

Within food-a-container:

- top search bar that spans the width. This search bar is special: see [here](#food-a-search-mechanism) for details. Once a food is selected, the search bar is input is cleared, and then the rest of the container is populated
- an editable bar right below that also spans the width, that contains the name of the selected food (which can be manually changed after)
- a positive number input field for "Protein (g) per " either 100ml or 100g serving, depending on if the food is a solid or liquid. Unit of ml vs g is automatically determined by the food form
- a food form toggle button "Form: [ SOLID | LIQUID ]"
- a food A strategy toggle button "Strategy: [ Initial dilution | Dilution only | No dilutions ]"
- if Initial dilution is selected, there should be another input box for: "Threshold to stop diluting:" ml or g, depending on if the food is a solid or liquid

Within food-b-container:

- top search bar that spans the width with clear-food-b button after that will clear food-b from the protocol (ie. if there was any info entered after, it would be erased). Once a food is selected, the search bar is input is cleared, and then the rest of the container is populated
- editable bar right below that also spans the width, that contains the name of the selected food (which can be manually changed after)
- a positive number input field for "Protein (g) per " either ml or g, depending on if the food is a solid or liquid
- a food form toggle button "Form: [ SOLID | LIQUID ]"
- a food b threshold input: "Threshold to transition:" ml or g, depending on if the food is a solid or liquid

Within dosing-strategy-container: a toggle bottom for "Dosing Strategy: [STANDARD | SLOW | RAPID]"

Within output-container a table with the dosing schedule is displayed, and to the right a small div for a sidebar containing any warnings that may arise. Normally it will simply state "No problems found", but it will display validation checks that have failed in order for the physician to know if the protocol is invalid or potentially dangerous. See [here](#validation-of-table).

The table in rough looks like:

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

- Editable column cells: target protein (mg), daily amount, amount for mixture. With each edit, other row values should automatically update
- The values should also automatically update with manual changes to the protein conc of the selected food(s)
- To the left of each step number, there should be a (+) and a (-). (+) inserts a copy of the row before; (-) deletes the step.

Within the output container there should also be two buttons: 1) to copy an ASCII representation of the protocol to paste into an EMR, and 2) a button to generate a printable PDF of the protocol.

#### food-a-search mechanism

When the user starts to type, they will see a dropdown of only the names of matching foods from a .json as follows:

```json
[
  {
    "Food": "Cheese souffle",
    "Food Group": "Mixed Dishes",
    "Mean value in 100g": 9.54,
    "Type": "Solid"
  },
  {
    "Food": "Chop suey, with meat, canned",
    "Food Group": "Mixed Dishes",
    "Mean value in 100g": 4.07,
    "Type": "Solid"
  },
  ...
]
```

The .json can be loaded in .js as: `fetch("/tool_assets/typed_foods_rough.json")`. The names are searched using fuzzysort.min.js, case insensitive. The first search result is always "Custom: {Whatever the user has typed}" in case the user wants to make a custom food. The dropdown shows a **maximum of VIRTUAL_SCROLL_THRESHOLD items**; rest scrollable. There should be a slight debounce / delay (ie 150 ms) and a search limit of around 50.

**The behaviour for food-b-search mechanism is the EXACT same, _EXCEPT that food-a-search can also search for pre-defined PROTOCOLS_**.
This is where there's another JSON file to search through with the following structure (steps are omitted for brevity here, the numbers are not actually correct/valid), in particular the "name" field. When the protocol is chosen, the whole table / rest of the relevant settings are populated as per the protocol.

```json
{
  "dosingStrategy": "STANDARD",
  "foodA": {
    "name": "Peanut Powder",
    "type": "SOLID",
    "mgPerUnit": "250"
  },
  "foodAStrategy": "DILUTE_INITIAL",
  "diThreshold": "0.2",
  "foodB": null,
  "foodBThreshold": null,
  "config": {
    "minMeasurableMass": "0.5",
    "minMeasurableVolume": "0.5",
    "minServingsForMix": 3
  },
  "steps": [
    {
      "stepIndex": 1,
      "targetMg": "1",
      "method": "DILUTE",
      "dailyAmount": "2",
      "dailyAmountUnit": "ml",
      "mixFoodAmount": "0.10",
      "mixWaterAmount": "50",
      "servings": "20"
    },
    {
      "stepIndex": 2,
      "targetMg": "2.5",
      "method": "DILUTE",
      "dailyAmount": "2",
      "dailyAmountUnit": "ml",
      "mixFoodAmount": "0.10",
      "mixWaterAmount": "20",
      "servings": "10"
    },
    {
      "stepIndex": 3,
      "targetMg": "5",
      "method": "DILUTE",
      "dailyAmount": "2",
      "dailyAmountUnit": "ml",
      "mixFoodAmount": "0.20",
      "mixWaterAmount": "20",
      "servings": "10"
    },
    {
      "stepIndex": 4,
      "targetMg": "10",
      "method": "DILUTE",
      "dailyAmount": "2",
      "dailyAmountUnit": "ml",
      "mixFoodAmount": "0.40",
      "mixWaterAmount": "20",
      "servings": "10"
    },
    {
      "stepIndex": 5,
      "targetMg": "40",
      "method": "DIRECT",
      "dailyAmount": "0.16",
      "dailyAmountUnit": "g",
      "mixFoodAmount": null,
      "mixWaterAmount": null,
      "servings": null
    },
    {
      "stepIndex": 6,
      "targetMg": "80",
      "method": "DIRECT",
      "dailyAmount": "0.32",
      "dailyAmountUnit": "g",
      "mixFoodAmount": null,
      "mixWaterAmount": null,
      "servings": null
    }
  ]
}
```

### Design decisions and invariants

- Canonical units: while in the food.json and in the UX, food protein content is expressed as grams of protein per 100g or 100ml, internally **the canonical protein concentration is always converted to:**
  - Solids: mgPerG (mg protein per gram)
  - Liquids: mgPerMl (mg protein per millilitre)
  - There should be a function `mgPer100ToMgPerUnit(uiValue, unit)` that will do this
- Units & serialization: will store Decimal fields as strings in JSON that holds state (and reconstructing with `new Decimal(str)`).
- foodBThreshold applies to neat mass (m) - i.e. once the required mass for a given P is ≥ threshold we switch to DIRECT food B
- Precision: Use Decimal (decimal.js) for all calculations; format for display only.
- Warnings: Non-blocking; show yellow and red warnings with recommended fixes. Red warnings should be acknowledged to export/print (but do not block edits).

### Editing a protocol: behaviours

- Form toggles: If the user toggles a food's form (SOLID ⇄ LIQUID) the app automatically converts existing daily and mix amounts to the other unit and recomputes the water to add to create the mix (the solid-in-liquid volume assumption changes accordingly). **WE ASSUME THAT 1 GRAM ~= 1 ML IN VOLUME, AND VISE VERSA**.
- Editing behaviour for steps:
  - Editing target protein mg P:
    - If step is DIRECT (undiluted): automatically update the daily amount. Vise versa, if the daily amount is edited, the target protein P should also change.
    - If step is DILUTE: keep daily amount and mix amount stable if possible; update the mixWaterAmount volume instead. If the new target is impossible with current mix amount, a red error will be shown.
  - Editing mixFoodAmount
    - if step is DIRECT: N/A - if DIRECT is the method, no dilution is used
    - if step is DILUTE: Recompute mixWaterAmount to keep P constant and dailyAmount unchanged
  - Editing dailyAmount
    - if step is DIRECT: the target protein P for the step changes
    - if step is DILUTE: keep mixFoodAmount fixed; update mixWaterAmount
- Food A → B transition: If food_b_threshold cannot be satisfied, show red error, allow manual override.
- No undo/redo implementation required
- No locked rows options required

### Other misc specs

- Fetch JSON datasets once on init; keep in-memory for search and protocol load.
- Keep all logic client-side (no PHI persistence).
- Display formatting:
  - grams → 2 decimal places for display
  - ml → 1 decimal or integer depending on magnitude
  - Validation and comparisons use raw Decimal values
- Use a single JS module that initializes the calculator for a given container element; make state serializable to JSON for copying into EMR or making a PDF.

### Functions to consider adding:

- generateDefaultProtocol(food: Food, strategy: DosingStrategy, settings): Protocol
- computeNeatMass(P: Decimal, food: Food): Decimal
- validateProtocol(protocol: Protocol): Warning[]

## UI Flow

User opens the webpage. They see a the two search bars for food A and optionally food B, and an unfilled table at the bottom with an empty warnings sidebar

### Selection of pre-defined food

- After typing in the searchbar for food A, ie. peanut butter, they select "Peanut Butter"
- The fields in food-a-container are automatically populated with relevant information + defaults. Specifically:
  - Editable food name field is filled with "Peanut Butter", and protein (g) per 100g serving is filled (ie. 23), and form is "Solid". All this info comes from the JSON with the food profiles
  - Strategy is default initial dilution, with a threshold to switch of 0.2 g.
  - The default dosing Strategy is "STANDARD", which corresponds to the following (mg) amounts: 1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300
  - If the user were to toggle to "SLOW" or "RAPID", the table is 'recalculated' for the new dosing strategy.
  - the table should populate automatically with the default settings, and then have the option of editing. For example, changing the protein concentration of the food, deleting or adding rows, altering the target protein (mg) amount, daily amount to give, and the amount of food to measure for a dilution if applicable. The other values in the row should deterministically update.
  - There then is the option to copy the current protocol or view a PDF (implementation of this is a separate issue for later)

### Selection of custom food

- After typing in the searchbar for a custom food "magic butter" and selecting "Custom: magic butter"
- The fields in food-a-container are populated with relevant information + defaults. Specifically:
  - Editable food name field is filled with "magic butter", and protein (g) per 100g serving is left blank, and form is default "Solid".
  - Strategy is default initial dilution, with a threshold to switch of 0.2 g.
  - The default dosing Strategy is "STANDARD"

### Selection of built-in protocol

- After typing in the searchbar for a built-in protocol ie. "Protocol: peanut powder" and selecting it, the entire `Protocol` object will be populated
- The fields in food-a-container (and potentially food-b-container) are populated with relevant information. Specifically:
  - Editable food name field is filled with specified food names, etc for protein concentration, form, strategy, thresholds, etc.
  - The rest is as above: the protocol that is loaded remains editable

## MVP implementation

- Rough GUI
- Food JSON load + Food A search + "Custom: <text>" option.
- Populate STANDARD dosing sequence (and calculate slow/rapid sequences too if later selected)
- Render protocol table with DIRECT/DILUTE rows and computed daily/mix values.
- Implement editable protein concentration, food type, food A strategy, diThreshold, etc.
- Implement editable protein step target Mg, dailyAmount, and mixFoodAmount with deterministic recalculation of the
- Implement validation with core yellow/red checks
- Create rough scaffold for very basic copy-to-clipboard ASCII export and PDF export that can be implemented later
