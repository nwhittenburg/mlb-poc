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
}

async function decorateHeader(fragment) {
  const sections = fragment.querySelectorAll(':scope > .section');
  if (sections[0]) decorateBrandSection(sections[0]);
  if (sections[1]) decorateNavSection(sections[1]);
  if (sections[2]) decorateActionSection(sections[2]);
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
