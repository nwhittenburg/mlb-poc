let searchIndex = [];

async function loadSearchIndex() {
  try {
    const response = await fetch('/search-index.json');
    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      // Direct array
      searchIndex = data;
    } else if (data.data && Array.isArray(data.data)) {
      // Object with data property containing array
      searchIndex = data.data;
    } else {
      console.error('Search index format not recognized:', data);
      searchIndex = [];
    }
    
    console.log('Search index loaded:', searchIndex.length, 'items');
  } catch (e) {
    console.error('Failed to load search index:', e);
  }
}

function searchContent(term) {
  if (!term || term.length < 2) return [];

  // Ensure searchIndex is an array before filtering
  if (!Array.isArray(searchIndex)) {
    console.error('searchIndex is not an array:', searchIndex);
    return [];
  }

  const lowerTerm = term.toLowerCase();
  return searchIndex.filter((item) => {
    const title = (item.title || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    const path = (item.path || '').toLowerCase();

    return title.includes(lowerTerm) || content.includes(lowerTerm) || path.includes(lowerTerm);
  });
}

function getExcerpt(content, term, length = 150) {
  if (!content) return '';

  const lowerContent = content.toLowerCase();
  const lowerTerm = term.toLowerCase();
  const index = lowerContent.indexOf(lowerTerm);

  if (index === -1) {
    return removeHtmlLinks(content.substring(0, length).concat('...'));
  }

  const start = Math.max(0, index - 50);
  const end = Math.min(content.length, start + length);
  let excerpt = content.substring(start, end);

  if (start > 0) excerpt = `...${excerpt}`;
  if (end < content.length) excerpt = `${excerpt}...`;

  return removeHtmlLinks(excerpt);
}

function removeHtmlLinks(text) {
  if (!text) return '';
  
  let result = text;
  
  // Remove HTML anchor tags but keep the text content
  result = result.replace(/<a[^>]*href="[^"]*"[^>]*>([^<]*)<\/a>/gi, '$1');
  
  // Remove plain text URLs (http://, https://, etc.)
  result = result.replace(/https?:\/\/[^\s]+/gi, '');
  
  return result;
}

function renderSearchResults(results, searchTerm) {
  // Find the search-section element
  const searchSection = document.querySelector('header .search-section');
  if (!searchSection) {
    console.error('Search section not found');
    return;
  }

  console.log('Rendering search results:', results.length);

  // Remove any existing search results first
  const existingResults = searchSection.querySelector('.search-results');
  if (existingResults) {
    existingResults.remove();
  }

  const resultsHTML = `
    <div class="search-results">
      <h2>Search results (${results.length})</h2>
      <div class="search-results-list">
        ${results.map((item) => `
          <div class="search-result-item">
            <h3><a href="${item.path}">${item.title || 'Untitled'}</a></h3>
            <p class="search-result-excerpt">${getExcerpt(item.content, searchTerm)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const resultsDiv = document.createElement('div');
  resultsDiv.innerHTML = resultsHTML;
  
  // Append inside the search-section
  searchSection.appendChild(resultsDiv.firstElementChild);
  console.log('Results appended inside search-section');
}

export default async function decorate(block) {
  await loadSearchIndex();
}

export async function performSearch(searchTerm) {
  if (!searchTerm || searchTerm.length < 2) {
    console.log('Search term too short');
    return;
  }

  // Load the search index if not already loaded
  if (searchIndex.length === 0) {
    await loadSearchIndex();
  }

  const results = searchContent(searchTerm);
  renderSearchResults(results, searchTerm);
}
