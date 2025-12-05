/**
 * @module
 *
 * Collection of utility functions
 */
import {
  FoodType,
} from "./types"

import type {
  Unit,
  Food,
} from "./types"

import {
  SOLID_RESOLUTION,
  LIQUID_RESOLUTION,
} from "./constants"

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape a string for safe HTML insertion.
 *
 * Escapes the five critical characters (&, <, >, ", ') to their HTML entities.
 * Use this before inserting any user-provided content into the DOM via innerHTML or template literals. Safe for repeated calls (idempotent).
 *
 * Side effects: none (pure)
 *
 * @param unsafe Untrusted string that may contain HTML/JS
 * @returns Escaped string safe to render as text content
 * @example
 * // => "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 * escapeHtml('<script>alert("xss")</script>');
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Format a numeric value with fixed decimal places.
 *
 * Accepts native numbers or Decimal-like objects exposing toNumber().
 * Returns an empty string for null/undefined to simplify templating.
 *
 * @param value Number or Decimal to format
 * @param decimals Number of fractional digits to render
 * @returns Formatted string (or "" for nullish input)
 */
export function formatNumber(value: any, decimals: number): string {
  if (value === null || value === undefined) return "";
  const num = typeof value === "number" ? value : value.toNumber();
  return num.toFixed(decimals);
}

/**
 * Format a patient-measured amount based on its unit.
 *
 * @remarks
 * - For grams (g): fixed to SOLID_RESOLUTION decimals
 * - For milliliters (ml): integer when whole, otherwise LIQUID_RESOLUTION
 *
 * @param value Amount to format (g/ml)
 * @param unit Measuring unit: "g" or "ml"
 * @returns Formatted string
 */
export function formatAmount(value: any, unit: Unit): string {
  if (value === null || value === undefined) return "";
  const num = typeof value === "number" ? value : value.toNumber();
  if (unit === "g") {
    return num.toFixed(SOLID_RESOLUTION);
  } else {
    // ml - integer or the LIQUID_RESOLUTION
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(LIQUID_RESOLUTION);
  }
}

/**
 * Get the measuring unit for a food by its form.
 *
 * @param food Food definition with type SOLID or LIQUID
 * @returns "g" for SOLID foods; "ml" for LIQUID foods
 */
export function getMeasuringUnit(food: Food): Unit {
  if (food.type === FoodType.LIQUID) {
    return "ml";
  } else {
    return "g";
  }
}
