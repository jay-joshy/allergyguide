// ============================================
// OIT CALCULATOR - COMPLETE IMPLEMENTATION
// ============================================

// Declare global Decimal from decimal.js
declare const Decimal: any;
declare const fuzzysort: any;

// Configure Decimal.js
if (typeof Decimal !== "undefined") {
  Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });
}

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
}

interface ProtocolConfig {
  minMeasurableMass: any; // Decimal
  minMeasurableVolume: any; // Decimal
  minServingsForMix: any; // Decimal
  PROTEIN_TOLERANCE_MG: any; // Decimal
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
}

// ============================================
// CONSTANTS
// ============================================

const DOSING_STRATEGIES: { [key: string]: number[] } = {
  STANDARD: [1, 2.5, 5, 10, 20, 40, 80, 120, 160, 240, 300],
  SLOW: [
    0.5, 1, 1.5, 2.5, 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, 190, 220,
    260, 300,
  ],
  RAPID: [1, 2.5, 5, 10, 20, 40, 80, 160, 300],
};

const SOLID_MIX_CANDIDATES = [
  0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 1, 2, 5, 10,
];
const LIQUID_MIX_CANDIDATES = [0.5, 1, 2, 3, 4, 5, 10];
const DAILY_AMOUNT_CANDIDATES = [0.5, 1, 2, 3, 4, 5, 10];
const MAX_MIX_WATER = 250;

let DEFAULT_CONFIG: ProtocolConfig;

// ============================================
// GLOBAL STATE
// ============================================

let currentProtocol: Protocol | null = null;
let foodsDatabase: FoodData[] = [];
let protocolsDatabase: ProtocolData[] = [];
let fuzzySortPreparedFoods: any[] = [];
let fuzzySortPreparedProtocols: any[] = [];

// Debounce timers
let searchDebounceTimer: number | null = null;
let editDebounceTimer: number | null = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
    };
  } else {
    return {
      stepIndex,
      targetMg: P,
      method: Method.DIRECT,
      dailyAmount: neatMass,
      dailyAmountUnit: unit,
    };
  }
}

function generateDefaultProtocol(food: Food, config: ProtocolConfig): Protocol {
  const dosingStrategy = DosingStrategy.STANDARD;
  const foodAStrategy = FoodAStrategy.DILUTE_INITIAL;
  const unit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
  const diThreshold = new Decimal(0.2);

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

  // Find first Food B step by checking when food changes or duplicate target (transition)
  for (let i = 1; i < protocol.steps.length; i++) {
    const prevTargetMg = protocol.steps[i - 1].targetMg;
    const currentTargetMg = protocol.steps[i].targetMg;
    // Food B starts when we have duplicate target (transition)
    if (currentTargetMg.equals(prevTargetMg)) {
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

  // Set Food B in protocol
  protocol.foodB = foodB;
  protocol.foodBThreshold = threshold;
}

function validateProtocol(protocol: Protocol): Warning[] {
  const warnings: Warning[] = [];

  // R1: Too few steps
  if (protocol.steps.length < 6) {
    warnings.push({
      severity: "red",
      code: "R1",
      message:
        "Protocol has fewer than 6 steps. Very rapid escalation may be unsafe.",
    });
  }

  // Check each step
  for (const step of protocol.steps) {
    const foodAStepCount = getFoodAStepCount(protocol);
    const isStepFoodB = protocol.foodB && step.stepIndex > foodAStepCount;
    const food = isStepFoodB ? protocol.foodB! : protocol.foodA;

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

      // R4: Below resolution
      if (
        (food.type === FoodType.SOLID &&
          step.mixFoodAmount!.lessThan(protocol.config.minMeasurableMass)) ||
        (food.type === FoodType.LIQUID &&
          step.mixFoodAmount!.lessThan(protocol.config.minMeasurableVolume)) ||
        step.dailyAmount.lessThan(protocol.config.minMeasurableVolume) ||
        step.mixWaterAmount!.lessThan(protocol.config.minMeasurableVolume)
      ) {
        warnings.push({
          severity: "red",
          code: "R4",
          message: `Step ${step.stepIndex}: Measured powder/volume below instrument resolution — impractical to prepare.`,
          stepIndex: step.stepIndex,
        });
      }

      // Y1: Low servings
      if (step.servings!.lessThan(protocol.config.minServingsForMix)) {
        warnings.push({
          severity: "yellow",
          code: "Y1",
          message: `Step ${step.stepIndex}: Only ${formatNumber(step.servings, 1)} servings (< configured minimum). Consider increasing mix amounts.`,
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

  // Preserve existing targets but recalculate methods
  const preservedTargets = currentProtocol.steps.map((s) => s.targetMg);
  const foodBStartIndex = getFoodAStepCount(currentProtocol);

  const steps: Step[] = [];

  for (let i = 0; i < preservedTargets.length; i++) {
    const targetMg = preservedTargets[i];
    const isStepFoodB = currentProtocol.foodB && i >= foodBStartIndex;
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
  const foodAStepCount = getFoodAStepCount(currentProtocol);
  const isStepFoodB = currentProtocol.foodB && stepIndex > foodAStepCount;
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

  const foodAStepCount = getFoodAStepCount(currentProtocol);
  const isStepFoodB = currentProtocol.foodB && stepIndex > foodAStepCount;
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

  const foodAStepCount = getFoodAStepCount(currentProtocol);
  const isStepFoodB = currentProtocol.foodB && stepIndex > foodAStepCount;
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
    stepIndex: stepIndex + 1,
    targetMg: step.targetMg,
    method: step.method,
    dailyAmount: step.dailyAmount,
    dailyAmountUnit: step.dailyAmountUnit,
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
  const foodAStepCount = getFoodAStepCount(currentProtocol);

  for (const step of currentProtocol.steps) {
    const stepIsFoodB =
      !!currentProtocol.foodB && step.stepIndex > foodAStepCount;
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
        value="${currentProtocol.foodA.name}"
      />
      <div class="setting-row">
        <label>Protein:</label>
        <input
          type="number"
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
          value="${currentProtocol.foodB.name}"
        />
        <div class="setting-row">
          <label>Protein:</label>
          <input
            type="number"
            id="food-b-protein"
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
    <h3>Dosing Strategy</h3>
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
    const isStepFoodB =
      currentProtocol.foodB && step.stepIndex > foodAStepCount;
    const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

    // Add food header if transitioning
    if (isStepFoodB && lastWasFootA) {
      html += `
        <tr class="food-section-header">
          <td colspan="6">${currentProtocol.foodB!.name}</td>
        </tr>
      `;
      lastWasFootA = false;
    } else if (!isStepFoodB && step.stepIndex === 1) {
      html += `
        <tr class="food-section-header">
          <td colspan="6">${currentProtocol.foodA.name}</td>
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
  let exportButtons = bottomSection.querySelector(".export-buttons");
  if (!exportButtons) {
    const exportHTML = `
      <div class="export-buttons">
        <button class="btn-export" id="export-ascii">Export ASCII</button>
        <button class="btn-export" id="export-pdf">Export PDF</button>
      </div>
    `;
    bottomSection.insertAdjacentHTML("afterbegin", exportHTML);
  }

  attachTableEventListeners();
  attachExportEventListeners();
}

function updateWarnings(): void {
  if (!currentProtocol) return;

  const warnings = validateProtocol(currentProtocol);
  const container = document.querySelector(
    ".warnings-container",
  ) as HTMLElement;

  if (warnings.length === 0) {
    container.innerHTML = `
      <div class="no-warnings">✓ No Issues Found<br>Protocol looks good to go!</div>
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
          ${redWarnings.map((w) => `<li><strong>${w.code}:</strong> ${w.message}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  if (yellowWarnings.length > 0) {
    html += `
      <div class="warning-section yellow-warnings">
        <h4>Cautions (Yellow)</h4>
        <ul>
          ${yellowWarnings.map((w) => `<li><strong>${w.code}:</strong> ${w.message}</li>`).join("")}
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
    return results;
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

  // Always add custom option first
  const customItem = document.createElement("div");
  customItem.className = "search-result-item";
  customItem.innerHTML = `<strong>Custom:</strong> ${query || "New food"}`;
  customItem.addEventListener("click", () => {
    selectCustomFood(query || "New Food", inputId);
    hideSearchDropdown(inputId);
  });
  dropdown.appendChild(customItem);

  // Add search results
  const displayResults = results.slice(0, 50);
  for (const result of displayResults) {
    const item = document.createElement("div");
    item.className = "search-result-item";

    if (result.obj.name) {
      // Protocol result
      item.innerHTML = `<strong>Protocol:</strong> ${result.obj.name}`;
      item.addEventListener("click", () => {
        selectProtocol(result.obj);
        hideSearchDropdown(inputId);
      });
    } else {
      // Food result
      const foodData = result.obj as FoodData;
      item.innerHTML = `
        ${foodData.Food}
        <span class="food-type"> - ${foodData.Type} - Protein: ${foodData["Mean value in 100g"].toFixed(1)} g/100 ${foodData.Type === "Solid" ? "g" : "ml"}</span>
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
    amount: new Decimal(0.2),
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
  } else {
    if (!currentProtocol) return;
    const threshold = {
      unit: "g" as Unit,
      amount: new Decimal(0.2),
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

  // load steps from the relevant table (table_di, table_dn, or table_da
  let tableToLoad;
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
        const value = parseFloat((e.target as HTMLInputElement).value);
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
        const value = parseFloat((e.target as HTMLInputElement).value);
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
      const value = parseFloat(target.value);

      if (isNaN(value)) return;

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
    pdfBtn.addEventListener("click", () => {
      alert("PDF export not yet implemented");
    });
  }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportASCII(): void {
  if (!currentProtocol) return;

  let text = "OIT Protocol\n\n";

  text += "========================================\n";
  text += "FOOD INFORMATION\n";
  text += "========================================\n\n";

  const foodAType =
    currentProtocol.foodA.type === FoodType.SOLID ? "Solid" : "Liquid";
  const foodAUnit = currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  text += `Food A: ${currentProtocol.foodA.name} (${foodAType})\n`;
  text += `Protein: ${formatNumber(currentProtocol.foodA.mgPerUnit, 1)} mg/${foodAUnit}\n`;

  const strategyName = {
    [FoodAStrategy.DILUTE_INITIAL]: "Initial dilution only",
    [FoodAStrategy.DILUTE_ALL]: "Dilution throughout",
    [FoodAStrategy.DILUTE_NONE]: "No dilutions",
  }[currentProtocol.foodAStrategy];
  text += `Dilution Strategy: ${strategyName}\n`;

  if (currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL) {
    text += `Dilution Threshold: ${formatAmount(currentProtocol.diThreshold, foodAUnit)} ${foodAUnit}\n`;
  }

  if (currentProtocol.foodB) {
    const foodBType =
      currentProtocol.foodB.type === FoodType.SOLID ? "Solid" : "Liquid";
    const foodBUnit =
      currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml";
    text += `\nFood B: ${currentProtocol.foodB.name} (${foodBType})\n`;
    text += `Protein: ${formatNumber(currentProtocol.foodB.mgPerUnit, 1)} mg/${foodBUnit}\n`;
    if (currentProtocol.foodBThreshold) {
      text += `Transition Threshold: ${formatAmount(currentProtocol.foodBThreshold.amount, currentProtocol.foodBThreshold.unit)} ${currentProtocol.foodBThreshold.unit}\n`;
    }
  }

  text += "\n========================================\n";
  text += "DOSING STRATEGY\n";
  text += "========================================\n";
  text += `${currentProtocol.dosingStrategy} (${currentProtocol.steps.length} steps)\n\n`;

  text += "========================================\n";
  text += "PROTOCOL STEPS\n";
  text += "========================================\n\n";

  const foodAStepCount = getFoodAStepCount(currentProtocol);
  let currentFood = currentProtocol.foodA.name;

  for (const step of currentProtocol.steps) {
    const isStepFoodB =
      currentProtocol.foodB && step.stepIndex > foodAStepCount;
    const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

    // Add food header
    if (food.name !== currentFood) {
      text += `\n--- ${food.name} ---\n\n`;
      currentFood = food.name;
    }

    text += `Step ${step.stepIndex} | ${formatNumber(step.targetMg, 1)} mg | ${step.method} | `;
    text += `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit} daily`;

    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
      text += ` | Mix: ${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + `;
      text += `${formatAmount(step.mixWaterAmount!, "ml")} ml water (${formatNumber(step.servings!, 1)} servings)`;
    }

    text += "\n";
  }

  text += "\n========================================\n";
  text += "NOTES\n";
  text += "========================================\n";
  text +=
    "- DILUTE steps: Mix food with water, give patient specified daily amount\n";
  text += "- DIRECT steps: Patient consumes food directly (neat/undiluted)\n";
  text += "- Always verify calculations before clinical use\n";

  // Copy to clipboard
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Protocol copied to clipboard!");
    })
    .catch(() => {
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
  // Initialize Decimal config
  DEFAULT_CONFIG = {
    minMeasurableMass: new Decimal(0.2),
    minMeasurableVolume: new Decimal(0.2),
    minServingsForMix: new Decimal(3),
    PROTEIN_TOLERANCE_MG: new Decimal(0.5),
  };

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
