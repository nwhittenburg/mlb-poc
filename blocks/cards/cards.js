import { fetchPlaceholders } from '../../scripts/placeholders.js';

/**
 * Check if a link points to a same-origin page
 */
function isPageLink(link) {
  try {
    const url = new URL(link.href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Return the link if the cell contains only a same-origin page link
 */
function getLinkOnlyCell(cell) {
  const links = cell.querySelectorAll('a');
  if (links.length !== 1) return null;
  const link = links[0];
  if (cell.querySelector('picture, img')) return null;
  return isPageLink(link) ? link : null;
}

/**
 * Fetch page metadata from a same-origin URL
 */
async function fetchPageMeta(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const html = await resp.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const getMeta = (name) => {
      const meta = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
      return meta?.content || '';
    };

    let image = getMeta('og:image');
    if (!image) {
      const firstImg = doc.querySelector('main img');
      if (firstImg) {
        image = new URL(firstImg.getAttribute('src'), url).href;
      }
    }

    return {
      title: getMeta('og:title'),
      description: getMeta('og:description'),
      image,
      ctaText: getMeta('cta-text') || (await fetchPlaceholders()).ctaText || 'Learn more',
    };
  } catch {
    return null;
  }
}

/**
 * Replace a link-only cell with card content from page metadata
 */
async function populateCardFromLink(cell, link) {
  const meta = await fetchPageMeta(link.href);
  if (!meta) return;

  const { href } = link;
  cell.innerHTML = '';

  if (meta.image) {
    const p = document.createElement('p');
    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = meta.image;
    img.alt = meta.title || '';
    img.loading = 'lazy';
    picture.appendChild(img);
    p.appendChild(picture);
    cell.appendChild(p);
  }

  if (meta.title) {
    const h3 = document.createElement('h3');
    h3.textContent = meta.title;
    cell.appendChild(h3);
  }

  if (meta.description) {
    const p = document.createElement('p');
    p.textContent = meta.description;
    cell.appendChild(p);
  }

  const ctaP = document.createElement('p');
  const cta = document.createElement('a');
  cta.href = href;
  cta.textContent = meta.ctaText;
  cta.classList.add('btn-primary');
  ctaP.appendChild(cta);
  cell.appendChild(ctaP);
}

function decorateMultiCard(el) {
  const wrapper = el.querySelector(':scope > div');
  const cols = [...wrapper.querySelectorAll(':scope > div')];
  const { parentElement } = el;
  const isHinting = el.classList.contains('hinting');

  cols.forEach((col) => {
    const card = document.createElement('div');
    [...el.classList].forEach((cls) => card.classList.add(cls));

    // Extract picture into card-image
    const pic = col.querySelector('picture');
    if (pic) {
      const picParent = pic.parentElement;
      const imgDiv = document.createElement('div');
      imgDiv.classList.add('card-image');
      imgDiv.appendChild(pic);
      card.appendChild(imgDiv);
      if (picParent.tagName === 'P' && !picParent.textContent.trim()) {
        picParent.remove();
      }
    }

    // Content
    col.classList.add('card-content');
    card.appendChild(col);

    // CTA - last paragraph with a link
    const ctaPara = col.querySelector('p:last-of-type');
    if (ctaPara?.querySelector('a')) {
      ctaPara.classList.add('card-cta');
    }

    parentElement.insertBefore(card, el);
  });

  // Configure hinting on wrapper based on column count
  if (isHinting) {
    parentElement.classList.add('hinting');
    const count = cols.length;
    if (count <= 2) parentElement.classList.add('hint-sm');
    else if (count === 3) parentElement.classList.add('hint-md');
    else parentElement.classList.add('hint-lg');
  }

  el.remove();
}

export default async function decorate(el) {
  const wrapper = el.querySelector(':scope > div');
  const divs = Array.from(wrapper.querySelectorAll(':scope > div'));

  // Populate link-only cells from page metadata
  const linkPopulations = divs
    .map((div) => {
      const link = getLinkOnlyCell(div);
      return link ? populateCardFromLink(div, link) : null;
    })
    .filter(Boolean);

  if (linkPopulations.length > 0) {
    await Promise.all(linkPopulations);
  }

  // Auto-detect multi-column cards (3+ columns, or 2+ with hinting)
  const isHinting = el.classList.contains('hinting');
  if (divs.length >= 3 || (isHinting && divs.length >= 2)) {
    decorateMultiCard(el);
    return;
  }

  // Handle background-color-{color} class
  const backgroundColorClass = Array.from(el.classList).find((cls) => cls.startsWith('background-color-'));
  if (backgroundColorClass) {
    const color = backgroundColorClass.replace('background-color-', '');
    el.style.setProperty('--card-bg-color', color);
  }

  // Handle picture (image or background-image)
  const pic = el.querySelector('picture');
  if (pic) {
    const img = pic.querySelector('img');
    const picDiv = divs.find((div) => div.contains(pic));

    if (el.classList.contains('background-image')) {
      // Background image variation
      if (img) el.style.setProperty('--card-bg-image', `url('${img.src}')`);
      if (picDiv) picDiv.remove();
    } else {
      // Standard image - wrap and detect position
      picDiv.classList.add('card-image');
      const isImageRight = divs.indexOf(picDiv) > 0;
      if (isImageRight) picDiv.style.order = '2';
    }
  }

  // Decorate content
  const contentDiv = wrapper.querySelector(':scope > div:not(.card-image)');
  if (contentDiv) {
    contentDiv.classList.add('card-content');

    // Decorate CTA link
    const ctaPara = contentDiv.querySelector('p:last-of-type');
    if (ctaPara?.querySelector('a')) {
      ctaPara.classList.add('card-cta');
    }
  }

  // Flatten structure - move children up and remove wrapper
  while (wrapper.firstChild) {
    el.appendChild(wrapper.firstChild);
  }
  wrapper.remove();
}
