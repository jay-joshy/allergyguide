// ============================================
// OIT CALCULATOR - COMPLETE IMPLEMENTATION
// Joshua Yu 2025 - allergyguide.ca
// See TYPESCRIPT_SETUP.md
// ============================================

// ============================================
// EXTERNAL PACKAGES
// ============================================

// Imports
import Decimal from "decimal.js";
import fuzzysort from "fuzzysort";
import { AsciiTable3 } from "ascii-table3";

import type { jsPDF } from 'jspdf';
import type { PDFDocument } from 'pdf-lib';

// Configure Decimal.js
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// commit hash
declare const __COMMIT_HASH__: string;

// ============================================
// TYPES - INTERFACES/ENUMS
// ============================================

import {
  DosingStrategy,
  FoodType,
  Method,
  FoodAStrategy,
} from "./types"

import type {
  Unit,
  Food,
  Step,
  ProtocolConfig,
  Protocol,
  Candidate,
  FoodData,
  ProtocolData,
  Warning
} from "./types"

// ============================================
// CONSTANTS / DEFAULTS
// ============================================

import {
  OIT_CLICKWRAP_ACCEPTED_KEY,
  CLICKWRAP_EXPIRY_DAYS,
  DEFAULT_CONFIG,
} from "./constants"

// ============================================
// VALIDATOR
// ============================================

import {
  validateProtocol
} from "./core/validator"

// ============================================
// CORE
// ============================================

import {
  findDilutionCandidates,
  generateStepForTarget,
  generateDefaultProtocol
} from "./core/calculator"

// ============================================
// Protocol
// ============================================
import {
  recalculateProtocol,
  addFoodBToProtocol,
  recalculateStepMethods
} from "./core/protocol"

// ============================================
// GLOBAL STATE
// ============================================

let currentProtocol: Protocol | null = null;
let protocolsDatabase: ProtocolData[] = [];
let fuzzySortPreparedFoods: any[] = [];
let fuzzySortPreparedProtocols: any[] = [];
let customNote: string = "";
let warningsPageURL = "";

// Clickwrap modal elements
let clickwrapModal: HTMLElement | null = null;
let clickwrapCheckbox0: HTMLInputElement | null = null;
let clickwrapCheckbox1: HTMLInputElement | null = null;
let clickwrapCheckbox2: HTMLInputElement | null = null;
let clickwrapCheckbox3: HTMLInputElement | null = null;
let clickwrapGenerateBtn: HTMLButtonElement | null = null;
let clickwrapCancelBtn: HTMLButtonElement | null = null;

// Debounce timers
let searchDebounceTimer: number | null = null;

// Dropdown navigation state
let currentDropdownIndex: number = -1;
let currentDropdownInputId: string = "";

// ============================================
// UTILITY FUNCTIONS
// ============================================

import {
  escapeHtml,
  formatNumber,
  formatAmount,
} from "./utils"

// ============================================
// CLICKWRAP MODAL FUNCTIONS
// ============================================

/**
 * Checks if the user has a valid, non-expired clickwrap acceptance token.
 * @returns {boolean} True if the token is valid, false otherwise.
 */
function isClickwrapAccepted(): boolean {
  const stored = localStorage.getItem(OIT_CLICKWRAP_ACCEPTED_KEY);
  if (!stored) return false;

  try {
    const { expiry } = JSON.parse(stored);
    if (typeof expiry !== 'number') return false;
    return new Date().getTime() < expiry;
  } catch (e) {
    return false;
  }
}

/**
 * Stores a clickwrap acceptance token in localStorage with a X-day expiry.
 */
function setClickwrapAcceptToken(): void {
  const expiry = new Date().getTime() + CLICKWRAP_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(OIT_CLICKWRAP_ACCEPTED_KEY, JSON.stringify({ expiry }));
}

/**
 * Displays the clickwrap modal.
 */
function showClickwrapModal(): void {
  if (clickwrapModal) {
    clickwrapModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Lock scroll
  }
}

/**
 * Hides the clickwrap modal and resets its state.
 */
function hideClickwrapModal(): void {
  if (clickwrapModal) {
    clickwrapModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore scroll
    if (clickwrapCheckbox0) clickwrapCheckbox0.checked = false;
    if (clickwrapCheckbox1) clickwrapCheckbox1.checked = false;
    if (clickwrapCheckbox2) clickwrapCheckbox2.checked = false;
    if (clickwrapCheckbox3) clickwrapCheckbox3.checked = false;
    if (clickwrapGenerateBtn) clickwrapGenerateBtn.disabled = true;
  }
}

// ============================================
// CORE ALGORITHMS
// ============================================


/**
 * Count the number of Food A steps in a protocol.
 *
 * @param protocol Protocol to inspect
 * @returns Number of steps that belong to Food A
 */
function getFoodAStepCount(protocol: Protocol): number {
  if (!protocol.foodB) return protocol.steps.length;

  // Find first Food B step by checking the food property
  for (let i = 0; i < protocol.steps.length; i++) {
    if (protocol.steps[i].food === "B") {
      return i;
    }
  }
  return protocol.steps.length;
}


// ============================================
// PROTOCOL MODIFICATION FUNCTIONS
// ============================================

/**
 * Handle user change to a step's target protein (mg).
 *
 * Updates dependent fields:
 * - DIRECT: recompute dailyAmount = targetMg / mgPerUnit
 * - DILUTE: recompute servings and mixWaterAmount to preserve dailyAmount and mixFoodAmount
 *
 * Triggers UI and warnings re-render.
 *
 * @param stepIndex 1-based index of the step to update
 * @param newTargetMg New target protein (mg)
 * @returns void
 */
function updateStepTargetMg(stepIndex: number, newTargetMg: any): void {
  // newTargetMg has to be any since it accepts update from UI user input
  // Though it really should only be a number
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step) return;

  try {
    step.targetMg = new Decimal(newTargetMg);
  }
  catch (error) {
    console.error("Invalid number format for targetMg:", newTargetMg);
    return
  }

  // Determine which food
  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

  if (step.method === Method.DIRECT) {
    // Recalculate dailyAmount
    step.dailyAmount = step.targetMg.dividedBy(food.getMgPerUnit());
  } else {
    // DILUTE - keep mixFoodAmount and dailyAmount, recalculate servings and water
    const totalMixProtein = step.mixFoodAmount!.times(food.getMgPerUnit());
    step.servings = totalMixProtein.dividedBy(step.targetMg);

    if (food.type === FoodType.SOLID) {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume;
    } else {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
    }
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Handle user change to a step's daily amount (g/ml).
 *
 * Updates dependent fields:
 * - DIRECT: recompute targetMg = dailyAmount × mgPerUnit
 * - DILUTE: recompute servings and mixWaterAmount to preserve targetMg and mixFoodAmount
 *
 * Triggers UI and warnings re-render.
 *
 * @param stepIndex 1-based index of the step to update
 * @param newDailyAmount New amount (g or ml), number-like
 * @returns void
 */
function updateStepDailyAmount(stepIndex: number, newDailyAmount: any): void {
  // new daily amount should be any since it accepts value from UI in event handler
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step) return;

  step.dailyAmount = new Decimal(newDailyAmount);

  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

  if (step.method === Method.DIRECT) {
    // Recalculate target protein
    step.targetMg = step.dailyAmount.times(food.getMgPerUnit());
  } else {
    // DILUTE - keep mixFoodAmount fixed, recalculate water
    const totalMixProtein = step.mixFoodAmount!.times(food.getMgPerUnit());
    step.servings = totalMixProtein.dividedBy(step.targetMg);

    if (food.type === FoodType.SOLID) {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume;
    } else {
      const mixTotalVolume = step.dailyAmount.times(step.servings);
      step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
    }
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Handle user change to a dilution step's mix food amount.
 *
 * Updates dependent fields (servings and mixWaterAmount) while preserving targetMg and dailyAmount.
 *
 * Triggers UI and warnings re-render.
 *
 * @param stepIndex 1-based index of the dilution step
 * @param newMixFoodAmount New amount of food to include in mix (g or ml), number-like
 * @returns void
 */
function updateStepMixFoodAmount(
  // newMixFoodAmount must be any since it accepts user input from UI
  stepIndex: number,
  newMixFoodAmount: any,
): void {
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step || step.method !== Method.DILUTE) return;

  step.mixFoodAmount = new Decimal(newMixFoodAmount);

  const isStepFoodB = step.food === "B";
  const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

  // Recalculate water to keep P and dailyAmount unchanged
  const totalMixProtein = step.mixFoodAmount.times(food.getMgPerUnit());
  step.servings = totalMixProtein.dividedBy(step.targetMg);

  if (food.type === FoodType.SOLID) {
    const mixTotalVolume = step.dailyAmount.times(step.servings);
    step.mixWaterAmount = mixTotalVolume;
  } else {
    const mixTotalVolume = step.dailyAmount.times(step.servings);
    step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount);
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Duplicate a step and insert it immediately after the original.
 *
 * Copies all step fields; for DILUTE steps also copies mix amounts and servings. Reindexes all subsequent steps. Triggers UI update.
 *
 * @param stepIndex 1-based index after which to insert the new step
 * @returns void
 */
function addStepAfter(stepIndex: number): void {
  if (!currentProtocol) return;

  const step = currentProtocol.steps[stepIndex - 1];
  if (!step) return;

  // Duplicate the step
  const newStep: Step = {
    stepIndex: step.stepIndex + 1,
    targetMg: step.targetMg,
    method: step.method,
    dailyAmount: step.dailyAmount,
    dailyAmountUnit: step.dailyAmountUnit,
    food: step.food,
  };

  if (step.method === Method.DILUTE) {
    newStep.mixFoodAmount = step.mixFoodAmount;
    newStep.mixWaterAmount = step.mixWaterAmount;
    newStep.servings = step.servings;
  }

  currentProtocol.steps.splice(stepIndex, 0, newStep);

  // Reindex
  for (let i = 0; i < currentProtocol.steps.length; i++) {
    currentProtocol.steps[i].stepIndex = i + 1;
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Remove a step from the protocol and reindex the remaining steps.
 *
 * Does nothing if there is only one step. Triggers UI update.
 *
 * @param stepIndex 1-based index of the step to remove
 * @returns void
 */
function removeStep(stepIndex: number): void {
  if (!currentProtocol) return;
  if (currentProtocol.steps.length <= 1) return;

  currentProtocol.steps.splice(stepIndex - 1, 1);

  // Reindex
  for (let i = 0; i < currentProtocol.steps.length; i++) {
    currentProtocol.steps[i].stepIndex = i + 1;
  }

  renderProtocolTable();
  updateWarnings();
}

/**
 * Toggle the form (SOLID ⇄ LIQUID) for Food A or Food B, updating all steps.
 *
 * For DILUTE steps:
 * - ensures dailyAmountUnit is "ml"
 * - recomputes mixWaterAmount based on the new volume model
 *
 * For DIRECT steps:
 * - adjusts dailyAmountUnit to "g" (SOLID) or "ml" (LIQUID)
 *
 * Triggers re-render of settings, table, and warnings.
 *
 * @param isFoodB When true, toggles Food B; otherwise toggles Food A
 * @returns void
 */
function toggleFoodType(isFoodB: boolean): void {
  if (!currentProtocol) return;

  const food = isFoodB ? currentProtocol.foodB! : currentProtocol.foodA;
  food.type = food.type === FoodType.SOLID ? FoodType.LIQUID : FoodType.SOLID;

  // Convert all relevant steps
  for (const step of currentProtocol.steps) {
    const stepIsFoodB = step.food === "B";
    if (stepIsFoodB !== isFoodB) continue;
    if (step.method === Method.DILUTE) {
      // Convert mixFoodAmount assuming 1g ≈ 1ml (value stays the same)
      // Ensure dailyAmountUnit is always "ml" for dilutions
      step.dailyAmountUnit = "ml";

      // Recalculate servings and water based on new food type
      const totalMixProtein = step.mixFoodAmount!.times(food.getMgPerUnit());
      step.servings = totalMixProtein.dividedBy(step.targetMg);

      if (food.type === FoodType.SOLID) {
        // Switched to solid (was liquid)
        // For solid: water = total volume (solid volume negligible)
        const mixTotalVolume = step.dailyAmount.times(step.servings);
        step.mixWaterAmount = mixTotalVolume;
      } else {
        // Switched to liquid (was solid)
        // For liquid: water = total - food

        const mixTotalVolume = step.dailyAmount.times(step.servings);
        step.mixWaterAmount = mixTotalVolume.minus(step.mixFoodAmount!);
      }
    } else {
      // DIRECT - just update unit
      step.dailyAmountUnit = food.type === FoodType.SOLID ? "g" : "ml";
    }
  }

  renderFoodSettings();
  renderProtocolTable();
  updateWarnings();
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

/**
 * Make protocol-dependent UI elements visible after initialization.
 * These include the dosing strategy container and the warnings container.
 */
function showProtocolUI(): void {
  const dosingContainer = document.querySelector(
    ".dosing-strategy-container",
  ) as HTMLElement;
  const warningsContainer = document.querySelector(
    ".warnings-container",
  ) as HTMLElement;

  if (dosingContainer) {
    dosingContainer.classList.remove("oit-hidden-on-init");
  }
  if (warningsContainer) {
    warningsContainer.classList.remove("oit-hidden-on-init");
  }
}

/**
 * Render Food A and (optionally) Food B settings panels into the DOM.
 *
 * Uses currentProtocol to populate controls and attaches event listeners.
 * Safe to call repeatedly; replaces existing settings blocks in-place.
 *
 * @returns void
 */
function renderFoodSettings(): void {
  if (!currentProtocol) return;

  const foodAContainer = document.querySelector(
    ".food-a-container",
  ) as HTMLElement;
  const foodBContainer = document.querySelector(
    ".food-b-container",
  ) as HTMLElement;

  // Render Food A settings
  let foodAHTML = `
    <div class="food-a-settings">
      <input
        type="text"
        class="food-name-input"
        id="food-a-name"
        value="${escapeHtml(currentProtocol.foodA.name)}"
      />
      <div class="setting-row">
        <label>Protein:</label>
      <div class="input-unit-group">
        <input
          type="number"
          min="0"
          max="${currentProtocol.foodA.servingSize}"
          id="food-a-protein"
          value="${currentProtocol.foodA.gramsInServing.toFixed(1)}"
          step="0.1"
        />
        <span>g per</span>
        <input
          type="number"
          min="0"
          id="food-a-serving-size"
          value="${currentProtocol.foodA.servingSize.toFixed(1)}"
          step="0.1"
        />
        <span>${currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml"}</span>
      </div>
      </div>
      <div class="setting-row">
        <label>Form:</label>
        <div class="toggle-group">
          <button class="toggle-btn ${currentProtocol.foodA.type === FoodType.SOLID ? "active" : ""}" data-action="toggle-food-a-solid">Solid</button>
          <button class="toggle-btn ${currentProtocol.foodA.type === FoodType.LIQUID ? "active" : ""}" data-action="toggle-food-a-liquid">Liquid</button>
        </div>
      </div>
      <div class="setting-row">
        <label>Dilution strategy:</label>
        <div class="toggle-group">
          <button class="toggle-btn ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL ? "active" : ""}" data-action="food-a-strategy-initial">Initial dilution</button>
          <button class="toggle-btn ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_ALL ? "active" : ""}" data-action="food-a-strategy-all">Dilution throughout</button>
          <button class="toggle-btn ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_NONE ? "active" : ""}" data-action="food-a-strategy-none">No dilutions</button>
        </div>
      </div>
      ${currentProtocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL
      ? `
      <div class="setting-row threshold-setting">
        <label>Directly dose when neat amount ≥</label>
        <div class="input-unit-group">
          <input
            type="number"
            id="food-a-threshold"
            min="0"
            value="${formatAmount(currentProtocol.diThreshold, currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml")}"
            step="0.1"
          />
          <span>${currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml"}</span>
        </div>
      </div>
      `
      : ""
    }
    </div>
  `;

  const existingSettings = foodAContainer.querySelector(".food-a-settings");
  if (existingSettings) {
    existingSettings.outerHTML = foodAHTML;
  } else {
    foodAContainer.insertAdjacentHTML("beforeend", foodAHTML);
  }

  // Render Food B settings if present
  if (currentProtocol.foodB) {
    let foodBHTML = `
      <div class="food-b-settings">
        <input
          type="text"
          class="food-name-input"
          id="food-b-name"
          value="${escapeHtml(currentProtocol.foodB.name)}"
        />
        <div class="setting-row">
          <label>Protein:</label>
          <div class="input-unit-group">
            <input
              type="number"
              id="food-b-protein"
              min="0"
              max="${currentProtocol.foodB.servingSize}"
              value="${currentProtocol.foodB.gramsInServing.toFixed(1)}"
              step="0.1"
            />
            <span>g per</span>
            <input
              type="number"
              id="food-b-serving-size"
              min="0"
              value="${currentProtocol.foodB.servingSize.toFixed(1)}"
              step="0.1"
            />
            <span>${currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml"}</span>
          </div>
        </div>
        <div class="setting-row">
          <label>Form:</label>
          <div class="toggle-group">
            <button class="toggle-btn ${currentProtocol.foodB.type === FoodType.SOLID ? "active" : ""}" data-action="toggle-food-b-solid">Solid</button>
            <button class="toggle-btn ${currentProtocol.foodB.type === FoodType.LIQUID ? "active" : ""}" data-action="toggle-food-b-liquid">Liquid</button>
          </div>
        </div>
        <div class="setting-row threshold-setting">
          <label>Transition when daily amount ≥</label>
          <div class="input-unit-group">
            <input
              type="number"
              id="food-b-threshold"
              value="${formatAmount(currentProtocol.foodBThreshold!.amount, currentProtocol.foodBThreshold!.unit)}"
              step="0.1"
              min="0"
            />
            <span>${currentProtocol.foodBThreshold!.unit}</span>
          </div>
        </div>
      </div>
    `;

    const existingBSettings = foodBContainer.querySelector(".food-b-settings");
    if (existingBSettings) {
      existingBSettings.outerHTML = foodBHTML;
    } else {
      foodBContainer.insertAdjacentHTML("beforeend", foodBHTML);
    }
  } else {
    const existingBSettings = foodBContainer.querySelector(".food-b-settings");
    if (existingBSettings) {
      existingBSettings.remove();
    }
  }

  attachSettingsEventListeners();
}

/**
 * Render dosing strategy buttons and wire up click handlers.
 *
 * Re-renders when strategy changes (which triggers recomputation of protocol).
 *
 * @returns void
 */
function renderDosingStrategy(): void {
  if (!currentProtocol) return;

  const container = document.querySelector(
    ".dosing-strategy-container",
  ) as HTMLElement;

  const html = `
    <h3>Dosing Strategy (resets all steps on change)</h3>
    <div class="setting-row">
      <div class="toggle-group">
        <button class="toggle-btn ${currentProtocol.dosingStrategy === DosingStrategy.STANDARD ? "active" : ""}" data-strategy="STANDARD">Standard</button>
        <button class="toggle-btn ${currentProtocol.dosingStrategy === DosingStrategy.SLOW ? "active" : ""}" data-strategy="SLOW">Slow</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Attach event listeners
  container.querySelectorAll("[data-strategy]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const strategy = (e.target as HTMLElement).getAttribute(
        "data-strategy",
      ) as DosingStrategy;
      if (currentProtocol && strategy !== currentProtocol.dosingStrategy) {
        currentProtocol.dosingStrategy = strategy;
        currentProtocol = recalculateProtocol(currentProtocol);
        renderProtocolTable();
        updateWarnings();
        renderDosingStrategy();
      }
    });
  });
}

/**
 * Render the protocol table (steps) and auxiliary UI (export, notes).
 *
 * Highlights rows with warnings, groups by Food A/B, and attaches handlers for inline editing and step add/remove controls.
 *
 * @returns void
 */
function renderProtocolTable(): void {
  if (!currentProtocol) return;

  const tableContainer = document.querySelector(
    ".output-container table",
  ) as HTMLElement;

  let html = `
    <thead>
      <tr>
        <th>Step</th>
        <th>Protein (mg)</th>
        <th>Method</th>
        <th>Amount for mixture</th>
        <th>Water for mixture</th>
        <th>Daily amount</th>
      </tr>
    </thead>
    <tbody>
  `;

  let lastWasFootA = true;

  // Get warnings to check for step highlights
  const warnings: Warning[] = validateProtocol(currentProtocol);
  const stepWarnings = new Map<number, "red" | "yellow">();
  for (const warning of warnings) {
    if (warning.stepIndex !== undefined) {
      const existing = stepWarnings.get(warning.stepIndex);
      // Red takes precedence over yellow
      if (!existing || (warning.severity === "red" && existing === "yellow")) {
        stepWarnings.set(warning.stepIndex, warning.severity);
      }
    }
  }

  for (const step of currentProtocol.steps) {
    const isStepFoodB = step.food === "B";
    const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

    // Add food header if transitioning
    if (isStepFoodB && lastWasFootA) {
      html += `
        <tr class="food-section-header">
          <td colspan="6">${escapeHtml(currentProtocol.foodB!.name)}</td>
        </tr>
      `;
      lastWasFootA = false;
    } else if (!isStepFoodB && step.stepIndex === 1) {
      html += `
        <tr class="food-section-header">
          <td colspan="6">${escapeHtml(currentProtocol.foodA.name)}</td>
        </tr>
      `;
    }

    // Add warning class if this step has warnings
    const warningClass = stepWarnings.get(step.stepIndex);
    const rowClass = warningClass ? `warning-highlight-${warningClass}` : "";
    html += `<tr class="${rowClass}">`;

    // Actions + Step number
    html += `
      <td>
        <div class="actions-cell">
          <button class="btn-add-step" data-step="${step.stepIndex}">+</button>
          <button class="btn-remove-step" data-step="${step.stepIndex}">−</button>
          <span class="step-number">${step.stepIndex}</span>
        </div>
      </td>
    `;

    // Protein (editable)
    html += `
      <td>
        <input
          class="editable"
          type="number"
          data-step="${step.stepIndex}"
          data-field="targetMg"
          value="${formatNumber(step.targetMg, 1)}"
          step="0.1"
          min="0"
        />
      </td>
    `;

    // Method
    html += `
      <td class="method-cell">${step.method}</td>
    `;

    // Amount for mixture (editable for dilutions)
    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
      html += `
        <td>
          <input
            class="editable"
            type="number"
            data-step="${step.stepIndex}"
            data-field="mixFoodAmount"
            min="0"
            value="${formatAmount(step.mixFoodAmount!, mixUnit)}"
            step="0.01"
          />
          <span> ${mixUnit}</span>
        </td>
      `;
    } else {
      html += `<td class="na-cell">n/a</td>`;
    }

    // Water for mixture (non-editable, auto-calculated)
    if (step.method === Method.DILUTE) {
      html += `
        <td class="non-editable">
          ${formatAmount(step.mixWaterAmount!, "ml")} ml
          <span style="color: var(--oit-text-secondary); font-size: 0.85rem;"> (${formatNumber(step.servings!, 1)} servings)</span>
        </td>
      `;
    } else {
      html += `<td class="na-cell">n/a</td>`;
    }

    // Daily amount (editable)
    html += `
      <td>
        <input
          class="editable"
          type="number"
          data-step="${step.stepIndex}"
          data-field="dailyAmount"
          value="${formatAmount(step.dailyAmount, step.dailyAmountUnit)}"
          step="0.1"
          min="0"
        />
        <span> ${step.dailyAmountUnit}</span>
      </td>
    `;

    html += `</tr>`;
  }

  html += `</tbody>`;

  tableContainer.innerHTML = html;

  // Add export buttons to bottom section
  const bottomSection = document.querySelector(
    ".bottom-section",
  ) as HTMLElement;
  let exportContainer = bottomSection.querySelector(".export-container");
  if (!exportContainer) {
    const exportHTML = `
      <div class="export-container">
        <div class="export-buttons">
          <button class="btn-export" id="export-ascii">Copy ASCII</button>
          <button class="btn-export" id="export-pdf">Export PDF</button>
        </div>
        <div class="custom-note-container">
          <label for="custom-note">Notes:</label>
          <textarea
            id="custom-note"
            class="custom-note-textarea"
            placeholder="Add any custom notes or instructions ..."
            rows="8"
          >${escapeHtml(customNote)}</textarea>
        </div>
      </div>
    `;
    bottomSection.insertAdjacentHTML("afterbegin", exportHTML);
    attachExportEventListeners();
    attachCustomNoteListener();
  }

  attachTableEventListeners();
}

// TODO! ? group step warnings together? so it's not just Step 1 ... Step 1 ... Step 1 if step 1 has ++ warnings
/**
 * Recompute and render the warnings sidebar for the current protocol.
 *
 * Groups warnings by severity and prints human-readable messages.
 *
 * @returns void
 */
function updateWarnings(): void {
  if (!currentProtocol) return;

  const warnings = validateProtocol(currentProtocol);
  const container = document.querySelector(
    ".warnings-container",
  ) as HTMLElement;

  if (warnings.length === 0) {
    container.innerHTML = `
      <div class="no-warnings">
      ✓ Protocol passes internal checks: see <a href="${warningsPageURL}" target="_blank">here</a> for the issues we check for.<br><br>THIS DOES NOT GUARANTEE THE PROTOCOL IS SAFE. DOSES MUST STILL BE VERIFIED/REVIEWED.
      </div>
    `;
    return;
  }

  const redWarnings = warnings.filter((w) => w.severity === "red");
  const yellowWarnings = warnings.filter((w) => w.severity === "yellow");

  let html = "";

  if (redWarnings.length > 0) {
    html += `
      <div class="warning-section red-warnings">
        <h4>Critical Issues (Red)</h4>
        <ul>
          ${redWarnings.map((w) => `<li><strong>${w.message}</strong></li>`).join("")}
        </ul>
      </div>
    `;
  }

  if (yellowWarnings.length > 0) {
    html += `
      <div class="warning-section yellow-warnings">
        <h4>Cautions (Yellow)</h4>
        <ul>
          ${yellowWarnings.map((w) => `<li>${w.message}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  container.innerHTML = html;
}

// ============================================
// SEARCH FUNCTIONS
// ============================================

/**
 * Run fuzzy search against foods and/or protocol templates.
 *
 * For searchType "food": returns foods only (used for Food B search).
 * For searchType "protocol": returns protocols first, then foods (Food A search).
 *
 * @param query User-entered search string
 * @param searchType "food" to search foods only; "protocol" to search protocols+foods
 * @returns Array of fuzzysort results (protocols may appear before foods)
 */
function performSearch(query: string, searchType: "food" | "protocol"): any[] {
  if (!query.trim()) return [];

  if (searchType === "food") {
    // Search foods only (for Food B)
    const results = fuzzysort.go(query, fuzzySortPreparedFoods, {
      key: "prepared", // make use of the prepared property generated by fuzzysort.prepare(string)
      limit: 50,
      threshold: -10000,
    });
    return [...results];
  } else {
    // Search both foods and protocols for Food A
    const foodResults = fuzzysort.go(query, fuzzySortPreparedFoods, {
      key: "prepared",
      limit: 25,
      threshold: -10000,
    });

    const protocolResults = fuzzysort.go(query, fuzzySortPreparedProtocols, {
      key: "prepared",
      limit: 25,
      threshold: -10000,
    });

    // Combine results
    return [...protocolResults, ...foodResults];
  }
}

/**
 * Render the autocomplete dropdown below a search input.
 *
 * Always includes a "Custom" item (index 0) to create user-defined foods.
 * Clicking an item selects Food A, Food B, or a protocol template depending on the input element.
 *
 * @param inputId Element id of the associated input
 * @param results Fuzzysort results array to display
 * @param query Current input string (used for the Custom option)
 * @returns void
 */
function showSearchDropdown(
  inputId: string,
  results: any[],
  query: string,
): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const container = input.parentElement!;

  // Remove existing dropdown
  const existingDropdown = container.querySelector(".search-dropdown");
  if (existingDropdown) {
    existingDropdown.remove();
  }

  if (results.length === 0 && !query.trim()) return;

  const dropdown = document.createElement("div");
  dropdown.className = "search-dropdown";

  // Reset dropdown navigation state
  currentDropdownIndex = -1;
  currentDropdownInputId = inputId;

  // Always add custom option first
  const customItem = document.createElement("div");
  customItem.className = "search-result-item";
  customItem.setAttribute("data-index", "0");
  customItem.innerHTML = `<strong>Custom:</strong> ${escapeHtml(query || "New food")}`;
  customItem.addEventListener("click", () => {
    selectCustomFood(query || "New Food", inputId);
    hideSearchDropdown(inputId);
  });
  dropdown.appendChild(customItem);

  // Add search results
  const displayResults = results.slice(0, 50);
  for (let i = 0; i < displayResults.length; i++) {
    const result = displayResults[i];
    const item = document.createElement("div");
    item.className = "search-result-item";
    item.setAttribute("data-index", String(i + 1));

    if (result.obj.name) {
      // Protocol result
      item.innerHTML = `<strong>Protocol:</strong> ${escapeHtml(result.obj.name)}`;
      item.addEventListener("click", () => {
        selectProtocol(result.obj);
        hideSearchDropdown(inputId);
      });
    } else {
      // Food result
      const foodData: FoodData = result.obj; // foodData here is the object from fuzzySortPreparedFoods 

      item.innerHTML = `
        ${escapeHtml(foodData.Food)}
        <span class="food-type"> - ${escapeHtml(foodData.Type)} - Protein: ${foodData["Mean protein in grams"].toFixed(1)} g/${foodData["Serving size"]} ${foodData.Type === "Solid" ? "g" : "ml"}</span>
      `;
      item.addEventListener("click", () => {
        if (inputId === "food-a-search") {
          selectFoodA(foodData);
        } else {
          selectFoodB(foodData);
        }
        hideSearchDropdown(inputId);
      });
    }

    dropdown.appendChild(item);
  }

  container.appendChild(dropdown);
}

/**
 * Remove and reset the autocomplete dropdown for a given input.
 *
 * @param inputId Element id of the associated input
 * @returns void
 */
function hideSearchDropdown(inputId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const container = input.parentElement!;
  const dropdown = container.querySelector(".search-dropdown");
  if (dropdown) {
    dropdown.remove();
  }
  currentDropdownIndex = -1;
  currentDropdownInputId = "";
}

/**
 * Keyboard navigation for the autocomplete dropdown.
 *
 * Wraps around at ends and ensures the highlighted item is visible.
 *
 * @param direction "up" or "down"
 * @returns void
 */
function navigateDropdown(direction: "up" | "down"): void {
  if (!currentDropdownInputId) return;

  const input = document.getElementById(
    currentDropdownInputId,
  ) as HTMLInputElement;
  if (!input) return;

  const container = input.parentElement!;
  const dropdown = container.querySelector(".search-dropdown");
  if (!dropdown) return;

  const items = Array.from(dropdown.querySelectorAll(".search-result-item"));
  if (items.length === 0) return;

  // Remove current highlight
  if (currentDropdownIndex >= 0 && currentDropdownIndex < items.length) {
    items[currentDropdownIndex].classList.remove("highlighted");
  }

  // Update index
  if (direction === "down") {
    currentDropdownIndex = (currentDropdownIndex + 1) % items.length;
  } else {
    currentDropdownIndex =
      currentDropdownIndex <= 0 ? items.length - 1 : currentDropdownIndex - 1;
  }

  // Add new highlight
  items[currentDropdownIndex].classList.add("highlighted");

  // Scroll into view
  items[currentDropdownIndex].scrollIntoView({
    block: "nearest",
    behavior: "smooth",
  });
}

/**
 * Programmatically "click" the currently highlighted autocomplete item.
 *
 * No-op if nothing is highlighted or the dropdown is missing.
 *
 * @returns void
 */
function selectHighlightedDropdownItem(): void {
  if (!currentDropdownInputId || currentDropdownIndex < 0) return;

  const input = document.getElementById(
    currentDropdownInputId,
  ) as HTMLInputElement;
  if (!input) return;

  const container = input.parentElement!;
  const dropdown = container.querySelector(".search-dropdown");
  if (!dropdown) return;

  const items = Array.from(dropdown.querySelectorAll(".search-result-item"));
  if (currentDropdownIndex < items.length) {
    (items[currentDropdownIndex] as HTMLElement).click();
  }
}

// ============================================
// FOOD SELECTION FUNCTIONS
// ============================================

/**
 * Select Food A from database entry and initialize a default protocol.
 *
 * Triggers rendering of settings, dosing strategy, table, and warnings.
 *
 * @param foodData Entry from the foods database
 * @returns void
 */
function selectFoodA(foodData: FoodData): void {
  const food: Food = {
    name: foodData.Food,
    type: foodData.Type === "Solid" ? FoodType.SOLID : FoodType.LIQUID,
    gramsInServing: new Decimal(foodData["Mean protein in grams"]),
    servingSize: new Decimal(foodData["Serving size"]),
    getMgPerUnit: function() {
      return this.gramsInServing.times(1000).dividedBy(this.servingSize);
    },
  };

  currentProtocol = generateDefaultProtocol(food, DEFAULT_CONFIG);

  showProtocolUI();
  renderFoodSettings();
  renderDosingStrategy();
  renderProtocolTable();
  updateWarnings();
  updateFoodBDisabledState();

  (document.getElementById("food-a-search") as HTMLInputElement).value = "";
}

/**
 * Select Food B from database entry and compute transition steps.
 *
 * Applies DEFAULT_FOOD_B_THRESHOLD as the initial transition threshold.
 * Triggers rendering and warnings update.
 *
 * @param foodData Entry from the foods database
 * @returns void
 */
function selectFoodB(foodData: FoodData): void {
  if (!currentProtocol) return;

  const food: Food = {
    name: foodData.Food,
    type: foodData.Type === "Solid" ? FoodType.SOLID : FoodType.LIQUID,
    gramsInServing: new Decimal(foodData["Mean protein in grams"]),
    servingSize: new Decimal(foodData["Serving size"]),
    getMgPerUnit: function() {
      return this.gramsInServing.times(1000).dividedBy(this.servingSize);
    },
  };

  const threshold = {
    unit: food.type === FoodType.SOLID ? ("g" as Unit) : ("ml" as Unit),
    amount: DEFAULT_CONFIG.DEFAULT_FOOD_B_THRESHOLD,
  };

  currentProtocol = addFoodBToProtocol(currentProtocol, food, threshold);

  renderFoodSettings();
  renderProtocolTable();
  updateWarnings();

  (document.getElementById("food-b-search") as HTMLInputElement).value = "";
}

/**
 * Create and select a custom food for Food A or Food B.
 *
 * Defaults to SOLID with 10 g protein per 100 g (100 mg/g) until edited.
 * For Food A, initializes a new protocol; for Food B, attaches to current protocol.
 *
 * @param name Display name for the custom food
 * @param inputId Source input id ("food-a-search" or "food-b-search")
 * @returns void
 */
function selectCustomFood(name: string, inputId: string): void {
  const food: Food = {
    name: name || "Custom Food",
    type: FoodType.SOLID,
    gramsInServing: new Decimal(10),
    servingSize: new Decimal(100),
    getMgPerUnit: function() {
      return this.gramsInServing.times(1000).dividedBy(this.servingSize);
    },
  };

  if (inputId === "food-a-search") {
    currentProtocol = generateDefaultProtocol(food, DEFAULT_CONFIG);
    showProtocolUI();
    renderFoodSettings();
    renderDosingStrategy();
    renderProtocolTable();
    updateWarnings();
    updateFoodBDisabledState();
  } else {
    if (!currentProtocol) return;
    const threshold = {
      unit: "g" as Unit,
      amount: DEFAULT_CONFIG.DEFAULT_FOOD_B_THRESHOLD,
    };
    currentProtocol = addFoodBToProtocol(currentProtocol, food, threshold);
    renderFoodSettings();
    renderProtocolTable();
    updateWarnings();
  }

  (document.getElementById(inputId) as HTMLInputElement).value = "";
}

/**
 * Load a protocol template from JSON metadata.
 *
 * Populates Food A, strategy, thresholds, and the appropriate step table (table_di, table_dn, or table_da). Also loads Food B and its threshold if present. Computes servings for any dilution steps.
 *
 * Triggers full UI refresh and updates Food B disabled state.
 *
 * @param protocolData Protocol template record
 * @returns void
 */
function selectProtocol(protocolData: ProtocolData): void {
  // Load protocol from JSON. All numbers should be represented as strings
  const foodA: Food = {
    name: protocolData.food_a.name,
    type:
      protocolData.food_a.type === "SOLID" ? FoodType.SOLID : FoodType.LIQUID,
    gramsInServing: new Decimal(protocolData.food_a.gramsInServing),
    servingSize: new Decimal(protocolData.food_a.servingSize),
    getMgPerUnit: function() {
      return this.gramsInServing.times(1000).dividedBy(this.servingSize);
    },
  };

  const protocol: Protocol = {
    dosingStrategy:
      DosingStrategy[
      protocolData.dosing_strategy as keyof typeof DosingStrategy
      ],
    foodA,
    foodAStrategy:
      FoodAStrategy[protocolData.food_a_strategy as keyof typeof FoodAStrategy],
    diThreshold: new Decimal(protocolData.di_threshold),
    steps: [],
    config: DEFAULT_CONFIG,
  };

  // Load custom note if it exists in global
  if (protocolData.custom_note) {
    customNote = protocolData.custom_note;
  }

  // load steps from the relevant table (table_di, table_dn, or table_da
  let tableToLoad: any[] = [];
  if (protocol.foodAStrategy === FoodAStrategy.DILUTE_INITIAL) {
    tableToLoad = protocolData.table_di;
  } else if (protocol.foodAStrategy === FoodAStrategy.DILUTE_NONE) {
    tableToLoad = protocolData.table_dn;
  } else if (protocol.foodAStrategy === FoodAStrategy.DILUTE_ALL) {
    tableToLoad = protocolData.table_da;
  }

  // Load steps from relevant table
  for (let i = 0; i < tableToLoad.length; i++) {
    const row = tableToLoad[i];
    const step: Step = {
      stepIndex: i + 1,
      targetMg: new Decimal(row.protein),
      method: row.method === "DILUTE" ? Method.DILUTE : Method.DIRECT,
      dailyAmount: new Decimal(row.daily_amount),
      dailyAmountUnit:
        row.method === "DILUTE"
          ? "ml"
          : row.food === foodA.name
            ? foodA.type === FoodType.SOLID
              ? "g"
              : "ml"
            : "g",
      food: row.food === foodA.name ? "A" : "B",
    };

    if (row.method === "DILUTE") {
      step.mixFoodAmount = new Decimal(row.mix_amount);
      step.mixWaterAmount = new Decimal(row.water_amount);
      // Calculate servings
      const food = row.food === foodA.name ? foodA : protocol.foodB!;
      const totalMixProtein = step.mixFoodAmount.times(food.getMgPerUnit());
      step.servings = totalMixProtein.dividedBy(step.targetMg);
    }

    protocol.steps.push(step);
  }

  // Load Food B if present
  if (protocolData.food_b) {
    protocol.foodB = {
      name: protocolData.food_b.name,
      type:
        protocolData.food_b.type === "SOLID" ? FoodType.SOLID : FoodType.LIQUID,
      gramsInServing: new Decimal(protocolData.food_b.gramsInServing),
      servingSize: new Decimal(protocolData.food_b.servingSize),
      getMgPerUnit: function() {
        return this.gramsInServing.times(1000).dividedBy(this.servingSize);
      },
    };

    if (protocolData.food_b_threshold) {
      protocol.foodBThreshold = {
        unit: protocol.foodB.type === FoodType.SOLID ? "g" : "ml",
        amount: new Decimal(protocolData.food_b_threshold),
      };
    }
  }

  currentProtocol = protocol;

  showProtocolUI();
  renderFoodSettings();
  renderDosingStrategy();
  renderProtocolTable();
  updateWarnings();
  updateFoodBDisabledState();

  (document.getElementById("food-a-search") as HTMLInputElement).value = "";
}

/**
 * Remove Food B and its transition from the current protocol.
 *
 * Recomputes the protocol as Food A only and refreshes UI.
 *
 * @returns void
 */
function clearFoodB(): void {
  if (!currentProtocol) return;

  // Remove Food B and recalculate
  currentProtocol.foodB = undefined;
  currentProtocol.foodBThreshold = undefined;

  // Regenerate steps without Food B
  currentProtocol = recalculateProtocol(currentProtocol);

  renderFoodSettings();
  renderProtocolTable();
  updateWarnings();
}

/**
 * Enable/disable the Food B UI section depending on Food A availability.
 *
 * Also clears and disables inputs when Food A is not set.
 *
 * @returns void
 */
function updateFoodBDisabledState(): void {
  const foodBContainer = document.querySelector(
    ".food-b-container",
  ) as HTMLElement;
  if (!foodBContainer) return;

  const hasFoodA = currentProtocol && currentProtocol.foodA;

  if (hasFoodA) {
    foodBContainer.classList.remove("disabled");
    const searchInput = document.getElementById(
      "food-b-search",
    ) as HTMLInputElement;
    const clearBtn = document.getElementById(
      "clear-food-b",
    ) as HTMLButtonElement;
    if (searchInput) {
      searchInput.disabled = false;
    }
    if (clearBtn) {
      clearBtn.disabled = false;
    }
  } else {
    foodBContainer.classList.add("disabled");
    const searchInput = document.getElementById(
      "food-b-search",
    ) as HTMLInputElement;
    const clearBtn = document.getElementById(
      "clear-food-b",
    ) as HTMLButtonElement;
    if (searchInput) {
      searchInput.disabled = true;
      searchInput.value = "";
    }
    if (clearBtn) {
      clearBtn.disabled = true;
    }
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Wire up event listeners for settings panel controls (Food A/B).
 *
 * Handles:
 * - name, protein concentration, and thresholds
 * - strategy toggles and type toggles
 * - recomputation and re-rendering on change
 *
 * @returns void
 */
function attachSettingsEventListeners(): void {
  // Food A name
  const foodANameInput = document.getElementById(
    "food-a-name",
  ) as HTMLInputElement;
  if (foodANameInput) {
    foodANameInput.addEventListener("input", (e) => {
      if (currentProtocol) {
        currentProtocol.foodA.name = (e.target as HTMLInputElement).value;
        renderProtocolTable();
      }
    });
  }

  // Food A protein - both grams in serving && servingSize
  // GET SERVING SIZE FIRST (because validation for protein amount depends on this being valid)
  const foodAServingSizeInput = document.getElementById(
    "food-a-serving-size",
  ) as HTMLInputElement;
  if (foodAServingSizeInput) {
    foodAServingSizeInput.addEventListener("change", (e) => {
      if (currentProtocol) {
        let value = parseFloat((e.target as HTMLInputElement).value);
        // Clamp value >0, cannot be NaN. Doesn't make sense to have a serving size of 0...
        // Serving size <= 1000, 1kg or 1L of food is crazy and not an applicable serving size
        if (value <= 0) value = 1;
        if (value > 1000) value = 1000;
        if (Number.isNaN(value)) value = 1;
        // Display
        (e.target as HTMLInputElement).value = value.toFixed(1);
        // Change protocol state
        currentProtocol.foodA.servingSize = new Decimal(value);
        currentProtocol = recalculateStepMethods(currentProtocol);
        renderProtocolTable();
        updateWarnings();
      }
    });
  }

  // GET PROTEIN IN SERVING
  const foodAProteinInput = document.getElementById(

    "food-a-protein",
  ) as HTMLInputElement;
  if (foodAProteinInput) {
    foodAProteinInput.addEventListener("change", (e) => {
      if (currentProtocol) {
        let value = parseFloat((e.target as HTMLInputElement).value);
        // Clamp value between 0 and serving size (impossible to have more grams of protein than grams of substance... lol)
        if (value < 0) value = 0;
        if (value > currentProtocol.foodA.servingSize.toNumber()) value = currentProtocol.foodA.servingSize.toNumber();
        if (Number.isNaN(value)) value = 0;
        (e.target as HTMLInputElement).value = value.toFixed(1);
        currentProtocol.foodA.gramsInServing = new Decimal(value);
        currentProtocol = recalculateStepMethods(currentProtocol);
        renderProtocolTable();
        updateWarnings();

      }
    });
  }

  // Food A threshold
  const foodAThresholdInput = document.getElementById(
    "food-a-threshold",
  ) as HTMLInputElement;
  if (foodAThresholdInput) {
    foodAThresholdInput.addEventListener("change", (e) => {
      if (currentProtocol) {
        currentProtocol.diThreshold = new Decimal(
          (e.target as HTMLInputElement).value,
        );
        currentProtocol = recalculateStepMethods(currentProtocol);
        renderProtocolTable();
        updateWarnings();

      }
    });
  }

  // Food B name
  const foodBNameInput = document.getElementById(
    "food-b-name",
  ) as HTMLInputElement;
  if (foodBNameInput) {
    foodBNameInput.addEventListener("input", (e) => {
      if (currentProtocol && currentProtocol.foodB) {
        currentProtocol.foodB.name = (e.target as HTMLInputElement).value;
        renderProtocolTable();
      }
    });
  }

  // SERVING SIZE OF FOOD B
  const foodBServingSizeInput = document.getElementById(
    "food-b-serving-size",
  ) as HTMLInputElement;
  if (foodBServingSizeInput) {
    foodBServingSizeInput.addEventListener("change", (e) => {
      if (currentProtocol && currentProtocol.foodB) {
        let value = parseFloat((e.target as HTMLInputElement).value);
        // serving size must be > 0 and < 1000 (1L or 1kg of food is CRAZY)
        if (value <= 0) value = 1;
        if (value > 1000) value = 1000;
        if (Number.isNaN(value)) value = 1;
        (e.target as HTMLInputElement).value = value.toFixed(1);
        currentProtocol.foodB.servingSize = new Decimal(value);

        // Recalculate Food B steps
        if (currentProtocol.foodBThreshold) {
          const tempFoodB = currentProtocol.foodB;
          const tempThreshold = currentProtocol.foodBThreshold;
          currentProtocol.foodB = undefined;
          currentProtocol.foodBThreshold = undefined;
          currentProtocol = recalculateProtocol(currentProtocol);

          currentProtocol = addFoodBToProtocol(currentProtocol, tempFoodB, tempThreshold);
          renderProtocolTable();
          updateWarnings();
        }
      }
    });
  }

  // Food B protein in serving 
  const foodBProteinInput = document.getElementById(
    "food-b-protein",
  ) as HTMLInputElement;
  if (foodBProteinInput) {
    foodBProteinInput.addEventListener("change", (e) => {
      if (currentProtocol && currentProtocol.foodB) {
        let value = parseFloat((e.target as HTMLInputElement).value);
        // Clamp value between 0 and serving size
        if (value < 0) value = 0;
        if (value > currentProtocol.foodB.servingSize.toNumber()) value = currentProtocol.foodB.servingSize.toNumber();
        if (Number.isNaN(value)) value = 0;
        (e.target as HTMLInputElement).value = value.toFixed(1);
        currentProtocol.foodB.gramsInServing = new Decimal(value);

        // Recalculate Food B steps
        if (currentProtocol.foodBThreshold) {
          const tempFoodB = currentProtocol.foodB;
          const tempThreshold = currentProtocol.foodBThreshold;
          currentProtocol.foodB = undefined;
          currentProtocol.foodBThreshold = undefined;
          currentProtocol = recalculateProtocol(currentProtocol);

          currentProtocol = addFoodBToProtocol(currentProtocol, tempFoodB, tempThreshold);
          renderProtocolTable();
          updateWarnings();
        }
      }
    });
  }

  // Food B threshold
  const foodBThresholdInput = document.getElementById(
    "food-b-threshold",
  ) as HTMLInputElement;
  if (foodBThresholdInput) {
    foodBThresholdInput.addEventListener("change", (e) => {
      if (
        currentProtocol &&
        currentProtocol.foodB &&
        currentProtocol.foodBThreshold
      ) {
        currentProtocol.foodBThreshold.amount = new Decimal(
          (e.target as HTMLInputElement).value,
        );

        // Recalculate transition
        const tempFoodB = currentProtocol.foodB;
        const tempThreshold = currentProtocol.foodBThreshold;
        currentProtocol.foodB = undefined;
        currentProtocol.foodBThreshold = undefined;
        currentProtocol = recalculateProtocol(currentProtocol);

        currentProtocol = addFoodBToProtocol(currentProtocol, tempFoodB, tempThreshold);
        renderProtocolTable();
        updateWarnings();
      }
    });
  }

  // Toggle buttons
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const action = (e.target as HTMLElement).getAttribute("data-action");

      if (!currentProtocol) return;

      switch (action) {
        case "toggle-food-a-solid":
          if (currentProtocol.foodA.type !== FoodType.SOLID) {
            toggleFoodType(false);
          }
          break;
        case "toggle-food-a-liquid":
          if (currentProtocol.foodA.type !== FoodType.LIQUID) {
            toggleFoodType(false);
          }
          break;
        case "toggle-food-b-solid":
          if (
            currentProtocol.foodB &&
            currentProtocol.foodB.type !== FoodType.SOLID
          ) {
            toggleFoodType(true);
          }
          break;
        case "toggle-food-b-liquid":
          if (
            currentProtocol.foodB &&
            currentProtocol.foodB.type !== FoodType.LIQUID
          ) {
            toggleFoodType(true);
          }
          break;
        case "food-a-strategy-initial":
          currentProtocol.foodAStrategy = FoodAStrategy.DILUTE_INITIAL;
          currentProtocol = recalculateStepMethods(currentProtocol);
          renderProtocolTable();
          updateWarnings();

          renderFoodSettings();
          break;
        case "food-a-strategy-all":
          currentProtocol.foodAStrategy = FoodAStrategy.DILUTE_ALL;
          currentProtocol = recalculateStepMethods(currentProtocol);
          renderProtocolTable();
          updateWarnings();

          renderFoodSettings();
          break;
        case "food-a-strategy-none":
          currentProtocol.foodAStrategy = FoodAStrategy.DILUTE_NONE;
          currentProtocol = recalculateStepMethods(currentProtocol);
          renderProtocolTable();
          updateWarnings();

          renderFoodSettings();
          break;
      }
    });
  });
}

/**
 * Attach event listeners for protocol table interactions.
 *
 * Handles:
 * - inline editing of numeric fields (blur/enter)
 * - add/remove step buttons
 *
 * @returns void
 */
function attachTableEventListeners(): void {
  // Editable inputs
  document.querySelectorAll("input.editable").forEach((input) => {
    input.addEventListener("blur", (e) => {
      const target = e.target as HTMLInputElement;
      const stepIndex = parseInt(target.getAttribute("data-step")!);
      const field = target.getAttribute("data-field")!;
      let value = parseFloat(target.value);

      if (isNaN(value)) return;

      // Clamp value to >= 0
      if (value < 0) {
        value = 0;
        target.value = value.toString();
      }

      if (field === "targetMg") {
        updateStepTargetMg(stepIndex, value);
      } else if (field === "dailyAmount") {
        updateStepDailyAmount(stepIndex, value);
      } else if (field === "mixFoodAmount") {
        updateStepMixFoodAmount(stepIndex, value);
      }
    });

    input.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    });
  });

  // Add step buttons
  document.querySelectorAll(".btn-add-step").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const stepIndex = parseInt(
        (e.target as HTMLElement).getAttribute("data-step")!,
      );
      addStepAfter(stepIndex);
    });
  });

  // Remove step buttons
  document.querySelectorAll(".btn-remove-step").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const stepIndex = parseInt(
        (e.target as HTMLElement).getAttribute("data-step")!,
      );
      removeStep(stepIndex);
    });
  });
}

/**
 * Wire up export buttons (ASCII and PDF).
 *
 * @returns void
 */
function attachExportEventListeners(): void {
  const asciiBtn = document.getElementById("export-ascii");
  if (asciiBtn) {
    asciiBtn.addEventListener("click", exportASCII);
  }

  const pdfBtn = document.getElementById("export-pdf");
  if (pdfBtn) {
    pdfBtn.addEventListener("click", handleExportPdfClick);
  }
}

/**
 * Handles the primary "Export PDF" button click, checking for clickwrap agreement.
 */
async function handleExportPdfClick(): Promise<void> {
  if (isClickwrapAccepted()) {
    await triggerPdfGeneration();
  } else {
    showClickwrapModal();
  }
}

/**
 * Loads PDF libraries and triggers the PDF generation.
 */
async function triggerPdfGeneration(): Promise<void> {
  const pdfBtn = document.getElementById("export-pdf");
  const modalPdfBtn = document.getElementById("clickwrap-generate-btn");

  if (pdfBtn) {
    pdfBtn.textContent = "Generating...";
    pdfBtn.setAttribute("disabled", "true");
  }
  if (modalPdfBtn) {
    modalPdfBtn.textContent = "Generating...";
    modalPdfBtn.setAttribute("disabled", "true");
  }

  try {
    const { jsPDF } = await import('jspdf');
    const { PDFDocument } = await import('pdf-lib');
    const { applyPlugin } = await import('jspdf-autotable');
    applyPlugin(jsPDF);

    await _generatePdf(jsPDF, PDFDocument);
  } catch (error) {
    console.error("Failed to load PDF libraries or generate PDF: ", error);
    alert("Error generating PDF. Please check the console for details.");
  } finally {
    if (pdfBtn) {
      pdfBtn.textContent = "Export PDF";
      pdfBtn.removeAttribute("disabled");
    }
    if (modalPdfBtn) {
      modalPdfBtn.textContent = "Generate PDF";
    }
  }
}

/**
 * Attach debounced input handler for custom notes textarea.
 *
 * Sanitizes text via textContent assignment to avoid HTML injection.
 *
 * @returns void
 */
function attachCustomNoteListener(): void {
  const textarea = document.getElementById(
    "custom-note",
  ) as HTMLTextAreaElement;
  if (!textarea) return;

  // Set initial value
  textarea.value = customNote;

  // Handle input with debouncing
  let noteDebounceTimer: number | null = null;
  textarea.addEventListener("input", (e) => {
    if (noteDebounceTimer !== null) {
      clearTimeout(noteDebounceTimer);
    }

    noteDebounceTimer = window.setTimeout(() => {
      const rawValue = (e.target as HTMLTextAreaElement).value;
      // Sanitize the input by creating a temporary element
      const temp = document.createElement("div");
      temp.textContent = rawValue;
      customNote = temp.textContent || "";
    }, 300);
  });
}

function attachClickwrapEventListeners(): void {
  clickwrapModal = document.getElementById('oit-clickwrap-modal');
  clickwrapCheckbox0 = document.getElementById('clickwrap-checkbox-0') as HTMLInputElement;
  clickwrapCheckbox1 = document.getElementById('clickwrap-checkbox-1') as HTMLInputElement;
  clickwrapCheckbox2 = document.getElementById('clickwrap-checkbox-2') as HTMLInputElement;
  clickwrapCheckbox3 = document.getElementById('clickwrap-checkbox-3') as HTMLInputElement;
  clickwrapGenerateBtn = document.getElementById('clickwrap-generate-btn') as HTMLButtonElement;
  clickwrapCancelBtn = document.getElementById('clickwrap-cancel-btn') as HTMLButtonElement;

  if (!clickwrapModal || !clickwrapCheckbox0 || !clickwrapCheckbox1 || !clickwrapCheckbox2 || !clickwrapCheckbox3 || !clickwrapGenerateBtn || !clickwrapCancelBtn) {
    return;
  }

  const validateCheckboxes = () => {
    if (clickwrapGenerateBtn) {
      clickwrapGenerateBtn.disabled = !(clickwrapCheckbox0?.checked && clickwrapCheckbox1?.checked && clickwrapCheckbox2?.checked && clickwrapCheckbox3?.checked);
    }
  };

  clickwrapCheckbox0.addEventListener('change', validateCheckboxes);
  clickwrapCheckbox1.addEventListener('change', validateCheckboxes);
  clickwrapCheckbox2.addEventListener('change', validateCheckboxes);
  clickwrapCheckbox3.addEventListener('change', validateCheckboxes);
  clickwrapCancelBtn.addEventListener('click', hideClickwrapModal);

  // allow ESC to get out of modal
  document.addEventListener('keydown', (e) => {
    if (e.key === "Escape" && clickwrapModal && clickwrapModal.style.display === 'flex') {
      hideClickwrapModal();
    }
  });

  // on clicking of generation button once available, set token, hide modal, and trigger PDF gen
  clickwrapGenerateBtn.addEventListener('click', async () => {
    setClickwrapAcceptToken();
    hideClickwrapModal();
    await triggerPdfGeneration();
  });
}


// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Generate a printable PDF of the current protocol using jsPDF + autoTable.
 *
 * Includes:
 * - Food A section (and Food B when present)
 * - step tables with intervals
 * - optional notes section
 * - footer disclaimer
 *
 * Opens in a new tab where possible; falls back to direct download.
 *
 * @param JsPdfClass  - the jsPDF constructor
 * @param PdfDocClass - static class for PDFDocument
 * @returns void
 */
async function _generatePdf(JsPdfClass: typeof jsPDF, PdfDocClass: typeof PDFDocument): Promise<void> {
  if (!currentProtocol) return;

  // fetch physician review sheet and education handout pdfs
  const reviewSheetPromise = fetch('/tool_assets/oit_patient_resource_terms.pdf')
    .then(res => {
      if (!res.ok) throw new Error("Failed to load review sheet PDF");
      return res.arrayBuffer();
    });

  // generate main protocol doc table
  const doc: any = new JsPdfClass({
    unit: "pt",
    format: "letter",
  });

  let yPosition = 40;

  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Oral Immunotherapy Protocol", 40, yPosition);
  yPosition += 30;

  // Get food information
  const foodAUnit = currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  const foodAStepCount = getFoodAStepCount(currentProtocol);
  const totalSteps = currentProtocol.steps.length;

  // Build Food A table data if it exists (it always should ... unless the user does Food A -> B and then deletes all the Food A steps for some dumb reason)
  if (foodAStepCount > 0) {
    const foodARows: any[] = [];
    for (let i = 0; i < foodAStepCount; i++) {
      const step = currentProtocol.steps[i];
      const food = currentProtocol.foodA;

      let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
      let mixDetails = "N/A";

      if (step.method === Method.DILUTE) {
        const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
        mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
      }

      if (i === totalSteps - 1) {
        foodARows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "Continue long term",
        ]);
      } else {
        foodARows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "2-4 weeks",
        ]);
      }
    }

    // Build Food A section PDF
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${currentProtocol.foodA.name}`, 40, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Protein: ${formatNumber(currentProtocol.foodA.gramsInServing, 2)} g per ${currentProtocol.foodA.servingSize} ${foodAUnit} serving.`,
      40,
      yPosition,
    );
    yPosition += 15;

    // Food A table
    (doc as any).autoTable({
      startY: yPosition,
      head: [
        [
          "Step",
          "Protein",
          "Method",
          "How to make mix",
          "Daily Amount",
          "Interval",
        ],
      ],
      body: foodARows,
      theme: "striped",
      headStyles: {
        fillColor: [220, 220, 220], // Light gray, B&W friendly
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'middle',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'center' }, // Step
        1: { halign: 'center' }, // Protein
        2: { halign: 'center' }, // Method
      },
      margin: { left: 40, right: 40 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Food B section (if exists)
  if (currentProtocol.foodB && foodAStepCount < totalSteps) {
    const foodBUnit =
      currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml";

    // Build Food B table data
    const foodBRows: any[] = [];
    for (let i = foodAStepCount; i < totalSteps; i++) {
      const step = currentProtocol.steps[i];

      let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
      let mixDetails = "N/A"; // default for food B since there is no mix

      if (step.method === Method.DILUTE) {
        console.log("A step for food B should never be diluted by design.", step)
      }

      // last step should say continue long term
      if (i === totalSteps - 1) {
        foodBRows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "Continue long term",
        ]);
      } else {
        foodBRows.push([
          step.stepIndex,
          `${formatNumber(step.targetMg, 1)} mg`,
          step.method,
          mixDetails,
          dailyAmountStr,
          "2-4 weeks",
        ]);
      }
    }

    // Check if we need a new page
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 40;
    }

    yPosition += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${currentProtocol.foodB.name}`, 40, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Protein: ${formatNumber(currentProtocol.foodB.gramsInServing, 2)} g per ${currentProtocol.foodB.servingSize} ${foodBUnit} serving`,
      40,
      yPosition,
    );
    yPosition += 15;

    // Food B table
    (doc as any).autoTable({
      startY: yPosition,
      head: [
        [
          "Step",
          "Protein",
          "Method",
          "How to make mix",
          "Daily Amount",
          "Interval",
        ],
      ],
      body: foodBRows,
      theme: "striped",
      headStyles: {
        fillColor: [220, 220, 220], // Light gray, B&W friendly
        textColor: [0, 0, 0],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
        overflow: 'linebreak',
        valign: 'middle',
        halign: 'left',
      },
      columnStyles: {
        0: { halign: 'center' }, // Step
        1: { halign: 'center' }, // Protein
        2: { halign: 'center' }, // Method
      },
      margin: { left: 40, right: 40 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  }

  // Custom notes section
  if (customNote && customNote.trim()) {
    // Check if we need a new page
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 40;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 40, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Split notes into lines that fit the page width
    const maxWidth = 520; // page width minus margins
    const lines = doc.splitTextToSize(customNote.trim(), maxWidth);

    for (const line of lines) {
      if (yPosition > 730) {
        doc.addPage();
        yPosition = 40;
      }
      doc.text(line, 40, yPosition);
      yPosition += 14;
    }
  }

  // Add footer with disclaimer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text("", 40, 760);
    doc.text(`Always verify calculations before clinical use. Current tool version-hash: ${__COMMIT_HASH__}`, 40, 772);
    doc.setTextColor(0);
  }

  // doc is complete
  // prep for merge: need array buffers for pdf-lib
  const jsPdfBytes = doc.output('arraybuffer');
  const reviewSheetBytes = await reviewSheetPromise;

  // merge
  const mergedPdf = await PdfDocClass.create();
  const protocolPdf = await PdfDocClass.load(jsPdfBytes);
  const reviewSheetPdf = await PdfDocClass.load(reviewSheetBytes);

  // order of pdfs
  const reviewSheetPages = await mergedPdf.copyPages(reviewSheetPdf, reviewSheetPdf.getPageIndices());
  reviewSheetPages.forEach((page: any) => mergedPdf.addPage(page));
  const protocolPages = await mergedPdf.copyPages(protocolPdf, protocolPdf.getPageIndices());
  protocolPages.forEach((page: any) => mergedPdf.addPage(page));

  // create blob
  const mergedPdfBytes = await mergedPdf.save();
  const pdfBlob = new Blob(
    [mergedPdfBytes as Uint8Array<ArrayBuffer>],
    { type: "application/pdf" }
  );

  const blobUrl = URL.createObjectURL(pdfBlob);

  // const pdfBlob = doc.output("blob");
  // const blobUrl = URL.createObjectURL(pdfBlob);

  // Detect if user is on mobile device
  // Combines user agent check with touch capability and screen size for better accuracy
  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ||
    (("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
      window.innerWidth <= 1024);

  if (isMobile) {
    // Mobile: Use download link approach for better compatibility
    const downloadLink = document.createElement("a");
    downloadLink.href = blobUrl;
    downloadLink.download = "protocol.pdf";
    downloadLink.style.display = "none";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Clean up the blob URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } else {
    // Desktop: Open in new tab (original behavior)
    const w = window.open(blobUrl, "_blank");
    if (!w) {
      // Fallback to download if popup blocked
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = "protocol.pdf";
      downloadLink.style.display = "none";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    // Clean up the blob URL after a delay (longer for new tab scenario)
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  }
}

/**
 * Generate and copy an ASCII representation of the protocol to clipboard.
 *
 * Creates separate tables for Food A and Food B, includes mix instructions for dilution steps, and appends custom notes when present. Falls back to alerting the text when clipboard copy fails.
 *
 * @returns void
 */
function exportASCII(): void {
  if (!currentProtocol) return;

  let text = "";
  let foodAInfo = "";
  let foodBInfo = "";

  // get food A and B? info
  const foodAType =
    currentProtocol.foodA.type === FoodType.SOLID ? "Solid" : "Liquid";
  const foodAUnit = currentProtocol.foodA.type === FoodType.SOLID ? "g" : "ml";
  foodAInfo += `${currentProtocol.foodA.name} (${foodAType}). Protein: ${formatNumber(currentProtocol.foodA.getMgPerUnit(), 1)} mg/${foodAUnit}`;
  if (currentProtocol.foodB) {
    const foodBType =
      currentProtocol.foodB.type === FoodType.SOLID ? "Solid" : "Liquid";
    const foodBUnit =
      currentProtocol.foodB.type === FoodType.SOLID ? "g" : "ml";
    foodBInfo += `${currentProtocol.foodB.name} (${foodBType}). Protein: ${formatNumber(currentProtocol.foodB.getMgPerUnit(), 1)} mg/${foodBUnit}`;
  }

  // GENERATE TABLES
  const totalSteps = currentProtocol.steps.length;
  const foodAStepCount = getFoodAStepCount(currentProtocol);

  // Create separate tables for each food
  const foodATable = new AsciiTable3(currentProtocol.foodA.name);
  const foodBTable = new AsciiTable3(currentProtocol.foodB?.name);

  foodATable.setHeading(
    "Step",
    "Protein",
    "Method",
    "Daily Amount",
    "Mix Details",
  );
  foodBTable.setHeading(
    "Step",
    "Protein",
    "Method",
    "Daily Amount",
    "Mix Details",
  );

  // Iterate over steps and build rows for each table
  for (const step of currentProtocol.steps) {
    const isStepFoodB = step.food === "B";
    const food = isStepFoodB ? currentProtocol.foodB! : currentProtocol.foodA;

    // Create table for this step
    let table: AsciiTable3;
    if (!isStepFoodB) {
      table = foodATable;
    } else {
      table = foodBTable;
    }

    let dailyAmountStr = `${formatAmount(step.dailyAmount, step.dailyAmountUnit)} ${step.dailyAmountUnit}`;
    let mixDetails = "N/A"; // default unless dilution

    if (step.method === Method.DILUTE) {
      const mixUnit: Unit = food.type === FoodType.SOLID ? "g" : "ml";
      mixDetails = `${formatAmount(step.mixFoodAmount!, mixUnit)} ${mixUnit} food + ${formatAmount(step.mixWaterAmount!, "ml")} ml water`;
    }

    table.addRow(
      step.stepIndex,
      `${formatNumber(step.targetMg, 1)} mg`,
      step.method,
      mixDetails,
      dailyAmountStr,
    );
  }

  // Baseline data
  if (currentProtocol.foodB) {
    text += foodAInfo + "\n" + foodBInfo + "\n\n";
  } else {
    text += foodAInfo + "\n\n";
  }

  // ADD TABLES
  if (foodAStepCount > 0) {
    text += foodATable.toString();
  }

  if (foodAStepCount < totalSteps) {
    text += `--- TRANSITION TO: ---\n`;
    text += foodBTable.toString();
  }

  // ADD CUSTOM NOTES IF PROVIDED
  if (customNote && customNote.trim()) {
    text += "========================================\n";
    text += "NOTES\n";
    text += "========================================\n";
    text += `${customNote.trim()}`;
  }

  // Copy to clipboard
  navigator.clipboard.writeText(text).catch(() => {
    alert("Failed to copy to clipboard. Please copy manually:\n\n" + text);
  });
}

// ============================================
// DATABASE LOADING
// ============================================

/**
 * Load foods and protocol template databases and prepare fuzzy search indices.
 *
 * Fetches:
 * - /tool_assets/typed_foods_rough.json TODO! Change to not rough...
 * - /tool_assets/custom_foods.json
 * - /tool_assets/oit_protocols.json
 *
 * On failure, logs the error and alerts the user that some features may not work.
 *
 * @returns Promise that resolves when databases are loaded
 */
async function loadDatabases(): Promise<void> {
  try {
    // Load foods database
    // TODO! validate the JSON structure
    const cnfFoodsResponse = await fetch("/tool_assets/typed_foods_rough.json");
    const customFoodsResponse = await fetch("/tool_assets/custom_foods.json");
    const cnfFoodsDatabase = await cnfFoodsResponse.json();
    const customFoodsDatabase = await customFoodsResponse.json();

    const foodsDatabase = [...cnfFoodsDatabase, ...customFoodsDatabase];

    // Prepare for fuzzy search
    fuzzySortPreparedFoods = foodsDatabase.map((f) => ({
      ...f,
      prepared: fuzzysort.prepare(f.Food),
    }));

    // Load protocols database
    const protocolsResponse = await fetch("/tool_assets/oit_protocols.json");
    protocolsDatabase = await protocolsResponse.json();

    // Prepare for fuzzy search
    fuzzySortPreparedProtocols = protocolsDatabase.map((p) => ({
      ...p,
      prepared: fuzzysort.prepare(p.name),
    }));

    console.log(
      `Loaded ${foodsDatabase.length} foods and ${protocolsDatabase.length} protocols`,
    );
  } catch (error) {
    console.error("Error loading databases:", error);
    alert(
      "Error loading food and protocol databases. Some features may not work.",
    );
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the OIT calculator after DOM is ready.
 *
 * Loads databases, wires up search inputs (with debounce and keyboard nav), attaches clear button behavior, initializes Food B disabled state, and logs readiness.
 *
 * @returns Promise<void>
 */
async function initializeCalculator(): Promise<void> {
  // Load databases
  await loadDatabases();

  // Get URL for rules page
  const urlContainer = document.getElementById('url-container');
  if (urlContainer) {
    // Note: data-target-url becomes dataset.targetUrl in JS (camelCase)
    warningsPageURL = urlContainer.dataset.targetUrl!;
  }
  // Set up search input listeners
  const foodASearchInput = document.getElementById(
    "food-a-search",
  ) as HTMLInputElement;
  if (foodASearchInput) {
    foodASearchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value;

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      searchDebounceTimer = window.setTimeout(() => {
        const results = performSearch(query, "protocol");
        showSearchDropdown("food-a-search", results, query);
      }, 150);
    });

    foodASearchInput.addEventListener("keydown", (e) => {
      const dropdown =
        foodASearchInput.parentElement?.querySelector(".search-dropdown");
      if (!dropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateDropdown("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateDropdown("up");
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectHighlightedDropdownItem();
      } else if (e.key === "Escape") {
        hideSearchDropdown("food-a-search");
      }
    });

    foodASearchInput.addEventListener("blur", () => {
      setTimeout(() => hideSearchDropdown("food-a-search"), 200);
    });
  }

  const foodBSearchInput = document.getElementById(
    "food-b-search",
  ) as HTMLInputElement;
  if (foodBSearchInput) {
    foodBSearchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value;

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      searchDebounceTimer = window.setTimeout(() => {
        const results = performSearch(query, "food");
        showSearchDropdown("food-b-search", results, query);
      }, 150);
    });

    foodBSearchInput.addEventListener("keydown", (e) => {
      const dropdown =
        foodBSearchInput.parentElement?.querySelector(".search-dropdown");
      if (!dropdown) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        navigateDropdown("down");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        navigateDropdown("up");
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectHighlightedDropdownItem();
      } else if (e.key === "Escape") {
        hideSearchDropdown("food-b-search");
      }
    });

    foodBSearchInput.addEventListener("blur", () => {
      setTimeout(() => hideSearchDropdown("food-b-search"), 200);
    });
  }

  // Clear Food B button
  const clearFoodBBtn = document.getElementById(
    "clear-food-b",
  ) as HTMLButtonElement;
  if (clearFoodBBtn) {
    clearFoodBBtn.addEventListener("click", clearFoodB);
  }

  // Set up clickwrap modal listeners
  attachClickwrapEventListeners();

  console.log("OIT Calculator initialized");
}

// Initialize when DOM is ready
if (typeof import.meta.vitest === 'undefined') {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCalculator);
  } else {
    initializeCalculator();
  }
}

// ============================================
// TESTS
// ============================================
if (import.meta.vitest) {
  const { it, expect, describe } = import.meta.vitest;

  // mock config 
  const TEST_CONFIG: ProtocolConfig = {
    minMeasurableMass: new Decimal(0.2),
    minMeasurableVolume: new Decimal(0.2),
    minServingsForMix: new Decimal(2),
    PROTEIN_TOLERANCE: new Decimal(0.05),
    DEFAULT_FOOD_A_DILUTION_THRESHOLD: new Decimal(0.2),
    DEFAULT_FOOD_B_THRESHOLD: new Decimal(0.2),
    MAX_SOLID_CONCENTRATION: new Decimal(0.05),
    MAX_MIX_WATER: new Decimal(500),
    SOLID_MIX_CANDIDATES: [
      0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 1, 2, 5, 10, 12, 14, 16, 18, 20, 25, 30
    ].map((num) => new Decimal(num)),
    LIQUID_MIX_CANDIDATES: [
      0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 14, 16, 18, 20, 25, 30
    ].map((num) => new Decimal(num)),
    DAILY_AMOUNT_CANDIDATES: [
      0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7, 9, 10, 11, 12,
    ].map((num) => new Decimal(num))
  };

  // Mock Food: flour (Solid, High Protein)
  const flour: Food = {
    name: "flour",
    type: FoodType.SOLID,
    gramsInServing: new Decimal(50),
    servingSize: new Decimal(100),
    getMgPerUnit: function() {
      return this.gramsInServing.times(1000).dividedBy(this.servingSize);
    }
  };

  // Mock Food: Milk (Liquid, Low Protein)
  const cowMilk: Food = {
    name: "Cow Milk",
    type: FoodType.LIQUID,
    gramsInServing: new Decimal(3.2),
    servingSize: new Decimal(100),
    getMgPerUnit: function() {
      return this.gramsInServing.times(1000).dividedBy(this.servingSize);
    }
  };

  describe("Utility Functions", () => {
    describe("escapeHtml", () => {
      it("should escape special HTML characters", () => {
        const input = "<script>alert('xss & stuff')</script>";
        const expected = "&lt;script&gt;alert(&#039;xss &amp; stuff&#039;)&lt;/script&gt;";
        expect(escapeHtml(input)).toBe(expected);
      });
      it("should handle empty strings", () => {
        expect(escapeHtml("")).toBe("");
      });
    });

    describe("formatNumber", () => {
      it("should format a number to a fixed number of decimal places", () => {
        expect(formatNumber(123.456, 2)).toBe("123.46");
      });
      it("should handle Decimal objects", () => {
        expect(formatNumber(new Decimal(123.456), 2)).toBe("123.46");
      });
    });

    describe("formatAmount", () => {
      it("should format solids to 2 decimals (SOLID_RESOLUTION)", () => {
        expect(formatAmount(10.1234, "g")).toBe("10.12");
      });
      it("should format liquids to integers if whole", () => {
        expect(formatAmount(10.00, "ml")).toBe("10");
      });
      it("should format liquids to 1 decimal if fractional", () => {
        expect(formatAmount(10.1234, "ml")).toBe("10.1");
      });
    });
  });

  describe("Core Calculations", () => {

    describe("findDilutionCandidates (Solid Food)", () => {
      it("should calculate correct mix for a small target using Solid food", () => {
        // Target 10mg protein using Flour (500mg/g)
        // 10mg requires 0.02g of neat flour. This is < minMeasurableMass (0.05), so it must dilute.
        const targetMg = new Decimal(10);
        const candidates: Candidate[] = findDilutionCandidates(targetMg, flour, TEST_CONFIG);

        expect(candidates.length).toBeGreaterThan(0);

        const best = candidates[0];
        const totalMixProtein = best.mixFoodAmount.times(500);
        const concentration = totalMixProtein.dividedBy(best.mixWaterAmount);
        const delivered = concentration.times(best.dailyAmount);
        // Expect delivered to be close to target
        const diff = delivered.minus(targetMg).abs();
        expect(diff.toNumber()).toBeLessThan(TEST_CONFIG.PROTEIN_TOLERANCE.toNumber());
      });

      it("should respect MAX_SOLID_CONCENTRATION for solids", () => {
        const targetMg = new Decimal(50);
        const candidates = findDilutionCandidates(targetMg, flour, TEST_CONFIG);

        if (candidates.length > 0) {
          const best = candidates[0];
          const ratio = best.mixFoodAmount.dividedBy(best.mixWaterAmount);
          console.log(candidates[0]);
          expect(ratio.toNumber()).toBeLessThanOrEqual(TEST_CONFIG.MAX_SOLID_CONCENTRATION.toNumber());
        }
      });
    });

    describe("findDilutionCandidates (Liquid Food)", () => {
      it("should calculate correct volume subtraction for Liquid food", () => {
        // Target 1mg protein using Milk (32mg/ml)
        const targetMg = new Decimal(1);
        const candidates = findDilutionCandidates(targetMg, cowMilk, TEST_CONFIG);

        expect(candidates.length).toBeGreaterThan(0);
        const best = candidates[0];

        // For liquids: Total Volume = Food + Water
        const totalVol = best.mixFoodAmount.plus(best.mixWaterAmount);
        expect(best.mixTotalVolume.toNumber()).toBeCloseTo(totalVol.toNumber());
      });
    });
  });

  describe("Step Generation & Strategy", () => {

    describe("generateStepForTarget", () => {
      it("should generate a DIRECT step when amount is above threshold", () => {
        // flour (500mg/g). Target 250mg = 0.5g neat.
        // Threshold is 0.2g. 1g > 0.2g, so Direct.
        const step = generateStepForTarget(
          new Decimal(250),
          1,
          flour,
          FoodAStrategy.DILUTE_INITIAL,
          TEST_CONFIG.DEFAULT_FOOD_A_DILUTION_THRESHOLD,
          TEST_CONFIG
        );

        expect(step).not.toBeNull();
        expect(step!.method).toBe(Method.DIRECT);
        expect(step!.dailyAmount.toNumber()).toBe(0.5);
        expect(step!.food).toBe("A");
      });

      it("should generate a DILUTE step when amount is below threshold", () => {
        // flour. Target 10mg = 0.02g neat.
        // Threshold 0.2g. 0.02 < 0.2, so Dilute.
        const step = generateStepForTarget(
          new Decimal(10),
          1,
          flour,
          FoodAStrategy.DILUTE_INITIAL,
          TEST_CONFIG.DEFAULT_FOOD_A_DILUTION_THRESHOLD,
          TEST_CONFIG
        );

        expect(step).not.toBeNull();
        expect(step!.method).toBe(Method.DILUTE);
        expect(step!.mixWaterAmount).toBeDefined();
      });

      it("should force DIRECT if strategy is DILUTE_NONE", () => {
        // Even for tiny amount
        const step = generateStepForTarget(
          new Decimal(1),
          1,
          flour,
          FoodAStrategy.DILUTE_NONE,
          TEST_CONFIG.DEFAULT_FOOD_A_DILUTION_THRESHOLD,
          TEST_CONFIG
        );
        expect(step!.method).toBe(Method.DIRECT);
      });
    });
  });

  describe("Protocol Logic", () => {
    describe("addFoodBToProtocol", () => {
      it("should correctly transition steps from Food A to Food B", () => {
        // 1. Setup a dummy protocol with A
        const protocol = generateDefaultProtocol(flour, TEST_CONFIG);
        // Override steps to known targets: 1, 100, 1000 mg
        protocol.steps = [
          { stepIndex: 1, targetMg: new Decimal(1), method: Method.DILUTE, dailyAmount: new Decimal(1), dailyAmountUnit: 'ml', food: "A" },
          { stepIndex: 2, targetMg: new Decimal(100), method: Method.DIRECT, dailyAmount: new Decimal(0.2), dailyAmountUnit: 'g', food: "A" },
          { stepIndex: 3, targetMg: new Decimal(1000), method: Method.DIRECT, dailyAmount: new Decimal(2), dailyAmountUnit: 'g', food: "A" }
        ];

        // 2. Define Food B (e.g., peanuts)
        const peanuts: Food = { ...flour, name: "peanuts" }; // assume same protein for simplicity

        // 3. Add Food B, threshold equivalent to 100mg
        // 100mg / 500mg/g = 0.2g threshold
        const threshold = { unit: "g" as Unit, amount: new Decimal(0.2) };

        currentProtocol = addFoodBToProtocol(protocol, peanuts, threshold);

        // Expectation:
        // Step 1: 1mg (Food A)
        // Step 2: 100mg (Food A) -> This is the transition point because 100mg >= 100mg threshold
        // Step 3: 100mg (Food B) -> Inserted duplicate
        // Step 4: 1000mg (Food B)

        expect(protocol.steps.length).toBe(4);
        expect(protocol.steps[0].food).toBe("A");
        expect(protocol.steps[1].food).toBe("A");
        expect(protocol.steps[2].food).toBe("B"); // The transition duplicate
        expect(protocol.steps[2].targetMg.toNumber()).toBe(100);
        expect(protocol.steps[3].food).toBe("B");
      });
    });
  });

  describe("Validation System", () => {
    it("should flag R2 (Protein Mismatch) if math is wrong", () => {
      const protocol = generateDefaultProtocol(flour, TEST_CONFIG);
      // Manually break a step
      const step = protocol.steps[0];
      step.method = Method.DIRECT;
      step.targetMg = new Decimal(1000); // 1000mg
      step.dailyAmount = new Decimal(0.001); // tiny amount, definitely not 1000mg

      const warnings = validateProtocol(protocol);
      const r2 = warnings.find(w => w.code === "R2");
      expect(r2).toBeDefined();
      expect(r2?.severity).toBe("red");
    });

    it("should flag R6 (Impossible Volume) for Dilution", () => {
      const protocol = generateDefaultProtocol(flour, TEST_CONFIG);
      // Manually create impossible liquid physics
      const step = protocol.steps[0];
      step.method = Method.DILUTE;
      step.mixWaterAmount = new Decimal(10);
      step.mixFoodAmount = new Decimal(0.5); // Solid
      step.dailyAmount = new Decimal(100); // Daily amount > Total Volume

      const warnings = validateProtocol(protocol);
      const r6 = warnings.find(w => w.code === "R6");
      expect(r6).toBeDefined();
    });

    it("should flag Y2 (Non-ascending steps)", () => {
      const protocol = generateDefaultProtocol(flour, TEST_CONFIG);
      // Make step 2 smaller than step 1
      protocol.steps[0].targetMg = new Decimal(10);
      protocol.steps[1].targetMg = new Decimal(5);

      const warnings = validateProtocol(protocol);
      const y2 = warnings.find(w => w.code === "Y2");
      expect(y2).toBeDefined();
    });
  });
}
