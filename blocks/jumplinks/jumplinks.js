import { loadFragment } from '../fragment/fragment.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';

function toId(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isCurrentPage(url) {
  try {
    return new URL(url, window.location.origin).pathname === window.location.pathname;
  } catch {
    return false;
  }
}

let navigating = false;
let navTimer = null;

function createJumplink(heading, block) {
  if (!heading.id) heading.id = toId(heading.textContent);

  const link = document.createElement('a');
  link.href = `#${heading.id}`;
  link.textContent = heading.textContent.trim();
  link.className = 'jumplinks-link';
  link.dataset.headingId = heading.id;

  link.onclick = (e) => {
    e.preventDefault();

    // Lock scroll spy and set final state immediately
    navigating = true;
    clearTimeout(navTimer);
    setActiveById(block, heading.id);

    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', `#${heading.id}`);

    // Unlock after scroll settles
    navTimer = setTimeout(() => { navigating = false; }, 800);
  };

  return link;
}

function setActiveById(block, headingId) {
  const headings = getPageHeadings();
  const groups = groupHeadings(headings);

  let activeH2Id = null;
  for (const group of groups) {
    if (group.h2.id === headingId || group.h3s.some((h) => h.id === headingId)) {
      activeH2Id = group.h2.id;
      break;
    }
  }

  block.querySelectorAll('.jumplinks-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.headingId === headingId);
  });

  block.querySelectorAll('.jumplinks-headings > li').forEach((li) => {
    li.classList.toggle('expanded', li.dataset.h2Id === activeH2Id);
  });
}

function getPageHeadings() {
  const headings = [...document.querySelectorAll('main h2, main h3')];
  return headings.filter((heading) => !heading.closest('.hero'));
}

function groupHeadings(headings) {
  const groups = [];
  let currentH2 = null;

  headings.forEach((h) => {
    if (h.tagName === 'H2') {
      currentH2 = { h2: h, h3s: [] };
      groups.push(currentH2);
    } else if (h.tagName === 'H3' && currentH2) {
      currentH2.h3s.push(h);
    }
  });

  return groups;
}

function updateActiveLink(block) {
  if (navigating) return;

  const headings = getPageHeadings();
  if (!headings.length) return;

  const scrollPos = window.scrollY + window.innerHeight / 3;

  let activeHeading = headings[0];
  for (const heading of headings) {
    if (heading.offsetTop <= scrollPos) {
      activeHeading = heading;
    }
  }

  setActiveById(block, activeHeading.id);
}

function setupScrollSpy(block) {
  let ticking = false;
  const update = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink(block);
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  
  // Initial update after a short delay to ensure layout is complete
  setTimeout(() => updateActiveLink(block), 100);
  
  // Also update on load
  window.addEventListener('load', () => {
    setTimeout(() => updateActiveLink(block), 100);
  });
}

function processNavigation(navList, block) {
  const headings = getPageHeadings();
  const groups = groupHeadings(headings);

  navList.querySelectorAll(':scope > li').forEach((item) => {
    const link = item.querySelector(':scope > a');
    if (!link) return;

    if (isCurrentPage(link.href)) {
      link.classList.add('jumplinks-current');
      item.querySelector(':scope > ul')?.remove();

      if (groups.length) {
        const ul = document.createElement('ul');
        ul.className = 'jumplinks-headings';

        groups.forEach((group) => {
          const li = document.createElement('li');
          if (!group.h2.id) group.h2.id = toId(group.h2.textContent);
          li.dataset.h2Id = group.h2.id;
          li.appendChild(createJumplink(group.h2, block));

          if (group.h3s.length) {
            const subUl = document.createElement('ul');
            subUl.className = 'jumplinks-subheadings';
            group.h3s.forEach((h3) => {
              const subLi = document.createElement('li');
              subLi.appendChild(createJumplink(h3, block));
              subUl.appendChild(subLi);
            });
            li.appendChild(subUl);
          }

          ul.appendChild(li);
        });

        item.appendChild(ul);
      }
    } else {
      link.classList.add('jumplinks-external');
      const nested = item.querySelector(':scope > ul');
      if (nested) processNavigation(nested, block);
    }
  });
}

export default async function decorate(block) {
  const path = block.querySelector('a')?.href || block.textContent.trim();
  
  if (!path?.includes('/fragments/')) {
    block.textContent = 'Jumplinks requires a fragment path';
    return;
  }
  
  block.innerHTML = '';
  
  try {
    const [fragment, placeholders] = await Promise.all([
      loadFragment(path),
      fetchPlaceholders(),
    ]);
    
    const navList = fragment?.querySelector('ul');
    if (!navList) {
      block.textContent = 'No navigation found in fragment';
      return;
    }
    
    const title = placeholders.jumpToSection || 'JUMP TO SECTION';
    
    const header = document.createElement('div');
    header.className = 'jumplinks-header';
    header.textContent = title.toUpperCase();
    
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Jump to section');
    
    const ul = navList.cloneNode(true);
    processNavigation(ul, block);
    nav.appendChild(ul);
    
    block.append(header, nav);
    setupScrollSpy(block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading jumplinks:', error);
    block.textContent = 'Failed to load navigation';
  }
}
