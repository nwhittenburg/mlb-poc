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

  // Numbered variant: each authored row becomes a numbered item
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const list = document.createElement('div');
  list.classList.add('longform-list');

  let itemNumber = 1;

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div');
    if (!cell || !cell.textContent.trim()) return;

    const item = document.createElement('div');
    item.classList.add('longform-item');

    const numberEl = document.createElement('div');
    numberEl.classList.add('longform-number');
    numberEl.textContent = itemNumber;

    const content = document.createElement('div');
    content.classList.add('longform-content');
    while (cell.firstChild) {
      content.appendChild(cell.firstChild);
    }

    item.appendChild(numberEl);
    item.appendChild(content);
    list.appendChild(item);

    itemNumber += 1;
  });

  block.innerHTML = '';
  block.appendChild(list);
}
