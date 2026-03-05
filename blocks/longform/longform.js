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
    const cells = [...row.querySelectorAll(':scope > div')];
    if (!cells.length || !cells.some((c) => c.textContent.trim())) return;

    const item = document.createElement('div');
    item.classList.add('longform-item');

    const numberEl = document.createElement('div');
    numberEl.classList.add('longform-number');
    numberEl.textContent = itemNumber;

    const content = document.createElement('div');
    content.classList.add('longform-content');

    if (cells.length > 1) {
      const columns = document.createElement('div');
      columns.classList.add('longform-columns');

      const hasImage = cells.map((c) => !!c.querySelector('picture, img'));
      const imageCount = hasImage.filter(Boolean).length;

      if (cells.length === 2 && imageCount === 1) {
        columns.style.gridTemplateColumns = hasImage.map((img) => (img ? 'auto' : '1fr')).join(' ');
      } else {
        columns.style.gridTemplateColumns = `repeat(${cells.length}, 1fr)`;
      }

      cells.forEach((cell) => {
        const col = document.createElement('div');
        col.classList.add('longform-col');
        while (cell.firstChild) col.appendChild(cell.firstChild);
        columns.appendChild(col);
      });

      content.appendChild(columns);
    } else {
      while (cells[0].firstChild) {
        content.appendChild(cells[0].firstChild);
      }
    }

    item.appendChild(numberEl);
    item.appendChild(content);
    list.appendChild(item);

    itemNumber += 1;
  });

  block.innerHTML = '';
  block.appendChild(list);
}
