import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { findDilutionCandidates, generateStepForTarget, generateDefaultProtocol } from '../../core/calculator';
import { FoodType, Method, FoodAStrategy, DosingStrategy } from '../../types';
import { DEFAULT_CONFIG } from '../../constants';
import type { Food, ProtocolConfig } from '../../types';

// Helper: create a food object
const createFood = (type: FoodType = FoodType.SOLID): Food => ({
  name: 'Peanut',
  type,
  gramsInServing: new Decimal(10), // 10g protein
  servingSize: new Decimal(100),   // per 100g/ml
  getMgPerUnit() {
    return this.gramsInServing.times(1000).dividedBy(this.servingSize); // 100 mg/unit
  }
});

describe('Core: Calculator', () => {
  const solidFood = createFood(FoodType.SOLID); // 100 mg/g
  const liquidFood = createFood(FoodType.LIQUID); // 100 mg/ml

  describe('findDilutionCandidates', () => {
    it('should find candidates for solid foods within constraints', () => {
      // Target 10mg protein
      // Concentration: 100mg/g.
      // 10mg = 0.1g of food.
      // If minMeasurableMass is 0.2g, we need dilution.
      const candidates = findDilutionCandidates(new Decimal(10), solidFood, DEFAULT_CONFIG);
      expect(candidates.length).toBeGreaterThan(0);

      candidates.forEach(c => {
        // Basic validity checks on returned candidates
        expect(c.mixFoodAmount.toNumber()).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minMeasurableMass.toNumber());
        expect(c.mixWaterAmount.toNumber()).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minMeasurableVolume.toNumber());

        // Check protein math roughly
        // total protein in mix = mixFood * 100
        // servings = total / target(10)
        // volume per serving = mixWater / servings (approx for solid)
        // daily amount should match volume per serving
        const totalProtein = c.mixFoodAmount.times(100);
        const calcServings = totalProtein.dividedBy(10);
        expect(c.servings.toNumber()).toBeCloseTo(calcServings.toNumber());
      });
    });

    it('should find candidates for liquid foods within constraints', () => {
      const candidates = findDilutionCandidates(new Decimal(10), liquidFood, DEFAULT_CONFIG);
      expect(candidates.length).toBeGreaterThan(0);
      candidates.forEach(c => {
        // For liquid, volume is additive
        // mixTotal = mixFood + mixWater
        expect(c.mixTotalVolume.minus(c.mixFoodAmount).toNumber()).toBeCloseTo(c.mixWaterAmount.toNumber());
      });
    });

    it('should return empty array if no valid candidates found', () => {
      // Impossible config
      const strictConfig: ProtocolConfig = {
        ...DEFAULT_CONFIG,
        minMeasurableMass: new Decimal(100), // huge min mass
        MAX_MIX_WATER: new Decimal(10) // tiny max water
      };
      // 1mg target, needs dilution.
      const candidates = findDilutionCandidates(new Decimal(1), solidFood, strictConfig);
      expect(candidates).toHaveLength(0);
    });
  });

  describe('generateStepForTarget', () => {
    const diThreshold = new Decimal(0.5); // 0.5g or ml

    it('should generate a direct step when above threshold', () => {
      // Target 1000mg = 10g of food. > 0.5g threshold
      const step = generateStepForTarget(
        new Decimal(1000),
        1,
        solidFood,
        FoodAStrategy.DILUTE_INITIAL,
        diThreshold,
        DEFAULT_CONFIG
      );

      expect(step).not.toBeNull();
      expect(step?.method).toBe(Method.DIRECT);
      expect(step?.dailyAmount.toNumber()).toBe(10);
      expect(step?.dailyAmountUnit).toBe('g');
    });

    it('should generate a dilute step when below threshold', () => {
      // Target 10mg = 0.1g of food. < 0.5g threshold. Needs dilution.
      const step = generateStepForTarget(
        new Decimal(10),
        1,
        solidFood,
        FoodAStrategy.DILUTE_INITIAL,
        diThreshold,
        DEFAULT_CONFIG
      );
      expect(step).not.toBeNull();
      expect(step?.method).toBe(Method.DILUTE);
      expect(step?.mixFoodAmount).toBeDefined();
      expect(step?.mixWaterAmount).toBeDefined();
    });

    it('should return null if dilution is required but impossible', () => {
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

    it('should respect DILUTE_ALL strategy', () => {
      // Even if amount is huge, DILUTE_ALL should dilute
      // 1000mg = 10g.
      const step = generateStepForTarget(
        new Decimal(1000),
        1,
        solidFood,
        FoodAStrategy.DILUTE_ALL,
        diThreshold,
        DEFAULT_CONFIG
      );
      expect(step?.method).toBe(Method.DILUTE);

      // It might be null if can't dilute large amounts, but let's check a feasible one
      const step2 = generateStepForTarget(
        new Decimal(100),
        1,
        solidFood,
        FoodAStrategy.DILUTE_ALL,
        diThreshold,
        DEFAULT_CONFIG
      );
      expect(step2?.method).toBe(Method.DILUTE);
    });
  });

  describe('generateDefaultProtocol', () => {
    it('should create a full protocol structure with default settings', () => {
      const protocol = generateDefaultProtocol(solidFood, DEFAULT_CONFIG);
      expect(protocol).toBeDefined();
      expect(protocol.foodA).toEqual(solidFood);
      expect(protocol.steps.length).toBeGreaterThan(0);
      expect(protocol.dosingStrategy).toBe(DosingStrategy.STANDARD);
      expect(protocol.config).toEqual(DEFAULT_CONFIG);

      // Steps should have ascending targetMg
      for (let i = 1; i < protocol.steps.length; i++) {
        expect(protocol.steps[i].targetMg.toNumber()).toBeGreaterThanOrEqual(protocol.steps[i - 1].targetMg.toNumber());
      }
    });
  });
});
