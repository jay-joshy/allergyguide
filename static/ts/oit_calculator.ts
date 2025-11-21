// ============================================
// OIT CALCULATOR - COMPLETE IMPLEMENTATION
// ============================================

// Declare global Decimal from decimal.js + other CDN packages
declare const AsciiTable: any;
declare const jspdf: any;
interface jsPDF {
  autoTable: (...args: any[]) => void;
}
// Import types for better type checking
import Decimal from "decimal.js";
import fuzzysort from "fuzzysort";

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

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

// ============================================
// TYPE ALIASES
// ============================================

type Unit = "g" | "ml";

// ============================================
// INTERFACES
// ============================================

interface Food {
  name: string;
  type: FoodType;
  mgPerUnit: any; // Decimal
}

interface Step {
  stepIndex: number;
  targetMg: any; // Decimal
  method: Method;
  dailyAmount: any; // Decimal
  dailyAmountUnit: Unit;
  mixFoodAmount?: any; // Decimal
  mixWaterAmount?: any; // Decimal
  servings?: any; // Decimal
  food: "A" | "B"; // Tracks which food this step belongs to
}

interface ProtocolConfig {
  minMeasurableMass: any; // Decimal.
  minMeasurableVolume: any; // Decimal
  minServingsForMix: any; // Decimal
  PROTEIN_TOLERANCE_MG: any; // Decimal. Max difference allowable between target and actual protein content (understanding that in real life there is limited resolution of measurement so the actual protein content may be slightly different from the target)
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: any; // Decimal
  DEFAULT_FOOD_B_THRESHOLD: any; // Decimal
  MAX_SOLID_CONCENTRATION: any; // Decimal - max g/ml ratio for solid dilutions (default 0.05). We assume that if the solid concentration is above this threshold, then the solid contributes non-negligibly to the total volume of the mixture.
}

interface Protocol {
  dosingStrategy: DosingStrategy;
  foodA: Food;
  foodAStrategy: FoodAStrategy;
  diThreshold: any; // Decimal
  foodB?: Food;
  foodBThreshold?: { unit: Unit; amount: any }; // Decimal
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
  mixFoodAmount: any; // Decimal
  mixWaterAmount: any; // Decimal
  dailyAmount: any; // Decimal
  mixTotalVolume: any; // Decimal
  servings: any; // Decimal
}

interface FoodData {
  Food: string;
  "Food Group": string;
  "Mean value in 100g": number;
  Type: string;
}

// For loading of protocols from JSON file
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
  table_di: any[];
  table_dn: any[];
  table_da: any[];
  custom_note?: string;
}

// ============================================
// CONSTANTS / DEFAULTS
// ============================================

const DOSING_STRATEGIES: { [key: string]: number[] } = {
  STANDARD: [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300],
  SLOW: [
    0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220,
    260, 300,
  ],
  RAPID: [5, 10, 20, 40, 80, 160, 300],
};

const SOLID_MIX_CANDIDATES = [
  0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 1, 2, 5, 10,
];
const LIQUID_MIX_CANDIDATES = [
  0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10,
];
const DAILY_AMOUNT_CANDIDATES = [
  0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7, 9, 10, 11, 12,
];
const MAX_MIX_WATER = 500;

let DEFAULT_CONFIG: ProtocolConfig;

DEFAULT_CONFIG = {
  minMeasurableMass: new Decimal(0.2), // assume that most scales for parents only have resolution of 0.01g
  minMeasurableVolume: new Decimal(0.2), // assume that syringes used has resolution of 0.1ml
  minServingsForMix: new Decimal(3), // want the mixture to last at least 3 days
  PROTEIN_TOLERANCE_MG: new Decimal(0.5), // max difference between target protein and actual protein in daily amount
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: new Decimal(0.2), // at what point to switch to direct from dilution
  DEFAULT_FOOD_B_THRESHOLD: new Decimal(0.2), // at what point to switch to food B
  MAX_SOLID_CONCENTRATION: new Decimal(0.05), // highest w/v ratio acceptable to assume weight of solid in liquid doesn't contribute to volume
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

// Debounce timers
let searchDebounceTimer: number | null = null;
let editDebounceTimer: number | null = null;

// Dropdown navigation state
let currentDropdownIndex: number = -1;
let currentDropdownInputId: string = "";

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escapes HTML special characters to prevent XSS (Cross-Site Scripting) attacks.
 * This function MUST be used whenever user input (food names, search queries, etc.)
 * is inserted into HTML content via innerHTML or template literals.
 *
 * @param unsafe - The untrusted string that may contain HTML/JS code
 * @returns A safe string with HTML entities escaped
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mgPer100ToMgPerUnit(uiValue: number, unit: Unit): any {
  // Convert g protein per 100 (g or ml) to mg protein per 1 (g or ml)
  // uiValue is in g per 100, we need mg per 1
  return new Decimal(uiValue).times(1000).dividedBy(100);
}

function mgPerUnitToMgPer100(mgPerUnit: any): number {
  // Convert mg per unit back to g per 100 for UI display
  return mgPerUnit.times(100).dividedBy(1000).toNumber();
}

function formatNumber(value: any, decimals: number): string {
  if (value === null || value === undefined) return "";
  const num = typeof value === "number" ? value : value.toNumber();
  return num.toFixed(decimals);
}

function formatAmount(value: any, unit: Unit): string {
  if (value === null || value === undefined) return "";
  const num = typeof value === "number" ? value : value.toNumber();
  if (unit === "g") {
    return num.toFixed(2);
  } else {
    // ml - use 1 decimal or integer
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(1);
  }
}

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

function findDilutionCandidates(
  P: any,
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
    const mixFood = new Decimal(mixFoodValue);

    for (const dailyAmountValue of DAILY_AMOUNT_CANDIDATES) {
      const dailyAmount = new Decimal(dailyAmountValue);

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
            .minus(P)
            .abs()
            .greaterThan(config.PROTEIN_TOLERANCE_MG)
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
            .minus(P)
            .abs()
            .greaterThan(config.PROTEIN_TOLERANCE_MG)
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

function generateStepForTarget(
  targetMg: any,
  stepIndex: number,
  food: Food,
  foodAStrategy: FoodAStrategy,
  diThreshold: any,
  config: ProtocolConfig,
): Step | null {
  const P = new Decimal(targetMg);
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
      const P = new Decimal(targetProteins[i]);
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

function addFoodBToProtocol(
  protocol: Protocol,
  foodB: Food,
  threshold: { unit: Unit; amount: any },
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
    console.warn("No transition point found for Food B");
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
        .dividedBy(mixTotalVolume);
      const delta = calculatedProtein.minus(step.targetMg).abs();

      if (delta.greaterThan(0.5)) {
        warnings.push({
          severity: "red",
          code: "R2",
          message: `Step ${step.stepIndex}: Protein mismatch. Target ${formatNumber(step.targetMg, 1)} mg but calculated ${formatNumber(calculatedProtein, 1)} mg.`,
          stepIndex: step.stepIndex,
        });
      }

      // R5: if in dilution, servings <1 then => there is not enough protein in mixFoodAmount to even give the target protein (mg)
      if (step.servings.lessThan(new Decimal(1))) {
        const totalMixProtein = step.mixFoodAmount!.times(food.mgPerUnit);
        warnings.push({
          severity: "red",
          code: "R5",
          message: `Step ${step.stepIndex}: ${formatNumber(step.mixFoodAmount, 2)} ${getMeasuringUnit(food)} of food only makes ${formatNumber(totalMixProtein, 1)} mg of total protein. However, target protein is ${formatNumber(step.targetMg, 1)} mg.`,
          stepIndex: step.stepIndex,
        });
      }

      // R6: if in dilution, Mix total volume < dailyAmount (impossible)
      if (mixTotalVolume.lessThan(step.dailyAmount)) {
        warnings.push({
          severity: "red",
          code: "R6",
          message: `Step ${step.stepIndex}: Total volume of dilution is ${formatNumber(mixTotalVolume, 1)} ml; however, daily amount is ${formatNumber(step.dailyAmount, 1)} ml, which is impossible`,
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
      if (step.mixFoodAmount.lessThanOrEqualTo(0)) {
        warnings.push({
          severity: "red",
          code: "R9",
          message: `Step ${step.stepIndex}: Amount of food to mix cannot be <= 0 ${getMeasuringUnit(food)}`,
          stepIndex: step.stepIndex,
        });
      }
      if (step.mixWaterAmount.lessThan(0)) {
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
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.mixFoodAmount, 2)} g of food is impractical. Aim for value >=${protocol.config.minMeasurableMass} g`,
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
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.mixFoodAmount, 1)} ml of food is impractical. Aim for value >=${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }
      if (step.dailyAmount.lessThan(protocol.config.minMeasurableVolume)) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring a daily amount of ${formatNumber(step.dailyAmount, 1)} ml is impractical. Aim for value >=${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }
      if (step.mixWaterAmount!.lessThan(protocol.config.minMeasurableVolume)) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.mixWaterAmount, 1)} ml of water is impractical. Aim for value >=${protocol.config.minMeasurableVolume} ml`,
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

      // Y4: if method is dilution and Food A is a solid, and the ratio of mixFoodAmount:mixWaterAmount is >1:20 (ie more than 5% w/v) our assumption that the solid contributes non neglibly to volume is violated. The effect is we underestimate the doses we give
      if (
        food.type === FoodType.SOLID &&
        step.mixFoodAmount
          .dividedBy(step.mixWaterAmount)
          .greaterThan(new Decimal(0.05))
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y4",
          message: `Step ${step.stepIndex}: at ${formatNumber(step.mixFoodAmount, 2)} g of food in ${formatNumber(step.mixWaterAmount, 1)} ml of water, the ratio of food:water is >1:20. The assumption that the food contributes non-negligibly to the total volume of dilution is likely violated. Consider increasing the Daily Amount`,
          stepIndex: step.stepIndex,
        });
      }
    }
    // FOR DIRECT
    else if (step.method === Method.DIRECT) {
      // R2: Protein mismatch
      const calculatedProtein = step.dailyAmount.times(food.mgPerUnit);
      const delta = calculatedProtein.minus(step.targetMg).abs();

      if (delta.greaterThan(0.5)) {
        warnings.push({
          severity: "red",
          code: "R2",
          message: `Step ${step.stepIndex}: Protein mismatch. Target ${formatNumber(step.targetMg, 1)} mg but calculated ${formatNumber(calculatedProtein, 1)} mg.`,
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
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.dailyAmount, 2)} g of food is impractical. Aim for >=${protocol.config.minMeasurableMass} g`,
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
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.dailyAmount, 1)} ml of food is impractical. Aim for >=${protocol.config.minMeasurableVolume} ml`,
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

function recalculateStepMethods(): void {
  if (!currentProtocol) return;

  // Preserve existing targets and food properties but recalculate methods
  const preservedTargets = currentProtocol.steps.map((s) => s.targetMg);
  const preservedFoods = currentProtocol.steps.map((s) => s.food);
  const foodBStartIndex = getFoodAStepCount(currentProtocol);

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

function updateStepTargetMg(stepIndex: number, newTargetMg: any): void {
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

function updateStepDailyAmount(stepIndex: number, newDailyAmount: any): void {
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

function updateStepMixFoodAmount(
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

function toggleFoodType(isFoodB: boolean): void {
  console.log(`toggleFoodType called with isFoodB=${isFoodB}`);
  if (!currentProtocol) return;

  const food = isFoodB ? currentProtocol.foodB! : currentProtocol.foodA;
  const wasLiquid = food.type === FoodType.LIQUID;
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
        <input
          type="number"
          min="0"
          max="150"
          id="food-a-protein"
          value="${mgPerUnitToMgPer100(currentProtocol.foodA.mgPerUnit).toFixed(1)}"
          step="0.1"
        />
        <span>g per 100 ${currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml"}</span>
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
      ${
        currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL
          ? `
      <div class="setting-row threshold-setting">
        <label>Directly dose when neat amount ≥</label>
        <input
          type="number"
          id="food-a-threshold"
          min="0"
          value="${formatAmount(currentProtocol.diThreshold, currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml")}"
          step="0.1"
        />
        <span>${currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml"}</span>
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
          <input
            type="number"
            id="food-b-protein"
            min="0"
            max="150"
            value="${mgPerUnitToMgPer100(currentProtocol.foodB.mgPerUnit).toFixed(1)}"
            step="0.1"
          />
          <span>g per 100 ${currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml"}</span>
        </div>
        <div class="setting-row">
          <label>Form:</label>
          <div class="toggle-group">
            <button class="toggle-btn ${currentProtocol.foodB.type === FoodType.SOLID ? "active" : ""}" data-action="toggle-food-b-solid">Solid</button>
            <button class="toggle-btn ${currentProtocol.foodB.type === FoodType.LIQUID ? "active" : ""}" data-action="toggle-food-b-liquid">Liquid</button>
          </div>
        </div>
        <div class="setting-row threshold-setting">
          <label>Transition when amount of food ≥</label>
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

  const foodAStepCount = getFoodAStepCount(currentProtocol);
  let lastWasFootA = true;

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

    html += `<tr>`;

    // Actions + Step number
    html += `
      <td class="actions-cell">
        <button class="btn-add-step" data-step="${step.stepIndex}">+</button>
        <button class="btn-remove-step" data-step="${step.stepIndex}">−</button>
        <span class="step-number">${step.stepIndex}</span>
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
          <button class="btn-export" id="export-ascii">Export ASCII</button>
          <button class="btn-export" id="export-pdf">Export PDF</button>
        </div>
        <div class="custom-note-container">
          <label for="custom-note">Notes:</label>
          <textarea
            id="custom-note"
            class="custom-note-textarea"
            placeholder="Add any custom notes or instructions for this protocol..."
            rows="10"
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

function updateWarnings(): void {
  if (!currentProtocol) return;

  const warnings = validateProtocol(currentProtocol);
  const container = document.querySelector(
    ".warnings-container",
  ) as HTMLElement;

  if (warnings.length === 0) {
    container.innerHTML = `
      <div class="no-warnings">✓ Protocol valid. See here for the issues we check for.<br></div>
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

function selectFoodA(foodData: FoodData): void {
  const food: Food = {
    name: foodData.Food,
    type: foodData.Type === "Solid" ? FoodType.SOLID : FoodType.LIQUID,
    mgPerUnit: mgPer100ToMgPerUnit(
      foodData["Mean value in 100g"],
      foodData.Type === "Solid" ? "g" : "ml",
    ),
  };

  currentProtocol = generateDefaultProtocol(food, DEFAULT_CONFIG);

  renderFoodSettings();
  renderDosingStrategy();
  renderProtocolTable();
  updateWarnings();
  updateFoodBDisabledState();

  (document.getElementById("food-a-search") as HTMLInputElement).value = "";
}

function selectFoodB(foodData: FoodData): void {
  if (!currentProtocol) return;

  const food: Food = {
    name: foodData.Food,
    type: foodData.Type === "Solid" ? FoodType.SOLID : FoodType.LIQUID,
    mgPerUnit: mgPer100ToMgPerUnit(
      foodData["Mean value in 100g"],
      foodData.Type === "Solid" ? "g" : "ml",
    ),
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

function selectCustomFood(name: string, inputId: string): void {
  const food: Food = {
    name: name || "Custom Food",
    type: FoodType.SOLID,
    mgPerUnit: mgPer100ToMgPerUnit(10, "g"), // Default 10g protein per 100g
  };

  if (inputId === "food-a-search") {
    currentProtocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
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

function selectProtocol(protocolData: ProtocolData): void {
  // Load protocol from JSON
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

  renderFoodSettings();
  renderDosingStrategy();
  renderProtocolTable();
  updateWarnings();
  updateFoodBDisabledState();

  (document.getElementById("food-a-search") as HTMLInputElement).value = "";
}

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
 * Updates the disabled state of the Food B section based on whether Food A is set
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
        const unit: Unit =
          currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml";
        currentProtocol.foodA.mgPerUnit = mgPer100ToMgPerUnit(value, unit);
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
        const unit: Unit =
          currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml";
        currentProtocol.foodB.mgPerUnit = mgPer100ToMgPerUnit(value, unit);

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

function attachExportEventListeners(): void {
  const asciiBtn = document.getElementById("export-ascii");
  if (asciiBtn) {
    asciiBtn.addEventListener("click", exportASCII);
  }

  const pdfBtn = document.getElementById("export-pdf");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", exportPDF);
  }
}

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

function exportPDF(): void {
  if (!currentProtocol) return;

  const { jsPDF } = jspdf;
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
  const foodAType =
    currentProtocol.foodA.type === FoodType.SOLID ? "Solid" : "Liquid";
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
    const foodBType =
      currentProtocol.foodB.type === FoodType.SOLID ? "Solid" : "Liquid";
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

  // Output PDF as data URL and open in new tab
  const dataUrl = doc.output("dataurlstring");
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(
      `<iframe src="${dataUrl}" style="width:100%; height:100%; border:none;"></iframe>`,
    );
  } else {
    alert("Popup blocked. Please allow popups to view the PDF.");
  }
}

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
  const foodATable = new AsciiTable(foodAInfo);
  const foodBTable = new AsciiTable(foodBInfo);
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
    let table: typeof AsciiTable;
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

  // ADD TABLES
  if (foodAStepCount > 0) {
    text += foodATable.toString() + "\n\n";
  }

  if (foodAStepCount < totalSteps) {
    text += `--- TRANSITION TO: ---\n`;
    text += foodBTable.toString() + "\n\n";
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

async function initializeCalculator(): Promise<void> {
  // Load databases
  await loadDatabases();

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

  // Set initial disabled state for Food B section
  updateFoodBDisabledState();

  console.log("OIT Calculator initialized");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCalculator);
} else {
  initializeCalculator();
}
