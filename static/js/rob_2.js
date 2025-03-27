
class Answer {
  // Private Fields
  static #_YES = "Yes";
  static #_PYES = "Probably Yes";
  static #_PNO = "Probably No";
  static #_NO = "No";
  static #_NOINFO = "No information";

  // Accessors for "get" functions only (no "set" functions)
  static get YES() { return this.#_YES; }
  static get PYES() { return this.#_PYES; }
  static get PNO() { return this.#_PNO; }
  static get NO() { return this.#_NO; }
  static get NOINFO() { return this.#_NOINFO; }
}

class DomainRisk {
  // Private Fields
  static #_Low = "Low risk";
  static #_Concerns = "Some concerns";
  static #_High = "High risk";

  // Accessors for "get" functions only (no "set" functions)
  static get Low() { return this.#_Low; }
  static get Concerns() { return this.#_Concerns; }
  static get High() { return this.#_High; }
}

function d_one_rob() {
  return {
    judgement: "high",
    message: "msg"
  };
}



// CLEAR STATE IN LOCAL STORAGE
function clearAllState() {
  // Clear all stored radio button and textarea values from localStorage
  localStorage.clear();

  // Optionally, reset the UI elements (radio buttons and textareas)
  document.querySelectorAll("input[type='radio']").forEach(input => {
    input.checked = false; // Uncheck all radio buttons
  });

  document.querySelectorAll("textarea").forEach(textarea => {
    textarea.value = ''; // Clear all textarea values
  });
}

// SAVE STATE IN LOCAL STORAGE
document.addEventListener("DOMContentLoaded", function() {
  function saveState() {
    document.querySelectorAll("input[type='radio']").forEach(input => {
      if (input.checked) {
        localStorage.setItem(input.name, input.nextElementSibling.innerText);
      }
    });

    document.querySelectorAll("textarea").forEach(textarea => {
      localStorage.setItem(textarea.id, textarea.value);
    });
  }

  function loadState() {
    document.querySelectorAll("input[type='radio']").forEach(input => {
      const savedValue = localStorage.getItem(input.name);
      if (savedValue && input.nextElementSibling.innerText === savedValue) {
        input.checked = true;
      }
    });

    document.querySelectorAll("textarea").forEach(textarea => {
      const savedText = localStorage.getItem(textarea.id);
      if (savedText) {
        textarea.value = savedText;
      }
    });
  }

  // Load saved state on page load
  loadState();

  // Save state when input changes
  document.querySelectorAll("input[type='radio']").forEach(input => {
    input.addEventListener("change", saveState);
  });

  document.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("input", saveState);
  });
});
