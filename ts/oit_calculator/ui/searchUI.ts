/**
 * @module
 *
 * Search UI components (dropdowns, navigation)
 * Does rely on glue from actions.ts
 */
import { escapeHtml } from "../utils";
import type { FoodData, ProtocolData } from "../types";
import { performSearch } from "../core/search";
import { AppState } from "../state/appState";
import { selectCustomFood, selectProtocol, selectFoodA, selectFoodB } from "./actions";

// State for dropdown navigation
let currentDropdownIndex: number = -1;
let currentDropdownInputId: string = "";
let searchDebounceTimer: number | null = null;

export interface SearchCallbacks {
  onSelectCustom: (name: string, inputId: string) => void;
  onSelectProtocol: (data: ProtocolData) => void;
  onSelectFoodA: (data: FoodData) => void;
  onSelectFoodB: (data: FoodData) => void;
}

/**
 * Initialize search input listeners.
 * Works for both food A and B search inputs
 */
export function initSearchEvents(appState: AppState): void {
  const setupSearch = (inputId: string, type: "protocol" | "food") => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!input) return;

    input.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value;
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

      searchDebounceTimer = window.setTimeout(() => {
        const results = performSearch(query, type, appState.foodsIndex, appState.protocolsIndex);
        showSearchDropdown(inputId, results, query, {
          onSelectCustom: selectCustomFood,
          onSelectProtocol: selectProtocol,
          onSelectFoodA: selectFoodA,
          onSelectFoodB: selectFoodB
        });
      }, 150);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); navigateDropdown("down"); }
      else if (e.key === "ArrowUp") { e.preventDefault(); navigateDropdown("up"); }
      else if (e.key === "Enter") { e.preventDefault(); selectHighlightedDropdownItem(); }
      else if (e.key === "Escape") { hideSearchDropdown(inputId); }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => hideSearchDropdown(inputId), 200);
    });
  };

  setupSearch("food-a-search", "protocol");
  setupSearch("food-b-search", "food");
}

/**
 * Render the autocomplete dropdown below a search input
 *
 * Always includes a "Custom" item (index 0)
 */
export function showSearchDropdown(
  inputId: string,
  results: any[],
  query: string,
  callbacks: SearchCallbacks
): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!input || !input.parentElement) return;

  const container = input.parentElement;

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
    callbacks.onSelectCustom(query || "New Food", inputId);
    hideSearchDropdown(inputId);
  });
  dropdown.appendChild(customItem);

  // Add search results
  // limit of 50 HARD CODED HERE consider moving out
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
        callbacks.onSelectProtocol(result.obj);
        hideSearchDropdown(inputId);
      });
    } else {
      // Food result
      const foodData: FoodData = result.obj;

      item.innerHTML = `
        ${escapeHtml(foodData.Food)}
        <span class="food-type"> - ${escapeHtml(foodData.Type)} - Protein: ${foodData["Mean protein in grams"].toFixed(1)} g/${foodData["Serving size"]} ${foodData.Type === "Solid" ? "g" : "ml"}</span>
      `;
      item.addEventListener("click", () => {
        if (inputId === "food-a-search") {
          callbacks.onSelectFoodA(foodData);
        } else {
          callbacks.onSelectFoodB(foodData);
        }
        hideSearchDropdown(inputId);
      });
    }

    dropdown.appendChild(item);
  }

  container.appendChild(dropdown);
}

/**
 * Remove and reset the autocomplete dropdown for a given input
 */
export function hideSearchDropdown(inputId: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!input || !input.parentElement) return;

  const container = input.parentElement;
  const dropdown = container.querySelector(".search-dropdown");
  if (dropdown) {
    dropdown.remove();
  }
  currentDropdownIndex = -1;
  currentDropdownInputId = "";
}

/**
 * Keyboard navigation for the autocomplete dropdown.
 */
export function navigateDropdown(direction: "up" | "down"): void {
  if (!currentDropdownInputId) return;

  const input = document.getElementById(
    currentDropdownInputId,
  ) as HTMLInputElement;
  if (!input || !input.parentElement) return;

  const container = input.parentElement;
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
 */
export function selectHighlightedDropdownItem(): void {
  if (!currentDropdownInputId || currentDropdownIndex < 0) return;

  const input = document.getElementById(
    currentDropdownInputId,
  ) as HTMLInputElement;
  if (!input || !input.parentElement) return;

  const container = input.parentElement;
  const dropdown = container.querySelector(".search-dropdown");
  if (!dropdown) return;

  const items = Array.from(dropdown.querySelectorAll(".search-result-item"));
  if (currentDropdownIndex < items.length) {
    (items[currentDropdownIndex] as HTMLElement).click();
  }
}
