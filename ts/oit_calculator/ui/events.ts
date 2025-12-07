/**
 * @module
 *
 * Centralized event delegation and handling
 * Biggun
 * Mainly for mutation of big global protocol states and the main components
 * Other more specialized UI event delegation and handling are done in other modules like ui/searchUI.ts, modals.ts 
 */
import Decimal from "decimal.js";
import { protocolState } from "../state/instances";
import {
  updateFoodDetails,
  recalculateStepMethods,
  updateFoodBAndRecalculate,
  updateFoodBThreshold,
  toggleFoodType,
  updateStepTargetMg,
  updateStepDailyAmount,
  updateStepMixFoodAmount,
  addStepAfter,
  removeStep,
  recalculateProtocol
} from "../core/protocol";
import {
  FoodType,
  FoodAStrategy,
  DosingStrategy
} from "../types";
import type { Protocol } from "../types";

import { clearFoodB } from "./actions";

// Debounce timers
let inputDebounceTimer: number | null = null;
let noteDebounceTimer: number | null = null;
let foodADebounceTimer: number | null = null;
let foodBDebounceTimer: number | null = null;

/**
 * Initialize global event listeners using delegation
 * Call this once at startup
 */
export function initGlobalEvents(): void {
  attachSettingsDelegation();
  attachTableDelegation();
  attachDosingStrategyDelegation();
  attachCustomNoteDelegation();
  attachUndoRedoDelegation();

  // Misc global listeners
  const clearFoodBBtn = document.getElementById("clear-food-b") as HTMLButtonElement;
  if (clearFoodBBtn) {
    clearFoodBBtn.addEventListener("click", clearFoodB);
  }
}

function attachUndoRedoDelegation() {
  const undoBtn = document.getElementById("btn-undo");
  const redoBtn = document.getElementById("btn-redo");

  // button wiring
  if (undoBtn) undoBtn.addEventListener("click", () => protocolState.undo());
  if (redoBtn) redoBtn.addEventListener("click", () => protocolState.redo());

  // keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Allow native undo/redo for the Custom Note textarea
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? protocolState.redo() : protocolState.undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      protocolState.redo();
    }
  });
}

// TODO! bottom section is mix of both export and custom note... decouple?
// right now this delegation doesn't really care about the export buttons which is good
function attachCustomNoteDelegation() {
  const bottomSection = document.querySelector(".bottom-section");
  if (bottomSection) {
    bottomSection.addEventListener("input", (e) => {
      const target = e.target as HTMLTextAreaElement;
      if (target.id === "custom-note") {
        if (noteDebounceTimer !== null) {
          clearTimeout(noteDebounceTimer);
        }

        noteDebounceTimer = window.setTimeout(() => {
          const rawValue = target.value;
          protocolState.setCustomNote(rawValue, { skipRender: true });
        }, 300);
      }
    });
  }
}

function attachSettingsDelegation() {
  // Food A Settings Delegation
  const foodAContainer = document.querySelector(".food-a-container");
  if (foodAContainer) {
    foodAContainer.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;

      if (target.id === "food-a-name") {
        // debounce
        if (foodADebounceTimer) clearTimeout(foodADebounceTimer);
        foodADebounceTimer = window.setTimeout(() => {
          const current = protocolState.getProtocol();
          if (current) {
            const updated = updateFoodDetails(current, 'A', {
              name: (target as HTMLInputElement).value
            });
            protocolState.setProtocol(updated);
          }
        }, 300);
      }
    });

    foodAContainer.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      const current = protocolState.getProtocol();
      if (!current) return;

      if (target.id === "food-a-serving-size") {
        let value = parseFloat((target as HTMLInputElement).value);
        // validation of input
        if (value <= 0) value = 1;
        if (value > 1000) value = 1000;
        if (Number.isNaN(value)) value = 1;
        const updated = updateFoodDetails(current, 'A', {
          servingSize: new Decimal(value),
        });
        protocolState.setProtocol(recalculateStepMethods(updated));
      } else if (target.id === "food-a-protein") {
        let value = parseFloat((target as HTMLInputElement).value);
        if (value < 0) value = 0;
        if (value > current.foodA.servingSize.toNumber()) value = current.foodA.servingSize.toNumber();
        if (Number.isNaN(value)) value = 0;
        const updated = updateFoodDetails(current, 'A', {
          gramsInServing: new Decimal(value)
        });
        protocolState.setProtocol(recalculateStepMethods(updated));
      } else if (target.id === "food-a-threshold") {
        const updated: Protocol = {
          ...current,
          diThreshold: new Decimal((target as HTMLInputElement).value)
        }
        protocolState.setProtocol(recalculateStepMethods(updated));
      }
    });

    foodAContainer.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute("data-action");
      const current = protocolState.getProtocol();
      if (!current || !action) return;

      switch (action) {
        case "toggle-food-a-solid":
          if (current.foodA.type !== FoodType.SOLID) {
            protocolState.setProtocol(toggleFoodType(current, false));
          }
          break;
        case "toggle-food-a-liquid":
          if (current.foodA.type !== FoodType.LIQUID) {
            protocolState.setProtocol(toggleFoodType(current, false));
          }
          break;
        case "food-a-strategy-initial":
          protocolState.setProtocol(
            recalculateStepMethods({ ...current, foodAStrategy: FoodAStrategy.DILUTE_INITIAL })
          );
          break;
        case "food-a-strategy-all":
          protocolState.setProtocol(
            recalculateStepMethods({ ...current, foodAStrategy: FoodAStrategy.DILUTE_ALL })
          );
          break;
        case "food-a-strategy-none":
          protocolState.setProtocol(
            recalculateStepMethods({ ...current, foodAStrategy: FoodAStrategy.DILUTE_NONE })
          );
          break;
      }
    });
  }

  // Food B Settings Delegation
  const foodBContainer = document.querySelector(".food-b-container");
  if (foodBContainer) {
    foodBContainer.addEventListener("input", (e) => {
      const target = e.target as HTMLElement;
      if (target.id === "food-b-name") {
        // debounce
        if (foodBDebounceTimer) clearTimeout(foodBDebounceTimer);
        foodBDebounceTimer = window.setTimeout(() => {
          const current = protocolState.getProtocol();
          if (current && current.foodB) {
            const updated = updateFoodDetails(current, "B", {
              name: (target as HTMLInputElement).value
            });
            protocolState.setProtocol(updated);
          }
        }, 300);
      }
    });

    foodBContainer.addEventListener("change", (e) => {
      const target = e.target as HTMLElement;
      const current = protocolState.getProtocol();
      if (!current || !current.foodB) return;

      if (target.id === "food-b-serving-size") {
        let value = parseFloat((target as HTMLInputElement).value);
        if (value <= 0) value = 1;
        if (value > 1000) value = 1000;
        if (Number.isNaN(value)) value = 1;
        const updated = updateFoodBAndRecalculate(current, {
          servingSize: new Decimal(value)
        });
        protocolState.setProtocol(updated);
      } else if (target.id === "food-b-protein") {
        let value = parseFloat((target as HTMLInputElement).value);
        if (value < 0) value = 0;
        if (value > current.foodB.servingSize.toNumber()) value = current.foodB.servingSize.toNumber();
        if (Number.isNaN(value)) value = 0;
        const updated = updateFoodBAndRecalculate(current, {
          gramsInServing: new Decimal(value)
        });
        protocolState.setProtocol(updated);
      } else if (target.id === "food-b-threshold") {
        const updated = updateFoodBThreshold(current, new Decimal((target as HTMLInputElement).value));
        protocolState.setProtocol(updated);
      }
    });

    foodBContainer.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute("data-action");
      const current = protocolState.getProtocol();
      if (!current || !action) return;

      switch (action) {
        case "toggle-food-b-solid":
          if (current.foodB && current.foodB.type !== FoodType.SOLID) {
            protocolState.setProtocol(toggleFoodType(current, true));
          }
          break;
        case "toggle-food-b-liquid":
          if (current.foodB && current.foodB.type !== FoodType.LIQUID) {
            protocolState.setProtocol(toggleFoodType(current, true));
          }
          break;
      }
    });
  }
}

function attachDosingStrategyDelegation() {
  const container = document.querySelector(".dosing-strategy-container");
  if (container) {
    container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const strategy = target.getAttribute("data-strategy") as DosingStrategy;
      const current = protocolState.getProtocol();
      if (current && strategy && strategy !== current.dosingStrategy) {
        const updated = recalculateProtocol({ ...current, dosingStrategy: strategy });

        protocolState.setProtocol(updated);
      }
    });
  }
}

function attachTableDelegation() {
  const tableContainer = document.querySelector(".output-container table");
  if (!tableContainer) return;

  // Click delegation for Add/Remove buttons
  tableContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const current = protocolState.getProtocol();
    if (!current) return;

    if (target.classList.contains("btn-add-step")) {
      const stepIndex = parseInt(target.getAttribute("data-step")!);
      const updated = addStepAfter(current, stepIndex);
      protocolState.setProtocol(updated);
    } else if (target.classList.contains("btn-remove-step")) {
      const stepIndex = parseInt(target.getAttribute("data-step")!);
      const updated = removeStep(current, stepIndex);
      protocolState.setProtocol(updated);
    }
  });

  // Input delegation with debounce
  tableContainer.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    if (!target.classList.contains("editable")) return;

    if (inputDebounceTimer !== null) {
      clearTimeout(inputDebounceTimer);
    }

    inputDebounceTimer = window.setTimeout(() => {
      const stepIndex = parseInt(target.getAttribute("data-step")!);
      const field = target.getAttribute("data-field")!;
      let value = parseFloat(target.value);

      // for ALL table inputs, disallow negatives
      if (isNaN(value)) return;
      if (value < 0) value = 0; // clamping logic

      // get current state of protocol
      const current = protocolState.getProtocol();
      if (!current) return;

      let updated: Protocol = { ...current };
      if (field === "targetMg") {
        updated = updateStepTargetMg(current, stepIndex, value);
      } else if (field === "dailyAmount") {
        updated = updateStepDailyAmount(current, stepIndex, value);
      } else if (field === "mixFoodAmount") {
        updated = updateStepMixFoodAmount(current, stepIndex, value);
      }

      protocolState.setProtocol(updated);
    }, 150); // 150ms debounce
  });

  tableContainer.addEventListener("keydown", (e) => {
    if ((e as KeyboardEvent).key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') {
        target.blur();
      }
    }
  });
}
