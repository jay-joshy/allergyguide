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
