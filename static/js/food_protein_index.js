// Configuration
const CONFIG = {
  DEBOUNCE_DELAY: 150,
  SEARCH_THRESHOLD: -10000,
  SEARCH_LIMIT: 100,
  VIRTUAL_SCROLL_THRESHOLD: 100
};

document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('food-search');
  const clearBtn = document.getElementById('clear-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const tableBody = document.getElementById('food-table-body');
  const resultsCount = document.getElementById('results-count');
  const noResults = document.getElementById('no-results');
  const foodTable = document.getElementById('food-table');

  // Cache DOM elements and create optimized data structure
  const allRows = Array.from(tableBody.querySelectorAll('.food-row'));
  const totalFoods = allRows.length;
  let currentFilter = 'all';
  let filteredRows = allRows;
  let displayedRows = allRows;

  // Pre-process data for better performance
  const searchableData = allRows.map((row, index) => ({
    element: row,
    foodName: row.querySelector('.food-name').textContent,
    group: row.getAttribute('data-group'),
    index: index
  }));

  // Create a map for faster group filtering
  const groupMap = new Map();
  searchableData.forEach(item => {
    if (!groupMap.has(item.group)) {
      groupMap.set(item.group, []);
    }
    groupMap.get(item.group).push(item);
  });

  // Optimized search function
  function performSearch(query) {
    if (!query.trim()) {
      return searchableData;
    }

    try {
      const fuzzyResults = fuzzysort.go(query, searchableData, {
        key: 'foodName',
        threshold: CONFIG.SEARCH_THRESHOLD,
        limit: CONFIG.SEARCH_LIMIT
      });
      return fuzzyResults.map(result => result.obj);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  // Optimized filter application
  function applyFilters(searchResults, group) {
    if (group === 'all') {
      return searchResults;
    }
    return searchResults.filter(item => item.group === group);
  }

  // Optimized display update with virtual scrolling consideration
  function updateDisplay() {
    const searchQuery = searchInput.value.trim();

    // Show initial state for empty search
    if (!searchQuery && currentFilter === 'all') {
      showInitialState();
      return;
    }

    // Get filtered results
    const searchResults = performSearch(searchQuery);
    displayedRows = applyFilters(searchResults, currentFilter);

    // Use document fragment for efficient DOM updates
    const fragment = document.createDocumentFragment();

    // Consider virtual scrolling for large datasets
    const itemsToShow = displayedRows.length > CONFIG.VIRTUAL_SCROLL_THRESHOLD
      ? displayedRows.slice(0, CONFIG.VIRTUAL_SCROLL_THRESHOLD)
      : displayedRows;

    itemsToShow.forEach(item => {
      // Use original element instead of cloning when possible
      fragment.appendChild(item.element);
    });

    // Batch DOM updates
    requestAnimationFrame(() => {
      tableBody.innerHTML = '';
      tableBody.appendChild(fragment);
      updateResultsInfo(displayedRows.length);

      if (displayedRows.length === 0) {
        showNoResults();
      } else {
        showResults();

        // Show "load more" indicator if using virtual scrolling
        if (displayedRows.length > CONFIG.VIRTUAL_SCROLL_THRESHOLD) {
          showLoadMoreIndicator();
        }
      }
    });
  }

  function showInitialState() {
    tableBody.innerHTML = '';
    resultsCount.innerHTML = `<strong>${totalFoods}</strong> foods.`;
    noResults.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <h3 style="margin-bottom: 16px; color: var(--food-text);">🔍 Start typing to search through the database.</h3>
        <p style="margin-bottom: 20px; font-size: 16px;">
          Search through <strong>${totalFoods} foods</strong> to find protein content and nutritional information.
        </p>
        <p style="color: var(--food-no-data); font-size: 14px;">
          Try searching for "peanut butter", "pecans", "lobster", or any other foods.
        </p>
      </div>
    `;
    noResults.style.display = 'block';
    foodTable.style.display = 'none';
  }

  function updateResultsInfo(count) {
    resultsCount.textContent = `${count} food${count !== 1 ? 's' : ''}`;
  }

  function showNoResults() {
    noResults.innerHTML = '<p>No foods match your search criteria.</p>';
    noResults.style.display = 'block';
    foodTable.style.display = 'none';
  }

  function showResults() {
    noResults.style.display = 'none';
    foodTable.style.display = '';
  }

  function showLoadMoreIndicator() {
    // Implementation for "Load More" functionality
    const loadMoreDiv = document.createElement('div');
    loadMoreDiv.className = 'load-more-indicator';
    loadMoreDiv.innerHTML = `<p>Showing first ${CONFIG.VIRTUAL_SCROLL_THRESHOLD} results. Refine your search for better results.</p>`;
    tableBody.appendChild(loadMoreDiv);
  }

  // Debounced search with improved performance
  const debouncedSearch = debounce(updateDisplay, CONFIG.DEBOUNCE_DELAY);

  // Event listeners
  searchInput.addEventListener('input', function() {
    debouncedSearch();
  });

  clearBtn.addEventListener('click', function() {
    searchInput.value = '';

    // Reset filter
    filterBtns.forEach(b => b.classList.remove('active'));
    filterBtns[0].classList.add('active');
    currentFilter = 'all';

    updateDisplay();
    searchInput.focus();
  });

  // Optimized filter button handling
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const newFilter = this.getAttribute('data-group');

      // Skip if same filter
      if (currentFilter === newFilter) return;

      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      currentFilter = newFilter;
      updateDisplay();
    });
  });

  // Enhanced keyboard navigation
  searchInput.addEventListener('keydown', function(e) {
    switch (e.key) {
      case 'Escape':
        this.value = '';
        updateDisplay();
        break;
      case 'ArrowDown':
        e.preventDefault();
        // Focus first result if available
        const firstRow = tableBody.querySelector('.food-row');
        if (firstRow) firstRow.focus();
        break;
    }
  });

  // Initialize
  updateDisplay();
  document.querySelector('.food_protein_index').classList.add('initialized');
});

// Utility functions
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
