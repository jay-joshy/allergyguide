import { getTable, copyToClipboard } from "./spt_generator_utils.js"; // getTable signature: export function getTable(entryList, useCol) {...} -> formatted string, useCol is a bool, where if true will provide a table with entries in two columns, else return just a list of entries.

// possible allergens for drop down list 
let allergens = {
  foods: {
    nuts: ["peanut", "brazil nut", "almond", "cashew"]
  },
  fruits: ["apple", "pear", "peach", "orange"],
  venoms: ["honeybee"],
  aeroallergens: {
    trees: ["cedar", "birch"],
    fungi: ["fungiA", "fungiB"]
  },
}

// The results from one skin prick test.
// allergen: string
// diameter: number 
// note: string or null
class entry {
  constructor(allergen, diameter, note) {
    this.allergen = allergen;
    this.diameter = diameter;
    this.note = note;
  }
}

// ----- Example usage -----
// One-column example (<4 entries)
const oneColumnEntries = [
  new entry("Allergen A", 3, "optional note"),
  new entry("Allergen B", 4, null),
  new entry("Allergen C", 1, null)
];
console.log("One Column Table:\n" + getTable(oneColumnEntries, true));

// Two-column example (>=4 entries)
const twoColumnEntries = [
  new entry("Allergen A", 3, "optional note that's very long and too long note"),
  new entry("Allergen B", 4, null),
  new entry("Allergen C", 1, null),
  new entry("Allergen D", 2, "another note"),
  new entry("Allergen E", 5, null),
];
console.log("\nTwo Column Table:\n" + getTable(twoColumnEntries, true));

// for visualization purposes
document.addEventListener("DOMContentLoaded", function() {
  const simpleListContainer = document.getElementById("simpleList"); // Select element by ID
  const tableContainer = document.getElementById("tableFormat"); // Select element by ID

  if (simpleListContainer) {
    simpleListContainer.innerHTML = getTable(twoColumnEntries, false);
  }
  if (tableContainer) {
    tableContainer.innerHTML = getTable(twoColumnEntries, true);
  }
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



