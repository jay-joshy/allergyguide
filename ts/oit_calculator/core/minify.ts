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
  Food
} from "../types";
import {
  FoodType,
  Method,
  DosingStrategy,
  FoodAStrategy,
} from "../types"

// Need global commit hash 
// And current tool version
declare const __COMMIT_HASH__: string;
declare const __VERSION_OIT_CALCULATOR__: string;


// --- Minification Helpers ---

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

  return {
    v: `${__VERSION_OIT_CALCULATOR__}-${__COMMIT_HASH__}`,
    ts: Date.now(),
    p: minifyProtocol(currentItem.protocol),
    h: history.map(h => h.label) // Strip timestamps/objects, keep text log
  };
}
