/*
 * Table Data Block
 * Custom table variant for MLB data documentation
 * Based on Figma design: MLB-Microsite-Working-File node 22229:50246
 */

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');

  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');

    [...row.children].forEach((cell, j) => {
      const td = document.createElement(i === 0 && header ? 'th' : 'td');

      if (i === 0) td.setAttribute('scope', 'column');

      // First column gets special styling class
      if (j === 0) {
        td.classList.add('attribute-cell');
      }

      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });

    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });

  table.append(thead, tbody);
  block.replaceChildren(table);
}
