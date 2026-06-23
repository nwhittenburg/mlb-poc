import { trackSearch } from '../../scripts/analytics.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

const INDEX_PATH = '/use-cases-index.json';
const PAGE_SIZE = 12;

function toPropertyKey(label) {
  return label.trim().toLowerCase().replace(/\s+/g, '-');
}

async function fetchUseCases() {
  const resp = await fetch(INDEX_PATH);
  if (!resp.ok) return [];
  const json = await resp.json();
  return (json.data || json)
    .map((item) => Object.fromEntries(
      Object.entries(item).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
    ))
    .filter((item) => item.title)
    .sort((a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }));
}

function getDistinctValues(data, key) {
  const values = new Set();
  data.forEach((item) => { if (item[key]) values.add(item[key]); });
  return [...values].sort();
}

function applyFilters(data, activeFilters) {
  return data.filter((item) => Object.entries(activeFilters).every(
    ([key, values]) => values.size === 0 || values.has(item[key]),
  ));
}

function buildInternalSearchTermFiltersString(filterDefs, activeFilters, ph) {
  const allLabel = ph.all || 'All';
  return filterDefs
    .map(({ label, key }) => {
      const values = activeFilters[key];
      const display = values.size === 0 ? allLabel : [...values].join(', ');
      return `${label}=${display}`;
    })
    .join(' | ');
}

function closeAllDropdowns(bar, except) {
  bar.querySelectorAll('.ucl-dropdown.open').forEach((dd) => {
    if (dd !== except) {
      dd.classList.remove('open');
      dd.querySelector('.ucl-dropdown-trigger').setAttribute('aria-expanded', 'false');
    }
  });
}

function createDropdown(label, key, options, ph) {
  const group = document.createElement('div');
  group.classList.add('use-case-library-filter');

  const labelEl = document.createElement('span');
  labelEl.classList.add('ucl-label');
  labelEl.textContent = label;

  const dd = document.createElement('div');
  dd.classList.add('ucl-dropdown');
  dd.dataset.key = key;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.classList.add('ucl-dropdown-trigger');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerText = document.createElement('span');
  triggerText.classList.add('ucl-dropdown-text');
  triggerText.textContent = ph.all || 'All';
  trigger.appendChild(triggerText);

  const chevron = document.createElement('span');
  chevron.classList.add('ucl-dropdown-chevron');
  chevron.innerHTML = '<svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  trigger.appendChild(chevron);

  const list = document.createElement('ul');
  list.classList.add('ucl-dropdown-list');
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-multiselectable', 'true');
  list.setAttribute('aria-label', label);

  const allItem = document.createElement('li');
  allItem.setAttribute('role', 'option');
  allItem.setAttribute('aria-selected', 'true');
  allItem.dataset.value = '';
  allItem.textContent = ph.all || 'All';
  allItem.classList.add('selected');
  list.appendChild(allItem);

  options.forEach((val) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.dataset.value = val;
    li.textContent = val;
    list.appendChild(li);
  });

  dd.appendChild(trigger);
  dd.appendChild(list);
  group.appendChild(labelEl);
  group.appendChild(dd);
  return group;
}

function buildFilterBar(filterDefs, data, ph) {
  const bar = document.createElement('div');
  bar.classList.add('use-case-library-filters');
  filterDefs.forEach(({ label, key }) => {
    bar.appendChild(createDropdown(label, key, getDistinctValues(data, key), ph));
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.ucl-dropdown')) closeAllDropdowns(bar);
  });

  return bar;
}

function createCard(item, ph) {
  const card = document.createElement('a');
  card.classList.add('use-case-card');
  card.href = item.path;

  if (item.image) {
    const imgWrap = document.createElement('div');
    imgWrap.classList.add('use-case-card-image');
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title;
    img.loading = 'lazy';
    imgWrap.appendChild(img);
    card.appendChild(imgWrap);
  }

  const content = document.createElement('div');
  content.classList.add('use-case-card-content');

  const title = document.createElement('h3');
  title.textContent = item.title;
  content.appendChild(title);

  if (item.description) {
    const desc = document.createElement('p');
    desc.textContent = item.description;
    content.appendChild(desc);
  }

  const cta = document.createElement('div');
  cta.classList.add('use-case-card-cta');
  const span = document.createElement('span');
  span.classList.add('btn-primary');
  span.textContent = ph.learnMore || 'Learn more';
  cta.appendChild(span);
  content.appendChild(cta);

  card.appendChild(content);
  return card;
}

function renderCards(grid, data, loadMoreEl, visibleCount, ph) {
  grid.textContent = '';

  if (data.length === 0) {
    const empty = document.createElement('p');
    empty.classList.add('use-case-library-empty');
    empty.textContent = ph.noUseCasesMatch || 'No use cases match the selected filters.';
    grid.appendChild(empty);
    loadMoreEl.hidden = true;
    return;
  }

  const fragment = document.createDocumentFragment();
  data.slice(0, visibleCount).forEach((item) => fragment.appendChild(createCard(item, ph)));
  grid.appendChild(fragment);
  loadMoreEl.hidden = visibleCount >= data.length;
}

function buildLoadMore(ph) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('use-case-library-load-more');
  const btn = document.createElement('button');
  btn.type = 'button';
  const text = ph.seeMoreUseCases || 'See more use cases';
  btn.innerHTML = `${text} <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  wrapper.appendChild(btn);
  return wrapper;
}

export default async function decorate(block) {
  const filterDefs = [...block.querySelectorAll(':scope > div')]
    .map((row) => {
      const label = row.textContent.trim();
      return { label, key: toPropertyKey(label) };
    })
    .filter(({ label }) => label);

  block.textContent = '';

  const [data, ph] = await Promise.all([fetchUseCases(), fetchPlaceholders()]);
  const activeFilters = {};
  filterDefs.forEach(({ key }) => { activeFilters[key] = new Set(); });

  const filterBar = buildFilterBar(filterDefs, data, ph);
  const grid = document.createElement('div');
  grid.classList.add('use-case-library-grid');
  const loadMore = buildLoadMore(ph);

  block.appendChild(filterBar);
  block.appendChild(grid);
  block.appendChild(loadMore);

  let visibleCount = PAGE_SIZE;
  let filtered = data;
  renderCards(grid, filtered, loadMore, visibleCount, ph);

  filterBar.addEventListener('click', (e) => {
    const trigger = e.target.closest('.ucl-dropdown-trigger');
    if (trigger) {
      const dd = trigger.closest('.ucl-dropdown');
      const opening = !dd.classList.contains('open');
      closeAllDropdowns(filterBar, dd);
      dd.classList.toggle('open', opening);
      trigger.setAttribute('aria-expanded', String(opening));
      return;
    }

    const li = e.target.closest('.ucl-dropdown-list li');
    if (!li) return;
    const dd = li.closest('.ucl-dropdown');
    const key = dd.dataset.key;
    const values = activeFilters[key];

    if (li.dataset.value === '') {
      values.clear();
    } else if (values.has(li.dataset.value)) {
      values.delete(li.dataset.value);
    } else {
      values.add(li.dataset.value);
    }

    dd.querySelectorAll('li').forEach((item) => {
      const isAll = item.dataset.value === '';
      const sel = isAll ? values.size === 0 : values.has(item.dataset.value);
      item.classList.toggle('selected', sel);
      item.setAttribute('aria-selected', String(sel));
    });

    const ph2 = ph.all || 'All';
    // eslint-disable-next-line no-nested-ternary
    dd.querySelector('.ucl-dropdown-text').textContent = values.size === 0 ? ph2 : values.size === 1 ? [...values][0] : `${values.size} selected`;

    visibleCount = PAGE_SIZE;
    filtered = applyFilters(data, activeFilters);
    renderCards(grid, filtered, loadMore, visibleCount, ph);

    trackSearch({
      searchTerm: '',
      resultCount: filtered.length,
      searchResultsPageType: 'Use Case Library',
      internalSearchTermFilters: buildInternalSearchTermFiltersString(
        filterDefs,
        activeFilters,
        ph,
      ),
    });
  });

  loadMore.querySelector('button').addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderCards(grid, filtered, loadMore, visibleCount, ph);
  });
}
