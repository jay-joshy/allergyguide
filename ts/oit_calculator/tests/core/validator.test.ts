import { describe, it, expect } from 'vitest';
import { validateProtocol } from '../../core/validator';

describe('Core: Validator', () => {
  describe('Critical Errors (Red)', () => {
    it.todo('should flag R1 for too few steps');
    it.todo('should flag R2 for protein mismatch > tolerance');
    it.todo('should flag R6 for impossible volumes (mix < daily)');
    it.todo('should flag R7 for invalid food protein concentration');
  });

  describe('Warnings (Yellow)', () => {
    it.todo('should flag Y1 for low servings');
    it.todo('should flag Y2 for non-ascending targets');
    it.todo('should flag Y3 for measurements below tool resolution');
    it.todo('should flag Y4 for high solid concentration in liquid');
  });
});
