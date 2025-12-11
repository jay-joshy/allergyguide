import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { findDilutionCandidates, generateStepForTarget, generateDefaultProtocol } from '../../core/calculator';
import { FoodType, Method, FoodAStrategy, DosingStrategy } from '../../types';
import { DEFAULT_CONFIG } from '../../constants';
import type { Food, ProtocolConfig } from '../../types';

// Helper: create a food object
const createFood = (type: FoodType = FoodType.SOLID, proteinPercent: number = 10): Food => ({
  name: type === FoodType.SOLID ? 'Peanut Flour' : 'Milk',
  type,
  gramsInServing: new Decimal(proteinPercent), // e.g. 10g protein
  servingSize: new Decimal(100),   // per 100g/ml
  getMgPerUnit() {
    return this.gramsInServing.times(1000).dividedBy(this.servingSize); // e.g. 100 mg/unit
  }
});

describe('Core: Calculator', () => {
  const solidFood = createFood(FoodType.SOLID, 10); // 100 mg/g
  const liquidFood = createFood(FoodType.LIQUID, 10); // 100 mg/ml

  describe('findDilutionCandidates', () => {
    it('should find candidates for solid foods within constraints', () => {
      // Target 10mg protein -> 0.1g food.
      // Default minMeasurableMass is 0.2g, so this needs dilution.
      const candidates = findDilutionCandidates(new Decimal(10), solidFood, DEFAULT_CONFIG);
      expect(candidates.length).toBeGreaterThan(0);

      candidates.forEach(c => {
        expect(c.mixFoodAmount.toNumber()).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minMeasurableMass.toNumber());
        expect(c.mixWaterAmount.toNumber()).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minMeasurableVolume.toNumber());
        expect(c.mixWaterAmount.toNumber()).toBeLessThanOrEqual(DEFAULT_CONFIG.MAX_MIX_WATER.toNumber());

        // For solid in liquid: mixTotalVolume = mixWaterAmount (approx)
        // Protein check:
        const totalProtein = c.mixFoodAmount.times(100); // 100mg/g
        const proteinPerMl = totalProtein.dividedBy(c.mixTotalVolume);
        const delivered = proteinPerMl.times(c.dailyAmount);

        // Check tolerance
        const diff = delivered.minus(10).abs().dividedBy(10);
        expect(diff.toNumber()).toBeLessThanOrEqual(DEFAULT_CONFIG.PROTEIN_TOLERANCE.toNumber());
      });
    });

    it('should find candidates for liquid foods using additive volume', () => {
      // Target 10mg protein -> 0.1ml food.
      const candidates = findDilutionCandidates(new Decimal(10), liquidFood, DEFAULT_CONFIG);
      expect(candidates.length).toBeGreaterThan(0);

      candidates.forEach(c => {
        // Liquid in liquid: mixTotalVolume = mixFood + mixWater
        expect(c.mixTotalVolume.minus(c.mixFoodAmount).toNumber()).toBeCloseTo(c.mixWaterAmount.toNumber());

        // Verify mix water is positive (implied by logic, but good to check)
        expect(c.mixWaterAmount.toNumber()).toBeGreaterThanOrEqual(0);
      });
    });

    it('should prioritize low concentration candidates for SOLID foods', () => {
      // Default MAX_SOLID_CONCENTRATION is 5% w/v
      // Target 10mg. Food has 100mg/g.
      const candidates = findDilutionCandidates(new Decimal(10), solidFood, DEFAULT_CONFIG);

      if (candidates.length >= 2) {
        const best = candidates[0];
        // Calculate concentration for the winner
        const conc = best.mixFoodAmount.dividedBy(best.mixWaterAmount);

        // We expect the best candidate to respect the max concentration if possible
        if (conc.greaterThan(DEFAULT_CONFIG.MAX_SOLID_CONCENTRATION)) {
          // If it violates, it means NO candidate met the criteria, 
          // OR the sort logic failed.
          const anyMet = candidates.some(c =>
            c.mixFoodAmount.dividedBy(c.mixWaterAmount).lessThanOrEqualTo(DEFAULT_CONFIG.MAX_SOLID_CONCENTRATION)
          );
          // If some met it, but the first one didn't, that's a failure.
          expect(anyMet).toBe(false);
        } else {
          expect(conc.toNumber()).toBeLessThanOrEqual(DEFAULT_CONFIG.MAX_SOLID_CONCENTRATION.toNumber());
        }
      }
    });

    it('should respect PROTEIN_TOLERANCE', () => {
      // Create a scenario where math is slightly off.
      // ie make the tolerance very tight to reject everything.
      const tightConfig: ProtocolConfig = {
        ...DEFAULT_CONFIG,
        PROTEIN_TOLERANCE: new Decimal(0.0000001) // Extremely strict
      };

      // It's likely that rounding to standard amounts (daily candidates) 
      // won't hit this perfect precision for arbitrary targets.
      // 13mg target is a prime number, hard to hit perfectly with standard step sizes.
      const candidates = findDilutionCandidates(new Decimal(13), solidFood, tightConfig);

      // Depending on the candidate arrays, this might return empty or very few matches.
      // This test mainly ensures the config parameter is actually used.
      // If we used a huge tolerance, we'd get more.
      const looseConfig: ProtocolConfig = {
        ...DEFAULT_CONFIG,
        PROTEIN_TOLERANCE: new Decimal(0.5) // 50%
      };
      const looseCandidates = findDilutionCandidates(new Decimal(13), solidFood, looseConfig);

      expect(looseCandidates.length).toBeGreaterThanOrEqual(candidates.length);
    });

    it('should respect MAX_MIX_WATER', () => {
      const lowWaterConfig: ProtocolConfig = {
        ...DEFAULT_CONFIG,
        MAX_MIX_WATER: new Decimal(5) // Max 5ml water
      };
      // This should filter out many candidates that require 100ml+ water
      const candidates = findDilutionCandidates(new Decimal(10), solidFood, lowWaterConfig);

      candidates.forEach(c => {
        expect(c.mixWaterAmount.toNumber()).toBeLessThanOrEqual(5);
      });
    });

    it('should return empty array if no candidates satisfy constraints', () => {
      const impossibleConfig: ProtocolConfig = {
        ...DEFAULT_CONFIG,
        minMeasurableMass: new Decimal(100), // Huge mass needed
        MAX_MIX_WATER: new Decimal(10)      // Tiny water allowed
      };
      // 1mg target
      const candidates = findDilutionCandidates(new Decimal(1), solidFood, impossibleConfig);
      expect(candidates).toHaveLength(0);
    });
  });

  describe('generateStepForTarget', () => {
    const diThreshold = new Decimal(0.5);

    it('should return DIRECT step when above threshold', () => {
      const step = generateStepForTarget(
        new Decimal(1000), // 1000mg = 10g food
        1,
        solidFood,
        FoodAStrategy.DILUTE_INITIAL,
        diThreshold,
        DEFAULT_CONFIG
      );
      expect(step?.method).toBe(Method.DIRECT);
      expect(step?.dailyAmount.toNumber()).toBe(10);
      expect(step?.dailyAmountUnit).toBe('g');
    });

    it('should return DILUTE step when below threshold and candidates exist', () => {
      const step = generateStepForTarget(
        new Decimal(10), // 10mg = 0.1g food < 0.5g
        1,
        solidFood,
        FoodAStrategy.DILUTE_INITIAL,
        diThreshold,
        DEFAULT_CONFIG
      );
      expect(step?.method).toBe(Method.DILUTE);
      expect(step?.mixFoodAmount).toBeDefined();
    });

    it('should return DIRECT step for any amount if strategy is DILUTE_NONE', () => {
      const step = generateStepForTarget(
        new Decimal(10), // 10mg would normally require dilution
        1,
        solidFood,
        FoodAStrategy.DILUTE_NONE,
        diThreshold,
        DEFAULT_CONFIG
      );
      expect(step?.method).toBe(Method.DIRECT);
      // It should just calculate the raw mass
      expect(step?.dailyAmount.toNumber()).toBe(0.1);
    });

    it('should force DILUTE for large amounts if strategy is DILUTE_ALL', () => {
      const step = generateStepForTarget(
        new Decimal(1000), // 10g normally DIRECT
        1,
        solidFood,
        FoodAStrategy.DILUTE_ALL,
        diThreshold,
        DEFAULT_CONFIG
      );
      // It might be null if it can't dilute such a large amount due to constraints (e.g. max water)
      // If it is null, that's valid behavior, but if it returns a step, it MUST be DILUTE.
      if (step) {
        expect(step.method).toBe(Method.DILUTE);
      }
    });

    it('should return null if dilution required but not possible', () => {
      const strictConfig: ProtocolConfig = {
        ...DEFAULT_CONFIG,
        minMeasurableMass: new Decimal(1000),
      };
      const step = generateStepForTarget(
        new Decimal(1),
        1,
        solidFood,
        FoodAStrategy.DILUTE_INITIAL,
        diThreshold,
        strictConfig
      );
      expect(step).toBeNull();
    });
  });

  describe('generateDefaultProtocol', () => {
    it('should generate a full protocol', () => {
      const protocol = generateDefaultProtocol(solidFood, DEFAULT_CONFIG);
      expect(protocol.foodA).toEqual(solidFood);
      expect(protocol.steps.length).toBeGreaterThan(0);
      expect(protocol.dosingStrategy).toBe(DosingStrategy.STANDARD);

      // Verify ascending order
      for (let i = 1; i < protocol.steps.length; i++) {
        expect(protocol.steps[i].targetMg.toNumber()).toBeGreaterThan(protocol.steps[i - 1].targetMg.toNumber());
      }
    });

    it('should provide fallback DIRECT steps if dilution fails', () => {
      // Create a config where dilution is impossible (huge min mass)
      const impossibleConfig: ProtocolConfig = {
        ...DEFAULT_CONFIG,
        minMeasurableMass: new Decimal(1000)
      };

      // This will attempt to create a protocol. 
      // Small doses (1mg, 2.5mg) will fail dilution.
      // The function should catch the null return and force a DIRECT step.
      const protocol = generateDefaultProtocol(solidFood, impossibleConfig);

      expect(protocol.steps.length).toBeGreaterThan(0);

      // Check the first step (lowest dose)
      const firstStep = protocol.steps[0];
      // It should be DIRECT even though it's tiny
      expect(firstStep.method).toBe(Method.DIRECT);

      // And it should have the correct calculated neat mass
      // 1mg target / 100mg/g = 0.01g
      const expectedMass = firstStep.targetMg.dividedBy(solidFood.getMgPerUnit());
      expect(firstStep.dailyAmount.toNumber()).toBeCloseTo(expectedMass.toNumber());
    });
  });
});
