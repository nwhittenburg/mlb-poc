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

function createJumplink(heading) {
  if (!heading.id) heading.id = toId(heading.textContent);
  
  const link = document.createElement('a');
  link.href = `#${heading.id}`;
  link.textContent = heading.textContent.trim();
  link.className = 'jumplinks-link';
  link.dataset.headingId = heading.id;
  
  link.onclick = (e) => {
    e.preventDefault();
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', `#${heading.id}`);
  };
  
  return link;
}

function getPageHeadings() {
  const headings = [...document.querySelectorAll('main h2')];
  // Exclude headings from hero section
  return headings.filter((heading) => !heading.closest('.hero'));
}

function updateActiveLink(block) {
  const headings = getPageHeadings();
  if (!headings.length) return;
  
  // Calculate scroll position accounting for header
  const scrollPos = window.scrollY + window.innerHeight / 3;
  
  // Find the last heading that's passed the scroll threshold
  // This gives us the heading currently being viewed
  let activeHeading = headings[0];
  
  for (const heading of headings) {
    if (heading.offsetTop <= scrollPos) {
      activeHeading = heading;
    }
  }
  
  // Update active state on all links
  block.querySelectorAll('.jumplinks-link').forEach((link) => {
    link.classList.toggle('active', activeHeading?.id === link.dataset.headingId);
  });
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

function processNavigation(navList) {
  const headings = getPageHeadings();
  
  navList.querySelectorAll(':scope > li').forEach((item) => {
    const link = item.querySelector(':scope > a');
    if (!link) return;
    
    if (isCurrentPage(link.href)) {
      link.classList.add('jumplinks-current');
      item.querySelector(':scope > ul')?.remove();
      
      if (headings.length) {
        const ul = document.createElement('ul');
        ul.className = 'jumplinks-headings';
        headings.forEach((h) => {
          const li = document.createElement('li');
          li.appendChild(createJumplink(h));
          ul.appendChild(li);
        });
        item.appendChild(ul);
      }
    } else {
      link.classList.add('jumplinks-external');
      const nested = item.querySelector(':scope > ul');
      if (nested) processNavigation(nested);
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
    processNavigation(ul);
    nav.appendChild(ul);
    
    block.append(header, nav);
    setupScrollSpy(block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading jumplinks:', error);
    block.textContent = 'Failed to load navigation';
  }
}
