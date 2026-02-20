const RESULTS_PER_PAGE = 5;
const SEARCH_INDEX_PATH = '/search-index.json';

let searchIndex = null;
let indexPromise = null;
let currentPage = 0;
let currentResults = [];
let currentSearchTerm = '';

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

function searchContent(term) {
  if (!term || term.length < 2 || !Array.isArray(searchIndex)) return [];
  const lower = term.toLowerCase();
  return searchIndex.filter((item) => {
    const t = (item.title || '').toLowerCase();
    const c = (item.content || '').toLowerCase();
    const p = (item.path || '').toLowerCase();
    return t.includes(lower) || c.includes(lower) || p.includes(lower);
  });
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


function getTotalPages() {
  return Math.ceil(currentResults.length / RESULTS_PER_PAGE);
}

function renderPage() {
  const container = document.querySelector('header .search-results');
  if (!container) return;

  const totalPages = getTotalPages();
  const start = currentPage * RESULTS_PER_PAGE;
  const pageResults = currentResults.slice(start, start + RESULTS_PER_PAGE);

  const list = container.querySelector('.search-results-list');
  list.innerHTML = pageResults.map((item) => {
    const desc = item.description || item.content || '';
    const excerpt = getExcerpt(desc, currentSearchTerm);
    return `
      <div class="search-result-item">
        <h3><a href="${item.path}">${item.title || 'Untitled'}</a></h3>
        ${excerpt ? `<p class="search-result-excerpt">${excerpt}</p>` : ''}
      </div>`;
  }).join('');

  const nav = container.querySelector('.search-results-nav');
  if (totalPages > 1) {
    nav.innerHTML = `
      <div class="search-results-nav-pill">
        <button class="search-nav-prev" aria-label="Previous page"${currentPage === 0 ? ' disabled' : ''}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" fill="#e0e0e0" stroke="#ccc" stroke-width="1"/>
            <path d="M16 9L11 14L16 19" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="search-nav-dots">
          ${Array.from({ length: totalPages }, (_, i) => `<button class="search-nav-dot${i === currentPage ? ' active' : ''}" aria-label="Page ${i + 1}" data-page="${i}"></button>`).join('')}
        </div>
        <button class="search-nav-next" aria-label="Next page"${currentPage === totalPages - 1 ? ' disabled' : ''}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="13" fill="#e0e0e0" stroke="#ccc" stroke-width="1"/>
            <path d="M12 9L17 14L12 19" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>`;
    nav.hidden = false;
  } else {
    nav.innerHTML = '';
    nav.hidden = true;
  }
}

function attachNavListeners(container) {
  container.addEventListener('click', (e) => {
    const prev = e.target.closest('.search-nav-prev');
    const next = e.target.closest('.search-nav-next');
    const dot = e.target.closest('.search-nav-dot');

    if (prev || next || dot) e.stopPropagation();

    if (prev && currentPage > 0) {
      currentPage -= 1;
      renderPage();
    } else if (next && currentPage < getTotalPages() - 1) {
      currentPage += 1;
      renderPage();
    } else if (dot) {
      currentPage = Number(dot.dataset.page);
      renderPage();
    }
  });
}

function renderSearchResults(results, searchTerm) {
  const searchSection = document.querySelector('header .search-section');
  if (!searchSection) return;

  let wrapper = searchSection.querySelector('.search-results');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'search-results';
    wrapper.innerHTML = `
      <h2></h2>
      <div class="search-results-list"></div>
      <nav class="search-results-nav" aria-label="Search results pagination"></nav>`;
    searchSection.appendChild(wrapper);
    attachNavListeners(wrapper);
  }

  currentResults = results;
  currentSearchTerm = searchTerm;
  currentPage = 0;

  wrapper.querySelector('h2').textContent = `Search results (${results.length})`;
  renderPage();
}

export function clearSearchResults() {
  const wrapper = document.querySelector('header .search-results');
  if (wrapper) wrapper.remove();
  currentResults = [];
  currentSearchTerm = '';
  currentPage = 0;
}

export default async function decorate() {
  await getSearchIndex();
}

export async function performSearch(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) return;
  await getSearchIndex();
  const results = searchContent(searchTerm);
  renderSearchResults(results, searchTerm);
}
