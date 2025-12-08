import { describe, it, expect } from 'vitest';
import { validateProtocol } from '../../core/validator';
import { generateDefaultProtocol } from '../../core/calculator';
import { DEFAULT_CONFIG } from '../../constants';
import { FoodType, Method, WarningCode } from '../../types';
import Decimal from 'decimal.js';
import type { Food } from '../../types';

const createFood = (type: FoodType = FoodType.SOLID): Food => ({
  name: 'Peanut',
  type,
  gramsInServing: new Decimal(10), // 10g protein
  servingSize: new Decimal(100),   // per 100g/ml
  getMgPerUnit() {
    return this.gramsInServing.times(1000).dividedBy(this.servingSize); // 100 mg/unit
  }
});

describe('Core: Validator', () => {
  const food = createFood();

  describe('Critical Errors (Red)', () => {
    it('should flag TOO_FEW_STEPS for too few steps', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      protocol.steps = protocol.steps.slice(0, 3); // Only 3 steps
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Red.TOO_FEW_STEPS)).toBe(true);
    });

    it('should flag PROTEIN_MISMATCH for protein mismatch > tolerance', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      // Corrupt a step: say target is 100mg but daily amount is 0.1g (10mg)
      protocol.steps[5].targetMg = new Decimal(100);
      protocol.steps[5].dailyAmount = new Decimal(0.1); 
      protocol.steps[5].method = Method.DIRECT;
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Red.PROTEIN_MISMATCH)).toBe(true);
    });

    it('should flag IMPOSSIBLE_VOLUME for impossible volumes (mix < daily)', () => {
      // Only applies to dilution
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      const diluteStepIndex = protocol.steps.findIndex(s => s.method === Method.DILUTE);
      if (diluteStepIndex === -1) return; 

      const step = protocol.steps[diluteStepIndex];
      // make daily amount huge, larger than mix water
      step.dailyAmount = new Decimal(1000);
      step.mixWaterAmount = new Decimal(10);
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Red.IMPOSSIBLE_VOLUME)).toBe(true);
    });

    it('should flag INVALID_CONCENTRATION for invalid food protein concentration', () => {
      const badFood = { ...food, getMgPerUnit: () => new Decimal(0) };
      const protocol = generateDefaultProtocol(badFood, DEFAULT_CONFIG);
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Red.INVALID_CONCENTRATION && w.message.includes("protein concentration must be > 0"))).toBe(true);
    });

    it('should flag INVALID_CONCENTRATION when protein content is greater than serving size', () => {
      const badFood = { ...food, gramsInServing: new Decimal(150), servingSize: new Decimal(100) }; // 150g protein in 100g serving
      const protocol = generateDefaultProtocol(badFood, DEFAULT_CONFIG);
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Red.INVALID_CONCENTRATION && w.message.includes("protein concentration cannot be greater than a serving size"))).toBe(true);
    });
  });

  describe('Warnings (Yellow)', () => {
    it('should flag LOW_SERVINGS for low servings', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      const diluteStepIndex = protocol.steps.findIndex(s => s.method === Method.DILUTE);
      if (diluteStepIndex === -1) return;

      // Force servings to be 1.5 (min is 3)
      protocol.steps[diluteStepIndex].servings = new Decimal(1.5);
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Yellow.LOW_SERVINGS)).toBe(true);
    });

    it('should flag NON_ASCENDING_STEPS for non-ascending targets', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      // Make step 2 smaller than step 1
      protocol.steps[1].targetMg = protocol.steps[0].targetMg.dividedBy(2);
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Yellow.NON_ASCENDING_STEPS)).toBe(true);
    });

    it('should flag BELOW_RESOLUTION for measurements below tool resolution', () => {
       const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
       // Make a direct step have very small amount
       const directIndex = protocol.steps.findIndex(s => s.method === Method.DIRECT);
       protocol.steps[directIndex].dailyAmount = new Decimal(0.01); // < 0.2g default min
       
       const warnings = validateProtocol(protocol);
       expect(warnings.some(w => w.code === WarningCode.Yellow.BELOW_RESOLUTION)).toBe(true);
    });

    it('should flag HIGH_SOLID_CONCENTRATION for high solid concentration in liquid', () => {
       const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG); // Solid food
       const diluteStepIndex = protocol.steps.findIndex(s => s.method === Method.DILUTE);
       if (diluteStepIndex === -1) return;
       
       // High concentration: 10g food in 10ml water = 1:1 ratio > 0.05 limit
       protocol.steps[diluteStepIndex].mixFoodAmount = new Decimal(10);
       protocol.steps[diluteStepIndex].mixWaterAmount = new Decimal(10);
       
       const warnings = validateProtocol(protocol);
       expect(warnings.some(w => w.code === WarningCode.Yellow.HIGH_SOLID_CONCENTRATION)).toBe(true);
    });

    it('should flag DUPLICATE_STEP for redundant adjacent steps', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      // Make step 2 same as step 1
      protocol.steps[1].targetMg = protocol.steps[0].targetMg;
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === WarningCode.Yellow.DUPLICATE_STEP)).toBe(true);
    });

    it('should NOT flag DUPLICATE_STEP if foods are different (transition)', () => {
       const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
       // Make adjacent steps have same target but different food
       protocol.steps[1].targetMg = protocol.steps[0].targetMg;
       protocol.steps[0].food = 'A';
       protocol.steps[1].food = 'B';
       
       // Ensure Food B is defined
       protocol.foodB = { ...food, name: 'Food B' };

       const warnings = validateProtocol(protocol);
       expect(warnings.some(w => w.code === WarningCode.Yellow.DUPLICATE_STEP)).toBe(false);
    });

    it('should flag HIGH_DAILY_AMOUNT when daily amount exceeds limit', () => {
       const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
       // Set daily amount to 300 (default max is 250)
       const index = protocol.steps.findIndex(s => s.method === Method.DIRECT);
       protocol.steps[index].dailyAmount = new Decimal(300);

       const warnings = validateProtocol(protocol);
       expect(warnings.some(w => w.code === WarningCode.Yellow.HIGH_DAILY_AMOUNT)).toBe(true);
    });

    it('should flag HIGH_MIX_WATER when mix water exceeds limit', () => {
       const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
       const index = protocol.steps.findIndex(s => s.method === Method.DILUTE);
       if (index === -1) return;

       // Set mix water to 600 (default max is 500)
       protocol.steps[index].mixWaterAmount = new Decimal(600);

       const warnings = validateProtocol(protocol);
       expect(warnings.some(w => w.code === WarningCode.Yellow.HIGH_MIX_WATER)).toBe(true);
    });
  });
});
