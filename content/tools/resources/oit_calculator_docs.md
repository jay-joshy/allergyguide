+++
title = "Oral Immunotherapy Calculator Documentation"
date = 2025-11-23
draft = false

[extra]
keywords = "OIT, tool"
toc = true
authors = ["Joshua Yu"]
+++

## 1. Overview and Rationale (Non-Technical)

Oral Immunotherapy (OIT) is a treatment for IgE-mediated food allergies that involves gradually introducing increasing amounts of allergen to desensitize the patient. Implementing effective OIT protocols for at-home use by patients and their families requires careful planning; however, existing tooling for generating OIT protocols are sparse and do not offer sufficient flexibility for the diversity of protocol phenotypes seen in clinical practice.

This open-source tool addresses these challenges by providing a robust and flexible platform to generate safe and customizable OIT protocols. It aims to simplify protocol creation, reduce manual errors, and support clinicians and patients with clear, exportable plans.

**Key Capabilities:**

- **Customizable Dose Progression:** Generate OIT protocols with configurable dose progressions, with sensible initial defaults.
- **Diverse Food Support:** Handle both solid and liquid foods, performing automatic dilution calculations where necessary.
- **Food Transitioning:** Support transitions from a primary food (Food A) to a secondary food (Food B) at a customizable threshold.
- **Interactive Protocol Tables:** Fully editable tables for protocol steps, food characteristics, and dilution strategies.
- **Real-time Validation:** Immediate, colour-coded warnings for potential safety or practicality concerns during protocol creation.
- **Export Options:** ASCII export to clipboard and PDF export of plan for patients.

**Future Enhancements:**

- Implement warnings for excessively high target protein doses (>5000mg).
- Expand PDF export to include comprehensive patient information about OIT at home.

### 1.1 There is substantial variability in OIT implementation

OIT protocols involve a series of increasing allergen doses over time. The specific progression of protein targets, food form (e.g., powder, whole food, liquid), dilution methods, and total steps can vary significantly between clinicians, even within a single food. This heterogeneity makes standardized protocol generation difficult: manual methods are time-consuming and are more prone to human error.

### 1.2 Underlying Assumptions and Defaults

The calculator operates based on a set of clinical and practical assumptions to ensure generated protocols are both safe and measurable in a home setting:

- **Dosing Strategies:** Three common protein dose progression strategies are provided as starting points: Standard, Slow, and Rapid. These can be adjusted by the user, but also on the backend (ie. new starting strategies can be added to the tool).
  - **Standard** (11 steps): [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300] mg
  - **Slow** (19 steps): [0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220, 260, 300] mg
- **OIT Phenotypes:** We assume four main OIT implementation types:
  1. _Food A with initial dilutions_, transitioning to direct dosing once the weight of undiluted food is easily measurable. By default, that threshold is set at 0.2 grams or 0.2 ml.
  2. _Food A with dilutions maintained throughout the protocol._
  3. _Food A with no dilutions_. Usually not feasible especially with low dose steps; can be done if compounded by pharmacy but not widely available.
  4. _Transition from Food A to Food B_, where Food A can follow any of the above dilution strategies. Food B is assumed to always be given directly without dilution. Food B is switched to once the weight of undiluted food is easily measurable: by default, that threshold is 0.2 grams or 0.2 ml.
- **Dilution Mechanics:**
  - For solid foods diluted in liquid, the volume contribution of the solid is considered negligible if its weight-to-volume ratio is below 5%. This threshold is arbitrary and later can be adjusted if required. For example: if 1 ml of a solution of 0.2g of peanut powder in 40ml of liquid is given, we assume that only 0.2g * 1/40 = 0.005g is actually ingested.
  - For liquid foods, the volume contribution of the food is considered non-negligible in calculations.
  - Dilution calculations prioritize practical patient measurements (e.g., minimum measurable mass/volume by standard scales/syringes - see below). They also aim to make at least 3 servings of daily doses for ease of use.
- **Measurement resolution:** We assume default precision settings for scales (0.01g resolution) and syringes (0.1ml resolution).
- **Practical minimum measurements:** We assume the minimum measurable mass and volume are 0.2g and 0.2ml, respectively. This is arbitrary but comes from personal experience.
- **Validation:** Because of the freedom provided to the user to edit a protocol, unintended side-effects inevitably can arise despite best efforts to programmatically limit 'unreachable' or 'unrealistic' scenarios. Protocols are therefore continuously validated against a set of rules (critical "red" warnings and cautionary "yellow" warnings) to highlight potential issues _without blocking_ the user's workflow. Detailed validation rules are available [here](@/tools/resources/oit_calculator_validation.md).
- **Pre-defined Foods:** The tool utilizes food protein data from Health Canada's Canadian Nutrient File (2015). The original dataset does not specify what is a solid versus a liquid, and _that characteristic has been added in with an error-prone method_. An assumption is made that for liquids, 100g is approximately equivalent to 100ml for protein concentration purposes; however, users should verify this in practice.
- **Pre-defined protocols:** existing protocols with real-world use can be added on the backend and be available for search. These protocols are loaded 'as-is', but can still be edited by the user after.

### 1.3 User Workflow

1. **Select Food A or Pre-existing Protocol:** Begin by searching for a primary food (Food A) or loading a pre-existing protocol template. Users can also define custom foods.
2. **Customize Protocol:** Adjust Food A settings (name, protein concentration, form, dilution strategy, threshold), select a dosing strategy (Standard, Slow, Rapid), and modify individual steps. Optionally, add a transition Food B, whose settings (name, protein concentration, form, threshold) can also be customized. A custom note can also be added.
3. **Review and Refine:** The tool displays real-time warnings (red for critical, yellow for caution) and can edit the protocol as required to fix these.
4. **Export:** Once satisfied, export the protocol in ASCII format or as a PDF for patient handout.

---

## 2. Technical Specification

### 2.1 File Overview and Stack

The OIT Calculator's implementation files are organized as follows within the `allergyguide/` repository:

```txt
allergyguide/
├── templates/shortcodes/
│ └── oit_calculator.html      
├── static/
│ ├── ts/
│ │ └── oit_calculator.ts     
│ ├── js/
│ │ └── oit_calculator.js     
│ └── tool_assets/
│   ├── typed_foods_rough.json # Food database (approx. 500 foods)
│   └── oit_protocols.json   # Pre-built protocol templates
└── sass/shortcodes/
  └── _oit_calculator.scss
```

**Stack:**

- **Frontend:** TypeScript (ES2017 target), HTML5, SCSS (compiled to CSS by Zola).
- **Core Libraries:**
  - `decimal.js`: For decimal arithmetic
  - `fuzzysort`: fuzzy search functionality for food and protocol lookup
  - `ascii-table3`: Used for generating formatted ASCII tables for EMR export
  - `jspdf` & `jspdf-autotable`: Libraries for PDF generation

### 2.2 TypeScript Interfaces and Enums

The core data structures and types are defined within `static/ts/oit_calculator.ts`. Refer to that file for up-to-date and complete interface definitions, including `Food`, `Step`, `Protocol`, `ProtocolConfig`, `Warning`, `Candidate`, `FoodData`, and `ProtocolData`, as well as enums like `DosingStrategy`, `FoodType`, `Method`, and `FoodAStrategy`.

These interfaces define the canonical structure for foods, individual dosing steps, the complete protocol, configuration settings, and warning messages.

### 2.3 Design Decisions

- **Canonical Units:** Internally, protein concentrations are managed in `mg per unit` (mg/g for solids, mg/ml for liquids) to maintain consistency. The UI converts these to `g per 100 (g/ml)` for user input/display.
- **Precision:** All critical numerical calculations utilize `decimal.js` to prevent floating-point inaccuracies. Formatting for display and export occurs only at the final stage.
- **Serialization:** Decimal fields within JSON data (for protocols and food data) are stored as strings and rehydrated into `Decimal` objects upon loading to preserve precision.
- **Non-Blocking Warnings:** Both "red" (critical) and "yellow" (cautionary) warnings are intentionally non-blocking.

### 2.4 Core Algorithms

#### 2.4.1 Dilution Calculation Algorithm

Identifies feasible and practical dilution recipes for a given target protein dose (`P`). Considers `mixFoodAmount`, `dailyAmount`, and `mixWaterAmount` candidates, subject to various constraints:

- **Assumptions:** Solid foods diluted in liquid are assumed to have negligible volume contribution, unless their concentration exceeds a `MAX_SOLID_CONCENTRATION` threshold (0.05 w/v).
- **Constraints:** Recipes must respect minimum measurable mass/volume (e.g., `minMeasurableMass`, `minMeasurableVolume`), maximum total mix water (`MAX_MIX_WATER`), minimum number of servings (`minServingsForMix`), and protein tolerance (`PROTEIN_TOLERANCE`).
- **Optimization:** Candidates are sorted to prioritize practical mixtures, favouring those meeting low concentration constraints for solids, then by `mixFoodAmount`, `dailyAmount`, `mixTotalVolume`, and `mixWaterAmount`.

Refer to the `findDilutionCandidates` function in `oit_calculator.ts` for implementation details.

#### 2.4.2 Default Protocol Generation Algorithm

This function constructs an initial Food A protocol based on a selected `DosingStrategy` (e.g., STANDARD) and `FoodAStrategy` (e.g., DILUTE_INITIAL).

1. **Target Protein Sequence:** Retrieves the target protein values (e.g., `[1, 2.5, ..., 300] mg`) from the chosen dosing strategy.
2. **Step Generation:** For each target protein, determines if dilution is required based on the `FoodAStrategy` and `diThreshold`.
   - If dilution is needed, call `findDilutionCandidates` to select the "best" mixture.
   - If direct dosing is appropriate, calculate the neat mass required.
   - If a required dilution is not feasible, a direct dosing step is created.
3. **Output:** `Protocol` object populated with Food A steps.

Refer to the `generateDefaultProtocol` function in `oit_calculator.ts`.

#### 2.4.3 Food B Addition Algorithm

Injects a Food B transition into an existing protocol. It identifies the appropriate transition point and modifies the subsequent steps:

1. **Threshold Calculation:** Determines protein equivalent (`foodBmgThreshold`) of the specified `foodBThreshold` (e.g., `0.2g` of Food B).
2. **Transition Point:** Scans Food A steps to find the first step (`n`) whose `targetMg` is greater than or equal to `foodBmgThreshold`.
3. **Protocol Modification:**
   - If a transition point is found, the step immediately following `n` becomes the first Food B step, duplicating the protein target of step `n`.
   - All subsequent original targets are then converted into Food B direct dosing steps.
   - Steps are re-indexed.
   - If no suitable transition point is found, Food B is not added, and a warning is issued.

Refer to the `addFoodBToProtocol` function in `oit_calculator.ts` for implementation.

### 2.5 Component Specifications

The calculator's user interface is composed of several interactive components:

#### 2.5.1 Search Inputs

- **Food A Search:** Allows fuzzy searching for pre-defined foods or protocol templates. Supports creating custom foods.
- **Food B Search:** Similar to Food A search but restricted to foods only. Includes a clear button to remove Food B.
  - Both searches feature debounced input, dropdown results, and keyboard navigation.

#### 2.5.2 Food Settings

- **Food A/B Settings Panel:** Editable fields for food name, protein concentration (with unit toggling based on form), and physical form (Solid/Liquid toggle).
- **Food A Specific:** Includes dilution strategy toggles (Initial dilution, Dilution throughout, No dilutions) and editable threshold for "Initial dilution."
- **Food B Specific:** Displays a transition threshold input).

#### 2.5.3 Dosing Strategy

- A set of toggle buttons (Standard, Slow, Rapid) to select the desired protein progression. Changing this resets all protocol steps to the default targets for the chosen strategy.

#### 2.5.4 Protocol Table

- **Columns:** Step number, Protein (mg), Method (DILUTE/DIRECT), Daily amount, Amount for mixture (dilution only), Water for mixture (dilution only).
- **Editable Cells:** Protein (mg), Daily amount, and Amount for mixture are editable. Changes trigger re-calculation and validation within the step.
- **Action Buttons:** Each row has `+` (add step) and `−` (remove step) buttons. Adding duplicates the current step; removing is disallowed if only one step remains.
- **Unit Display:** Displays units (g/ml) appropriate for the food type and method.
- **Special Rows:** Food section headers appear before the first Food A step and before any Food B steps.

### 2.6 Editing Behaviour

The calculator dynamically responds to user input, recalculating and validating the protocol in real-time:

- **Food Settings Modification:**
  - Changing food name updates display immediately.
  - Altering protein concentration of either Food A or B triggers a full table recalculation.
  - Toggling food type (Solid ↔ Liquid) for Food A or B converts existing amounts (assuming 1g ≈ 1ml) and recomputes dilution parameters. Existing target protein values are preserved.
  - Changing Food A dilution strategy or threshold recalculates step methods and mix parameters while preserving target protein values.
- **Dosing Strategy Change:** Selecting a different dosing strategy (Standard, Slow, Rapid) regenerates the entire protocol with new default protein targets for that strategy. This overrides any custom step targets. Food B should be preserved if already selected.
- **New Food Loading:** Loading a new Food A resets and recalculates the entire protocol. If there is a Food B already selected, it is removed. Adding or changing Food B regenerates steps from the transition point onward.
- **Step Editing:**
  - **Editing Target Protein:** For direct steps, `dailyAmount` is recalculated. For dilution steps, `mixWaterAmount` is adjusted to preserve `dailyAmount` and `mixFoodAmount` if possible. If impossible, a warning should be triggered.
  - **Editing Daily Amount:** For direct steps, `targetMg` is recalculated. For dilution steps, `mixFoodAmount` is preserved, and `mixWaterAmount` is adjusted.
  - **Editing Mix Food Amount:** For dilution steps, `mixWaterAmount` is recomputed to maintain `targetMg` and `dailyAmount`.

### 2.7 Export Features

#### 2.7.1 ASCII Export

Designed for quick copy-pasting into EMR systems. It generates a formatted text table of the protocol. Of note, output is readable with a monospaced font - it will not look good otherwise.

#### 2.7.2 PDF Export

Utilizes `jspdf` and `jspdf-autotable` to generate a patient-friendly PDF document of the protocol. See `exportPDF()` function in `oit_calculator.ts`.

### 2.8 Data Files

#### 2.8.1 Food Database (`typed_foods_rough.json`)

A JSON array of food objects, each containing `Food` (name), `Food Group`, `Mean value in 100g` (protein content), and `Type` (Solid/Liquid). This data is loaded on initialization to populate search results.

#### 2.8.2 Protocol Templates (`oit_protocols.json`)

A JSON array of pre-defined `ProtocolData` objects, serving as starting points for users. These templates include various `dosing_strategy`, `food_a`, `food_a_strategy`, `di_threshold`, and optional `food_b` configurations. Numeric fields are stored as strings and converted to `Decimal` objects upon loading.

### 2.9 Compilation & Deployment

To build the TypeScript code for the OIT Calculator, navigate to the `allergyguide` directory and run:

```bash
npm run build_oit
```
