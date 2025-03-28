export class Answer {
  // Private Fields
  static #_YES = "Yes";
  static #_PYES = "Prob Yes";
  static #_PNO = "Prob No";
  static #_NO = "No";
  static #_NOINFO = "No info";

  // Accessors for "get" functions only (no "set" functions)
  static get YES() { return this.#_YES; }
  static get PYES() { return this.#_PYES; }
  static get PNO() { return this.#_PNO; }
  static get NO() { return this.#_NO; }
  static get NOINFO() { return this.#_NOINFO; }
}

export class DomainRisk {
  // Private Fields
  static #_Low = "Low risk";
  static #_Concerns = "Some concerns";
  static #_High = "High risk";

  // Accessors for "get" functions only (no "set" functions)
  static get Low() { return this.#_Low; }
  static get Concerns() { return this.#_Concerns; }
  static get High() { return this.#_High; }
}

// A helper to get the normalized answer from a radio group
export function getAnswer(questionName) {
  const radio = document.querySelector(`input[name="${questionName}"]:checked`);
  if (!radio) return null;
  // Normalize by replacing any whitespace (including from <br> tags) with a single space
  return radio.nextElementSibling.innerText.replace(/\s+/g, " ").trim();
}

export function setup_save_state() {
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


}

