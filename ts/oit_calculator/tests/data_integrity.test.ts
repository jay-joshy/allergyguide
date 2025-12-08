import { describe, it, expect } from 'vitest';
import { FoodDataSchema, ProtocolDataSchema } from '../types';

// Import JSONs
import cnfFoods from '../../../static/tool_assets/typed_foods_rough.json';
import customFoods from '../../../static/tool_assets/custom_foods.json';
import protocols from '../../../static/tool_assets/oit_protocols.json';

const cnfList = cnfFoods as unknown[];
const customList = customFoods as unknown[];
const protocolList = protocols as unknown[];

// Helper to check if a string is a valid number (for Decimal.js compatibility)
const isNumericStr = (val: string | undefined) => {
  if (!val) return true; // Optional fields might be undefined
  return !isNaN(parseFloat(val)) && isFinite(Number(val));
};

describe('Static Data Integrity', () => {

  it('validates CNF foods (Structure & Numeric)', () => {
    expect(Array.isArray(cnfList)).toBe(true);
    let invalidCount = 0;

    cnfList.forEach((item: any, index) => {
      const result = FoodDataSchema.safeParse(item);
      if (!result.success) {
        console.error(`Invalid CNF Food structure at index ${index} (${item?.Food}):`, result.error);
        invalidCount++;
      }
    });
    expect(invalidCount, `Found ${invalidCount} invalid CNF foods`).toBe(0);
  });

  it('validates Custom foods (Structure & Numeric)', () => {
    expect(Array.isArray(customList)).toBe(true);
    let invalidCount = 0;
    const seenNames = new Set<string>();

    customList.forEach((item: any, index) => {
      // 1. Zod Structure Check
      const result = FoodDataSchema.safeParse(item);

      if (!result.success) {
        console.error(`Invalid Custom Food structure at index ${index}:`, result.error);
        invalidCount++;
        return;
      }

      const data = result.data;

      // 2. Uniqueness Check
      if (seenNames.has(data.Food)) {
        console.error(`Duplicate Custom Food found: "${data.Food}"`);
        invalidCount++;
      }
      seenNames.add(data.Food);
    });

    expect(invalidCount, `Found ${invalidCount} issues in Custom foods`).toBe(0);
  });

  it('validates Protocols (Structure, Numeric strings, Uniqueness)', () => {
    expect(Array.isArray(protocolList)).toBe(true);
    let invalidCount = 0;
    const seenNames = new Set<string>();

    protocolList.forEach((item: any, index) => {
      // Zod Structure Check
      const result = ProtocolDataSchema.safeParse(item);

      if (!result.success) {
        console.error(`Invalid Protocol structure at index ${index}:`, result.error);
        invalidCount++;
        return;
      }

      const p = result.data;

      // Uniqueness Check
      if (seenNames.has(p.name)) {
        console.error(`Duplicate Protocol Name: "${p.name}"`);
        invalidCount++;
      }
      seenNames.add(p.name);

      // Numeric String Validation
      // Check crucial fields that will be parsed as Decimals
      const numberFieldsToCheck = [
        { name: 'food_a.gramsInServing', val: p.food_a.gramsInServing },
        { name: 'food_a.servingSize', val: p.food_a.servingSize },
        { name: 'food_b.gramsInServing', val: p.food_b?.gramsInServing }, // Optional
        { name: 'food_b.servingSize', val: p.food_b?.servingSize },       // Optional
        { name: 'food_b_threshold', val: p.food_b_threshold },            // Optional
        { name: 'di_threshold', val: p.di_threshold },
      ];

      numberFieldsToCheck.forEach(field => {
        if (!isNumericStr(field.val)) {
          console.error(`Protocol "${p.name}" has invalid number string for ${field.name}: "${field.val}"`);
          invalidCount++;
        }
      });
    });

    expect(invalidCount, `Found ${invalidCount} issues in Protocols`).toBe(0);
  });
});
