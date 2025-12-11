import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';

// Import actual App Logic
import { generateAsciiContent } from '../../export/exports';
import { generateDefaultProtocol } from '../../core/calculator';
import { addFoodBToProtocol, removeStep } from '../../core/protocol';
import { DEFAULT_CONFIG } from '../../constants';
import { FoodType, type Protocol, DosingStrategy, FoodAStrategy, Method } from '../../types';

declare global {
  var __COMMIT_HASH__: string;
  var __VERSION_OIT_CALCULATOR__: string;
}
globalThis.__COMMIT_HASH__ = 'TEST_HASH';
globalThis.__VERSION_OIT_CALCULATOR__ = '1.0.0';

// Helpers
const createFood = (name: string, proteinPerServing: number, servingSize: number) => ({
  name,
  type: FoodType.SOLID,
  gramsInServing: new Decimal(proteinPerServing),
  servingSize: new Decimal(servingSize),
  getMgPerUnit() {
    return this.gramsInServing.times(1000).dividedBy(this.servingSize);
  }
});

describe('Export Output Logic', () => {
  // Base Data
  const peanutFlour = createFood('Peanut Flour', 10, 20); // 500mg/g
  const bamba = createFood('Bamba', 2, 15); // ~133mg/g

  let baseProtocol: Protocol;

  beforeEach(() => {
    // Start fresh for every test
    baseProtocol = generateDefaultProtocol(peanutFlour, DEFAULT_CONFIG);
  });

  it('Scenario: Standard Protocol (Food A only)', () => {
    const output = generateAsciiContent(baseProtocol, "Keep it up!");

    // Check Headers
    expect(output).toContain("Peanut Flour (SOLID)");
    expect(output).not.toContain("TRANSITION TO");
  });

  it('Scenario: Food A -> Food B Transition', () => {
    // Add Food B at 1000mg threshold (1g of Peanut Flour protein)
    const threshold = { unit: 'g' as const, amount: new Decimal(2) }; // 2g of Bamba (approx 266mg) to start transition

    // Let's pick a threshold that actually hits the middle of the default protocol
    const transitionThreshold = { unit: 'g' as const, amount: new Decimal(0.15) }; // ~20mg for Bamba

    const protocol = addFoodBToProtocol(baseProtocol, bamba, transitionThreshold);
    const output = generateAsciiContent(protocol, "");

    // 1. Should have both tables
    expect(output).toContain("Peanut Flour");
    // New format separates header from food name
    expect(output).toContain("--- TRANSITION TO ---");
    expect(output).toContain("Bamba (SOLID)");

    // 2. Interval checks removed as they are not in the new ASCII format
  });

  it('Scenario: High Food B Threshold (Ghost Food B)', () => {
    // Add Food B but with a threshold higher than any step in the protocol
    const impossibleThreshold = { unit: 'g' as const, amount: new Decimal(1000) };
    const protocol = addFoodBToProtocol(baseProtocol, bamba, impossibleThreshold);

    // Verify state: Food B exists in object, but no steps are assigned to B
    expect(protocol.foodB).toBeDefined();
    expect(protocol.steps.some(s => s.food === "B")).toBe(false);

    const output = generateAsciiContent(protocol, "");

    // Should NOT show transition header
    expect(output).not.toContain("TRANSITION TO");
  });

  it('Scenario: Deleted Food A (Starts immediately with B)', () => {
    // 1. Create transition
    // Transition at 1mg (basically start immediately)
    const transitionThreshold = { unit: 'g' as const, amount: new Decimal(0.001) };
    let protocol = addFoodBToProtocol(baseProtocol, bamba, transitionThreshold);

    // 2. Manually remove all Food A steps (steps where food === 'A')
    // In reality, user clicks "Remove Step" repeatedly. 
    // We simulate this by filtering, mimicking the state result.
    protocol.steps = protocol.steps.filter(s => s.food === "B");

    // Re-index steps to look realistic
    protocol.steps.forEach((s, i) => s.stepIndex = i + 1);

    const output = generateAsciiContent(protocol, "");

    // 1. Should show Bamba Name
    expect(output).toContain("Bamba");

    // 2. Logic check: if Food A steps are 0, it skips A table and goes directly to B Table.
    // In this case, it should NOT print the transition header because there is nothing to transition FROM.
    expect(output).not.toContain("TRANSITION TO");
  });

  it('Scenario: Dilution Logic Check', () => {
    // Force a specific step to be DILUTE
    // Peanut Flour (500mg/g). Target 10mg. 
    // Neat mass = 0.02g (Too small, requires dilution).
    // generateDefaultProtocol should have created dilution steps at the start.

    const output = generateAsciiContent(baseProtocol, "");

    // Look for "g food +" string which indicates dilution syntax
    expect(output).toContain("g food +");
    expect(output).toContain("ml water");
  });

  it('Scenario: Precision and Formatting (Liquid & Solid)', () => {
    // --- LIQUID TEST ---
    const milk = {
      name: 'Milk',
      type: FoodType.LIQUID,
      gramsInServing: new Decimal(3), // 3g protein
      servingSize: new Decimal(100),   // 100ml
      getMgPerUnit() { return new Decimal(30); } // 30 mg/ml
    };

    const pLiquid: Protocol = {
      dosingStrategy: DosingStrategy.STANDARD,
      foodA: milk,
      foodAStrategy: FoodAStrategy.DILUTE_NONE,
      diThreshold: new Decimal(0),
      steps: [],
      config: DEFAULT_CONFIG
    };

    // Step 1: 30 mg -> 1 ml (Exact integer)
    // Step 2: 15 mg -> 0.5 ml (1 decimal)
    // Step 3: 4 mg -> 0.1333 ml -> 0.1 ml (Rounded)

    pLiquid.steps.push({
      stepIndex: 1,
      targetMg: new Decimal(30),
      method: Method.DIRECT,
      dailyAmount: new Decimal(1),
      dailyAmountUnit: 'ml',
      food: 'A'
    });

    pLiquid.steps.push({
      stepIndex: 2,
      targetMg: new Decimal(15),
      method: Method.DIRECT,
      dailyAmount: new Decimal(0.5),
      dailyAmountUnit: 'ml',
      food: 'A'
    });

    pLiquid.steps.push({
      stepIndex: 3,
      targetMg: new Decimal(4),
      method: Method.DIRECT,
      dailyAmount: new Decimal(0.1333),
      dailyAmountUnit: 'ml',
      food: 'A'
    });

    const outLiquid = generateAsciiContent(pLiquid, "");
    
    // Check for exact substrings in the ASCII table output
    // Assuming standard spacing, we just check for value + unit
    expect(outLiquid).toContain("1 ml");
    expect(outLiquid).toContain("0.5 ml");
    expect(outLiquid).toContain("0.1 ml");
    
    // --- SOLID TEST ---
    // 1g -> "1.00 g"
    const peanut = createFood('Peanut', 10, 100); // 100mg/g
    const pSolid: Protocol = {
        dosingStrategy: DosingStrategy.STANDARD,
        foodA: peanut,
        foodAStrategy: FoodAStrategy.DILUTE_NONE,
        diThreshold: new Decimal(0),
        steps: [],
        config: DEFAULT_CONFIG
    };
    
    pSolid.steps.push({
        stepIndex: 1,
        targetMg: new Decimal(100),
        method: Method.DIRECT,
        dailyAmount: new Decimal(1),
        dailyAmountUnit: 'g',
        food: 'A'
    });

    const outSolid = generateAsciiContent(pSolid, "");
    expect(outSolid).toContain("1.00 g");
  });

  it('Scenario: Custom Notes', () => {
    const note = "Patient must eat with 200ml of water.";
    const output = generateAsciiContent(baseProtocol, note);

    expect(output).toContain("NOTES");
    expect(output).toContain(note);
    expect(output).toContain("========================================");
  });

  it('Scenario: Empty Protocol', () => {
    const output = generateAsciiContent(null, "Notes");
    expect(output).toBe("");
  });

  it('Scenario: Version Footer', () => {
    const output = generateAsciiContent(baseProtocol, "");
    expect(output).toContain(`Tool version-hash: v${globalThis.__VERSION_OIT_CALCULATOR__}-${globalThis.__COMMIT_HASH__}`);
  });
});