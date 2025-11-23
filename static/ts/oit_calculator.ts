// ============================================
// OIT CALCULATOR - COMPLETE IMPLEMENTATION
// Joshua Yu 2025 - allergyguide.ca
// See TYPESCRIPT_SETUP.md
// ============================================

// ============================================
// EXTERNAL PACKAGES
// ============================================

// Imports
import Decimal from "decimal.js";
import fuzzysort from "fuzzysort";
import { AsciiTable3 } from "ascii-table3";

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ============================================
// ENUMS
// ============================================

// TODO! Consider increasing number of strategies
/**
 * Dosing plan presets for target protein steps.
 * STANDARD, SLOW, and RAPID map to arrays in DOSING_STRATEGIES.
 */
enum DosingStrategy {
  STANDARD = "STANDARD",
  SLOW = "SLOW",
  RAPID = "RAPID",
}

/**
 * Physical form that determines measuring unit and mixing model.
 * SOLID uses grams; LIQUID uses milliliters.
 */
enum FoodType {
  SOLID = "SOLID",
  LIQUID = "LIQUID",
}

/**
 * How a step is administered:
 * DIRECT (neat food) or DILUTE (prepared mixture).
 */
enum Method {
  DILUTE = "DILUTE",
  DIRECT = "DIRECT",
}

/**
 * Policy for when Food A uses dilution across steps.
 * DILUTE_INITIAL (until neat ≥ threshold), DILUTE_ALL, or DILUTE_NONE.
 */
enum FoodAStrategy {
  DILUTE_INITIAL = "DILUTE_INITIAL",
  DILUTE_ALL = "DILUTE_ALL",
  DILUTE_NONE = "DILUTE_NONE",
}

// ============================================
// TYPE ALIASES
// ============================================

/**
 * Measuring unit for patient-facing amounts.
 * "g" for solids; "ml" for liquids.
 */
type Unit = "g" | "ml";

// ============================================
// INTERFACES
// ============================================

/**
 * Food definition with protein concentration used for calculations.
 * mgPerUnit is the canonical internal unit (mg protein per g or ml food).
 */
interface Food {
  name: string;
  type: FoodType;
  mgPerUnit: Decimal; // mg of protein per gram or ml of food. Canonical protein unit for calculations in the tool
}

/**
 * Single dosing step with target protein and administration details.
 * For DILUTE steps, mix * and servings describe the prepared mixture.
 */
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

/**
 * Limits and tolerances used to compute feasible dilution/direct steps. Values are Decimals and represent device resolution, tolerances, and ratios.
 */
interface ProtocolConfig {
  minMeasurableMass: Decimal; // Minimal mass that is practically measurable by scale.
  minMeasurableVolume: Decimal; // Minimal mass that is practically measurable by syringe.
  minServingsForMix: Decimal; // Minimal servings for dilution mix (must be >= 1)
  PROTEIN_TOLERANCE: Decimal; // allowable percent deviation of calculated actual protein target and targetmg. ie. 0.05. Understanding that in real life there is limited resolution of measurement so the actual protein content may be slightly different from the target to an allowable degree
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: Decimal; // At what amount of Food A do you switch to direct dosing?
  DEFAULT_FOOD_B_THRESHOLD: Decimal; // At what amount of Food B do you switch from Food A to Food B?
  MAX_SOLID_CONCENTRATION: Decimal; //  max g/ml ratio for solid diluted into liquids (default 0.05). Assume that if the solid concentration is above this threshold, then the solid contributes non-negligibly to the total volume of the mixture.
}

/**
 * Complete protocol definition, including steps and global settings.
 * May include a Food B transition and its threshold.
 */
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

/**
 * Validation result describing an issue with the protocol or a specific step.
 * severity is "red" (critical) or "yellow" (caution).
 */
interface Warning {
  severity: "red" | "yellow";
  code: string;
  message: string;
  stepIndex?: number;
}

/**
 * Intermediate dilution candidate considered during planning.
 * Represents a particular mix recipe and its derived servings.
 */
interface Candidate {
  mixFoodAmount: Decimal;
  mixWaterAmount: Decimal;
  dailyAmount: Decimal;
  mixTotalVolume: Decimal;
  servings: Decimal;
}

// TODO! Clean up the CNF file; some of the SOLID/LIQUID distinctions are wrong still
/**
 * Food database record (as loaded from JSON containing with data from Canadian Nutrient File, Health Canada, 2015).
 * Raw values are UI-facing and converted to internal Decimal where needed.
 */
interface FoodData {
  Food: string;
  "Food Group": string;
  "Mean value in 100g": number; // before use in calculations should be converted into Decimal
  Type: string; // SOLID or LIQUID
}

// For loading of protocols from JSON file
/**
 * Protocol template record (as loaded from JSON).
 * String fields representing numbers are parsed into Decimal during load.
 */
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

// ============================================
// CONSTANTS / DEFAULTS
// ============================================

// Precision / resolution of scales/syringes
// Number of decimals to display
const SOLID_RESOLUTION: number = 2;
const LIQUID_RESOLUTION: number = 1;

// Dosing step target quick options
// TODO! Clarify other options
const DOSING_STRATEGIES: { [key: string]: Decimal[] } = {
  STANDARD: [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300].map(
    (num) => new Decimal(num),
  ),
  SLOW: [
    0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220,
    260, 300,
  ].map((num) => new Decimal(num)),
  RAPID: [5, 10, 20, 40, 80, 160, 300].map((num) => new Decimal(num)),
};

// Default candidate options for various parameters used to calculate optimal dilutions
const SOLID_MIX_CANDIDATES = [
  0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 1, 2, 5, 10,
].map((num) => new Decimal(num));
const LIQUID_MIX_CANDIDATES = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10,
].map((num) => new Decimal(num));
const DAILY_AMOUNT_CANDIDATES = [
  0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7, 9, 10, 11, 12,
].map((num) => new Decimal(num));
const MAX_MIX_WATER = new Decimal(500);

let DEFAULT_CONFIG: ProtocolConfig;
DEFAULT_CONFIG = {
  minMeasurableMass: new Decimal(0.2), // assume that scales for patients have resolution of 0.01g
  minMeasurableVolume: new Decimal(0.2), // assume that syringes used has resolution of 0.1ml
  minServingsForMix: new Decimal(3), // want mixture to last at least 3 days
  PROTEIN_TOLERANCE: new Decimal(0.05), // percent difference allowable
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: new Decimal(0.2),
  DEFAULT_FOOD_B_THRESHOLD: new Decimal(0.2),
  MAX_SOLID_CONCENTRATION: new Decimal(0.05),
};

// ============================================
// GLOBAL STATE
// ============================================

let currentProtocol: Protocol | null = null;
let foodsDatabase: FoodData[] = [];
let protocolsDatabase: ProtocolData[] = [];
let fuzzySortPreparedFoods: any[] = [];
let fuzzySortPreparedProtocols: any[] = [];
let customNote: string = "";
let warningsPageURL = "";

// Debounce timers
let searchDebounceTimer: number | null = null;

// Dropdown navigation state
let currentDropdownIndex: number = -1;
let currentDropdownInputId: string = "";

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape a string for safe HTML insertion.
 *
 * Escapes the five critical characters (&, <, >, ", ') to their HTML entities.
 * Use this before inserting any user-provided content into the DOM via innerHTML or template literals. Safe for repeated calls (idempotent).
 *
 * Side effects: none (pure)
 *
 * @param unsafe Untrusted string that may contain HTML/JS
 * @returns Escaped string safe to render as text content
 * @example
 * // => "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 * escapeHtml('<script>alert("xss")</script>');
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Convert protein concentration from g per 100 (g or ml) to mg per unit (g or ml).
 *
 * @remarks Formula: mgPerUnit = gPer100 × 10.
 * @param uiValue protein concentration in g per 100 unit (UI-facing)
 * @returns Milligrams of protein per unit (Decimal) for internal calculations
 */
function gramPer100ToMgPerUnit(uiValue: number): Decimal {
  // works out to value * 1000 / 100 = value * 10
  return new Decimal(uiValue).times(10);
}

/**
 * Convert protein concentration from mg per unit (g or ml) to g per 100 (g or ml).
 *
 * @remarks Formula: gPer100 = mgPerUnit ÷ 10.
 * @param mgPerUnit Milligrams of protein per unit
 * @returns Grams of protein per 100 units (number) for UI display
 */
function mgPerUnitToGramPer100(mgPerUnit: Decimal): number {
  // works out to value * (1/1000) * (100) = value / 10
  return mgPerUnit.dividedBy(10).toNumber();
}

/**
 * Format a numeric value with fixed decimal places.
 *
 * Accepts native numbers or Decimal-like objects exposing toNumber().
 * Returns an empty string for null/undefined to simplify templating.
 *
 * @param value Number or Decimal to format
 * @param decimals Number of fractional digits to render
 * @returns Formatted string (or "" for nullish input)
 */
function formatNumber(value: any, decimals: number): string {
  if (value === null || value === undefined) return "";
  const num = typeof value === "number" ? value : value.toNumber();
  return num.toFixed(decimals);
}

/**
 * Format a patient-measured amount based on its unit.
 *
 * @remarks
 * - For grams (g): fixed to SOLID_RESOLUTION decimals
 * - For milliliters (ml): integer when whole, otherwise LIQUID_RESOLUTION
 *
 * @param value Amount to format (g/ml)
 * @param unit Measuring unit: "g" or "ml"
 * @returns Formatted string
 */
function formatAmount(value: any, unit: Unit): string {
  if (value === null || value === undefined) return "";
  const num = typeof value === "number" ? value : value.toNumber();
  if (unit === "g") {
    return num.toFixed(SOLID_RESOLUTION);
  } else {
    // ml - integer or the LIQUID_RESOLUTION
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(LIQUID_RESOLUTION);
  }
}

/**
 * Get the measuring unit for a food by its form.
 *
 * @param food Food definition with type SOLID or LIQUID
 * @returns "g" for SOLID foods; "ml" for LIQUID foods
 */
function getMeasuringUnit(food: Food): Unit {
  if (food.type === FoodType.LIQUID) {
    return "ml";
  } else {
    return "g";
  }
}

// ============================================
// CORE ALGORITHMS
// ============================================
/**
 * Compute feasible dilution candidates for a target protein dose.
 *
 * For a target protein P (mg), searches across candidate mix sizes and daily amounts to produce practical dilution recipes that:
 * - respect tool resolution (minMeasurableMass/minMeasurableVolume)
 * - keep total mix water within MAX_MIX_WATER
 * - meet minimum servings (minServingsForMix)
 * - achieve protein within relative tolerance PROTEIN_TOLERANCE
 * - for SOLID foods, prefer low w/v concentration based on MAX_SOLID_CONCENTRATION
 *
 * Liquid-in-liquid assumes additive volumes; solid-in-liquid assumes solid volume is negligible (validated separately via warnings).
 *
 * Returned candidates are sorted by:
 * - whether they meet low-concentration preference (SOLID only), then
 * - mixFoodAmount asc, dailyAmount asc, mixTotalVolume asc, mixWaterAmount asc
 *
 *
 * @param P Target protein per dose, in mg
 * @param food Food used for the dilution (determines unit logic)
 * @param config Protocol configuration and constraints
 * @returns Array of feasible, sorted Candidate items
 */
function findDilutionCandidates(
  P: Decimal,
  food: Food,
  config: ProtocolConfig,
): Candidate[] {
  const candidates: Candidate[] = [];
  const mixCandidates =
    food.type === FoodType.SOLID ? SOLID_MIX_CANDIDATES : LIQUID_MIX_CANDIDATES;

  // Calculate minimum dailyAmount for preferred concentration (solids only)
  // For ratio = mixFood / mixWaterAmount < MAX_SOLID_CONCENTRATION
  // Recall: mixWaterAmount = mixTotalVolume = dailyAmount × servings
  // & servings = (mixFood × mgPerUnit) / P
  // => ratio = P / (dailyAmount × mgPerUnit)
  // => MAX_SOLID_CONCENTRATION > P / (dailyAmount × mgPerUnit)
  // =>dailyAmount > P / (MAX_SOLID_CONCENTRATION × mgPerUnit)
  const minDailyForLowConcentration =
    food.type === FoodType.SOLID
      ? P.dividedBy(config.MAX_SOLID_CONCENTRATION.times(food.mgPerUnit))
      : null;

  for (const mixFoodValue of mixCandidates) {
    const mixFood: Decimal = mixFoodValue;

    for (const dailyAmountValue of DAILY_AMOUNT_CANDIDATES) {
      const dailyAmount: Decimal = dailyAmountValue;

      if (food.type === FoodType.SOLID) {
        // Solid in liquid - volume of solid is negligible
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

    // Then apply existing sort criteria
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

/**
 * For a given target protein in a step, calculate the remaining numbers to formally define a step if possible.
 *
 * When diluting, picks the first (best) candidate from findDilutionCandidates.
 * Returns null only when a dilution is required but no feasible candidate exists.
 *
 * Side effects: none (pure)
 *
 * @param targetMg Target protein amount for this step (mg)
 * @param stepIndex
 * @param food Food to base the step on (Food A or Food B)
 * @param foodAStrategy Strategy controlling Food A dilution behavior
 * @param diThreshold Threshold neat amount at/above which DIRECT is acceptable, for dilution initial strategy
 * @param config Protocol constraints and tolerances
 * @returns Step definition or null if a required dilution cannot be constructed
 */
function generateStepForTarget(
  targetMg: Decimal,
  stepIndex: number,
  food: Food,
  foodAStrategy: FoodAStrategy,
  diThreshold: Decimal,
  config: ProtocolConfig,
): Step | null {
  const P = targetMg;
  const neatMass = P.dividedBy(food.mgPerUnit);
  const unit: Unit = food.type === FoodType.SOLID ? "g" : "ml";

  let needsDilution = false;
  if (foodAStrategy === FoodAStrategy.DILUTE_INITIAL) {
    needsDilution = neatMass.lessThan(diThreshold);
  } else if (foodAStrategy === FoodAStrategy.DILUTE_ALL) {
    needsDilution = true;
  } else {
    needsDilution = false;
  }

  if (needsDilution) {
    const candidates = findDilutionCandidates(P, food, config);
    if (candidates.length === 0) {
      return null; // Cannot dilute
    }
    const best = candidates[0];
    return {
      stepIndex,
      targetMg: P,
      method: Method.DILUTE,
      dailyAmount: best.dailyAmount,
      dailyAmountUnit: "ml",
      mixFoodAmount: best.mixFoodAmount,
      mixWaterAmount: best.mixWaterAmount,
      servings: best.servings,
      food: "A",
    };
  } else {
    return {
      stepIndex,
      targetMg: P,
      method: Method.DIRECT,
      dailyAmount: neatMass,
      dailyAmountUnit: unit,
      food: "A",
    };
  }
}

/**
 * Build a default protocol for Food A using the default dosing strategy.
 *
 * Uses:
 * - dosingStrategy: STANDARD
 * - foodAStrategy: DILUTE_INITIAL
 * - diThreshold: DEFAULT_CONFIG.DEFAULT_FOOD_A_DILUTION_THRESHOLD
 *
 * Steps are generated with generateStepForTarget. If a dilution is required but not feasible for a target, a DIRECT fallback step is emitted so the sequence remains continuous (validation will flag any issues).
 *
 * @param food Food A
 * @param config Protocol configuration and constraints
 * @returns Protocol with Food A steps populated
 */
function generateDefaultProtocol(food: Food, config: ProtocolConfig): Protocol {
  const dosingStrategy = DosingStrategy.STANDARD;
  const foodAStrategy = FoodAStrategy.DILUTE_INITIAL;
  const unit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
  const diThreshold = DEFAULT_CONFIG.DEFAULT_FOOD_A_DILUTION_THRESHOLD;

  const targetProteins = DOSING_STRATEGIES[dosingStrategy];
  const steps: Step[] = [];

  for (let i = 0; i < targetProteins.length; i++) {
    const step = generateStepForTarget(
      targetProteins[i],
      i + 1,
      food,
      foodAStrategy,
      diThreshold,
      config,
    );
    if (step) {
      steps.push(step);
    } else {
      // Cannot generate step - still add it as direct with warning
      const P = targetProteins[i];
      const neatMass = P.dividedBy(food.mgPerUnit);
      steps.push({
        stepIndex: i + 1,
        targetMg: P,
        method: Method.DIRECT,
        dailyAmount: neatMass,
        dailyAmountUnit: unit,
        food: "A",
      });
    }
  }

  return {
    dosingStrategy,
    foodA: food,
    foodAStrategy,
    diThreshold,
    steps,
    config,
  };
}

/**
 * Count the number of Food A steps in a protocol.
 *
 * @param protocol Protocol to inspect
 * @returns Number of steps that belong to Food A
 */
function getFoodAStepCount(protocol: Protocol): number {
  if (!protocol.foodB) return protocol.steps.length;

  // Find first Food B step by checking the food property
  for (let i = 0; i < protocol.steps.length; i++) {
    if (protocol.steps[i].food === "B") {
      return i;
    }
  }
  return protocol.steps.length;
}

/**
 * Inject a Food B transition into an existing protocol.
 *
 * Finds the first step where targetMg ≥ (threshold.amount × foodB.mgPerUnit) and transitions at that point by:
 * - duplicating the transition target as the first Food B step
 * - converting all subsequent targets to Food B DIRECT steps
 * - reindexing steps
 *
 * Protocol.foodB and .foodBThreshold are assigned even if no transition point is found; the validation system will surface a warning in that case.
 *
 * Mutates the provided protocol in place.
 *
 * @param protocol Protocol to modify (mutated)
 * @param foodB Food B definition
 * @param threshold Threshold to begin Food B, unit-specific amount (g/ml)
 */
function addFoodBToProtocol(
  protocol: Protocol,
  foodB: Food,
  threshold: { unit: Unit; amount: Decimal },
): void {
  // Calculate foodBmgThreshold
  const foodBmgThreshold = threshold.amount.times(foodB.mgPerUnit);

  // Set Food B in protocol (even if no transition point found, so threshold changes can be detected)
  protocol.foodB = foodB;
  protocol.foodBThreshold = threshold;

  // Find transition point
  let transitionIndex = -1;
  for (let i = 0; i < protocol.steps.length; i++) {
    if (protocol.steps[i].targetMg.greaterThanOrEqualTo(foodBmgThreshold)) {
      transitionIndex = i;
      break;
    }
  }

  if (transitionIndex === -1) {
    // No transition point found - emit warning
    // warning is picked up by validation system
    return;
  }

  // Get the original target sequence after transition
  const originalTargets: any[] = [];
  for (let i = transitionIndex + 1; i < protocol.steps.length; i++) {
    originalTargets.push(protocol.steps[i].targetMg);
  }

  // Insert duplicate at transition point
  const transitionTargetMg = protocol.steps[transitionIndex].targetMg;

  // Build Food B steps
  const foodBSteps: Step[] = [];
  const foodBUnit: Unit = foodB.type === FoodType.SOLID ? "g" : "ml";

  // First Food B step uses same target as last Food A step
  const firstBTargetMg = transitionTargetMg;
  const firstBNeatMass = firstBTargetMg.dividedBy(foodB.mgPerUnit);
  foodBSteps.push({
    stepIndex: transitionIndex + 2, // Will be reindexed later
    targetMg: firstBTargetMg,
    method: Method.DIRECT,
    dailyAmount: firstBNeatMass,
    dailyAmountUnit: foodBUnit,
    food: "B",
  });

  // Remaining Food B steps
  for (const targetMg of originalTargets) {
    const neatMass = targetMg.dividedBy(foodB.mgPerUnit);
    foodBSteps.push({
      stepIndex: 0, // Will be reindexed
      targetMg,
      method: Method.DIRECT,
      dailyAmount: neatMass,
      dailyAmountUnit: foodBUnit,
      food: "B",
    });
  }

  // Truncate protocol.steps at transition point
  protocol.steps = protocol.steps.slice(0, transitionIndex + 1);

  // Add Food B steps
  protocol.steps.push(...foodBSteps);

  // Reindex
  for (let i = 0; i < protocol.steps.length; i++) {
    protocol.steps[i].stepIndex = i + 1;
  }
}

/**
 * Validate protocol-level and per-step constraints, yielding warnings.
 *
 * Produces red (critical) and yellow (practical) warnings covering:
 * - structural issues (too few steps, non-ascending targets)
 * - invalid/edge concentrations, servings, volumes, mismatch to tolerance
 * - measurement resolution impracticalities
 * - transition feasibility for Food B
 *
 * No exceptions are thrown; issues are reported via structured Warning items.
 *
 * @param protocol Protocol to validate
 * @returns Array of warnings, possibly empty
 */
function validateProtocol(protocol: Protocol): Warning[] {
  const warnings: Warning[] = [];

  // NON STEP SETTINGS
  // -----------------
  // R1: Too few steps
  if (protocol.steps.length < 5) {
    warnings.push({
      severity: "red",
      code: "R1",
      message:
        "Protocol < 5 steps, which is quite rapid for a full OIT protocol.",
    });
  }

  // R7: zero or negative mgPerUnit for food A
  if (protocol.foodA.mgPerUnit.lessThanOrEqualTo(new Decimal(0))) {
    warnings.push({
      severity: "red",
      code: "R7",
      message: `${escapeHtml(protocol.foodA.name)} protein concentration must be > 0 to be considered for OIT`,
    });
  }
  // R7: zero or negative mgPerUnit for food B
  if (protocol.foodB?.mgPerUnit.lessThanOrEqualTo(new Decimal(0))) {
    warnings.push({
      severity: "red",
      code: "R7",
      message: `${escapeHtml(protocol.foodB?.name || "")} protein concentration must be > 0 to be considered for OIT`,
    });
  }

  // Y5: No transition point found for food B if it exists. That means the transition threshold is too high.
  if (protocol.foodB) {
    let foodBinSteps: boolean = false;
    for (const step of protocol.steps) {
      if (step.food === "B") {
        foodBinSteps = true;
      }
    }
    if (foodBinSteps === false) {
      warnings.push({
        severity: "yellow",
        code: "Y5",
        message: `${escapeHtml(protocol.foodB.name)} has no transition point. Decrease the threshold if you want to transition.`,
      });
    }
  }

  // STEP VALIDATION ONE BY ONE
  // --------------------------
  for (const step of protocol.steps) {
    const isStepFoodB = step.food === "B";
    const food = isStepFoodB ? protocol.foodB! : protocol.foodA;

    // R8: Step targetMg zero or negative
    if (step.targetMg.lessThanOrEqualTo(new Decimal(0))) {
      warnings.push({
        severity: "red",
        code: "R8",
        message: `Step ${step.stepIndex}: A target protein of ${formatNumber(step.targetMg, 1)} mg is NOT valid. It must be >0.`,
        stepIndex: step.stepIndex,
      });
    }

    // FOR DILUTION STEPS
    if (step.method === Method.DILUTE) {
      // R2: Protein mismatch
      const totalMixProtein = step.mixFoodAmount!.times(food.mgPerUnit);
      const mixTotalVolume =
        food.type === FoodType.SOLID
          ? step.mixWaterAmount
          : step.mixFoodAmount!.plus(step.mixWaterAmount!);
      const calculatedProtein = totalMixProtein
        .times(step.dailyAmount)
        .dividedBy(mixTotalVolume!);
      const delta = calculatedProtein.dividedBy(step.targetMg).minus(1).abs();
      // const delta = calculatedProtein.minus(step.targetMg).abs();

      if (delta.greaterThan(DEFAULT_CONFIG.PROTEIN_TOLERANCE)) {
        warnings.push({
          severity: "red",
          code: "R2",
          message: `Step ${step.stepIndex}: Protein mismatch. Target ${formatNumber(step.targetMg, 1)} mg but calculated ${formatNumber(calculatedProtein, 1)} mg: ${formatNumber(delta.times(100), 0)}% difference.`,
          stepIndex: step.stepIndex,
        });
      }

      // R5: if in dilution, servings <1 then => there is not enough protein in mixFoodAmount to even give the target protein (mg)
      if (step.servings!.lessThan(new Decimal(1))) {
        const totalMixProtein = step.mixFoodAmount!.times(food.mgPerUnit);
        warnings.push({
          severity: "red",
          code: "R5",
          message: `Step ${step.stepIndex}: ${formatAmount(step.mixFoodAmount, getMeasuringUnit(food))} ${getMeasuringUnit(food)} of food only makes ${formatNumber(totalMixProtein, 1)} mg of total protein. However, target protein is ${formatNumber(step.targetMg, 1)} mg.`,
          stepIndex: step.stepIndex,
        });
      }

      // R6: if in dilution, Mix total volume < dailyAmount (impossible)
      if (mixTotalVolume!.lessThan(step.dailyAmount)) {
        warnings.push({
          severity: "red",
          code: "R6",
          message: `Step ${step.stepIndex}: Total volume of dilution is ${formatNumber(mixTotalVolume, LIQUID_RESOLUTION)} ml; however, daily amount is ${formatNumber(step.dailyAmount, LIQUID_RESOLUTION)} ml, which is impossible`,
          stepIndex: step.stepIndex,
        });
      }

      // R9: if in dilution, no negatives!!
      if (step.dailyAmount.lessThanOrEqualTo(0)) {
        warnings.push({
          severity: "red",
          code: "R9",
          message: `Step ${step.stepIndex}: Daily amount cannot be <= 0 ml`,
          stepIndex: step.stepIndex,
        });
      }
      if (step.mixFoodAmount!.lessThanOrEqualTo(0)) {
        warnings.push({
          severity: "red",
          code: "R9",
          message: `Step ${step.stepIndex}: Amount of food to mix cannot be <= 0 ${getMeasuringUnit(food)}`,
          stepIndex: step.stepIndex,
        });
      }
      if (step.mixWaterAmount!.lessThan(0)) {
        warnings.push({
          severity: "red",
          code: "R9",
          message: `Step ${step.stepIndex}: Amount of water to mix cannot be < 0 ml`,
          stepIndex: step.stepIndex,
        });
      }

      // Y3: for dilutions, noted below resolution of measurement tools
      if (
        food.type === FoodType.SOLID &&
        step.mixFoodAmount!.lessThan(protocol.config.minMeasurableMass)
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.mixFoodAmount, SOLID_RESOLUTION)} g of food is impractical. Aim for value ≥ ${protocol.config.minMeasurableMass} g`,
          stepIndex: step.stepIndex,
        });
      }
      if (
        food.type === FoodType.LIQUID &&
        step.mixFoodAmount!.lessThan(protocol.config.minMeasurableVolume)
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.mixFoodAmount, LIQUID_RESOLUTION)} ml of food is impractical. Aim for value ≥ ${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }
      if (step.dailyAmount.lessThan(protocol.config.minMeasurableVolume)) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring a daily amount of ${formatNumber(step.dailyAmount, LIQUID_RESOLUTION)} ml is impractical. Aim for value ≥ ${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }
      if (step.mixWaterAmount!.lessThan(protocol.config.minMeasurableVolume)) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.mixWaterAmount, LIQUID_RESOLUTION)} ml of water is impractical. Aim for value ≥ ${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }

      // Y1: Low servings
      if (
        step.servings!.lessThan(protocol.config.minServingsForMix) &&
        step.servings!.greaterThan(new Decimal(1))
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y1",
          message: `Step ${step.stepIndex}: Only ${formatNumber(step.servings, 1)} servings (< ${DEFAULT_CONFIG.minServingsForMix} - impractical). Consider increasing mix amounts.`,
          stepIndex: step.stepIndex,
        });
      }

      // Y4: if method is dilution and Food A is a solid, and the ratio of mixFoodAmount:mixWaterAmount high (ie more than 5% w/v) our assumption that the solid contributes non neglibly to volume is violated. The effect is we underestimate the doses we give. See DEFAULT_CONFIG.MAX_SOLID_CONCENTRATION
      if (
        food.type === FoodType.SOLID &&
        step
          .mixFoodAmount!.dividedBy(step.mixWaterAmount!)
          .greaterThan(new Decimal(DEFAULT_CONFIG.MAX_SOLID_CONCENTRATION))
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y4",
          message: `Step ${step.stepIndex}: at ${formatNumber(step.mixFoodAmount, SOLID_RESOLUTION)} g of food in ${formatNumber(step.mixWaterAmount, LIQUID_RESOLUTION)} ml of water, the w/v is > ${formatNumber(DEFAULT_CONFIG.MAX_SOLID_CONCENTRATION.times(100), 0)}%. The assumption that the food contributes non-negligibly to the total volume of dilution is likely violated. Consider increasing the Daily Amount`,
          stepIndex: step.stepIndex,
        });
      }
    }
    // FOR DIRECT
    else if (step.method === Method.DIRECT) {
      // R2: Protein mismatch
      const calculatedProtein = step.dailyAmount.times(food.mgPerUnit);
      // const delta = calculatedProtein.minus(step.targetMg).abs();
      const delta = calculatedProtein.dividedBy(step.targetMg).minus(1).abs();

      if (delta.greaterThan(DEFAULT_CONFIG.PROTEIN_TOLERANCE)) {
        warnings.push({
          severity: "red",
          code: "R2",
          // message: `Step ${step.stepIndex}: Protein mismatch. Target ${formatNumber(step.targetMg, 1)} mg but calculated ${formatNumber(calculatedProtein, 1)} mg.`,
          message: `Step ${step.stepIndex}: Protein mismatch. Target ${formatNumber(step.targetMg, 1)} mg but calculated ${formatNumber(calculatedProtein, 1)} mg: ${formatNumber(delta.times(100), 0)}% difference.`,
          stepIndex: step.stepIndex,
        });
      }

      // Y3: for direct, noted below resolution of measurement tools
      if (
        food.type === FoodType.SOLID &&
        step.dailyAmount.lessThan(protocol.config.minMeasurableMass)
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.dailyAmount, SOLID_RESOLUTION)} g of food is impractical. Aim for ≥ ${protocol.config.minMeasurableMass} g`,
          stepIndex: step.stepIndex,
        });
      }
      if (
        food.type === FoodType.LIQUID &&
        step.dailyAmount.lessThan(protocol.config.minMeasurableVolume)
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.dailyAmount, LIQUID_RESOLUTION)} ml of food is impractical. Aim for ≥ ${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }
    }
  }

  // Y2: Non-ascending steps
  for (let i = 1; i < protocol.steps.length; i++) {
    if (protocol.steps[i].targetMg.lessThan(protocol.steps[i - 1].targetMg)) {
      warnings.push({
        severity: "yellow",
        code: "Y2",
        message: `Steps must be ascending or equal — check step ${protocol.steps[i].stepIndex} vs step ${protocol.steps[i - 1].stepIndex}.`,
        stepIndex: protocol.steps[i].stepIndex,
      });
    }
  }

  return warnings;
}

// ============================================
// PROTOCOL MODIFICATION FUNCTIONS
// ============================================

/**
 * Recompute the entire protocol step sequence from current high-level settings.
 *
 * Rebuilds Food A steps from the selected dosing strategy and Food A strategy, then re-applies Food B transition if present. Triggers UI updates.
 *
 * Mutates global currentProtocol.
 *
 * @returns void
 */
function recalculateProtocol(): void {
  if (!currentProtocol) return;

  const targetProteins = DOSING_STRATEGIES[currentProtocol.dosingStrategy];
  const steps: Step[] = [];

  // Regenerate Food A steps
  for (let i = 0; i < targetProteins.length; i++) {
    const step = generateStepForTarget(
      targetProteins[i],
      i + 1,
      currentProtocol.foodA,
      currentProtocol.foodAStrategy,
      currentProtocol.diThreshold,
      currentProtocol.config,
    );
    if (step) {
      steps.push(step);
    }
  }

  currentProtocol.steps = steps;

  // Re-add Food B if it exists
  if (currentProtocol.foodB && currentProtocol.foodBThreshold) {
    addFoodBToProtocol(
      currentProtocol,
      currentProtocol.foodB,
      currentProtocol.foodBThreshold,
    );
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Recompute per-step methods (DIRECT vs DILUTE) without changing targets/foods.
 *
 * For Food B steps, always enforce DILUTE_NONE. For Food A steps, use the current Food A strategy and diThreshold. Triggers UI updates.
 *
 * Mutates global currentProtocol.
 *
 * @returns void
 */
function recalculateStepMethods(): void {
  if (!currentProtocol) return;

  // Preserve existing targets and food properties but recalculate methods
  const preservedTargets = currentProtocol.steps.map((s) => s.targetMg);
  const preservedFoods = currentProtocol.steps.map((s) => s.food);

  const steps: Step[] = [];

  for (let i = 0; i < preservedTargets.length; i++) {
    const targetMg = preservedTargets[i];
    const isStepFoodB = preservedFoods[i] === "B";
    const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;
    const foodAStrategy = isStepFoodB
      ? FoodAStrategy.DILUTE_NONE
      : currentProtocol.foodAStrategy;

    const step = generateStepForTarget(
      targetMg,
      i + 1,
      food,
      foodAStrategy,
      currentProtocol.diThreshold,
      currentProtocol.config,
    );

    if (step) {
      step.food = preservedFoods[i]; // Preserve the original food property
      steps.push(step);
    }
  }

  currentProtocol.steps = steps;
  renderProtocolTable();
  updateWarnings();
}

/**
 * Handle user change to a step's target protein (mg).
 *
 * Updates dependent fields:
 * - DIRECT: recompute dailyAmount = targetMg / mgPerUnit
 * - DILUTE: recompute servings and mixWaterAmount to preserve dailyAmount and mixFoodAmount
 *
 * Triggers UI and warnings re-render.
 *
 * @param stepIndex 1-based index of the step to update
 * @param newTargetMg New target protein (mg)
 * @returns void
 */
function updateStepTargetMg(stepIndex: number, newTargetMg: any): void {
  // newTargetMg has to be any since it accepts update from UI user input
  // Though it really should only be a number
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step) return;

  step.targetMg = new Decimal(newTargetMg);

  // Determine which food
  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

  if (step.method === Method.DIRECT) {
    // Recalculate dailyAmount
    step.dailyAmount = step.targetMg.dividedBy(food.mgPerUnit);
  } else {
    // DILUTE - keep mixFoodAmount and dailyAmount, recalculate servings and water
    const totalMixProtein = step.mixFoodAmount!.times(food.mgPerUnit);
    step.servings = totalMixProtein.dividedBy(step.targetMg);

    if (food.type === FoodType.SOLID) {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume;
    } else {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
    }
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Handle user change to a step's daily amount (g/ml).
 *
 * Updates dependent fields:
 * - DIRECT: recompute targetMg = dailyAmount × mgPerUnit
 * - DILUTE: recompute servings and mixWaterAmount to preserve targetMg and mixFoodAmount
 *
 * Triggers UI and warnings re-render.
 *
 * @param stepIndex 1-based index of the step to update
 * @param newDailyAmount New amount (g or ml), number-like
 * @returns void
 */
function updateStepDailyAmount(stepIndex: number, newDailyAmount: any): void {
  // new daily amount should be any since it accepts value from UI in event handler
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step) return;

  step.dailyAmount = new Decimal(newDailyAmount);

  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

  if (step.method === Method.DIRECT) {
    // Recalculate target protein
    step.targetMg = step.dailyAmount.times(food.mgPerUnit);
  } else {
    // DILUTE - keep mixFoodAmount fixed, recalculate water
    const totalMixProtein = step.mixFoodAmount!.times(food.mgPerUnit);
    step.servings = totalMixProtein.dividedBy(step.targetMg);

    if (food.type === FoodType.SOLID) {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume;
    } else {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
    }
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Handle user change to a dilution step's mix food amount.
 *
 * Updates dependent fields (servings and mixWaterAmount) while preserving targetMg and dailyAmount.
 *
 * Triggers UI and warnings re-render.
 *
 * @param stepIndex 1-based index of the dilution step
 * @param newMixFoodAmount New amount of food to include in mix (g or ml), number-like
 * @returns void
 */
function updateStepMixFoodAmount(
  // newMixFoodAmount must be any since it accepts user input from UI
  stepIndex: number,
  newMixFoodAmount: any,
): void {
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step || step.method !== Method.DILUTE) return;

  step.mixFoodAmount = new Decimal(newMixFoodAmount);

  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

  // Recalculate water to keep P and dailyAmount unchanged
  const totalMixProtein = step.mixFoodAmount.times(food.mgPerUnit);
  step.servings = totalMixProtein.dividedBy(step.targetMg);

  if (food.type === FoodType.SOLID) {
    const mixTotalVolume = step.dailyAmount.times(step.servings);
    step.mixWaterAmount = mixTotalVolume;
  } else {
    const mixTotalVolume = step.dailyAmount.times(step.servings);
    step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount);
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Duplicate a step and insert it immediately after the original.
 *
 * Copies all step fields; for DILUTE steps also copies mix amounts and servings. Reindexes all subsequent steps. Triggers UI update.
 *
 * @param stepIndex 1-based index after which to insert the new step
 * @returns void
 */
function addStepAfter(stepIndex: number): void {
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step) return;

  // Duplicate the step
  const newStep: Step = {
    stepIndex: step.stepIndex + 1,
    targetMg: step.targetMg,
    method: step.method,
    dailyAmount: step.dailyAmount,
    dailyAmountUnit: step.dailyAmountUnit,
    food: step.food,
  };

  if (step.method === Method.DILUTE) {
    newStep.mixFoodAmount = step.mixFoodAmount;
    newStep.mixWaterAmount = step.mixWaterAmount;
    newStep.servings = step.servings;
  }

  currentProtocol.steps.splice(stepIndex, 0, newStep);

  // Reindex
  for (let i = 0; i < currentProtocol.steps.length; i++) {
    currentProtocol.steps[i].stepIndex = i + 1;
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Remove a step from the protocol and reindex the remaining steps.
 *
 * Does nothing if there is only one step. Triggers UI update.
 *
 * @param stepIndex 1-based index of the step to remove
 * @returns void
 */
function removeStep(stepIndex: number): void {
  if (!currentProtocol) return;
  if (currentProtocol.steps.length <= 1) return;

  currentProtocol.steps.splice(stepIndex - 1, 1);

  // Reindex
  for (let i = 0; i < currentProtocol.steps.length; i++) {
    currentProtocol.steps[i].stepIndex = i + 1;
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Toggle the form (SOLID ⇄ LIQUID) for Food A or Food B, updating all steps.
 *
 * For DILUTE steps:
 * - ensures dailyAmountUnit is "ml"
 * - recomputes mixWaterAmount based on the new volume model
 *
 * For DIRECT steps:
 * - adjusts dailyAmountUnit to "g" (SOLID) or "ml" (LIQUID)
 *
 * Triggers re-render of settings, table, and warnings.
 *
 * @param isFoodB When true, toggles Food B; otherwise toggles Food A
 * @returns void
 */
function toggleFoodType(isFoodB: boolean): void {
  if (!currentProtocol) return;

  const food = isFoodB ? currentProtocol.foodB! : currentProtocol.foodA;
  food.type = food.type === FoodType.SOLID ? FoodType.LIQUID : FoodType.SOLID;

  // Convert all relevant steps
  for (const step of currentProtocol.steps) {
    const stepIsFoodB = step.food === "B";
    if (stepIsFoodB !== isFoodB) continue;
    if (step.method === Method.DILUTE) {
      // Convert mixFoodAmount assuming 1g ≈ 1ml (value stays the same)
      // Ensure dailyAmountUnit is always "ml" for dilutions
      step.dailyAmountUnit = "ml";

      // Recalculate servings and water based on new food type
      const totalMixProtein = step.mixFoodAmount!.times(food.mgPerUnit);
      step.servings = totalMixProtein.dividedBy(step.targetMg);

      if (food.type === FoodType.SOLID) {
        // Switched to solid (was liquid)
        // For solid: water = total volume (solid volume negligible)
        const mixTotalVolume = step.dailyAmount.times(step.servings);
        step.mixWaterAmount = mixTotalVolume;
      } else {
        // Switched to liquid (was solid)
        // For liquid: water = total - food

        const mixTotalVolume = step.dailyAmount.times(step.servings);
        step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
      }
    } else {
      // DIRECT - just update unit
      step.dailyAmountUnit = food.type === FoodType.SOLID ? "g" : "ml";
    }
  }

  renderFoodSettings();
  renderProtocolTable();
  updateWarnings();
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

/**
 * Make protocol-dependent UI elements visible after initialization.
 * These include the dosing strategy container and the warnings container.
 */
function showProtocolUI(): void {
  const dosingContainer = document.querySelector(
    ".dosing-strategy-container",
  ) as HTMLElement;
  const warningsContainer = document.querySelector(
    ".warnings-container",
  ) as HTMLElement;

  if (dosingContainer) {
    dosingContainer.classList.remove("oit-hidden-on-init");
  }
  if (warningsContainer) {
    warningsContainer.classList.remove("oit-hidden-on-init");
  }
}

/**
 * Render Food A and (optionally) Food B settings panels into the DOM.
 *
 * Uses currentProtocol to populate controls and attaches event listeners.
 * Safe to call repeatedly; replaces existing settings blocks in-place.
 *
 * @returns void
 */
function renderFoodSettings(): void {
  if (!currentProtocol) return;

  const foodAContainer = document.querySelector(
    ".food-a-container",
  ) as HTMLElement;
  const foodBContainer = document.querySelector(
    ".food-b-container",
  ) as HTMLElement;

  // Render Food A settings
  let foodAHTML = `
    <div class="food-a-settings">
      <input
        type="text"
        class="food-name-input"
        id="food-a-name"
        value="${escapeHtml(currentProtocol.foodA.name)}"
      />
      <div class="setting-row">
        <label>Protein:</label>
      <div class="input-unit-group">
        <input
          type="number"
          min="0"
          max="150"
          id="food-a-protein"
          value="${mgPerUnitToGramPer100(currentProtocol.foodA.mgPerUnit).toFixed(1)}"
          step="0.1"
        />
        <span>g per 100 ${currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml"}</span>
      </div>
      </div>
      <div class="setting-row">
        <label>Form:</label>
        <div class="toggle-group">
          <button class="toggle-btn ${currentProtocol.foodA.type === FoodType.SOLID ? "active" : ""}" data-action="toggle-food-a-solid">Solid</button>
          <button class="toggle-btn ${currentProtocol.foodA.type === FoodType.LIQUID ? "active" : ""}" data-action="toggle-food-a-liquid">Liquid</button>
        </div>
      </div>
      <div class="setting-row">
        <label>Dilution strategy:</label>
        <div class="toggle-group">
          <button class="toggle-btn ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL ? "active" : ""}" data-action="food-a-strategy-initial">Initial dilution</button>
          <button class="toggle-btn ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_ALL ? "active" : ""}" data-action="food-a-strategy-all">Dilution throughout</button>
          <button class="toggle-btn ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_NONE ? "active" : ""}" data-action="food-a-strategy-none">No dilutions</button>
        </div>
      </div>
      ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL
      ? `
      <div class="setting-row threshold-setting">
        <label>Directly dose when neat amount ≥</label>
        <div class="input-unit-group">
          <input
            type="number"
            id="food-a-threshold"
            min="0"
            value="${formatAmount(currentProtocol.diThreshold, currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml")}"
            step="0.1"
          />
          <span>${currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml"}</span>
        </div>
      </div>
      `
      : ""
    }
    </div>
  `;

  const existingSettings = foodAContainer.querySelector(".food-a-settings");
  if (existingSettings) {
    existingSettings.outerHTML = foodAHTML;
  } else {
    foodAContainer.insertAdjacentHTML("beforeend", foodAHTML);
  }

  // Render Food B settings if present
  if (currentProtocol.foodB) {
    let foodBHTML = `
      <div class="food-b-settings">
        <input
          type="text"
          class="food-name-input"
          id="food-b-name"
          value="${escapeHtml(currentProtocol.foodB.name)}"
        />
        <div class="setting-row">
          <label>Protein:</label>
          <div class="input-unit-group">
            <input
              type="number"
              id="food-b-protein"
              min="0"
              max="150"
              value="${mgPerUnitToGramPer100(currentProtocol.foodB.mgPerUnit).toFixed(1)}"
              step="0.1"
            />
            <span>g per 100 ${currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml"}</span>
          </div>
        </div>
        <div class="setting-row">
          <label>Form:</label>
          <div class="toggle-group">
            <button class="toggle-btn ${currentProtocol.foodB.type === FoodType.SOLID ? "active" : ""}" data-action="toggle-food-b-solid">Solid</button>
            <button class="toggle-btn ${currentProtocol.foodB.type === FoodType.LIQUID ? "active" : ""}" data-action="toggle-food-b-liquid">Liquid</button>
          </div>
        </div>
        <div class="setting-row threshold-setting">
          <label>Transition when daily amount ≥</label>
          <div class="input-unit-group">
            <input
              type="number"
              id="food-b-threshold"
              value="${formatAmount(currentProtocol.foodBThreshold!.amount, currentProtocol.foodBThreshold!.unit)}"
              step="0.1"
              min="0"
            />
            <span>${currentProtocol.foodBThreshold!.unit}</span>
          </div>
        </div>
      </div>
    `;

    const existingBSettings = foodBContainer.querySelector(".food-b-settings");
    if (existingBSettings) {
      existingBSettings.outerHTML = foodBHTML;
    } else {
      foodBContainer.insertAdjacentHTML("beforeend", foodBHTML);
    }
  } else {
    const existingBSettings = foodBContainer.querySelector(".food-b-settings");
    if (existingBSettings) {
      existingBSettings.remove();
    }
  }

  attachSettingsEventListeners();
}

/**
 * Render dosing strategy buttons and wire up click handlers.
 *
 * Re-renders when strategy changes (which triggers recomputation of protocol).
 *
 * @returns void
 */
function renderDosingStrategy(): void {
  if (!currentProtocol) return;

  const container = document.querySelector(
    ".dosing-strategy-container",
  ) as HTMLElement;

  const html = `
    <h3>Dosing Strategy (resets all steps on change)</h3>
    <div class="setting-row">
      <div class="toggle-group">
        <button class="toggle-btn ${currentProtocol.dosingStrategy === DosingStrategy.STANDARD ? "active" : ""}" data-strategy="STANDARD">Standard</button>
        <button class="toggle-btn ${currentProtocol.dosingStrategy === DosingStrategy.SLOW ? "active" : ""}" data-strategy="SLOW">Slow</button>
        <button class="toggle-btn ${currentProtocol.dosingStrategy === DosingStrategy.RAPID ? "active" : ""}" data-strategy="RAPID">Rapid</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  container.querySelectorAll("[data-strategy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const strategy = (e.target as HTMLElement).getAttribute(
        "data-strategy",
      ) as DosingStrategy;
      if (currentProtocol && strategy !== currentProtocol.dosingStrategy) {
        currentProtocol.dosingStrategy = strategy;
        recalculateProtocol();
        renderDosingStrategy();
      }
    });
  });
}

/**
 * Render the protocol table (steps) and auxiliary UI (export, notes).
 *
 * Highlights rows with warnings, groups by Food A/B, and attaches handlers for inline editing and step add/remove controls.
 *
 * @returns void
 */
function renderProtocolTable(): void {
  if (!currentProtocol) return;

  const tableContainer = document.querySelector(
    ".output-container table",
  ) as HTMLElement;

  let html = `
    <thead>
      <tr>
        <th>Step</th>
        <th>Protein (mg)</th>
        <th>Method</th>
        <th>Daily amount</th>
        <th>Amount for mixture</th>
        <th>Water for mixture</th>
      </tr>
    </thead>
    <tbody>
  `;

  let lastWasFootA = true;

  // Get warnings to check for step highlights
  const warnings = validateProtocol(currentProtocol);
  const stepWarnings = new Map<number, "red" | "yellow">();
  for (const warning of warnings) {
    if (warning.stepIndex !== undefined) {
      const existing = stepWarnings.get(warning.stepIndex);
      // Red takes precedence over yellow
      if (!existing || (warning.severity === "red" && existing === "yellow")) {
        stepWarnings.set(warning.stepIndex, warning.severity);
      }
    }
  }

  for (const step of currentProtocol.steps) {
    const isStepFoodB = step.food === "B";
    const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

    // Add food header if transitioning
    if (isStepFoodB && lastWasFootA) {
      html += `
        <tr class="food-section-header">
          <td colspan="6">${escapeHtml(currentProtocol.foodB!.name)}</td>
        </tr>
      `;
      lastWasFootA = false;
    } else if (!isStepFoodB && step.stepIndex === 1) {
      html += `
        <tr class="food-section-header">
          <td colspan="6">${escapeHtml(currentProtocol.foodA.name)}</td>
        </tr>
      `;
    }

    // Add warning class if this step has warnings
    const warningClass = stepWarnings.get(step.stepIndex);
    const rowClass = warningClass ? `warning-highlight-${warningClass}` : "";
    html += `<tr class="${rowClass}">`;

    // Actions + Step number
    html += `
      <td>
        <div class="actions-cell">
          <button class="btn-add-step" data-step="${step.stepIndex}">+</button>
          <button class="btn-remove-step" data-step="${step.stepIndex}">−</button>
          <span class="step-number">${step.stepIndex}</span>
        </div>
      </td>
    `;

    // Protein (editable)
    html += `
      <td>
        <input
          class="editable"
          type="number"
          data-step="${step.stepIndex}"
          data-field="targetMg"
          value="${formatNumber(step.targetMg, 1)}"
          step="0.1"
          min="0"
        />
      </td>
    `;

    // Method
    html += `
      <td class="method-cell">${step.method}</td>
    `;

    // Daily amount (editable)
    html += `
      <td>
        <input
          class="editable"
          type="number"
          data-step="${step.stepIndex}"
          data-field="dailyAmount"
          value="${formatAmount(step.dailyAmount, step.dailyAmountUnit)}"
          step="0.1"
          min="0"
        />
        <span> ${step.dailyAmountUnit}</span>
      </td>
    `;

    // Amount for mixture (editable for dilutions)
    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
      html += `
        <td>
          <input
            class="editable"
            type="number"
            data-step="${step.stepIndex}"
            data-field="mixFoodAmount"
            min="0"
            value="${formatAmount(step.mixFoodAmount!, mixUnit)}"
            step="0.01"
          />
          <span> ${mixUnit}</span>
        </td>
      `;
    } else {
      html += `<td class="na-cell">n/a</td>`;
    }

    // Water for mixture (non-editable, auto-calculated)
    // Also includes servings TODO! consider removing?
    if (step.method === Method.DILUTE) {
      html += `
        <td class="non-editable">
          ${formatAmount(step.mixWaterAmount!, "ml")} ml
          <span style="color: var(--oit-text-secondary); font-size: 0.85rem;"> (${formatNumber(step.servings!, 1)} servings)</span>
        </td>
      `;
    } else {
      html += `<td class="na-cell">n/a</td>`;
    }

    html += `</tr>`;
  }

  html += `</tbody>`;

  tableContainer.innerHTML = html;

  // Add export buttons to bottom section
  const bottomSection = document.querySelector(
    ".bottom-section",
  ) as HTMLElement;
  let exportContainer = bottomSection.querySelector(".export-container");
  if (!exportContainer) {
    const exportHTML = `
      <div class="export-container">
        <div class="export-buttons">
          <button class="btn-export" id="export-ascii">Copy ASCII</button>
          <button class="btn-export" id="export-pdf">Export PDF</button>
        </div>
        <div class="custom-note-container">
          <label for="custom-note">Notes:</label>
          <textarea
            id="custom-note"
            class="custom-note-textarea"
            placeholder="Add any custom notes or instructions ..."
            rows="8"
          >${escapeHtml(customNote)}</textarea>
        </div>
      </div>
    `;
    bottomSection.insertAdjacentHTML("afterbegin", exportHTML);
  }

  attachTableEventListeners();
  attachExportEventListeners();
  attachCustomNoteListener();
}

// TODO! ? group step warnings together? so it's not just Step 1 ... Step 1 ... Step 1 if step 1 has ++ warnings
/**
 * Recompute and render the warnings sidebar for the current protocol.
 *
 * Groups warnings by severity and prints human-readable messages.
 *
 * @returns void
 */
function updateWarnings(): void {
  if (!currentProtocol) return;

  const warnings = validateProtocol(currentProtocol);
  const container = document.querySelector(
    ".warnings-container",
  ) as HTMLElement;

  if (warnings.length === 0) {
    container.innerHTML = `
      <div class="no-warnings">✓ Protocol valid. See&nbsp;<a href="${warningsPageURL}" target="_blank">here</a>&nbsp;for the issues we check for.<br></div>
    `;
    return;
  }

  const redWarnings = warnings.filter((w) => w.severity === "red");
  const yellowWarnings = warnings.filter((w) => w.severity === "yellow");

  let html = "";

  if (redWarnings.length > 0) {
    html += `
      <div class="warning-section red-warnings">
        <h4>Critical Issues (Red)</h4>
        <ul>
          ${redWarnings.map((w) => `<li><strong>${w.message}</strong></li>`).join("")}
        </ul>
      </div>
    `;
  }

  if (yellowWarnings.length > 0) {
    html += `
      <div class="warning-section yellow-warnings">
        <h4>Cautions (Yellow)</h4>
        <ul>
          ${yellowWarnings.map((w) => `<li>${w.message}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ============================================
// SEARCH FUNCTIONS
// ============================================

/**
 * Run fuzzy search against foods and/or protocol templates.
 *
 * For searchType "food": returns foods only (used for Food B search).
 * For searchType "protocol": returns protocols first, then foods (Food A search).
 *
 * @param query User-entered search string
 * @param searchType "food" to search foods only; "protocol" to search protocols+foods
 * @returns Array of fuzzysort results (protocols may appear before foods)
 */
function performSearch(query: string, searchType: "food" | "protocol"): any[] {
  if (!query.trim()) return [];

  if (searchType === "protocol") {
    // Search foods only (for Food B)
    const results = fuzzysort.go(query, fuzzySortPreparedFoods, {
      key: "Food",
      limit: 50,
      threshold: -10000,
    });
    return [...results];
  } else {
    // Search both foods and protocols for Food A
    const foodResults = fuzzysort.go(query, fuzzySortPreparedFoods, {
      key: "Food",
      limit: 25,
      threshold: -10000,
    });

    const protocolResults = fuzzysort.go(query, fuzzySortPreparedProtocols, {
      key: "name",
      limit: 25,
      threshold: -10000,
    });

    // Combine results
    return [...protocolResults, ...foodResults];
  }
}

/**
 * Render the autocomplete dropdown below a search input.
 *
 * Always includes a "Custom" item (index 0) to create user-defined foods.
 * Clicking an item selects Food A, Food B, or a protocol template depending on the input element.
 *
 * @param inputId Element id of the associated input
 * @param results Fuzzysort results array to display
 * @param query Current input string (used for the Custom option)
 * @returns void
 */
function showSearchDropdown(
  inputId: string,
  results: any[],
  query: string,
): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const container = input.parentElement!;

  // Remove existing dropdown
  const existingDropdown = container.querySelector(".search-dropdown");
  if (existingDropdown) {
    existingDropdown.remove();
  }

  if (results.length === 0 && !query.trim()) return;

  const dropdown = document.createElement("div");
  dropdown.className = "search-dropdown";

  // Reset dropdown navigation state
  currentDropdownIndex = -1;
  currentDropdownInputId = inputId;

  // Always add custom option first
  const customItem = document.createElement("div");
  customItem.className = "search-result-item";
  customItem.setAttribute("data-index", "0");
  customItem.innerHTML = `<strong>Custom:</strong> ${escapeHtml(query || "New food")}`;
  customItem.addEventListener("click", () => {
    selectCustomFood(query || "New Food", inputId);
    hideSearchDropdown(inputId);
  });
  dropdown.appendChild(customItem);

  // Add search results
  const displayResults = results.slice(0, 50);
  for (let i = 0; i < displayResults.length; i++) {
    const result = displayResults[i];
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.setAttribute("data-index", String(i + 1));

    if (result.obj.name) {
      // Protocol result
      item.innerHTML = `<strong>Protocol:</strong> ${escapeHtml(result.obj.name)}`;
      item.addEventListener("click", () => {
        selectProtocol(result.obj);
        hideSearchDropdown(inputId);
      });
    } else {
      // Food result
      const foodData = result.obj as FoodData;
      item.innerHTML = `
        ${escapeHtml(foodData.Food)}
        <span class="food-type"> - ${escapeHtml(foodData.Type)} - Protein: ${foodData["Mean value in 100g"].toFixed(1)} g/100 ${foodData.Type === "Solid" ? "g" : "ml"}</span>
      `;
      item.addEventListener("click", () => {
        if (inputId === "food-a-search") {
          selectFoodA(foodData);
        } else {
          selectFoodB(foodData);
        }
        hideSearchDropdown(inputId);
      });
    }

    dropdown.appendChild(item);
  }

  container.appendChild(dropdown);
}

/**
 * Remove and reset the autocomplete dropdown for a given input.
 *
 * @param inputId Element id of the associated input
 * @returns void
 */
function hideSearchDropdown(inputId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const container = input.parentElement!;
  const dropdown = container.querySelector(".search-dropdown");
  if (dropdown) {
    dropdown.remove();
  }
  currentDropdownIndex = -1;
  currentDropdownInputId = "";
}

/**
 * Keyboard navigation for the autocomplete dropdown.
 *
 * Wraps around at ends and ensures the highlighted item is visible.
 *
 * @param direction "up" or "down"
 * @returns void
 */
function navigateDropdown(direction: "up" | "down"): void {
  if (!currentDropdownInputId) return;

  const input = document.getElementById(
    currentDropdownInputId,
  ) as HTMLInputElement;
  if (!input) return;

  const container = input.parentElement!;
  const dropdown = container.querySelector(".search-dropdown");
  if (!dropdown) return;

  const items = Array.from(dropdown.querySelectorAll(".search-result-item"));
  if (items.length === 0) return;

  // Remove current highlight
  if (currentDropdownIndex >= 0 && currentDropdownIndex < items.length) {
    items[currentDropdownIndex].classList.remove("highlighted");
  }

  // Update index
  if (direction === "down") {
    currentDropdownIndex = (currentDropdownIndex + 1) % items.length;
  } else {
    currentDropdownIndex =
      currentDropdownIndex <= 0 ? items.length - 1 : currentDropdownIndex - 1;
  }

  // Add new highlight
  items[currentDropdownIndex].classList.add("highlighted");

  // Scroll into view
  items[currentDropdownIndex].scrollIntoView({
    block: "nearest",
    behavior: "smooth",
  });
}

/**
 * Programmatically "click" the currently highlighted autocomplete item.
 *
 * No-op if nothing is highlighted or the dropdown is missing.
 *
 * @returns void
 */
function selectHighlightedDropdownItem(): void {
  if (!currentDropdownInputId || currentDropdownIndex < 0) return;

  const input = document.getElementById(
    currentDropdownInputId,
  ) as HTMLInputElement;
  if (!input) return;

  const container = input.parentElement!;
  const dropdown = container.querySelector(".search-dropdown");
  if (!dropdown) return;

  const items = Array.from(dropdown.querySelectorAll(".search-result-item"));
  if (currentDropdownIndex < items.length) {
    (items[currentDropdownIndex] as HTMLElement).click();
  }
}

// ============================================
// FOOD SELECTION FUNCTIONS
// ============================================

/**
 * Select Food A from database entry and initialize a default protocol.
 *
 * Triggers rendering of settings, dosing strategy, table, and warnings.
 *
 * @param foodData Entry from the foods database
 * @returns void
 */
function selectFoodA(foodData: FoodData): void {
  const food: Food = {
    name: foodData.Food,
    type: foodData.Type === "Solid" ? FoodType.SOLID : FoodType.LIQUID,
    mgPerUnit: gramPer100ToMgPerUnit(foodData["Mean value in 100g"]),
  };

  currentProtocol = generateDefaultProtocol(food, DEFAULT_CONFIG);

  showProtocolUI();
  renderFoodSettings();
  renderDosingStrategy();
  renderProtocolTable();
  updateWarnings();
  updateFoodBDisabledState();

  (document.getElementById("food-a-search") as HTMLInputElement).value = "";
}

/**
 * Select Food B from database entry and compute transition steps.
 *
 * Applies DEFAULT_FOOD_B_THRESHOLD as the initial transition threshold.
 * Triggers rendering and warnings update.
 *
 * @param foodData Entry from the foods database
 * @returns void
 */
function selectFoodB(foodData: FoodData): void {
  if (!currentProtocol) return;

  const food: Food = {
    name: foodData.Food,
    type: foodData.Type === "Solid" ? FoodType.SOLID : FoodType.LIQUID,
    mgPerUnit: gramPer100ToMgPerUnit(foodData["Mean value in 100g"]),
  };

  const threshold = {
    unit: food.type === FoodType.SOLID ? ("g" as Unit) : ("ml" as Unit),
    amount: DEFAULT_CONFIG.DEFAULT_FOOD_B_THRESHOLD,
  };

  addFoodBToProtocol(currentProtocol, food, threshold);

  renderFoodSettings();
  renderProtocolTable();
  updateWarnings();

  (document.getElementById("food-b-search") as HTMLInputElement).value = "";
}

/**
 * Create and select a custom food for Food A or Food B.
 *
 * Defaults to SOLID with 10 g protein per 100 g (100 mg/g) until edited.
 * For Food A, initializes a new protocol; for Food B, attaches to current protocol.
 *
 * @param name Display name for the custom food
 * @param inputId Source input id ("food-a-search" or "food-b-search")
 * @returns void
 */
function selectCustomFood(name: string, inputId: string): void {
  const food: Food = {
    name: name || "Custom Food",
    type: FoodType.SOLID,
    mgPerUnit: gramPer100ToMgPerUnit(10), // Default 10g protein per 100g
  };

  if (inputId === "food-a-search") {
    currentProtocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
    showProtocolUI();
    renderFoodSettings();
    renderDosingStrategy();
    renderProtocolTable();
    updateWarnings();
    updateFoodBDisabledState();
  } else {
    if (!currentProtocol) return;
    const threshold = {
      unit: "g" as Unit,
      amount: DEFAULT_CONFIG.DEFAULT_FOOD_B_THRESHOLD,
    };
    addFoodBToProtocol(currentProtocol, food, threshold);
    renderFoodSettings();
    renderProtocolTable();
    updateWarnings();
  }

  (document.getElementById(inputId) as HTMLInputElement).value = "";
}

/**
 * Load a protocol template from JSON metadata.
 *
 * Populates Food A, strategy, thresholds, and the appropriate step table (table_di, table_dn, or table_da). Also loads Food B and its threshold if present. Computes servings for any dilution steps.
 *
 * Triggers full UI refresh and updates Food B disabled state.
 *
 * @param protocolData Protocol template record
 * @returns void
 */
function selectProtocol(protocolData: ProtocolData): void {
  // Load protocol from JSON. All numbers should be represented as strings
  const foodA: Food = {
    name: protocolData.food_a.name,
    type:
      protocolData.food_a.type === "SOLID" ? FoodType.SOLID : FoodType.LIQUID,
    mgPerUnit: new Decimal(protocolData.food_a.mgPerUnit),
  };

  const protocol: Protocol = {
    dosingStrategy:
      DosingStrategy[
      protocolData.dosing_strategy as keyof typeof DosingStrategy
      ],
    foodA,
    foodAStrategy:
      FoodAStrategy[protocolData.food_a_strategy as keyof typeof FoodAStrategy],
    diThreshold: new Decimal(protocolData.di_threshold),
    steps: [],
    config: DEFAULT_CONFIG,
  };

  // Load custom note if it exists in global
  if (protocolData.custom_note) {
    customNote = protocolData.custom_note;
  }

  // load steps from the relevant table (table_di, table_dn, or table_da
  let tableToLoad: any[] = [];
  if (protocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL) {
    tableToLoad = protocolData.table_di;
  } else if (protocol.foodAStrategy === FoodAStrategy.DILUTE_NONE) {
    tableToLoad = protocolData.table_dn;
  } else if (protocol.foodAStrategy === FoodAStrategy.DILUTE_ALL) {
    tableToLoad = protocolData.table_da;
  }

  // Load steps from relevant table
  for (let i = 0; i < tableToLoad.length; i++) {
    const row = tableToLoad[i];
    const step: Step = {
      stepIndex: i + 1,
      targetMg: new Decimal(row.protein),
      method: row.method === "DILUTE" ? Method.DILUTE : Method.DIRECT,
      dailyAmount: new Decimal(row.daily_amount),
      dailyAmountUnit:
        row.method === "DILUTE"
          ? "ml"
          : row.food === foodA.name
            ? foodA.type === FoodType.SOLID
              ? "g"
              : "ml"
            : "g",
      food: row.food === foodA.name ? "A" : "B",
    };

    if (row.method === "DILUTE") {
      step.mixFoodAmount = new Decimal(row.mix_amount);
      step.mixWaterAmount = new Decimal(row.water_amount);
      // Calculate servings
      const food = row.food === foodA.name ? foodA : protocol.foodB!;
      const totalMixProtein = step.mixFoodAmount.times(food.mgPerUnit);
      step.servings = totalMixProtein.dividedBy(step.targetMg);
    }

    protocol.steps.push(step);
  }

  // Load Food B if present
  if (protocolData.food_b) {
    protocol.foodB = {
      name: protocolData.food_b.name,
      type:
        protocolData.food_b.type === "SOLID" ? FoodType.SOLID : FoodType.LIQUID,
      mgPerUnit: new Decimal(protocolData.food_b.mgPerUnit),
    };

    if (protocolData.food_b_threshold) {
      protocol.foodBThreshold = {
        unit: protocol.foodB.type === FoodType.SOLID ? "g" : "ml",
        amount: new Decimal(protocolData.food_b_threshold),
      };
    }
  }

  currentProtocol = protocol;

  showProtocolUI();
  renderFoodSettings();
  renderDosingStrategy();
  renderProtocolTable();
  updateWarnings();
  updateFoodBDisabledState();

  (document.getElementById("food-a-search") as HTMLInputElement).value = "";
}

/**
 * Remove Food B and its transition from the current protocol.
 *
 * Recomputes the protocol as Food A only and refreshes UI.
 *
 * @returns void
 */
function clearFoodB(): void {
  if (!currentProtocol) return;

  // Remove Food B and recalculate
  currentProtocol.foodB = undefined;
  currentProtocol.foodBThreshold = undefined;

  // Regenerate steps without Food B
  recalculateProtocol();

  renderFoodSettings();
  renderProtocolTable();
  updateWarnings();
}

/**
 * Enable/disable the Food B UI section depending on Food A availability.
 *
 * Also clears and disables inputs when Food A is not set.
 *
 * @returns void
 */
function updateFoodBDisabledState(): void {
  const foodBContainer = document.querySelector(
    ".food-b-container",
  ) as HTMLElement;
  if (!foodBContainer) return;

  const hasFoodA = currentProtocol && currentProtocol.foodA;

  if (hasFoodA) {
    foodBContainer.classList.remove("disabled");
    const searchInput = document.getElementById(
      "food-b-search",
    ) as HTMLInputElement;
    const clearBtn = document.getElementById(
      "clear-food-b",
    ) as HTMLButtonElement;
    if (searchInput) {
      searchInput.disabled = false;
    }
    if (clearBtn) {
      clearBtn.disabled = false;
    }
  } else {
    foodBContainer.classList.add("disabled");
    const searchInput = document.getElementById(
      "food-b-search",
    ) as HTMLInputElement;
    const clearBtn = document.getElementById(
      "clear-food-b",
    ) as HTMLButtonElement;
    if (searchInput) {
      searchInput.disabled = true;
      searchInput.value = "";
    }
    if (clearBtn) {
      clearBtn.disabled = true;
    }
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Wire up event listeners for settings panel controls (Food A/B).
 *
 * Handles:
 * - name, protein concentration, and thresholds
 * - strategy toggles and type toggles
 * - recomputation and re-rendering on change
 *
 * @returns void
 */
function attachSettingsEventListeners(): void {
  // Food A name
  const foodANameInput = document.getElementById(
    "food-a-name",
  ) as HTMLInputElement;
  if (foodANameInput) {
    foodANameInput.addEventListener("input", (e) => {
      if (currentProtocol) {
        currentProtocol.foodA.name = (e.target as HTMLInputElement).value;
        renderProtocolTable();
      }
    });
  }

  // Food A protein
  const foodAProteinInput = document.getElementById(
    "food-a-protein",
  ) as HTMLInputElement;
  if (foodAProteinInput) {
    foodAProteinInput.addEventListener("change", (e) => {
      if (currentProtocol) {
        let value = parseFloat((e.target as HTMLInputElement).value);
        // Clamp value between 0 and 150
        if (value < 0) value = 0;
        if (value > 150) value = 150;
        if (Number.isNaN(value)) value = 0;
        (e.target as HTMLInputElement).value = value.toFixed(1);
        currentProtocol.foodA.mgPerUnit = gramPer100ToMgPerUnit(value);
        recalculateStepMethods();
      }
    });
  }

  // Food A threshold
  const foodAThresholdInput = document.getElementById(
    "food-a-threshold",
  ) as HTMLInputElement;
  if (foodAThresholdInput) {
    foodAThresholdInput.addEventListener("change", (e) => {
      if (currentProtocol) {
        currentProtocol.diThreshold = new Decimal(
          (e.target as HTMLInputElement).value,
        );
        recalculateStepMethods();
      }
    });
  }

  // Food B name
  const foodBNameInput = document.getElementById(
    "food-b-name",
  ) as HTMLInputElement;
  if (foodBNameInput) {
    foodBNameInput.addEventListener("input", (e) => {
      if (currentProtocol && currentProtocol.foodB) {
        currentProtocol.foodB.name = (e.target as HTMLInputElement).value;
        renderProtocolTable();
      }
    });
  }

  // Food B protein
  const foodBProteinInput = document.getElementById(
    "food-b-protein",
  ) as HTMLInputElement;
  if (foodBProteinInput) {
    foodBProteinInput.addEventListener("change", (e) => {
      if (currentProtocol && currentProtocol.foodB) {
        let value = parseFloat((e.target as HTMLInputElement).value);
        // Clamp value between 0 and 150
        if (value < 0) value = 0;
        if (value > 150) value = 150;
        if (Number.isNaN(value)) value = 0;
        (e.target as HTMLInputElement).value = value.toFixed(1);
        currentProtocol.foodB.mgPerUnit = gramPer100ToMgPerUnit(value);

        // Recalculate Food B steps
        if (currentProtocol.foodBThreshold) {
          const tempFoodB = currentProtocol.foodB;
          const tempThreshold = currentProtocol.foodBThreshold;
          currentProtocol.foodB = undefined;
          currentProtocol.foodBThreshold = undefined;
          recalculateProtocol();
          addFoodBToProtocol(currentProtocol, tempFoodB, tempThreshold);
          renderProtocolTable();
          updateWarnings();
        }
      }
    });
  }

  // Food B threshold
  const foodBThresholdInput = document.getElementById(
    "food-b-threshold",
  ) as HTMLInputElement;
  if (foodBThresholdInput) {
    foodBThresholdInput.addEventListener("change", (e) => {
      if (
        currentProtocol &&
        currentProtocol.foodB &&
        currentProtocol.foodBThreshold
      ) {
        currentProtocol.foodBThreshold.amount = new Decimal(
          (e.target as HTMLInputElement).value,
        );

        // Recalculate transition
        const tempFoodB = currentProtocol.foodB;
        const tempThreshold = currentProtocol.foodBThreshold;
        currentProtocol.foodB = undefined;
        currentProtocol.foodBThreshold = undefined;
        recalculateProtocol();
        addFoodBToProtocol(currentProtocol, tempFoodB, tempThreshold);
        renderProtocolTable();
        updateWarnings();
      }
    });
  }

  // Toggle buttons
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = (e.target as HTMLElement).getAttribute("data-action");

      if (!currentProtocol) return;

      switch (action) {
        case "toggle-food-a-solid":
          if (currentProtocol.foodA.type !== FoodType.SOLID) {
            toggleFoodType(false);
          }
          break;
        case "toggle-food-a-liquid":
          if (currentProtocol.foodA.type !== FoodType.LIQUID) {
            toggleFoodType(false);
          }
          break;
        case "toggle-food-b-solid":
          if (
            currentProtocol.foodB &&
            currentProtocol.foodB.type !== FoodType.SOLID
          ) {
            toggleFoodType(true);
          }
          break;
        case "toggle-food-b-liquid":
          if (
            currentProtocol.foodB &&
            currentProtocol.foodB.type !== FoodType.LIQUID
          ) {
            toggleFoodType(true);
          }
          break;
        case "food-a-strategy-initial":
          currentProtocol.foodAStrategy = FoodAStrategy.DILUTE_INITIAL;
          recalculateStepMethods();
          renderFoodSettings();
          break;
        case "food-a-strategy-all":
          currentProtocol.foodAStrategy = FoodAStrategy.DILUTE_ALL;
          recalculateStepMethods();
          renderFoodSettings();
          break;
        case "food-a-strategy-none":
          currentProtocol.foodAStrategy = FoodAStrategy.DILUTE_NONE;
          recalculateStepMethods();
          renderFoodSettings();
          break;
      }
    });
  });
}

/**
 * Attach event listeners for protocol table interactions.
 *
 * Handles:
 * - inline editing of numeric fields (blur/enter)
 * - add/remove step buttons
 *
 * @returns void
 */
function attachTableEventListeners(): void {
  // Editable inputs
  document.querySelectorAll("input.editable").forEach((input) => {
    input.addEventListener("blur", (e) => {
      const target = e.target as HTMLInputElement;
      const stepIndex = parseInt(target.getAttribute("data-step")!);
      const field = target.getAttribute("data-field")!;
      let value = parseFloat(target.value);

      if (isNaN(value)) return;

      // Clamp value to >= 0
      if (value < 0) {
        value = 0;
        target.value = value.toString();
      }

      if (field === "targetMg") {
        updateStepTargetMg(stepIndex, value);
      } else if (field === "dailyAmount") {
        updateStepDailyAmount(stepIndex, value);
      } else if (field === "mixFoodAmount") {
        updateStepMixFoodAmount(stepIndex, value);
      }
    });

    input.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    });
  });

  // Add step buttons
  document.querySelectorAll(".btn-add-step").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const stepIndex = parseInt(
        (e.target as HTMLElement).getAttribute("data-step")!,
      );
      addStepAfter(stepIndex);
    });
  });

  // Remove step buttons
  document.querySelectorAll(".btn-remove-step").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const stepIndex = parseInt(
        (e.target as HTMLElement).getAttribute("data-step")!,
      );
      removeStep(stepIndex);
    });
  });
}

/**
 * Wire up export buttons (ASCII and PDF).
 *
 * @returns void
 */
function attachExportEventListeners(): void {
  const asciiBtn = document.getElementById("export-ascii");
  if (asciiBtn) {
    asciiBtn.addEventListener("click", exportASCII);
  }

  const pdfBtn = document.getElementById("export-pdf");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", async () => {
      const pdfBtn = document.getElementById("export-pdf");
      if (pdfBtn) {
        pdfBtn.textContent = "Generating...";
        pdfBtn.setAttribute("disabled", "true");
      }

      try {
        // Dynamically import the libraries ONLY when the button is clicked
        const { jsPDF } = await import('jspdf');
        const { applyPlugin } = await import('jspdf-autotable');

        applyPlugin(jsPDF);
        exportPDF(jsPDF);

      } catch (error) {
        console.error("Failed to load PDF libraries or generate PDF: ", error)
        alert("Error generating PDF. Please check the console for details.");
      } finally {
        if (pdfBtn) {
          pdfBtn.textContent = "Export PDF";
          pdfBtn.removeAttribute("disabled");
        }
      }

    });
  }
}

/**
 * Attach debounced input handler for custom notes textarea.
 *
 * Sanitizes text via textContent assignment to avoid HTML injection.
 *
 * @returns void
 */
function attachCustomNoteListener(): void {
  const textarea = document.getElementById(
    "custom-note",
  ) as HTMLTextAreaElement;
  if (!textarea) return;

  // Set initial value
  textarea.value = customNote;

  // Handle input with debouncing
  let noteDebounceTimer: number | null = null;
  textarea.addEventListener("input", (e) => {
    if (noteDebounceTimer !== null) {
      clearTimeout(noteDebounceTimer);
    }

    noteDebounceTimer = window.setTimeout(() => {
      const rawValue = (e.target as HTMLTextAreaElement).value;
      // Sanitize the input by creating a temporary element
      const temp = document.createElement("div");
      temp.textContent = rawValue;
      customNote = temp.textContent || "";
    }, 300);
  });
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Generate a printable PDF of the current protocol using jsPDF + autoTable.
 *
 * Includes:
 * - Food A section (and Food B when present)
 * - step tables with intervals
 * - optional notes section
 * - footer disclaimer
 *
 * Opens in a new tab where possible; falls back to direct download.
 *
 * @returns void
 */
function exportPDF(jsPDF: any): void {
  if (!currentProtocol) return;

  const doc: any = new jsPDF({
    unit: "pt",
    format: "letter",
  });

  let yPosition = 40;

  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Oral Immunotherapy Protocol", 40, yPosition);
  yPosition += 30;

  // Get food information
  const foodAUnit = currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  const foodAStepCount = getFoodAStepCount(currentProtocol);
  const totalSteps = currentProtocol.steps.length;

  // Build Food A table data
  const foodARows: any[] = [];
  for (let i = 0; i < foodAStepCount; i++) {
    const step = currentProtocol.steps[i];
    const food = currentProtocol.foodA;

    let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
    let mixDetails = "N/A";

    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
      mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
    }

    if (i === totalSteps - 1) {
      foodARows.push([
        step.stepIndex,
        `${formatNumber(step.targetMg, 1)} mg`,
        step.method,
        dailyAmountStr,
        mixDetails,
        "Continue long term",
      ]);
    } else {
      foodARows.push([
        step.stepIndex,
        `${formatNumber(step.targetMg, 1)} mg`,
        step.method,
        dailyAmountStr,
        mixDetails,
        "2-4 weeks",
      ]);
    }
  }

  // Food A section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${currentProtocol.foodA.name}`, 40, yPosition);
  yPosition += 20;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Protein: ${formatNumber(currentProtocol.foodA.mgPerUnit.dividedBy(new Decimal(10)), 2)} g per 100 ${foodAUnit} serving.`,
    40,
    yPosition,
  );
  yPosition += 15;

  // Food A table
  (doc as any).autoTable({
    startY: yPosition,
    head: [
      [
        "Step",
        "Protein",
        "Method",
        "Daily Amount",
        "How to make mix",
        "Interval",
      ],
    ],
    body: foodARows,
    theme: "grid",
    headStyles: { fillColor: [66, 139, 202], fontStyle: "bold" },
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 70 },
      2: { cellWidth: 60 },
      3: { cellWidth: 90 },
      4: { cellWidth: 180 },
      5: { cellWidth: 80 },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 20;

  // Food B section (if exists)
  if (currentProtocol.foodB && foodAStepCount < totalSteps) {
    const foodBUnit =
      currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml";

    // Build Food B table data
    const foodBRows: any[] = [];
    for (let i = foodAStepCount; i < totalSteps; i++) {
      const step = currentProtocol.steps[i];
      const food = currentProtocol.foodB;

      let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
      let mixDetails = "N/A";

      if (step.method === Method.DILUTE) {
        const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
        mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
      }

      // last step should say continue long term
      if (i === totalSteps - 1) {
        foodBRows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          dailyAmountStr,
          mixDetails,
          "Continue long term",
        ]);
      } else {
        foodBRows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          dailyAmountStr,
          mixDetails,
          "2-4 weeks",
        ]);
      }
    }

    // Check if we need a new page
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 40;
    }

    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${currentProtocol.foodB.name}`, 40, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Protein: ${formatNumber(currentProtocol.foodB.mgPerUnit.dividedBy(new Decimal(10)), 2)} g per 100 ${foodBUnit} serving`,
      40,
      yPosition,
    );
    yPosition += 15;

    // Food B table
    (doc as any).autoTable({
      startY: yPosition,
      head: [
        [
          "Step",
          "Protein",
          "Method",
          "Daily Amount",
          "How to make mix",
          "Interval",
        ],
      ],
      body: foodBRows,
      theme: "grid",
      headStyles: { fillColor: [66, 139, 202], fontStyle: "bold" },
      margin: { left: 40, right: 40 },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 70 },
        2: { cellWidth: 60 },
        3: { cellWidth: 90 },
        4: { cellWidth: 180 },
        5: { cellWidth: 80 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Custom notes section
  if (customNote && customNote.trim()) {
    // Check if we need a new page
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 40;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 40, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Split notes into lines that fit the page width
    const maxWidth = 520; // page width minus margins
    const lines = doc.splitTextToSize(customNote.trim(), maxWidth);

    for (const line of lines) {
      if (yPosition > 730) {
        doc.addPage();
        yPosition = 40;
      }
      doc.text(line, 40, yPosition);
      yPosition += 14;
    }
  }

  // Add footer with disclaimer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("", 40, 760);
    doc.text("Always verify calculations before clinical use.", 40, 772);
    doc.setTextColor(0);
  }

  // Detect if user is on mobile device
  // Combines user agent check with touch capability and screen size for better accuracy
  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    (("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
      window.innerWidth <= 1024);

  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);

  if (isMobile) {
    // Mobile: Use download link approach for better compatibility
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = "protocol.pdf";
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } else {
    // Desktop: Open in new tab (original behavior)
    const w = window.open(blobUrl, "_blank");
    if (!w) {
      // Fallback to download if popup blocked
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = "protocol.pdf";
      downloadLink.style.display = "none";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    // Clean up the blob URL after a delay (longer for new tab scenario)
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  }
}

/**
 * Generate and copy an ASCII representation of the protocol to clipboard.
 *
 * Creates separate tables for Food A and Food B, includes mix instructions for dilution steps, and appends custom notes when present. Falls back to alerting the text when clipboard copy fails.
 *
 * @returns void
 */
function exportASCII(): void {
  if (!currentProtocol) return;

  let text = "";
  let foodAInfo = "";
  let foodBInfo = "";

  // get food A and B? info
  const foodAType =
    currentProtocol.foodA.type === FoodType.SOLID ? "Solid" : "Liquid";
  const foodAUnit = currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  foodAInfo += `${currentProtocol.foodA.name} (${foodAType}). Protein: ${formatNumber(currentProtocol.foodA.mgPerUnit, 1)} mg/${foodAUnit}`;
  if (currentProtocol.foodB) {
    const foodBType =
      currentProtocol.foodB.type === FoodType.SOLID ? "Solid" : "Liquid";
    const foodBUnit =
      currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml";
    foodBInfo += `${currentProtocol.foodB.name} (${foodBType}). Protein: ${formatNumber(currentProtocol.foodB.mgPerUnit, 1)} mg/${foodBUnit}`;
  }

  // GENERATE TABLES
  const totalSteps = currentProtocol.steps.length;
  const foodAStepCount = getFoodAStepCount(currentProtocol);

  // Create separate tables for each food
  const foodATable = new AsciiTable3(currentProtocol.foodA.name);
  const foodBTable = new AsciiTable3(currentProtocol.foodB?.name);

  foodATable.setHeading(
    "Step",
    "Protein",
    "Method",
    "Daily Amount",
    "Mix Details",
  );
  foodBTable.setHeading(
    "Step",
    "Protein",
    "Method",
    "Daily Amount",
    "Mix Details",
  );

  // Iterate over steps and build rows for each table
  for (const step of currentProtocol.steps) {
    const isStepFoodB = step.food === "B";
    const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

    // Create table for this step
    let table: AsciiTable3;
    if (!isStepFoodB) {
      table = foodATable;
    } else {
      table = foodBTable;
    }

    let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
    let mixDetails = "N/A"; // default unless dilution

    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
      mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
    }

    table.addRow(
      step.stepIndex,
      `${formatNumber(step.targetMg, 1)} mg`,
      step.method,
      dailyAmountStr,
      mixDetails,
    );
  }

  // Baseline data
  if (currentProtocol.foodB) {
    text += foodAInfo + "\n" + foodBInfo + "\n\n";
  } else {
    text += foodAInfo + "\n\n";
  }

  // ADD TABLES
  if (foodAStepCount > 0) {
    text += foodATable.toString();
  }

  if (foodAStepCount < totalSteps) {
    text += `--- TRANSITION TO: ---\n`;
    text += foodBTable.toString();
  }

  // ADD CUSTOM NOTES IF PROVIDED
  if (customNote && customNote.trim()) {
    text += "========================================\n";
    text += "NOTES\n";
    text += "========================================\n";
    text += `${customNote.trim()}`;
  }

  // Copy to clipboard
  navigator.clipboard.writeText(text).catch(() => {
    alert("Failed to copy to clipboard. Please copy manually:\n\n" + text);
  });
}

// ============================================
// DATABASE LOADING
// ============================================

/**
 * Load foods and protocol template databases and prepare fuzzy search indices.
 *
 * Fetches:
 * - /tool_assets/typed_foods_rough.json
 * - /tool_assets/oit_protocols.json
 *
 * On failure, logs the error and alerts the user that some features may not work.
 *
 * @returns Promise that resolves when databases are loaded
 */
async function loadDatabases(): Promise<void> {
  try {
    // Load foods database
    const foodsResponse = await fetch("/tool_assets/typed_foods_rough.json");
    foodsDatabase = await foodsResponse.json();

    // Prepare for fuzzy search
    fuzzySortPreparedFoods = foodsDatabase.map((f) => ({
      ...f,
      prepared: fuzzysort.prepare(f.Food),
    }));

    // Load protocols database
    const protocolsResponse = await fetch("/tool_assets/oit_protocols.json");
    protocolsDatabase = await protocolsResponse.json();

    // Prepare for fuzzy search
    fuzzySortPreparedProtocols = protocolsDatabase.map((p) => ({
      ...p,
      prepared: fuzzysort.prepare(p.name),
    }));

    console.log(
      `Loaded ${foodsDatabase.length} foods and ${protocolsDatabase.length} protocols`,
    );
  } catch (error) {
    console.error("Error loading databases:", error);
    alert(
      "Error loading food and protocol databases. Some features may not work.",
    );
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the OIT calculator after DOM is ready.
 *
 * Loads databases, wires up search inputs (with debounce and keyboard nav), attaches clear button behavior, initializes Food B disabled state, and logs readiness.
 *
 * @returns Promise<void>
 */
async function initializeCalculator(): Promise<void> {
  // Load databases
  await loadDatabases();

  // Get URL for rules page
  const urlContainer = document.getElementById('url-container');
  if (urlContainer) {
    // Note: data-target-url becomes dataset.targetUrl in JS (camelCase)
    warningsPageURL = urlContainer.dataset.targetUrl!;
  }
  // Set up search input listeners
  const foodASearchInput = document.getElementById(
    "food-a-search",
  ) as HTMLInputElement;
  if (foodASearchInput) {
    foodASearchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value;

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      searchDebounceTimer = window.setTimeout(() => {
        const results = performSearch(query, "food");
        showSearchDropdown("food-a-search", results, query);
      }, 150);
    });

    foodASearchInput.addEventListener("keydown", (e) => {
      const dropdown =
        foodASearchInput.parentElement?.querySelector(".search-dropdown");
      if (!dropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateDropdown("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateDropdown("up");
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectHighlightedDropdownItem();
      } else if (e.key === "Escape") {
        hideSearchDropdown("food-a-search");
      }
    });

    foodASearchInput.addEventListener("blur", () => {
      setTimeout(() => hideSearchDropdown("food-a-search"), 200);
    });
  }

  const foodBSearchInput = document.getElementById(
    "food-b-search",
  ) as HTMLInputElement;
  if (foodBSearchInput) {
    foodBSearchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value;

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      searchDebounceTimer = window.setTimeout(() => {
        const results = performSearch(query, "protocol");
        showSearchDropdown("food-b-search", results, query);
      }, 150);
    });

    foodBSearchInput.addEventListener("keydown", (e) => {
      const dropdown =
        foodBSearchInput.parentElement?.querySelector(".search-dropdown");
      if (!dropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateDropdown("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateDropdown("up");
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectHighlightedDropdownItem();
      } else if (e.key === "Escape") {
        hideSearchDropdown("food-b-search");
      }
    });

    foodBSearchInput.addEventListener("blur", () => {
      setTimeout(() => hideSearchDropdown("food-b-search"), 200);
    });
  }

  // Clear Food B button
  const clearFoodBBtn = document.getElementById(
    "clear-food-b",
  ) as HTMLButtonElement;
  if (clearFoodBBtn) {
    clearFoodBBtn.addEventListener("click", clearFoodB);
  }

  console.log("OIT Calculator initialized");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCalculator);
} else {
  initializeCalculator();
}
