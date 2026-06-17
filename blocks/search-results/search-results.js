import { trackSearch } from '../../scripts/analytics.js';

const RESULTS_PER_PAGE = 5;
const SEARCH_INDEX_PATH = '/search-index.json';

let searchIndex = null;
let indexPromise = null;

const state = {
  page: 0,
  allResults: [],
  filteredResults: [],
  searchTerm: '',
  selectedTypes: [],
  selectedSolutions: [],
  resourceTypeFilter: null,
  solutionFilter: null,
};

// ─── Index ────────────────────────────────────────────────────────────────────

async function getSearchIndex() {
  if (searchIndex) return searchIndex;
  if (!indexPromise) {
    indexPromise = fetch(SEARCH_INDEX_PATH)
      .then((r) => r.json())
      .then((data) => {
        searchIndex = Array.isArray(data) ? data : (data?.data ?? []);
        return searchIndex;
      })
      .catch(() => {
        searchIndex = [];
        return searchIndex;
      });
  }
  return indexPromise;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getResourceTypeFromPath(path) {
  const segment = (path || '').split('/').filter(Boolean)[0] || '';
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripLinks(text) {
  if (!text) return '';
  return text
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/\/fragments\/[^\s]+/gi, '')
    .replace(/\/[a-z0-9-]+\/[a-z0-9-]+\.[a-z]+/gi, '');
}

function getExcerpt(content, term) {
  if (!content) return '';
  const clean = stripLinks(content);
  const lower = clean.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  const maxLen = 150;

  if (idx === -1) return clean.substring(0, maxLen).concat(clean.length > maxLen ? '...' : '');

  const start = Math.max(0, idx - 50);
  const end = Math.min(clean.length, start + maxLen);
  let excerpt = clean.substring(start, end);
  if (start > 0) excerpt = `...${excerpt}`;
  if (end < clean.length) excerpt = `${excerpt}...`;
  return excerpt;
}

function searchContent(term) {
  if (!term || term.length < 2) return [];
  const lower = term.toLowerCase();
  return searchIndex.filter((item) => {
    if ((item.path || '').startsWith('/need-access')) return false;
    const t = (item.title || '').toLowerCase();
    const c = (item.content || '').toLowerCase();
    const p = (item.path || '').toLowerCase();
    return t.includes(lower) || c.includes(lower) || p.includes(lower);
  });
}

// ─── Multi-select filter dropdown ────────────────────────────────────────────

function closeAllFilters(filtersBar) {
  filtersBar.querySelectorAll('.sr-dropdown.open').forEach((dd) => {
    dd.classList.remove('open');
    dd.querySelector('.sr-dropdown-trigger').setAttribute('aria-expanded', 'false');
  });
}

function createMultiSelectFilter(labelText, filtersBar, onChange) {
  const group = document.createElement('div');
  group.className = 'sr-filter';

  const labelEl = document.createElement('span');
  labelEl.className = 'sr-filter-label';
  labelEl.textContent = labelText;

  const dd = document.createElement('div');
  dd.className = 'sr-dropdown';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'sr-dropdown-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerText = document.createElement('span');
  triggerText.className = 'sr-dropdown-text';
  triggerText.textContent = 'All';

  const chevron = document.createElement('span');
  chevron.className = 'sr-dropdown-chevron';
  chevron.innerHTML = '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  trigger.append(triggerText, chevron);

  const list = document.createElement('ul');
  list.className = 'sr-dropdown-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-multiselectable', 'true');
  list.setAttribute('aria-label', labelText);

  dd.append(trigger, list);
  group.append(labelEl, dd);

  const selected = new Set();

  function getValueText() {
    if (selected.size === 0) return 'All';
    if (selected.size === 1) return [...selected][0];
    return `${selected.size} selected`;
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dd.classList.contains('open');
    closeAllFilters(filtersBar);
    if (!isOpen) {
      dd.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const { value } = li.dataset;
    if (selected.has(value)) {
      selected.delete(value);
      li.classList.remove('selected');
      li.setAttribute('aria-selected', 'false');
    } else {
      selected.add(value);
      li.classList.add('selected');
      li.setAttribute('aria-selected', 'true');
    }
    triggerText.textContent = getValueText();
    onChange([...selected]);
  });

  group.clearSelection = () => {
    selected.clear();
    list.querySelectorAll('li').forEach((li) => {
      li.classList.remove('selected');
      li.setAttribute('aria-selected', 'false');
    });
    triggerText.textContent = 'All';
  };

  group.updateOptions = (options) => {
    list.innerHTML = '';
    selected.clear();
    triggerText.textContent = 'All';
    options.forEach((val) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.dataset.value = val;
      li.textContent = val;
      list.appendChild(li);
    });
  };

  return group;
}

// ─── Results panel rendering ──────────────────────────────────────────────────

function applyFilters() {
  state.filteredResults = state.allResults.filter((item) => {
    const rt = getResourceTypeFromPath(item.path);
    const matchesType = state.selectedTypes.length === 0 || state.selectedTypes.includes(rt);
    const matchesSolution = state.selectedSolutions.length === 0
      || state.selectedSolutions.includes(item['solution-type']);
    return matchesType && matchesSolution;
  });
}

function buildNavPill(totalPages, currentPage) {
  const prevArrow = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#e0e0e0" stroke="#ccc" stroke-width="1"/>
    <path d="M16 9L11 14L16 19" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  const nextArrow = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="13" fill="#e0e0e0" stroke="#ccc" stroke-width="1"/>
    <path d="M12 9L17 14L12 19" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  const dots = Array.from(
    { length: totalPages },
    (_, i) => `<button class="search-nav-dot${i === currentPage ? ' active' : ''}" aria-label="Page ${i + 1}" data-page="${i}"></button>`,
  ).join('');

  return `<div class="search-results-nav-pill">
    <button class="search-nav-prev" aria-label="Previous page"${currentPage === 0 ? ' disabled' : ''}>${prevArrow}</button>
    <div class="search-nav-dots">${dots}</div>
    <button class="search-nav-next" aria-label="Next page"${currentPage === totalPages - 1 ? ' disabled' : ''}>${nextArrow}</button>
  </div>`;
}

function renderPage() {
  const container = document.querySelector('header .search-results');
  if (!container) return;

  const totalPages = Math.ceil(state.filteredResults.length / RESULTS_PER_PAGE);
  const start = state.page * RESULTS_PER_PAGE;
  const pageResults = state.filteredResults.slice(start, start + RESULTS_PER_PAGE);

  container.querySelector('.search-results-heading').textContent = `Search results (${state.filteredResults.length})`;

  container.querySelector('.search-results-list').innerHTML = pageResults
    .map((item) => {
      const excerpt = getExcerpt(item.description || item.content || '', state.searchTerm);
      return `<div class="search-result-item">
        <h3><a href="${item.path}">${item.title || 'Untitled'}</a></h3>
        ${excerpt ? `<p class="search-result-excerpt">${excerpt}</p>` : ''}
      </div>`;
    })
    .join('');

  const nav = container.querySelector('.search-results-nav');
  if (totalPages > 1) {
    nav.innerHTML = buildNavPill(totalPages, state.page);
    nav.hidden = false;
  } else {
    nav.innerHTML = '';
    nav.hidden = true;
  }
}

function buildResultsPanel(searchSection) {
  const wrapper = document.createElement('div');
  wrapper.className = 'search-results';

  const heading = document.createElement('h2');
  heading.className = 'search-results-heading';

  const filtersBar = document.createElement('div');
  filtersBar.className = 'search-results-filters';
  filtersBar.setAttribute('aria-label', 'Filter search results');

  state.resourceTypeFilter = createMultiSelectFilter('Resource Type', filtersBar, (sel) => {
    state.selectedTypes = sel;
    applyFilters();
    state.page = 0;
    renderPage();
  });

  state.solutionFilter = createMultiSelectFilter('Solution', filtersBar, (sel) => {
    state.selectedSolutions = sel;
    applyFilters();
    state.page = 0;
    renderPage();
  });

  const clearBtn = document.createElement('button');
  clearBtn.className = 'search-results-clear';
  clearBtn.type = 'button';
  clearBtn.textContent = 'Clear Filters';
  clearBtn.addEventListener('click', () => {
    state.selectedTypes = [];
    state.selectedSolutions = [];
    state.resourceTypeFilter.clearSelection();
    state.solutionFilter.clearSelection();
    applyFilters();
    state.page = 0;
    renderPage();
  });

  filtersBar.append(state.resourceTypeFilter, state.solutionFilter, clearBtn);

  const list = document.createElement('div');
  list.className = 'search-results-list';

  const nav = document.createElement('nav');
  nav.className = 'search-results-nav';
  nav.setAttribute('aria-label', 'Search results pagination');
  nav.hidden = true;

  wrapper.append(heading, filtersBar, list, nav);
  searchSection.appendChild(wrapper);

  wrapper.addEventListener('click', (e) => {
    const prev = e.target.closest('.search-nav-prev');
    const next = e.target.closest('.search-nav-next');
    const dot = e.target.closest('.search-nav-dot');
    const totalPages = Math.ceil(state.filteredResults.length / RESULTS_PER_PAGE);

    if (prev || next || dot) e.stopPropagation();
    if (prev && state.page > 0) {
      state.page -= 1;
      renderPage();
    } else if (next && state.page < totalPages - 1) {
      state.page += 1;
      renderPage();
    } else if (dot) {
      state.page = Number(dot.dataset.page);
      renderPage();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('header .sr-dropdown')) closeAllFilters(filtersBar);
  });

  return wrapper;
}

function renderSearchResults(results, searchTerm) {
  const searchSection = document.querySelector('header .search-section');
  if (!searchSection) return;

  if (!searchSection.querySelector('.search-results')) {
    buildResultsPanel(searchSection);
  }

  state.allResults = results;
  state.searchTerm = searchTerm;
  state.page = 0;
  state.selectedTypes = [];
  state.selectedSolutions = [];

  const resourceTypeOptions = [
    ...new Set(results.map((r) => getResourceTypeFromPath(r.path))),
  ].sort();
  const solutionOptions = [...new Set(results.map((r) => r['solution-type']).filter(Boolean))].sort();

  state.resourceTypeFilter.updateOptions(resourceTypeOptions);
  state.solutionFilter.updateOptions(solutionOptions);

  applyFilters();
  renderPage();

  trackSearch({ searchTerm, resultCount: results.length });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function clearSearchResults() {
  const wrapper = document.querySelector('header .search-results');
  if (wrapper) wrapper.remove();
  Object.assign(state, {
    page: 0,
    allResults: [],
    filteredResults: [],
    searchTerm: '',
    selectedTypes: [],
    selectedSolutions: [],
    resourceTypeFilter: null,
    solutionFilter: null,
  });
}

export async function performSearch(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return;
  await getSearchIndex();
  renderSearchResults(searchContent(searchTerm), searchTerm);
}

export default async function decorate() {
  await getSearchIndex();
}
