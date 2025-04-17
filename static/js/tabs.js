document.addEventListener('DOMContentLoaded', function() {
  // Initialize all tab containers
  document.querySelectorAll('.tabs-container').forEach(container => {
    const tabButtons = container.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Get the tab container ID
        const containerId = container.id;

        // Get the tab id this button controls
        const tabId = this.getAttribute('data-tab');

        // Deactivate all tabs in this container
        container.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.remove('active');
        });

        container.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('active');
        });

        // Activate the clicked tab
        this.classList.add('active');
        document.getElementById(tabId).classList.add('active');

        // Save active tab to session storage for persistence
        sessionStorage.setItem(containerId + '-active-tab', tabId);
      });
    });

    // Check for previously selected tab on page load
    const savedTabId = sessionStorage.getItem(container.id + '-active-tab');
    if (savedTabId) {
      const savedTab = container.querySelector(`[data-tab="${savedTabId}"]`);
      if (savedTab) {
        savedTab.click();
      }
    }
  });
});
