import { ALLERGENS, TEMPLATES, flattenAllergens, getTable, copyToClipboard } from "./spt_generator_utils.js";

const allergenList = flattenAllergens(ALLERGENS);

let entries = [];

class entry {
  constructor(allergen, diameter, note) {
    this.allergen = allergen.trim();
    this.diameter = diameter;
    this.note = note;
  }
}

document.addEventListener("DOMContentLoaded", function() {

  // Add reset functionality
  document.getElementById('reset-btn').addEventListener('click', () => {
    entries = [];
    renderEntries();
    updateDisplays();
  });

  // Update template handler to use NaN for diameter
  document.querySelectorAll('.template-btn').forEach(btn => {
    if (!btn.dataset.template) return;

    btn.addEventListener('click', () => {
      const template = TEMPLATES[btn.dataset.template];
      template.forEach(allergen => {
        entries.push(new entry(allergen, NaN, null)); // Use NaN for diameter
      });
      renderEntries();
      updateDisplays();
    });
  });

  // Initialize UI
  const entryCreation = document.querySelector(".entry-creation");

  // Create input row
  const inputRow = document.createElement("div");
  inputRow.className = "input-row";

  // Allergen input with dropdown
  const allergenContainer = document.createElement("div");
  allergenContainer.className = "input-container allergen-input";
  const allergenInput = document.createElement("input");
  allergenInput.type = "text";
  allergenInput.placeholder = "Search allergen";
  allergenInput.autofocus = true;
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";

  // Diameter input
  const diameterInput = document.createElement("input");
  diameterInput.type = "number";
  diameterInput.placeholder = "mm";
  diameterInput.min = 0;
  diameterInput.addEventListener('input', () => {
    if (diameterInput.value < 0) diameterInput.value = 0;
  });

  // Note input
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.placeholder = "Note (optional)";

  // Assemble inputs
  allergenContainer.append(allergenInput, dropdown);
  inputRow.append(allergenContainer, diameterInput, noteInput);

  // Create entries list container
  const entriesList = document.createElement("div");
  entriesList.className = "entries-list";

  // Add to DOM
  entryCreation.append(inputRow, entriesList);

  // --- Event Listeners ---
  // Fuzzy search implementation
  allergenInput.addEventListener("input", function(e) {
    const query = e.target.value.toLowerCase();
    const results = allergenList.filter(item =>
      item.toLowerCase().includes(query)
    );

    dropdown.innerHTML = "";
    if (results.length === 0 && query) {
      const customOption = document.createElement("div");
      customOption.className = "dropdown-item";
      customOption.textContent = `Add "${query}"`;
      customOption.addEventListener("click", () => {
        allergenInput.value = query;
        dropdown.classList.remove("visible");
      });
      dropdown.append(customOption);
    } else {
      results.forEach(item => {
        const option = document.createElement("div");
        option.className = "dropdown-item";
        option.textContent = item;
        option.addEventListener("click", () => {
          allergenInput.value = item;
          dropdown.classList.remove("visible");
          diameterInput.focus();
        });
        dropdown.append(option);
      });
    }
    dropdown.classList.toggle("visible", results.length > 0 || query);
  });

  // Add dropdown keyboard navigation
  let selectedIndex = -1;
  allergenInput.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.dropdown-item');

    if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      const direction = e.key === 'ArrowDown' ? 1 : -1;
      selectedIndex = Math.max(-1, Math.min(items.length - 1, selectedIndex + direction));

      items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
      });

      if (selectedIndex >= 0) {
        items[selectedIndex].scrollIntoView({
          block: 'nearest'
        });
      }
    }

    if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
      selectedIndex = -1;
    }
  });

  // Handle keyboard controls
  document.addEventListener("click", e => {
    if (!allergenContainer.contains(e.target)) {
      dropdown.classList.remove("visible");
    }
  });

  // Add entry on Ctrl+Enter
  function handleKeydown(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const allergen = allergenInput.value.trim();
      const diameter = parseFloat(diameterInput.value);
      const note = noteInput.value.trim() || null;

      if (!allergen || isNaN(diameter)) {
        alert("Please fill required fields");
        return;
      }

      entries.push(new entry(allergen, diameter, note));
      renderEntries();
      updateDisplays();

      // Clear inputs
      allergenInput.value = "";
      diameterInput.value = "";
      noteInput.value = "";
      allergenInput.focus();
    }
  }

  [allergenInput, diameterInput, noteInput].forEach(input => {
    input.addEventListener("keydown", handleKeydown);
  });

  // Render entries list
  function renderEntries() {
    entriesList.innerHTML = "";
    entries.forEach((entry, index) => {
      const entryDiv = document.createElement("div");
      entryDiv.className = "entry";

      const allergen = document.createElement("input");
      allergen.value = entry.allergen;
      allergen.addEventListener("input", e => {
        entry.allergen = e.target.value;
        updateDisplays();
      });

      const diameter = document.createElement("input");
      diameter.type = "number";
      diameter.value = isNaN(entry.diameter) ? "" : entry.diameter; // Handle NaN
      diameter.addEventListener("input", e => {
        entry.diameter = parseFloat(e.target.value);
        entry.diameter = isNaN(diameter.value) ? NaN : diameter.value;
        updateDisplays();
      });

      const note = document.createElement("input");
      note.value = entry.note || "";
      note.addEventListener("input", e => {
        entry.note = e.target.value.trim() || null;
        updateDisplays();
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "×";
      deleteBtn.className = "delete";
      deleteBtn.addEventListener("click", () => {
        entries.splice(index, 1);
        renderEntries();
        updateDisplays();
      });

      entryDiv.append(allergen, diameter, note, deleteBtn);
      entriesList.append(entryDiv);
    });
  }

  // Update code blocks
  function updateDisplays() {
    const simpleList = document.getElementById("simpleList");
    const tableFormat = document.getElementById("tableFormat");
    if (simpleList) simpleList.textContent = getTable(entries, false, true);
    if (tableFormat) tableFormat.textContent = getTable(entries, true, true);
  }

  // Initial example render
  renderEntries();
  updateDisplays();
});


// -----------------------------------------------------------
// for copy button for code block:
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll(".copy-button").forEach(button => {
    button.addEventListener("click", function() {
      copyToClipboard(this);
    });
  });
});



