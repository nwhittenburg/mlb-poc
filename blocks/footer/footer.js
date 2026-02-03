import { loadFragment } from '../fragment/fragment.js';
import loadIcons from '../../scripts/utils/icons.js';

/**
 * loads and decorates the footer
 * @param {Element} el The footer element
 */
export default async function decorate(el) {
  const fragment = await loadFragment('/fragments/nav/footer');
  const ul = fragment.querySelector('ul');
  const listItems = ul.querySelectorAll('li');
  
  // Load icons before moving them
  const icons = fragment.querySelectorAll('.icon');
  loadIcons(icons);
  
  // Create container
  const container = document.createElement('div');
  container.className = 'footer-container';

  // Create logos row with separator
  const logosRow = document.createElement('div');
  logosRow.className = 'footer-logos';
  
  // Get the icon elements (they should be SVGs now after loadIcons)
  const mlbIcon = listItems[0].querySelector('.icon, svg.icon');
  const adobeIcon = listItems[1].querySelector('.icon, svg.icon');
  
  if (mlbIcon) logosRow.appendChild(mlbIcon);
  
  const separator = document.createElement('div');
  separator.className = 'footer-separator';
  logosRow.appendChild(separator);
  
  if (adobeIcon) logosRow.appendChild(adobeIcon);
  
  container.appendChild(logosRow);

  // Add copyright text
  const copyright = document.createElement('div');
  copyright.className = 'footer-copyright';
  copyright.textContent = listItems[1].querySelectorAll('p')[1].textContent;
  container.appendChild(copyright);

  ul.replaceWith(container);
  el.append(fragment);
}
