import { loadFragment } from '../fragment/fragment.js';
import { getConfig } from '../../scripts/ak.js';

/**
 * loads and decorates the need-access block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? new URL(link.href).pathname : block.textContent.trim();

  if (!path || !path.includes('/fragments/')) {
    block.textContent = 'Need Access block requires a fragment URL';
    return;
  }

  const { locale } = getConfig();
  const fullPath = `${locale.prefix}${path}`.replace(/\/+/g, '/');

  const fragment = await loadFragment(fullPath);
  if (!fragment) {
    block.textContent = 'Failed to load fragment';
    return;
  }

  const section = fragment.querySelector('.section');
  const content = section?.querySelector('.default-content, .block-content');
  if (!content) {
    block.textContent = 'No content in fragment';
    return;
  }

  block.textContent = '';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'need-access-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '&times;';

  const wrapper = document.createElement('div');
  wrapper.className = 'need-access-content';
  wrapper.appendChild(content);

  block.closest('.section')?.classList.add('need-access-section');

  block.appendChild(wrapper);
  block.appendChild(closeBtn);

  closeBtn.addEventListener('click', () => {
    block.classList.add('need-access-dismissed');
  });
}
