import { ALLERGENS, TEMPLATES, flattenAllergens, getTable, copyToClipboard } from "./spt_generator_utils.js";
/**
 * Allergy testing utilities module
 * 
 * @constant {Object} ALLERGENS - Hierarchical allergen categories (aeroallergens, foods, venoms)
 * @constant {Object} TEMPLATES - Predefined allergen groups (controls, commonNuts, commonFruits)
 * 
 * @function flattenAllergens
 *   @param {Object} obj - Nested allergen structure
 *   @returns {string[]} Flattened array of all allergen strings
 * 
 * @function getTable
 *   @param {Object[]} entryList - Allergen entries ({ allergen, diameter, note })
 *   @param {boolean} useCol - Enable two-column format
 *   @param {boolean} sort - Sort by ALLERGENS hierarchy first, then alphabetically
 *   @returns {string} Formatted ASCII table with optional notes wrapping
 * 
 * Note: Sorting uses ALLERGENS' hierarchical order (main categories → subcategories → allergen position).  In addition, when editing an existing entry's allergen, there is intentionally no dropdown for suggestions. getTable() will also handle cases where an entry diameter is NaN or null.
 */

class Entry {
  constructor(allergen, diameter, note) {
    this.allergen = allergen.trim();
    this.diameter = diameter;
    this.note = note;
  }
}

let entries = [];
const cachedFlattenedAllergens = flattenAllergens(ALLERGENS);

function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", function() {
  const mainContainer = document.querySelector(".spt_generator");
  const entryCreation = document.querySelector(".entry-creation");
  const [inputRow, entriesList] = createInputComponents();

  entryCreation.append(inputRow, entriesList);
  setupEventListeners(mainContainer, entriesList);
  updateDisplays();
});

function createInputComponents() {
  // Input Row
  const inputRow = document.createElement("div");
  inputRow.className = "input-row";

  // Allergen Input
  const [allergenContainer, allergenInput, dropdown] = createAllergenInput();

  // Diameter Input
  const diameterInput = createNumberInput("mm", "Diameter in millimeters");

  // Note Input
  const noteInput = createTextInput("Note (optional)", "Optional note");

  inputRow.append(allergenContainer, diameterInput, noteInput);

  // Entries List
  const entriesList = document.createElement("div");
  entriesList.className = "entries-list";
  entriesList.setAttribute("aria-live", "polite");

  return [inputRow, entriesList];
}

function createAllergenInput() {
  const container = document.createElement("div");
  container.className = "input-container allergen-input";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Search allergen";
  input.autofocus = true;
  input.setAttribute("aria-label", "Search allergen");
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-expanded", "false");
  // Add a dedicated class for easier targeting
  input.classList.add("allergen-input-field");

  const dropdownId = `dropdown-${Math.random().toString(36).substr(2, 9)}`;
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";
  dropdown.setAttribute("role", "listbox");
  dropdown.id = dropdownId;
  input.setAttribute("aria-controls", dropdownId);

  container.append(input, dropdown);
  return [container, input, dropdown];
}

function createNumberInput(placeholder, ariaLabel) {
  const input = document.createElement("input");
  input.type = "number";
  input.placeholder = placeholder;
  input.min = 0;
  input.setAttribute("aria-label", ariaLabel);
  input.addEventListener('input', validateNumberInput);
  return input;
}

function createTextInput(placeholder, ariaLabel) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", ariaLabel);
  return input;
}

function validateNumberInput(e) {
  if (e.target.value < 0) e.target.value = 0;
}

function setupEventListeners(container, entriesList) {
  // Reset Button
  container.querySelector('#reset-btn').addEventListener('click', handleReset);

  // Template Buttons
  container.querySelectorAll('.template-btn').forEach(btn => {
    if (btn.dataset.template) {
      btn.addEventListener('click', handleTemplateAdd);
    }
  });

  // Allergen Search
  const allergenInput = container.querySelector('.allergen-input input');

  allergenInput.addEventListener('input', handleAllergenSearch);
  allergenInput.addEventListener('keydown', handleDropdownNavigation);
  allergenInput.addEventListener('focusout', handleOutsideClick);

  // Global Click Handler
  document.addEventListener('click', handleOutsideClick);

  // Entry Submission
  const inputs = Array.from(container.querySelectorAll('.input-row input'));
  inputs.forEach(input => {
    // Only attach the submission handler if the input is not the allergen input
    if (!input.classList.contains('allergen-input-field')) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.defaultPrevented) {
          handleEntrySubmission.call(input, e);
        }
      });
    }
  });

  // Copy Buttons
  document.querySelectorAll(".copy-button").forEach(button => {
    button.addEventListener("click", function() {
      copyToClipboard(this);
    });
  });

  // Entries List Interactions
  entriesList.addEventListener('input', handleEntryUpdate);
  entriesList.addEventListener('click', handleEntryDeletion);
}

function handleReset() {
  entries = [];
  renderEntries();
  updateDisplays();
  this.blur();
}

function handleTemplateAdd(e) {
  const template = TEMPLATES[e.target.dataset.template];
  template.forEach(allergen => {
    entries.push(new Entry(allergen, NaN, null));
  });
  renderEntries();
  updateDisplays();
  this.blur();
}

function handleAllergenSearch(e) {
  const query = e.target.value;
  const dropdown = this.parentNode.querySelector('.dropdown');
  dropdown.innerHTML = '';

  if (query.length === 0) {
    dropdown.classList.remove('visible');
    this.setAttribute('aria-expanded', 'false');
    return;
  }

  // Use fuzzysort with the updated scoring range (0 to 1) and new API.
  const results = fuzzysort.go(query, cachedFlattenedAllergens, {
    threshold: 0.1, // Adjust threshold as needed based on new score range
    limit: 10
  });

  if (results.length) {
    results.forEach(result => {
      const option = document.createElement("div");
      option.className = "dropdown-item";
      // Use highlight() if available; otherwise, fall back to escaped plain text.
      const highlighted = result.highlight('<span class="highlight">', '</span>');
      option.innerHTML = highlighted || escapeHtml(result.target);
      option.id = `option-${Math.random().toString(36).substr(2, 9)}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.addEventListener("click", () => {
        e.target.value = result.target; // Use the original string value
        dropdown.classList.remove("visible");
        e.target.setAttribute('aria-expanded', 'false');
        e.target.removeAttribute('aria-activedescendant');
        e.target.closest('.input-row').querySelector('input[type="number"]').focus();
      });
      dropdown.append(option);
    });
  } else {
    // Create custom option if no match meets the threshold
    dropdown.append(createCustomOption(query, e.target));
  }

  const isVisible = dropdown.children.length > 0;
  dropdown.classList.toggle('visible', isVisible);
  e.target.setAttribute('aria-expanded', isVisible);
}

function createCustomOption(query, inputElement) {
  const option = document.createElement("div");
  option.className = "dropdown-item";
  // option.textContent = `Add "${query}"`;
  option.setAttribute("role", "option");
  option.addEventListener("click", () => {
    inputElement.value = query;
    inputElement.parentNode.querySelector('.dropdown').classList.remove("visible");
  });
  return option;
}

function handleDropdownNavigation(e) {
  const dropdown = this.parentNode.querySelector('.dropdown');
  if (!dropdown.classList.contains('visible')) return;

  const items = dropdown.querySelectorAll('.dropdown-item');
  let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

  // Handle ArrowDown, ArrowUp, Tab, Shift+Tab
  if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
    e.preventDefault();
    const direction = 1;
    selectedIndex = Math.max(-1, Math.min(items.length - 1, selectedIndex + direction));
  } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
    e.preventDefault();
    const direction = -1;
    selectedIndex = Math.max(-1, Math.min(items.length - 1, selectedIndex + direction));
  }

  // Update selected item
  items.forEach((item, index) => {
    const isSelected = index === selectedIndex;
    item.classList.toggle('selected', isSelected);
    item.setAttribute('aria-selected', isSelected);
    if (isSelected) {
      this.setAttribute('aria-activedescendant', item.id);
    }
  });

  if (selectedIndex >= 0) {
    scrollItemIntoView(dropdown, items[selectedIndex]);
  }

  // Handle Enter and Escape
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    if (selectedIndex >= 0 && items[selectedIndex]) {
      items[selectedIndex].click();
    } else {
      this.closest('.input-row').querySelector('input[type="number"]').focus();
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    dropdown.classList.remove('visible');
    this.removeAttribute('aria-activedescendant');
    this.focus();
  }
}

// Update the handleOutsideClick function
function handleOutsideClick(e) {
  const allergenContainer = document.querySelector('.allergen-input');
  const dropdown = document.querySelector('.dropdown');

  let shouldClose = false;

  if (e.type === 'focusout') {
    // Close if moving focus outside the allergen container
    shouldClose = !allergenContainer.contains(e.relatedTarget);
  } else if (e.type === 'click') {
    // Close if clicking outside the allergen container
    shouldClose = !allergenContainer.contains(e.target);
  }

  if (shouldClose) {
    dropdown.classList.remove('visible');
  }
}


function handleEntrySubmission(e) {
  if (e.key === 'Enter') {
    e.preventDefault();

    const dropdown = this.closest('.input-row').querySelector('.dropdown');
    if (dropdown.classList.contains('visible')) return;

    const inputs = Array.from(e.target.closest('.input-row').querySelectorAll('input'));
    const [allergen, diameter, note] = inputs.map(input =>
      input.type === 'number' ? parseFloat(input.value) : input.value.trim()
    );

    if (!allergen) {
      alert("Please enter an allergen");
      inputs[0].classList.add('error');
      return;
    }

    entries.push(new Entry(allergen, diameter, note || null));
    renderEntries();
    updateDisplays();
    inputs.forEach(input => {
      input.value = '';
      input.classList.remove('error');
    });
    inputs[0].focus();
  }
}

function renderEntries() {
  const entriesList = document.querySelector('.entries-list');
  entriesList.innerHTML = '';

  entries.forEach((entry, index) => {
    const entryDiv = document.createElement("div");
    entryDiv.className = "entry";
    // Set a data attribute so we know which entry this is.
    entryDiv.setAttribute("data-index", index);
    entryDiv.setAttribute("role", "listitem");

    const allergen = createEditableInput(entry.allergen, 'text', (e) => {
      entry.allergen = e.target.value;
      updateDisplays();
    });

    const diameter = createEditableInput(
      isNaN(entry.diameter) ? '' : entry.diameter,
      'number',
      (e) => {
        entry.diameter = parseFloat(e.target.value) || NaN;
        updateDisplays();
      }
    );

    const note = createEditableInput(entry.note || '', 'text', (e) => {
      entry.note = e.target.value.trim() || null;
      updateDisplays();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "Delete entry");

    entryDiv.append(allergen, diameter, note, deleteBtn);
    entriesList.append(entryDiv);
  });
}

function createEditableInput(value, type, handler) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value;
  input.addEventListener('input', handler);
  return input;
}

function handleEntryUpdate(e) {
  if (e.target.tagName === 'INPUT') {
    const index = Array.from(e.target.closest('.entry').parentNode.children)
      .indexOf(e.target.closest('.entry'));
    const field = Array.from(e.target.parentNode.children).indexOf(e.target);

    switch (field) {
      case 0: entries[index].allergen = e.target.value; break;
      case 1: entries[index].diameter = parseFloat(e.target.value) || NaN; break;
      case 2: entries[index].note = e.target.value.trim() || null; break;
    }

    updateDisplays();
  }
}

function handleEntryDeletion(e) {
  if (e.target.classList.contains('delete')) {
    const entryDiv = e.target.closest('.entry');
    const index = parseInt(entryDiv.getAttribute('data-index'));
    // Remove the entry from the array.
    entries.splice(index, 1);
    // Remove the DOM element for this entry.
    entryDiv.remove();
    updateDisplays();
    // Update data-index for remaining entries.
    updateEntryIndices();
  }
}

// Helper function to update the data-index attributes
function updateEntryIndices() {
  document.querySelectorAll('.entries-list .entry').forEach((entryDiv, idx) => {
    entryDiv.setAttribute('data-index', idx);
  });
}

function updateDisplays() {
  const simpleList = document.getElementById("simpleList");
  const tableFormat = document.getElementById("tableFormat");

  const simpleText = getTable(entries, false, true);
  const tableText = getTable(entries, true, true);

  simpleList.textContent = simpleText;
  tableFormat.textContent = tableText;

  // Hide copy button if the associated text is empty
  const simpleCopyBtn = simpleList.parentElement.querySelector('.copy-button');
  if (simpleText.trim() === "") {
    simpleCopyBtn.style.display = 'none';
  } else {
    simpleCopyBtn.style.display = '';
  }

  const tableCopyBtn = tableFormat.parentElement.querySelector('.copy-button');
  if (tableText.trim() === "") {
    tableCopyBtn.style.display = 'none';
  } else {
    tableCopyBtn.style.display = '';
  }
}

function scrollItemIntoView(container, item) {
  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  if (itemRect.bottom > containerRect.bottom) {
    container.scrollTop += itemRect.bottom - containerRect.bottom;
  } else if (itemRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - itemRect.top;
  }
}
