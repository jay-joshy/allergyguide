import { describe, it, expect } from 'vitest';
import { validateProtocol } from '../../core/validator';
import { generateDefaultProtocol } from '../../core/calculator';
import { DEFAULT_CONFIG } from '../../constants';
import { FoodType, Method } from '../../types';
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
    it('should flag R1 for too few steps', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      protocol.steps = protocol.steps.slice(0, 3); // Only 3 steps
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === 'R1')).toBe(true);
    });

    it('should flag R2 for protein mismatch > tolerance', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      // Corrupt a step: say target is 100mg but daily amount is 0.1g (10mg)
      protocol.steps[5].targetMg = new Decimal(100);
      protocol.steps[5].dailyAmount = new Decimal(0.1); 
      protocol.steps[5].method = Method.DIRECT;
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === 'R2')).toBe(true);
    });

    it('should flag R6 for impossible volumes (mix < daily)', () => {
      // Only applies to dilution
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      const diluteStepIndex = protocol.steps.findIndex(s => s.method === Method.DILUTE);
      if (diluteStepIndex === -1) return; 

      const step = protocol.steps[diluteStepIndex];
      // make daily amount huge, larger than mix water
      step.dailyAmount = new Decimal(1000);
      step.mixWaterAmount = new Decimal(10);
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === 'R6')).toBe(true);
    });

    it('should flag R7 for invalid food protein concentration', () => {
      const badFood = { ...food, getMgPerUnit: () => new Decimal(0) };
      const protocol = generateDefaultProtocol(badFood, DEFAULT_CONFIG);
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === 'R7')).toBe(true);
    });
  });

  describe('Warnings (Yellow)', () => {
    it('should flag Y1 for low servings', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      const diluteStepIndex = protocol.steps.findIndex(s => s.method === Method.DILUTE);
      if (diluteStepIndex === -1) return;

      // Force servings to be 1.5 (min is 3)
      protocol.steps[diluteStepIndex].servings = new Decimal(1.5);
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === 'Y1')).toBe(true);
    });

    it('should flag Y2 for non-ascending targets', () => {
      const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
      // Make step 2 smaller than step 1
      protocol.steps[1].targetMg = protocol.steps[0].targetMg.dividedBy(2);
      
      const warnings = validateProtocol(protocol);
      expect(warnings.some(w => w.code === 'Y2')).toBe(true);
    });

    it('should flag Y3 for measurements below tool resolution', () => {
       const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
       // Make a direct step have very small amount
       const directIndex = protocol.steps.findIndex(s => s.method === Method.DIRECT);
       protocol.steps[directIndex].dailyAmount = new Decimal(0.01); // < 0.2g default min
       
       const warnings = validateProtocol(protocol);
       expect(warnings.some(w => w.code === 'Y3')).toBe(true);
    });

    it('should flag Y4 for high solid concentration in liquid', () => {
       const protocol = generateDefaultProtocol(food, DEFAULT_CONFIG); // Solid food
       const diluteStepIndex = protocol.steps.findIndex(s => s.method === Method.DILUTE);
       if (diluteStepIndex === -1) return;
       
       // High concentration: 10g food in 10ml water = 1:1 ratio > 0.05 limit
       protocol.steps[diluteStepIndex].mixFoodAmount = new Decimal(10);
       protocol.steps[diluteStepIndex].mixWaterAmount = new Decimal(10);
       
       const warnings = validateProtocol(protocol);
       expect(warnings.some(w => w.code === 'Y4')).toBe(true);
    });
  });
});