/**
 * Longform block
 * Transforms content into a numbered list format
 * @param {Element} block The longform block element
 */
export default function decorate(block) {
  const isNumbered = block.classList.contains('numbered');
  
  if (!isNumbered) {
    // Plain longform - just apply base styling
    return;
  }

  // Numbered variant: wrap each top-level paragraph in numbered items
  const inner = block.querySelector(':scope > div');
  if (!inner) return;

  // Get all direct children (paragraphs, lists, etc.)
  const children = [...inner.children];
  
  // Clear the inner container
  inner.innerHTML = '';
  inner.classList.add('longform-list');

  let itemNumber = 1;

  children.forEach((child) => {
    // Only number direct paragraphs and divs with content
    if (child.tagName === 'P' || (child.tagName === 'DIV' && child.textContent.trim())) {
      const item = document.createElement('div');
      item.classList.add('longform-item');

      // Create number element
      const numberEl = document.createElement('div');
      numberEl.classList.add('longform-number');
      numberEl.textContent = itemNumber;

      // Create content element
      const content = document.createElement('div');
      content.classList.add('longform-content');
      content.appendChild(child);

      item.appendChild(numberEl);
      item.appendChild(content);
      inner.appendChild(item);

      itemNumber += 1;
    }
  });
}
