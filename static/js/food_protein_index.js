document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('food-search');
  const clearBtn = document.getElementById('clear-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tableBody = document.getElementById('food-table-body');
  const resultsCount = document.getElementById('results-count');
  const noResults = document.getElementById('no-results');
  const foodTable = document.getElementById('food-table');

  let allRows = Array.from(tableBody.querySelectorAll('.food-row'));
  let currentFilter = 'all';
  let searchResults = allRows;

  // Create searchable data for fuzzysort
  const searchableData = allRows.map(row => {
    return {
      element: row,
      foodName: row.querySelector('.food-name').textContent,
    };
  });

  // Search functionality
  function performSearch(query) {
    if (!query.trim()) {
      searchResults = allRows;
      return;
    }

    const fuzzyResults = fuzzysort.go(query, searchableData, {
      key: 'foodName', // Use 'key' (singular) instead of 'keys'
      threshold: -10000,
      limit: 50
    });
    console.log(fuzzyResults)

    searchResults = fuzzyResults.map(result => result.obj.element);
  }

  // Filter functionality
  function applyFilter(group) {
    const filteredRows = currentFilter === 'all'
      ? searchResults
      : searchResults.filter(row => row.getAttribute('data-group') === group);

    return filteredRows;
  }

  // Update display
  function updateDisplay() {
    const visibleRows = applyFilter(currentFilter);

    // Hide all rows first
    allRows.forEach(row => row.style.display = 'none');

    // Remove all rows from the table body
    tableBody.innerHTML = '';

    // Re-add rows in the correct order
    visibleRows.forEach(row => {
      row.style.display = '';
      tableBody.appendChild(row);
    });

    // Update results count
    const count = visibleRows.length;
    resultsCount.textContent = `${count} food${count !== 1 ? 's' : ''}`;

    // Show/hide no results message
    if (count === 0) {
      noResults.style.display = 'block';
      foodTable.style.display = 'none';
    } else {
      noResults.style.display = 'none';
      foodTable.style.display = '';
    }
  }

  // Event listeners
  searchInput.addEventListener('input', function() {
    performSearch(this.value);
    updateDisplay();
  });

  clearBtn.addEventListener('click', function() {
    searchInput.value = '';
    performSearch('');
    updateDisplay();
    searchInput.focus();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Update current filter
      currentFilter = this.getAttribute('data-group');
      updateDisplay();
    });
  });

  // Initialize display
  updateDisplay();

  // Add keyboard navigation for search
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      this.value = '';
      performSearch('');
      updateDisplay();
    }
  });
});
