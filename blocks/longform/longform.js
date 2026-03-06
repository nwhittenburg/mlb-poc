/**
 * Longform block
 * Transforms content into a numbered or plain list format with optional image columns
 * @param {Element} block The longform block element
 */

async function normalizeImageColumns(block) {
  const imageCols = [...block.querySelectorAll('.longform-col--image')];
  if (!imageCols.length) return;

  const images = imageCols.map((col) => col.querySelector('img')).filter(Boolean);

  await Promise.all(images.map((img) => (img.complete
    ? Promise.resolve()
    : new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }))));

  const maxWidth = Math.max(...images.map((img) => img.naturalWidth));
  if (maxWidth <= 0) return;

  block.style.setProperty('--longform-img-width', `${maxWidth}px`);
}

function buildColumns(cells) {
  const columns = document.createElement('div');
  columns.classList.add('longform-columns');

  const hasImage = cells.map((c) => !!c.querySelector('picture, img'));
  const imageCount = hasImage.filter(Boolean).length;

  if (cells.length === 2 && imageCount === 1) {
    columns.classList.add('longform-columns--with-image');
    if (hasImage[0]) columns.classList.add('longform-columns--image-first');
  } else {
    columns.style.gridTemplateColumns = `repeat(${cells.length}, 1fr)`;
  }

  cells.forEach((cell, i) => {
    const col = document.createElement('div');
    col.classList.add('longform-col');
    if (hasImage[i]) col.classList.add('longform-col--image');
    while (cell.firstChild) col.appendChild(cell.firstChild);
    columns.appendChild(col);
  });

  return columns;
}

function decorateNumbered(block) {
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
      content.appendChild(buildColumns(cells));
    } else {
      while (cells[0].firstChild) content.appendChild(cells[0].firstChild);
    }

    item.appendChild(numberEl);
    item.appendChild(content);
    list.appendChild(item);

    itemNumber += 1;
  });

  block.innerHTML = '';
  block.appendChild(list);
}

function decoratePlain(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return;

  const list = document.createElement('div');
  list.classList.add('longform-list');

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (!cells.length || !cells.some((c) => c.textContent.trim())) return;

    const item = document.createElement('div');
    item.classList.add('longform-item');

    const content = document.createElement('div');
    content.classList.add('longform-content');

    if (cells.length > 1) {
      content.appendChild(buildColumns(cells));
    } else {
      while (cells[0].firstChild) content.appendChild(cells[0].firstChild);
    }

    item.appendChild(content);
    list.appendChild(item);
  });

  block.innerHTML = '';
  block.appendChild(list);
}

export default function decorate(block) {
  if (block.classList.contains('numbered')) {
    decorateNumbered(block);
  } else {
    decoratePlain(block);
  }

  normalizeImageColumns(block);
}
