import { describe, it, expect } from 'vitest';
import { findDilutionCandidates, generateStepForTarget } from '../../core/calculator';

describe('Core: Calculator', () => {
  describe('findDilutionCandidates', () => {
    it.todo('should find candidates for solid foods within constraints');
    it.todo('should find candidates for liquid foods within constraints');
    it.todo('should return empty array if no valid candidates found');
    it.todo('should prioritize candidates based on solid concentration limits');
  });

  describe('generateStepForTarget', () => {
    it.todo('should generate a direct step when above threshold');
    it.todo('should generate a dilute step when below threshold');
    it.todo('should return null if dilution is required but impossible');
  });

  describe('generateDefaultProtocol', () => {
    it.todo('should create a full protocol structure with default settings');
  });
});
