// Debounce utility function
// This allows for a slight delay so that the search is not triggered on EVERY keystroke...
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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

    try {
      const fuzzyResults = fuzzysort.go(query, searchableData, {
        key: 'foodName',
        threshold: -10000,
        limit: 50
      });
      searchResults = fuzzyResults.map(result => result.obj.element);
    } catch (error) {
      console.error('Search error:', error);
      searchResults = []; // Graceful fallback
    }
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
    const searchQuery = searchInput.value.trim();

    // If no search query, encourage user to search
    if (searchQuery === '' && currentFilter === 'all') {
      tableBody.innerHTML = '';
      resultsCount.innerHTML = `<strong>${visibleRows.length}</strong> foods.`;

      noResults.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <h3 style="margin-bottom: 16px; color: var(--food-text);">🔍 Start typing to search through the database.</h3>
          <p style="margin-bottom: 20px; font-size: 16px;">
            Search through <strong>${visibleRows.length} foods</strong> to find protein content and nutritional information.
          </p>
          <p style="color: var(--food-no-data); font-size: 14px;">
            Try searching for "peanut butter", "pecans", "lobster", or any other foods.
          </p>
        </div>
      `;
      noResults.style.display = 'block';
      foodTable.style.display = 'none';
      return;
    }

    // Normal search results
    const fragment = document.createDocumentFragment();

    visibleRows.forEach(row => {
      fragment.appendChild(row.cloneNode(true));
    });

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);

    const count = visibleRows.length;
    resultsCount.textContent = `${count} food${count !== 1 ? 's' : ''}`;

    if (count === 0) {
      noResults.innerHTML = '<p>No foods match your search criteria.</p>';
      noResults.style.display = 'block';
      foodTable.style.display = 'none';
    } else {
      noResults.style.display = 'none';
      foodTable.style.display = '';
    }
  }

  // Create debounced search function
  const debouncedSearch = debounce(function(query) {
    performSearch(query);
    updateDisplay();
  }, 150); // Wait 150ms after user stops typing

  // Event listeners
  searchInput.addEventListener('input', function() {
    // Use debounced search instead of immediate search
    debouncedSearch(this.value);
  });

  clearBtn.addEventListener('click', function() {
    searchInput.value = '';
    performSearch('');

    // Reset to "All Foods" filter and show start message
    filterBtns.forEach(b => b.classList.remove('active'));
    filterBtns[0].classList.add('active'); // First button is "All Foods"
    currentFilter = 'all';

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


  // Add keyboard navigation for search
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      this.value = '';
      performSearch('');
      updateDisplay();
    }
  });

  // Initialize display
  updateDisplay();

  document.querySelector('.food_protein_index').classList.add('initialized');
});
