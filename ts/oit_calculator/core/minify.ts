/**
 * @module
 * * Logic for minifying protocols and generating payloads for QR codes
 */
import type {
  Protocol,
  HistoryItem,
  MProtocol,
  MFood,
  MStep,
  Step,
  UserHistoryPayload,
  Food,
  ReadableHistoryPayload,
  ReadableProtocol,
  ReadableFood,
  ReadableStep,
  Warning,
  MWarning,
  ReadableWarning
} from "../types";
import {
  FoodType,
  Method,
  DosingStrategy,
  FoodAStrategy,
  WarningCode
} from "../types"
import { validateProtocol } from "./validator";

// Need global commit hash 
// And current tool version
declare const __COMMIT_HASH__: string;
declare const __VERSION_OIT_CALCULATOR__: string;

// --- Minification Helpers ---

function minifyWarnings(warnings: Warning[]): MWarning[] {
  return warnings.map(w => ({
    c: w.code,
    i: w.stepIndex
  }));
}

function minifyFood(f: Food): MFood {
  // f is type Food, but we access properties to convert Decimal
  return {
    n: f.name,
    t: f.type === FoodType.SOLID ? 0 : 1,
    p: f.gramsInServing.toNumber(),
    s: f.servingSize.toNumber()
  };
}

function minifyStep(s: Step): MStep {
  // s is Step
  const ms: MStep = {
    i: s.stepIndex,
    t: s.targetMg.toNumber(),
    m: s.method === Method.DIRECT ? 0 : 1,
    d: s.dailyAmount.toNumber(),
    f: s.food === "A" ? 0 : 1
  };

  if (s.method === Method.DILUTE) {
    if (s.mixFoodAmount) ms.mf = s.mixFoodAmount.toNumber();
    if (s.mixWaterAmount) ms.mw = s.mixWaterAmount.toNumber();
    if (s.servings) ms.sv = s.servings.toNumber();
  }

  return ms;
}

/**
 * Converts a full Protocol object into a Minified Protocol (MProtocol)
 */
export function minifyProtocol(p: Protocol): MProtocol {
  const mp: MProtocol = {
    ds: p.dosingStrategy === DosingStrategy.STANDARD ? 0 : 1,
    fas: 0, // default, check for dilute all and none later
    dt: p.diThreshold.toNumber(),
    fa: minifyFood(p.foodA),
    s: p.steps.map(minifyStep)
  };

  // Map Food A Strategy
  if (p.foodAStrategy === FoodAStrategy.DILUTE_ALL) mp.fas = 1;
  else if (p.foodAStrategy === FoodAStrategy.DILUTE_NONE) mp.fas = 2;

  if (p.foodB) {
    mp.fb = minifyFood(p.foodB);
  }

  if (p.foodBThreshold) {
    mp.fbt = p.foodBThreshold.amount.toNumber();
  }

  return mp;
}

/**
 * Generates information for final QR Payload
 */
export function generateUserHistoryPayload(history: HistoryItem[]): UserHistoryPayload | null {
  if (history.length === 0) return null;

  // Current state is the last item in history (ProtocolState.getHistory returns [...past, current])
  const currentItem = history[history.length - 1];

  // Calculate warnings for current protocol
  const warnings = validateProtocol(currentItem.protocol);
  const mWarnings = minifyWarnings(warnings);

  return {
    v: `${__VERSION_OIT_CALCULATOR__}-${__COMMIT_HASH__}`,
    ts: Date.now(),
    p: minifyProtocol(currentItem.protocol),
    w: mWarnings.length > 0 ? mWarnings : undefined,
    h: history.map(h => h.label) // Strip timestamps/objects, keep text log
  };
}

/**
 * Decodes a Base64 encoded QR string into a human-readable JSON object
 * @param b64String from QR code
 * @returns fully expanded JavaScript object with readable keys and Enums resolved
 */
export async function decodeUserHistoryPayload(b64String: string): Promise<ReadableHistoryPayload | null> {
  try {
    const { inflate } = await import('pako');

    // Decode Base64 to Binary String
    const binaryString = atob(b64String);

    // Convert Binary String to Uint8Array
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decompress (Inflate)
    // Note: 'to: "string"' forces pako to return a string instead of a Uint8Array
    const jsonStr = inflate(bytes, { to: 'string' });

    // Parse JSON (This gives us the Minified structure)
    const minified = JSON.parse(jsonStr);

    // Expand Minified Keys to Human Readable Names
    return expandPayload(minified);

  } catch (error) {
    console.error("Failed to decode payload:", error);
    return null;
  }
}

// --- Helper: Expansion Logic ---

function expandWarnings(mw: MWarning[]): ReadableWarning[] {
  return mw.map(w => ({
    code: w.c,
    stepIndex: w.i
  }));
}

function expandPayload(m: any): ReadableHistoryPayload {
  const result: ReadableHistoryPayload = {
    version: m.v,
    timestamp: new Date(m.ts).toISOString(), // Convert epoch to Readable Date
    protocol: expandProtocol(m.p),
    historyLog: m.h
  };

  if (m.w && Array.isArray(m.w)) {
    result.warnings = expandWarnings(m.w);
  }

  return result;
}

function expandProtocol(p: any): ReadableProtocol {
  return {
    dosingStrategy: p.ds === 0 ? "STANDARD" : "SLOW",
    foodAStrategy: mapFoodAStrategy(p.fas),
    diThreshold: p.dt,
    foodBThreshold: p.fbt, // undefined if not present
    foodA: expandFood(p.fa),
    foodB: p.fb ? expandFood(p.fb) : undefined,
    steps: p.s.map(expandStep),
  };
}

function expandFood(f: any): ReadableFood {
  return {
    name: f.n,
    type: f.t === 0 ? "SOLID" : "LIQUID",
    gramsInServing: f.p,
    servingSize: f.s,
    proteinConcentrationMgPerUnit: (f.p * 1000) / f.s
  };
}

function expandStep(s: any): ReadableStep {
  const method = s.m === "D" ? "DIRECT" : "DILUTE";

  const step: any = {
    stepIndex: s.i,
    targetMg: s.t,
    method: method,
    dailyAmount: s.d,
    foodSource: s.f === 0 ? "Food A" : "Food B"
  };

  // Add dilution specifics only if they exist
  if (method === "DILUTE") {
    step.mixFoodAmount = s.mf;
    step.mixWaterAmount = s.mw;
    step.servings = s.sv;
  }

  return step;
}

function mapFoodAStrategy(val: number): string {
  switch (val) {
    case 0: return "DILUTE_INITIAL";
    case 1: return "DILUTE_ALL";
    case 2: return "DILUTE_NONE";
    default: return "UNKNOWN";
  }
}
