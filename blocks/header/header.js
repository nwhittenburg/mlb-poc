import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const { locale } = getConfig();
const HEADER_PATH = '/fragments/nav/header';
const DEBOUNCE_MS = 400;
const MIN_SEARCH_LENGTH = 2;

let debounceTimer = null;

function clearActiveState() {
  document.querySelectorAll('header .main-nav-item.is-active').forEach((el) => {
    el.classList.remove('is-active');
  });
}

function closeAllMenus() {
  document.querySelectorAll('header .main-nav-item.is-open').forEach((el) => {
    el.classList.remove('is-open');
  });
  clearActiveState();
}

function clearSearchUI() {
  const header = document.querySelector('header');
  if (!header) return;
  const input = header.querySelector('.search-input');
  if (input) input.value = '';
  import('../search-results/search-results.js').then(({ clearSearchResults }) => {
    clearSearchResults();
  });
}

function closeSearch() {
  const header = document.querySelector('header');
  if (!header) return;
  header.classList.remove('search-open');
  clearSearchUI();
}

function triggerSearch(input) {
  const term = input.value.trim();
  if (term.length < MIN_SEARCH_LENGTH) return;
  import('../search-results/search-results.js').then(({ performSearch }) => {
    performSearch(term);
  });
}

function handleSearchInput(input) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => triggerSearch(input), DEBOUNCE_MS);
}

function onDocClick(e) {
  const header = document.querySelector('header');
  if (!header) return;

  const clickedInsideMenu = e.target.closest('header .main-nav-item.is-open')
    || e.target.closest('header .main-nav-link');
  if (!clickedInsideMenu) closeAllMenus();

  const clickedInsideSearch = e.target.closest('header .search-section')
    || e.target.closest('header .search-button');
  if (!clickedInsideSearch && header.classList.contains('search-open')) {
    closeSearch();
  }
}

function toggleSearch() {
  const header = document.querySelector('header');
  if (!header || window.innerWidth < 900) return;

  if (header.classList.contains('search-open')) {
    closeSearch();
    return;
  }

  closeAllMenus();
  header.classList.add('search-open');
  const searchInput = header.querySelector('.search-input');
  if (searchInput) setTimeout(() => searchInput.focus(), 100);
}

function toggleMenu(li) {
  const isOpen = li.classList.contains('is-open');
  closeAllMenus();
  if (!isOpen) {
    li.classList.add('is-open');
    li.classList.add('is-active');
  }
}

function decorateNavToggle(btn) {
  btn.addEventListener('click', () => {
    const header = document.querySelector('header');
    if (!header) return;
    const isOpen = header.classList.toggle('is-mobile-open');
    btn.setAttribute('aria-expanded', isOpen.toString());
    if (!isOpen) clearSearchUI();
  });
}

function decorateMenu(li) {
  const nestedList = li.querySelector(':scope > ul');
  if (!nestedList) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'menu';
  wrapper.append(nestedList);
  li.append(wrapper);
  return wrapper;
}

function decorateNavItem(li) {
  li.classList.add('main-nav-item');
  const link = li.querySelector(':scope > p > a');
  const textNode = li.querySelector(':scope > p');
  const menu = decorateMenu(li);

  li.addEventListener('mouseenter', () => {
    li.classList.add('is-active');
  });
  li.addEventListener('mouseleave', () => {
    li.classList.remove('is-active');
  });

  if (menu) {
    if (textNode) {
      textNode.classList.add('main-nav-link');
      textNode.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu(li);
      });
    }
  } else if (link) {
    link.classList.add('main-nav-link');
    link.addEventListener('click', () => {
      clearActiveState();
      li.classList.add('is-active');
    });
  }
}

function decorateBrandSection(section) {
  section.classList.add('brand-section');
  const icons = section.querySelectorAll('.icon');

  if (icons.length > 1) {
    const separator = document.createElement('span');
    separator.className = 'brand-separator';
    icons[0].after(separator);
  }

  const hamburger = document.createElement('button');
  hamburger.className = 'nav-toggle';
  hamburger.setAttribute('aria-label', 'Toggle navigation menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '&#9776;';

  section.querySelector('.default-content').append(hamburger);
  decorateNavToggle(hamburger);
}

function decorateNavSection(section) {
  section.classList.add('main-nav-section');
  const navContent = section.querySelector('.default-content');
  const navList = section.querySelector('ul');
  if (!navList) return;
  navList.classList.add('main-nav-list');

  const nav = document.createElement('nav');
  nav.append(navList);
  navContent.append(nav);

  section.querySelectorAll('nav > ul > li').forEach(decorateNavItem);

}

async function decorateActionSection(section) {
  section.classList.add('actions-section');
  const searchIcon = section.querySelector('.icon-search');
  if (!searchIcon) return;

  const searchButton = document.createElement('button');
  searchButton.className = 'search-button';
  searchButton.setAttribute('aria-label', 'Search');
  searchButton.setAttribute('type', 'button');
  searchButton.appendChild(searchIcon.cloneNode(true));

  const closeIcon = document.createElement('span');
  closeIcon.className = 'icon-close';
  closeIcon.textContent = '\u00d7';
  searchButton.appendChild(closeIcon);

  searchIcon.parentNode.replaceChild(searchButton, searchIcon);
  searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSearch();
  });
}

async function createSearchSection() {
  const searchSection = document.createElement('div');
  searchSection.className = 'search-section';

  const form = document.createElement('form');
  form.className = 'search-form';

  const searchBtn = document.createElement('button');
  searchBtn.type = 'submit';
  searchBtn.className = 'search-icon-btn';
  searchBtn.setAttribute('aria-label', 'Submit search');

  try {
    const resp = await fetch('/img/icons/search-dark.svg');
    searchBtn.innerHTML = await resp.text();
    const svg = searchBtn.querySelector('svg');
    if (svg) svg.classList.add('icon', 'icon-search-dark');
  } catch {
    searchBtn.textContent = '\uD83D\uDD0D';
  }

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'search-input';
  input.className = 'search-input';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');
  input.setAttribute('autocomplete', 'off');

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'search-clear';
  clearBtn.setAttribute('aria-label', 'Clear search');
  clearBtn.textContent = '\u00d7';

  form.append(searchBtn, input, clearBtn);
  searchSection.append(form);

  input.addEventListener('input', () => handleSearchInput(input));

  clearBtn.addEventListener('click', () => {
    clearSearchUI();
    input.focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer);
    triggerSearch(input);
  });

  return searchSection;
}

async function decorateHeader(fragment) {
  const sections = fragment.querySelectorAll(':scope > .section');
  if (sections[0]) decorateBrandSection(sections[0]);
  if (sections[1]) decorateNavSection(sections[1]);
  if (sections[2]) await decorateActionSection(sections[2]);

  const searchSection = await createSearchSection();
  fragment.append(searchSection);

  document.addEventListener('click', onDocClick);
}

/**
 * loads and decorates the header
 * @param {Element} el The header element
 */
export default async function init(el) {
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;

  const fragment = await loadFragment(`${locale.prefix}${path}`);
  if (fragment) {
    fragment.classList.add('header-content');
    await decorateHeader(fragment);
    el.append(fragment);
  }
}
