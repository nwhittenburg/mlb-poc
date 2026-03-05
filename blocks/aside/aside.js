/**
 * Aside block - 2 columns with configurable split (e.g. split-60-40, split-30-70).
 * Default 50-50. Image can be left or right.
 */
const SPLIT_REGEX = /^split-(\d+)-(\d+)$/;

function getSplit(el) {
  const match = [...el.classList].find((c) => SPLIT_REGEX.test(c))?.match(SPLIT_REGEX);
  if (match) {
    const a = parseInt(match[1], 10);
    const b = parseInt(match[2], 10);
    if (a + b === 100 && a > 0 && b > 0) return [a, b];
  }
  return [50, 50];
}

function decorateCols(row, cols) {
  cols.forEach((col, idx) => {
    col.classList.add('aside-col', `aside-col-${idx + 1}`);
    const hasImage = col.querySelector(':scope > picture');
    if (hasImage) col.classList.add('aside-image');
    else col.classList.add('aside-content');
  });
}

export default function init(el) {
  const [col1, col2] = getSplit(el);
  el.style.setProperty('--aside-col-1', `${col1}%`);
  el.style.setProperty('--aside-col-2', `${col2}%`);

  const rows = [...el.children];
  rows.forEach((row) => {
    row.classList.add('aside-row');
    const cols = [...row.children];
    row.style.setProperty('--child-count', String(cols.length));
    decorateCols(row, cols);
  });
}
