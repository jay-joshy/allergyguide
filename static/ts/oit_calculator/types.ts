import Decimal from "decimal.js";

// ============================================
// ENUMS
// ============================================

/**
 * Dosing plan presets for target protein steps.
 * STANDARD, SLOW, map to arrays in DOSING_STRATEGIES.
 */
export enum DosingStrategy {
  STANDARD = "STANDARD",
  SLOW = "SLOW",
}

/**
 * Physical form that determines measuring unit and mixing model.
 * SOLID uses grams; LIQUID uses milliliters.
 */
export enum FoodType {
  SOLID = "SOLID",
  LIQUID = "LIQUID",
}

/**
 * How a step is administered:
 * DIRECT (neat food) or DILUTE (prepared mixture).
 */
export enum Method {
  DILUTE = "DILUTE",
  DIRECT = "DIRECT",
}

/**
 * Policy for when Food A uses dilution across steps.
 * DILUTE_INITIAL (until neat ≥ threshold), DILUTE_ALL, or DILUTE_NONE.
 */
export enum FoodAStrategy {
  DILUTE_INITIAL = "DILUTE_INITIAL",
  DILUTE_ALL = "DILUTE_ALL",
  DILUTE_NONE = "DILUTE_NONE",
}

// ============================================
// TYPE ALIASES
// ============================================

/**
 * Measuring unit for patient-facing amounts.
 * "g" for solids; "ml" for liquids.
 */
export type Unit = "g" | "ml";

// ============================================
// INTERFACES
// ============================================

/**
 * Food definition with protein concentration used for calculations.
 * mgPerUnit is the canonical internal unit (mg protein per g or ml food).
 * But this can be derived from the grams of protein per serving size (X g or ml)
 */
export interface Food {
  name: string;
  type: FoodType;
  gramsInServing: Decimal;
  servingSize: Decimal;
  getMgPerUnit(): Decimal;
  // mgPerUnit: Decimal; // mg of protein per gram or ml of food. Canonical protein unit for calculations in the tool
}

/**
 * Single dosing step with target protein and administration details.
 * For DILUTE steps, mix * and servings describe the prepared mixture.
 */
export interface Step {
  stepIndex: number;
  targetMg: Decimal;
  method: Method;
  dailyAmount: Decimal;
  dailyAmountUnit: Unit;
  mixFoodAmount?: Decimal;
  mixWaterAmount?: Decimal;
  servings?: Decimal;
  food: "A" | "B";
}

/**
 * Limits and tolerances used to compute feasible dilution/direct steps. Values are Decimals and represent device resolution, tolerances, and ratios.
 */
export interface ProtocolConfig {
  minMeasurableMass: Decimal; // Minimal mass that is practically measurable by scale.
  minMeasurableVolume: Decimal; // Minimal mass that is practically measurable by syringe.
  minServingsForMix: Decimal; // Minimal servings for dilution mix (must be >= 1)
  PROTEIN_TOLERANCE: Decimal; // allowable percent deviation of calculated actual protein target and targetmg. ie. 0.05. Understanding that in real life there is limited resolution of measurement so the actual protein content may be slightly different from the target to an allowable degree
  DEFAULT_FOOD_A_DILUTION_THRESHOLD: Decimal; // At what amount of Food A do you switch to direct dosing?
  DEFAULT_FOOD_B_THRESHOLD: Decimal; // At what amount of Food B do you switch from Food A to Food B?
  MAX_SOLID_CONCENTRATION: Decimal; //  max g/ml ratio for solid diluted into liquids (default 0.05). Assume that if the solid concentration is above this threshold, then the solid contributes non-negligibly to the total volume of the mixture.
  MAX_MIX_WATER: Decimal;
  // Default candidate options for various parameters used to calculate optimal dilutions
  SOLID_MIX_CANDIDATES: Decimal[];
  LIQUID_MIX_CANDIDATES: Decimal[];
  DAILY_AMOUNT_CANDIDATES: Decimal[];
}

/**
 * Complete protocol definition, including steps and global settings.
 * May include a Food B transition and its threshold.
 */
export interface Protocol {
  dosingStrategy: DosingStrategy;
  foodA: Food;
  foodAStrategy: FoodAStrategy;
  diThreshold: Decimal;
  foodB?: Food;
  foodBThreshold?: { unit: Unit; amount: Decimal };
  steps: Step[];
  config: ProtocolConfig;
}

/**
 * Validation result describing an issue with the protocol or a specific step.
 * severity is "red" (critical) or "yellow" (caution).
 */
export interface Warning {
  severity: "red" | "yellow";
  code: string;
  message: string;
  stepIndex?: number;
}

/**
 * Intermediate dilution candidate considered during planning.
 * Represents a particular mix recipe and its derived servings.
 */
export interface Candidate {
  mixFoodAmount: Decimal;
  mixWaterAmount: Decimal;
  dailyAmount: Decimal;
  mixTotalVolume: Decimal;
  servings: Decimal;
}

// TODO! Clean up the CNF file; some of the SOLID/LIQUID distinctions are wrong still
/**
 * Food database record (as loaded from JSON containing with data from Canadian Nutrient File, Health Canada, 2015).
 * Raw values are UI-facing and converted to internal Decimal where needed.
 */
export interface FoodData {
  Food: string;
  "Mean protein in grams": number; // Not all will be mean
  "Serving size": number; // 100g for CNF, but otherwise for custom foods will be variable
  Type: string; // SOLID or LIQUID
}

// For loading of protocols from JSON file
/**
 * Protocol template record (as loaded from JSON).
 * String fields representing numbers are parsed into Decimal during load.
 */
export interface ProtocolData {
  name: string;
  dosing_strategy: string;
  food_a: {
    type: string;
    name: string;
    gramsInServing: string;
    servingSize: string;
    // mgPerUnit: string;
  };
  food_a_strategy: string;
  di_threshold: string;
  food_b?: {
    type: string;
    name: string;
    gramsInServing: string;
    servingSize: string;
    // mgPerUnit: string;
  };
  food_b_threshold?: string;
  table_di: any[]; // steps for protocol using dilution initial strategy
  table_dn: any[]; // steps for protocol using dilution none strategy
  table_da: any[]; // steps for protocol using dilution all strategy
  custom_note?: string;
}
