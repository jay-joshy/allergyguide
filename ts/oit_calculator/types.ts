/**
 * @module
 *
 * Core data structures, enumerations, and type aliases
 */
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

export const WarningCode = {
  Red: {
    TOO_FEW_STEPS: "TOO_FEW_STEPS",
    PROTEIN_MISMATCH: "PROTEIN_MISMATCH",
    INSUFFICIENT_MIX_PROTEIN: "INSUFFICIENT_MIX_PROTEIN",
    IMPOSSIBLE_VOLUME: "IMPOSSIBLE_VOLUME",
    INVALID_CONCENTRATION: "INVALID_CONCENTRATION",
    INVALID_TARGET: "INVALID_TARGET",
    INVALID_DILUTION_STEP_VALUES: "INVALID_DILUTION_STEP_VALUES",
  },
  Yellow: {
    LOW_SERVINGS: "LOW_SERVINGS",
    NON_ASCENDING_STEPS: "NON_ASCENDING_STEPS",
    BELOW_RESOLUTION: "BELOW_RESOLUTION",
    HIGH_SOLID_CONCENTRATION: "HIGH_SOLID_CONCENTRATION",
    NO_TRANSITION_POINT: "NO_TRANSITION_POINT",
  }
} as const;
// to use in Warning interface
export type SpecificWarningCode = typeof WarningCode.Red[keyof typeof WarningCode.Red] | typeof WarningCode.Yellow[keyof typeof WarningCode.Yellow];

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
  code: SpecificWarningCode;
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

// ============================================
// HISTORY INTERFACES
// ============================================

/**
 * Rich history item for internal application state
 * Maintains full object fidelity and precise timestamps 
 */
export interface HistoryItem {
  protocol: Protocol;
  label: string;      // Human-readable action description
  timestamp: number;  // Unix timestamp 
}

// --- MINIFIED INTERFACES FOR QR PAYLOAD ---

export interface MFood {
  n: string; // name
  t: number; // 0=SOLID, 1=LIQUID
  p: number; // gramsInServing
  s: number; // servingSize
}

export interface MStep {
  i: number; // stepIndex
  t: number; // targetMg
  m: number; // 0=DIRECT, 1=DILUTE
  d: number; // dailyAmount
  mf?: number; // mixFoodAmount (optional)
  mw?: number; // mixWaterAmount (optional)
  sv?: number; // servings (optional)
  f: number; // 0=Food A, 1=Food B
}

export interface MProtocol {
  ds: number;   // DosingStrategy: 0=STANDARD, 1=SLOW
  fas: number;  // FoodAStrategy: 0=INIT, 1=ALL, 2=NONE
  dt: number;   // diThreshold
  fbt?: number; // foodBThreshold amount
  fa: MFood;    // Food A
  fb?: MFood;   // Food B
  s: MStep[];   // Steps
}

/**
 * The final payload structure to be compressed into the QR code.
 */
export interface UserHistoryPayload {
  v: string;      // semver-hash, ie. 0.8.0-a1213b2c 
  ts: number;     // Generated At timestamp
  p: MProtocol;   // Current Protocol State
  h: string[];    // History of action labels only (stripped timestamps)
}

// ============================================
// READABLE INTERFACES (For Decoded Payload)
// ============================================
// The purpose of these interfaces is when a userhistory payload (minified as per above) needs to be read by a human. These don't include the config as these are not changeable by the user and can simply be found by going to the relevant commit hash

export interface ReadableFood {
  name: string;
  type: string; // "SOLID" | "LIQUID"
  gramsInServing: number;
  servingSize: number;
  proteinConcentrationMgPerUnit: number;
}

export interface ReadableStep {
  stepIndex: number;
  targetMg: number;
  method: string; // "DIRECT" | "DILUTE"
  dailyAmount: number;
  foodSource: string; // "Food A" | "Food B"
  mixFoodAmount?: number;
  mixWaterAmount?: number;
  servings?: number;
}

export interface ReadableProtocol {
  dosingStrategy: string;
  foodAStrategy: string;
  diThreshold: number;
  foodBThreshold?: number;
  foodA: ReadableFood;
  foodB?: ReadableFood;
  steps: ReadableStep[];
}

export interface ReadableHistoryPayload {
  version: string;
  timestamp: string; // ISO String
  protocol: ReadableProtocol;
  historyLog: string[];
}
