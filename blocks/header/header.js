import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const { locale } = getConfig();

const HEADER_PATH = '/fragments/nav/header';

function closeAllMenus() {
  const openMenus = document.body.querySelectorAll('header .is-open');
  for (const openMenu of openMenus) {
    openMenu.classList.remove('is-open');
  }
}

function closeSearch() {
  const header = document.body.querySelector('header');
  if (header && window.innerWidth >= 900) {
    header.classList.remove('search-open');
  }
}

function docCloseSearch(e) {
  if (e.target.closest('header .search-section') || e.target.closest('header .search-button')) return;
  closeSearch();
}

function toggleSearch() {
  const header = document.body.querySelector('header');
  if (!header || window.innerWidth < 900) return;

  const isOpen = header.classList.contains('search-open');
  
  if (isOpen) {
    closeSearch();
    return;
  }

  header.classList.add('search-open');
  const searchInput = header.querySelector('.search-input');
  if (searchInput) {
    setTimeout(() => searchInput.focus(), 100);
  }
  document.addEventListener('click', docCloseSearch);
}

function docClose(e) {
  if (e.target.closest('header')) return;
  closeAllMenus();
}

function toggleMenu(menu) {
  const isOpen = menu.classList.contains('is-open');
  closeAllMenus();
  if (isOpen) {
    document.removeEventListener('click', docClose);
    return;
  }

  // Setup the global close event
  document.addEventListener('click', docClose);
  menu.classList.add('is-open');
}

function decorateNavToggle(btn) {
  btn.addEventListener('click', () => {
    const header = document.body.querySelector('header');
    if (header) {
      const isOpen = header.classList.toggle('is-mobile-open');
      btn.setAttribute('aria-expanded', isOpen.toString());
    }
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

  // If there's a menu (submenu exists), style and make it clickable
  if (menu) {
    // Add styling class to the text node (not the link)
    if (textNode) {
      textNode.classList.add('main-nav-link');
      textNode.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMenu(li);
      });
    }
  } else if (link) {
    // If no menu and it's just a link, add link styling without chevron
    link.classList.add('main-nav-link');
  }
}

function decorateBrandSection(section) {
  section.classList.add('brand-section');

  // Check if there are multiple icons (dual logo setup like MLB + Adobe)
  const icons = section.querySelectorAll('.icon');

  if (icons.length > 1) {
    // Add separator between logos
    const separator = document.createElement('span');
    separator.className = 'brand-separator';
    icons[0].after(separator);
  }

  // Create hamburger button for mobile
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-toggle';
  hamburger.setAttribute('aria-label', 'Toggle navigation menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '&#9776;';

  const defaultContent = section.querySelector('.default-content');
  defaultContent.append(hamburger);

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

  const mainNavItems = section.querySelectorAll('nav > ul > li');
  for (const navItem of mainNavItems) {
    decorateNavItem(navItem);
  }
}

async function decorateActionSection(section) {
  section.classList.add('actions-section');
  
  // Look for search icon and make it a clickable button
  const searchIcon = section.querySelector('.icon-search');
  if (searchIcon) {
    const searchButton = document.createElement('button');
    searchButton.className = 'search-button';
    searchButton.setAttribute('aria-label', 'Search');
    searchButton.setAttribute('type', 'button');
    searchButton.appendChild(searchIcon.cloneNode(true));
    searchIcon.parentNode.replaceChild(searchButton, searchIcon);
    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSearch();
    });
  }
}

  async function handleSearchSubmit(form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const searchInput = form.querySelector('.search-input');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm && searchTerm.length >= 2) {
      try {
        const { performSearch } = await import('/blocks/search-results/search-results.js');
        await performSearch(searchTerm);
      } catch (error) {
        console.error('Failed to load search results:', error);
      }
    }
  });
}

async function createSearchSection() {
  const searchSection = document.createElement('div');
  searchSection.className = 'search-section';
  
  const form = document.createElement('form');
  form.className = 'search-form';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'search-input';
  input.className = 'search-input';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');
  
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'search-submit';
  submitBtn.setAttribute('aria-label', 'Submit search');
  
  try {
    const iconResponse = await fetch('/img/icons/arrow.svg');
    const iconSvg = await iconResponse.text();
    submitBtn.innerHTML = iconSvg;
    const svg = submitBtn.querySelector('svg');
    if (svg) svg.classList.add('icon', 'icon-arrow');
  } catch (e) {
    submitBtn.innerHTML = '→';
  }
  
  form.append(input, submitBtn);
  searchSection.append(form);
  
  await handleSearchSubmit(form);
  
  return searchSection;
}

async function decorateHeader(fragment) {
  const sections = fragment.querySelectorAll(':scope > .section');
  if (sections[0]) decorateBrandSection(sections[0]);
  if (sections[1]) decorateNavSection(sections[1]);
  if (sections[2]) await decorateActionSection(sections[2]);
  
  const searchSection = await createSearchSection();
  fragment.append(searchSection);
  
  // Create a close button for desktop header (top right)
  const desktopCloseBtn = document.createElement('button');
  desktopCloseBtn.type = 'button';
  desktopCloseBtn.className = 'search-close search-close-desktop';
  desktopCloseBtn.setAttribute('aria-label', 'Close search');
  desktopCloseBtn.textContent = '×';
  desktopCloseBtn.addEventListener('click', closeSearch);
  fragment.append(desktopCloseBtn);
}

/**
 * loads and decorates the header
 * @param {Element} el The header element
 */
export default async function init(el) {
  const headerMeta = getMetadata('header');
  const path = headerMeta || HEADER_PATH;
  
  try {
    const fragment = await loadFragment(`${locale.prefix}${path}`);
    if (fragment) {
      fragment.classList.add('header-content');
      await decorateHeader(fragment);
      el.append(fragment);
    }
  } catch (e) {
    throw Error(e);
  }
}
