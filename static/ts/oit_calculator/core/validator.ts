import Decimal from "decimal.js";

import {
  FoodType,
  Method,
} from "../types"

import type {
  Protocol,
  Warning,
} from "../types"

import {
  escapeHtml,
  formatNumber,
  formatAmount,
  getMeasuringUnit
} from "../utils"

import {
  SOLID_RESOLUTION,
  LIQUID_RESOLUTION,
  DEFAULT_CONFIG,
} from "../constants"

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
 * @remarks Validation should act on the ROUNDED VALUES PRESENTED TO THE USER, not the internally calculated ones.
 * @param protocol Protocol to validate
 * @returns Array of warnings, possibly empty
 */
export function validateProtocol(protocol: Protocol): Warning[] {
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
  if (protocol.foodA.getMgPerUnit().lessThanOrEqualTo(new Decimal(0))) {
    warnings.push({
      severity: "red",
      code: "R7",
      message: `${escapeHtml(protocol.foodA.name)} protein concentration must be > 0 to be considered for OIT`,
    });
  }
  // R7: zero or negative mgPerUnit for food B
  if (protocol.foodB?.getMgPerUnit().lessThanOrEqualTo(new Decimal(0))) {
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
      // R2: Protein mismatch. This check is based on the ROUNDED values that a user will actually measure at home, to reflect the true delivered dose.
      const mixUnit = getMeasuringUnit(food);
      const roundedMixFoodAmount = new Decimal(
        formatAmount(step.mixFoodAmount!, mixUnit),
      );
      const roundedMixWaterAmount = new Decimal(
        formatAmount(step.mixWaterAmount!, "ml"),
      );
      const roundedDailyAmount = new Decimal(formatAmount(step.dailyAmount, "ml"));

      const totalMixProteinBasedOnRounded = roundedMixFoodAmount.times(
        food.getMgPerUnit(),
      );
      let mixTotalVolumeBasedOnRounded =
        food.type === FoodType.SOLID
          ? roundedMixWaterAmount
          : roundedMixFoodAmount.plus(roundedMixWaterAmount);

      if (mixTotalVolumeBasedOnRounded.isZero()) {
        mixTotalVolumeBasedOnRounded = new Decimal(1); // Avoid division by zero
        console.log("mixTotalVolumeBasedOnRounded is 0", mixTotalVolumeBasedOnRounded)
      }

      const calculatedProtein = totalMixProteinBasedOnRounded
        .times(roundedDailyAmount)
        .dividedBy(mixTotalVolumeBasedOnRounded);

      if (!step.targetMg.isZero()) {
        const delta = calculatedProtein.dividedBy(step.targetMg).minus(1).abs();
        if (delta.greaterThan(DEFAULT_CONFIG.PROTEIN_TOLERANCE)) {
          warnings.push({
            severity: "red",
            code: "R2",
            message: `Step ${step.stepIndex}: Protein mismatch. Target ${formatNumber(step.targetMg, 1)} mg but calculated ${formatNumber(calculatedProtein, 1)} mg: ${formatNumber(delta.times(100), 0)}% difference.`,
            stepIndex: step.stepIndex,
          });
        }
      }

      // R5: if in dilution, servings <1 then => there is not enough protein in mixFoodAmount to even give the target protein (mg)
      if (step.servings!.lessThan(new Decimal(1))) {
        const totalMixProtein = step.mixFoodAmount!.times(food.getMgPerUnit());
        warnings.push({
          severity: "red",
          code: "R5",
          message: `Step ${step.stepIndex}: ${formatAmount(step.mixFoodAmount, getMeasuringUnit(food))} ${getMeasuringUnit(food)} of food only makes ${formatNumber(totalMixProtein, 1)} mg of total protein. However, target protein is ${formatNumber(step.targetMg, 1)} mg.`,
          stepIndex: step.stepIndex,
        });
      }

      // R6: if in dilution, Mix total volume < dailyAmount (impossible)
      const mixTotalVolume =
        food.type === FoodType.SOLID
          ? step.mixWaterAmount
          : step.mixFoodAmount!.plus(step.mixWaterAmount!);
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
      // FOR ROUNDED VALUES
      if (
        food.type === FoodType.SOLID && roundedMixFoodAmount.lessThan(protocol.config.minMeasurableMass)
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
        roundedMixFoodAmount.lessThan(protocol.config.minMeasurableVolume)
      ) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring ${formatNumber(step.mixFoodAmount, LIQUID_RESOLUTION)} ml of food is impractical. Aim for value ≥ ${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }
      if (roundedDailyAmount.lessThan(protocol.config.minMeasurableVolume)) {
        warnings.push({
          severity: "yellow",
          code: "Y3",
          message: `Step ${step.stepIndex}: Measuring a daily amount of ${formatNumber(step.dailyAmount, LIQUID_RESOLUTION)} ml is impractical. Aim for value ≥ ${protocol.config.minMeasurableVolume} ml`,
          stepIndex: step.stepIndex,
        });
      }
      if (roundedMixWaterAmount.lessThan(protocol.config.minMeasurableVolume)) {
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
      // R2: Protein mismatch. This check is based on the ROUNDED values that a user will actually measure at home, to reflect the true delivered dose.
      const dailyAmountUnit = step.dailyAmountUnit;
      const roundedDailyAmount = new Decimal(
        formatAmount(step.dailyAmount, dailyAmountUnit),
      );
      const calculatedProtein = roundedDailyAmount.times(food.getMgPerUnit());

      if (!step.targetMg.isZero()) {
        const delta = calculatedProtein.dividedBy(step.targetMg).minus(1).abs();
        if (delta.greaterThan(DEFAULT_CONFIG.PROTEIN_TOLERANCE)) {
          warnings.push({
            severity: "red",
            code: "R2",
            message: `Step ${step.stepIndex}: Protein mismatch. Target ${formatNumber(step.targetMg, 1)} mg but calculated ${formatNumber(calculatedProtein, 1)} mg: ${formatNumber(delta.times(100), 0)}% difference.`,
            stepIndex: step.stepIndex,
          });
        }
      }

      // Y3: for direct, noted below resolution of measurement tools
      // Will use the ROUNDED measurements since that is what users will use
      if (
        food.type === FoodType.SOLID &&
        roundedDailyAmount.lessThan(protocol.config.minMeasurableMass)
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
        roundedDailyAmount.lessThan(protocol.config.minMeasurableVolume)
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

