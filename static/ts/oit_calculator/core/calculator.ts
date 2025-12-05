import Decimal from "decimal.js";

import {
  FoodType,
} from "../types"

import type {
  Food,
  ProtocolConfig,
  Candidate,
} from "../types"

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
export function findDilutionCandidates(
  P: Decimal,
  food: Food,
  config: ProtocolConfig,
): Candidate[] {
  const candidates: Candidate[] = [];
  const mixCandidates =
    food.type === FoodType.SOLID ? config.SOLID_MIX_CANDIDATES : config.LIQUID_MIX_CANDIDATES;

  // Calculate minimum dailyAmount to achieve `dailyAmount > P / (MAX_SOLID_CONCENTRATION × mgPerUnit)`
  // For ratio = mixFood / mixWaterAmount < MAX_SOLID_CONCENTRATION
  // Recall: mixWaterAmount = mixTotalVolume = dailyAmount × servings
  // & servings = (mixFood × mgPerUnit) / P
  // => ratio = P / (dailyAmount × mgPerUnit)
  // => MAX_SOLID_CONCENTRATION > P / (dailyAmount × mgPerUnit)
  // => dailyAmount > P / (MAX_SOLID_CONCENTRATION × mgPerUnit)
  const minDailyForLowConcentration =
    food.type === FoodType.SOLID
      ? P.dividedBy(config.MAX_SOLID_CONCENTRATION.times(food.getMgPerUnit()))
      : null;

  for (const mixFoodValue of mixCandidates) {
    const mixFood: Decimal = mixFoodValue;

    for (const dailyAmountValue of config.DAILY_AMOUNT_CANDIDATES) {
      const dailyAmount: Decimal = dailyAmountValue;

      if (food.type === FoodType.SOLID) {
        // Solid in liquid - volume of solid is negligible
        const totalMixProtein = mixFood.times(food.getMgPerUnit());
        const servings = totalMixProtein.dividedBy(P);

        if (servings.lessThan(config.minServingsForMix)) continue;

        const mixTotalVolume = dailyAmount.times(servings);
        const mixWaterAmount = mixTotalVolume;

        // Validate constraints
        if (mixFood.lessThan(config.minMeasurableMass)) continue;
        if (dailyAmount.lessThan(config.minMeasurableVolume)) continue;
        if (mixWaterAmount.greaterThan(config.MAX_MIX_WATER)) continue;
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
        const totalMixProtein = mixFood.times(food.getMgPerUnit());
        const servings = totalMixProtein.dividedBy(P);

        if (servings.lessThan(config.minServingsForMix)) continue;

        const mixTotalVolume = dailyAmount.times(servings);
        const mixWaterAmount = mixTotalVolume.minus(mixFood);

        if (mixWaterAmount.lessThan(0)) continue;
        if (mixFood.lessThan(config.minMeasurableVolume)) continue;
        if (dailyAmount.lessThan(config.minMeasurableVolume)) continue;
        if (mixWaterAmount.greaterThan(config.MAX_MIX_WATER)) continue;
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

