/**
 * @module
 *
 * Protocol modifying functions
 *
 */
import Decimal from "decimal.js";

import {
  FoodType,
  Method,
  FoodAStrategy,
} from "../types"

import type {
  Unit,
  Food,
  Step,
  Protocol,
} from "../types"

import {
  DOSING_STRATEGIES,
} from "../constants"

import {
  generateStepForTarget
} from "./calculator"


/**
 * Count the number of Food A steps in a protocol.
 *
 * @param protocol Protocol to inspect
 * @returns Number of steps that belong to Food A
 */
export function getFoodAStepCount(protocol: Protocol): number {
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
 * Pure function to update properties of Food A or Food B.
 * @returns Protocol 
 */
export function updateFoodDetails(
  protocol: Protocol,
  food: 'A' | 'B',
  updates: Partial<Food>
): Protocol {
  // Shallow copy 
  const newProtocol = { ...protocol };

  const currentFood = food === 'A' ? protocol.foodA : protocol.foodB;
  if (!currentFood) return protocol;

  // create new Food object with the updates applied
  const newFood = { ...currentFood, ...updates };

  // assign back to the new protocol
  if (food === 'A') {
    newProtocol.foodA = newFood;
  } else {
    newProtocol.foodB = newFood;
  }

  return newProtocol;
}

/**
 * Updates Food B details
 * if a threshold exists: recalculate the transition point
 */
export function updateFoodBAndRecalculate(
  protocol: Protocol,
  updates: Partial<Food>
): Protocol {
  // Update the food object and create shallow copy of protocol
  let newProtocol = updateFoodDetails(protocol, 'B', updates);

  // If we have a threshold, must re-calculate the transition because a change in Protein/Serving size changes WHERE the transition happens
  if (newProtocol.foodB && newProtocol.foodBThreshold) {
    const tempFoodB = newProtocol.foodB;
    const tempThreshold = newProtocol.foodBThreshold;

    // Reset Food B state to force clean recalculation of Food A steps
    newProtocol.foodB = undefined;
    newProtocol.foodBThreshold = undefined;

    // Recalculate Food A steps
    newProtocol = recalculateProtocol(newProtocol);

    // Re-add B (This finds the new transition index)
    newProtocol = addFoodBToProtocol(newProtocol, tempFoodB, tempThreshold);
  }

  return newProtocol;
}

/**
 * Updates the Food B transition threshold and recalculates the step sequence.
 */
export function updateFoodBThreshold(
  protocol: Protocol,
  newAmount: Decimal
): Protocol {
  // Create shallow copy
  let newProtocol = { ...protocol };

  // verify Food B exists to update ... though it should always ...
  if (newProtocol.foodB && newProtocol.foodBThreshold) {
    const tempFoodB = newProtocol.foodB;

    // Create new temp threshold object with the updated amount
    const newThreshold = {
      ...newProtocol.foodBThreshold,
      amount: newAmount
    };

    // Reset Food B state to force clean recalculation of Food A steps then add Food A
    newProtocol.foodB = undefined;
    newProtocol.foodBThreshold = undefined;

    newProtocol = recalculateProtocol(newProtocol);
    newProtocol = addFoodBToProtocol(newProtocol, tempFoodB, newThreshold);
  }
  return newProtocol;
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
 *
 * @param oldProtocol Protocol - a new protocol with the modifications based on this will be done
 * @param foodB Food B definition
 * @param threshold Threshold to begin Food B, unit-specific amount (g/ml)
 * @returns Protocol - the new protocol with food B steps added
 */
export function addFoodBToProtocol(
  oldProtocol: Protocol,
  foodB: Food,
  threshold: { unit: Unit; amount: Decimal },
): Protocol {
  const newProtocol = { ...oldProtocol };

  // Normalize all existing steps to be valid Food A steps
  // => if the transition point moves "later" (ie. another food B is chosen), steps before it which might have been Food B previously are correctly recalculated as Food A using `generateStepForTarget`
  const normalizedSteps: Step[] = [];
  for (const existingStep of newProtocol.steps) {
    const step = generateStepForTarget(
      existingStep.targetMg,
      existingStep.stepIndex,
      newProtocol.foodA,
      newProtocol.foodAStrategy,
      newProtocol.diThreshold,
      newProtocol.config
    );

    if (step) {
      normalizedSteps.push(step);
    } else {
      // Fallback DIRECT if dilution generation fails
      const P = existingStep.targetMg;
      const neatMass = P.dividedBy(newProtocol.foodA.getMgPerUnit());
      const unit: Unit = newProtocol.foodA.type === FoodType.SOLID ? "g" : "ml";
      normalizedSteps.push({
        stepIndex: existingStep.stepIndex,
        targetMg: P,
        method: Method.DIRECT,
        dailyAmount: neatMass,
        dailyAmountUnit: unit,
        food: "A",
      });
    }
  }
  newProtocol.steps = normalizedSteps;

  // Calculate foodBmgThreshold
  const foodBmgThreshold = threshold.amount.times(foodB.getMgPerUnit());

  // Set Food B in protocol (even if no transition point found, so threshold changes can be detected)
  newProtocol.foodB = foodB;
  newProtocol.foodBThreshold = threshold;

  // Find transition point
  let transitionIndex = -1;
  for (let i = 0; i < newProtocol.steps.length; i++) {
    if (newProtocol.steps[i].targetMg.greaterThanOrEqualTo(foodBmgThreshold)) {
      transitionIndex = i;
      break;
    }
  }

  if (transitionIndex === -1) {
    // No transition point found - emit warning
    // warning is picked up by validation system
    // new protocol basically isn't changed
    return newProtocol;
  }

  // Get the original target sequence after transition
  const originalTargets: any[] = [];
  for (let i = transitionIndex + 1; i < newProtocol.steps.length; i++) {
    originalTargets.push(newProtocol.steps[i].targetMg);
  }

  // Insert duplicate at transition point
  const transitionTargetMg = newProtocol.steps[transitionIndex].targetMg;

  // Build Food B steps
  const foodBSteps: Step[] = [];
  const foodBUnit: Unit = foodB.type === FoodType.SOLID ? "g" : "ml";

  // First Food B step uses same target as last Food A step
  const firstBTargetMg = transitionTargetMg;
  const firstBNeatMass = firstBTargetMg.dividedBy(foodB.getMgPerUnit());
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
    const neatMass = targetMg.dividedBy(foodB.getMgPerUnit());
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
  newProtocol.steps = newProtocol.steps.slice(0, transitionIndex + 1);

  // Add Food B steps
  newProtocol.steps.push(...foodBSteps);

  // Reindex
  for (let i = 0; i < newProtocol.steps.length; i++) {
    newProtocol.steps[i].stepIndex = i + 1;
  }

  // tada new protocol
  return newProtocol;
}


/**
 * Recompute the entire protocol step sequence from current high-level settings.
 *
 * Rebuilds Food A steps from the selected dosing strategy and Food A strategy, then re-applies Food B transition if present. Triggers UI updates.
 *
 * @param oldProtocol Protocol - old protocol to recalculate based on its config
 * @returns Protocol
 */
export function recalculateProtocol(oldProtocol: Protocol): Protocol {

  const newProtocol = { ...oldProtocol };

  const targetProteins = DOSING_STRATEGIES[newProtocol.dosingStrategy];
  const steps: Step[] = [];

  // Regenerate Food A steps
  for (let i = 0; i < targetProteins.length; i++) {
    const step = generateStepForTarget(
      targetProteins[i],
      i + 1,
      newProtocol.foodA,
      newProtocol.foodAStrategy,
      newProtocol.diThreshold,
      newProtocol.config,
    );
    if (step) {
      steps.push(step);
    }
  }

  newProtocol.steps = steps;

  // Re-add Food B if it exists
  if (newProtocol.foodB && newProtocol.foodBThreshold) {
    return addFoodBToProtocol(
      newProtocol,
      newProtocol.foodB,
      newProtocol.foodBThreshold,
    );
  }

  return newProtocol;
}

/**
 * Recompute per-step methods (DIRECT vs DILUTE) without changing targets/foods.
 *
 * For Food B steps, always enforce DILUTE_NONE. For Food A steps, use the current Food A strategy and diThreshold. 
 *
 * @param oldProtocol
 * @returns Protocol
 */
export function recalculateStepMethods(oldProtocol: Protocol): Protocol {
  const newProtocol = { ...oldProtocol };

  // Preserve existing targets and food properties but recalculate methods
  const preservedTargets = newProtocol.steps.map((s) => s.targetMg);
  const preservedFoods = newProtocol.steps.map((s) => s.food);

  const steps: Step[] = [];

  for (let i = 0; i < preservedTargets.length; i++) {
    const targetMg = preservedTargets[i];
    const isStepFoodB = preservedFoods[i] === "B";
    const food = isStepFoodB ? newProtocol.foodB! : newProtocol.foodA;
    const foodAStrategy = isStepFoodB
      ? FoodAStrategy.DILUTE_NONE
      : newProtocol.foodAStrategy;

    const step = generateStepForTarget(
      targetMg,
      i + 1,
      food,
      foodAStrategy,
      newProtocol.diThreshold,
      newProtocol.config,
    );

    if (step) {
      step.food = preservedFoods[i]; // Preserve the original food property
      steps.push(step);
    }
  }

  newProtocol.steps = steps;

  return newProtocol;
}

/**
 * Handle user change to a step's target protein (mg).
 *
 * Updates dependent fields:
 * - DIRECT: recompute dailyAmount = targetMg / mgPerUnit
 * - DILUTE: recompute servings and mixWaterAmount to preserve dailyAmount and mixFoodAmount
 *
 * @param oldProtocol
 * @param stepIndex 1-based index of the step to update
 * @param newTargetMg New target protein (mg)
 * @returns Protocol
 */
export function updateStepTargetMg(oldProtocol: Protocol, stepIndex: number, newTargetMg: any): Protocol {
  if (!oldProtocol) return oldProtocol;

  // Shallow copy steps array
  const newSteps = [...oldProtocol.steps];

  // does it exist
  const originalStep = newSteps[stepIndex - 1];
  if (!originalStep) return oldProtocol;

  // shallow copy SPECIFIC step to modify
  const step = { ...originalStep };

  try {
    step.targetMg = new Decimal(newTargetMg);
  }
  catch (error) {
    console.error("Invalid number format for targetMg:", newTargetMg);
    return oldProtocol;
  }

  // Determine which food
  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? oldProtocol.foodB! : oldProtocol.foodA;

  if (step.method === Method.DIRECT) {
    // Recalculate dailyAmount
    step.dailyAmount = step.targetMg.dividedBy(food.getMgPerUnit());
  } else {
    // DILUTE - keep mixFoodAmount and dailyAmount, recalculate servings and water
    const totalMixProtein = step.mixFoodAmount!.times(food.getMgPerUnit());
    step.servings = totalMixProtein.dividedBy(step.targetMg);

    if (food.type === FoodType.SOLID) {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume;
    } else {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
    }
  }

  newSteps[stepIndex - 1] = step;
  return { ...oldProtocol, steps: newSteps };
}

/**
 * Handle user change to a step's daily amount (g/ml).
 *
 * Updates dependent fields:
 * - DIRECT: recompute targetMg = dailyAmount × mgPerUnit
 * - DILUTE: recompute servings and mixWaterAmount to preserve targetMg and mixFoodAmount
 *
 *
 * @param oldProtocol Protocol
 * @param stepIndex 1-based index of the step to update
 * @param newDailyAmount New amount (g or ml), number-like
 * @returns Protocol
 */
export function updateStepDailyAmount(oldProtocol: Protocol, stepIndex: number, newDailyAmount: any): Protocol {
  if (!oldProtocol) return oldProtocol;

  const newProtocol = { ...oldProtocol };

  const step = newProtocol.steps[stepIndex - 1];
  if (!step) return newProtocol;

  step.dailyAmount = new Decimal(newDailyAmount);

  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? newProtocol.foodB! : newProtocol.foodA;

  if (step.method === Method.DIRECT) {
    // Recalculate target protein
    step.targetMg = step.dailyAmount.times(food.getMgPerUnit());
  } else {
    // DILUTE - keep mixFoodAmount fixed, recalculate water
    const totalMixProtein = step.mixFoodAmount!.times(food.getMgPerUnit());
    step.servings = totalMixProtein.dividedBy(step.targetMg);

    if (food.type === FoodType.SOLID) {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume;
    } else {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
    }
  }

  return newProtocol;
}

/**
 * Handle user change to a dilution step's mix food amount.
 *
 * Updates dependent fields (servings and mixWaterAmount) while preserving targetMg and dailyAmount.
 *
 * @param oldProtocol Protocol
 * @param stepIndex 1-based index of the dilution step
 * @param newMixFoodAmount New amount of food to include in mix (g or ml), number-like
 * @returns Protocol
 */
export function updateStepMixFoodAmount(
  oldProtocol: Protocol,
  // newMixFoodAmount must be any since it accepts user input from UI
  stepIndex: number,
  newMixFoodAmount: any,
): Protocol {
  if (!oldProtocol) return oldProtocol;

  const newProtocol = { ...oldProtocol };

  const step = newProtocol.steps[stepIndex - 1];
  if (!step || step.method !== Method.DILUTE) return newProtocol;

  step.mixFoodAmount = new Decimal(newMixFoodAmount);

  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? newProtocol.foodB! : newProtocol.foodA;

  // Recalculate water to keep P and dailyAmount unchanged
  const totalMixProtein = step.mixFoodAmount.times(food.getMgPerUnit());
  step.servings = totalMixProtein.dividedBy(step.targetMg);

  if (food.type === FoodType.SOLID) {
    const mixTotalVolume = step.dailyAmount.times(step.servings);
    step.mixWaterAmount = mixTotalVolume;
  } else {
    const mixTotalVolume = step.dailyAmount.times(step.servings);
    step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount);
  }

  return newProtocol;
}

/**
 * Duplicate a step and insert it immediately after the original.
 *
 * Copies all step fields; for DILUTE steps also copies mix amounts and servings. Reindexes all subsequent steps.  
 *
 * @param oldProtocol Protocol
 * @param stepIndex 1-based index after which to insert the new step
 * @returns Protocol
 */
export function addStepAfter(oldProtocol: Protocol, stepIndex: number): Protocol {
  if (!oldProtocol) return oldProtocol;

  const newProtocol = { ...oldProtocol };

  const step = newProtocol.steps[stepIndex - 1];
  if (!step) return newProtocol;

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

  newProtocol.steps.splice(stepIndex, 0, newStep);

  // Reindex
  for (let i = 0; i < newProtocol.steps.length; i++) {
    newProtocol.steps[i].stepIndex = i + 1;
  }

  return newProtocol;
}

/**
 * Remove a step from the protocol and reindex the remaining steps.
 *
 * Does nothing if there is only one step. Triggers UI update.
 *
 * @param oldProtocol Protocol
 * @param stepIndex 1-based index of the step to remove
 * @returns Protocol
 */
export function removeStep(oldProtocol: Protocol, stepIndex: number): Protocol {
  if (!oldProtocol) return oldProtocol;

  const newProtocol = { ...oldProtocol };

  if (newProtocol.steps.length <= 1) return newProtocol;

  newProtocol.steps.splice(stepIndex - 1, 1);

  // Reindex
  for (let i = 0; i < newProtocol.steps.length; i++) {
    newProtocol.steps[i].stepIndex = i + 1;
  }

  return newProtocol;
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
 * @param oldProtocol Protocol
 * @param isFoodB When true, toggles Food B; otherwise toggles Food A
 * @returns Protocol
 */
export function toggleFoodType(oldProtocol: Protocol, isFoodB: boolean): Protocol {
  if (!oldProtocol) return oldProtocol;

  const newProtocol = { ...oldProtocol };

  const food = isFoodB ? newProtocol.foodB! : newProtocol.foodA;
  food.type = food.type === FoodType.SOLID ? FoodType.LIQUID : FoodType.SOLID;

  // Convert all relevant steps
  for (const step of newProtocol.steps) {
    const stepIsFoodB = step.food === "B";
    if (stepIsFoodB !== isFoodB) continue;
    if (step.method === Method.DILUTE) {
      // Convert mixFoodAmount assuming 1g ≈ 1ml (value stays the same)
      // Ensure dailyAmountUnit is always "ml" for dilutions
      step.dailyAmountUnit = "ml";

      // Recalculate servings and water based on new food type
      const totalMixProtein = step.mixFoodAmount!.times(food.getMgPerUnit());
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

  return newProtocol;
}


