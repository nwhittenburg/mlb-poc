/*
 * Table Data Block
 * Custom table variant for MLB data documentation
 * Based on Figma design: MLB-Microsite-Working-File node 22229:50246
 *
 * Features:
 * - Accordion functionality for rows marked with <strong>
 * - Rows below accordion headers are collapsible
 */

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const section = block.closest('.section');
  const hideSampleValue = section?.classList.contains('hide-sample-value-column')
    || section?.querySelector('.section-metadata')?.textContent?.toLowerCase().includes('hide-sample-value-column');

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');
  const rows = [...block.children];

  // Build table rows and identify accordion sections
  const bodyRows = [];
  let sampleValueColIndex = -1;

  rows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const cells = [...row.children];

    // Check if this is an accordion header (has <strong> in first cell)
    const firstCell = cells[0];
    const isAccordionHeader = firstCell?.querySelector('strong') !== null;

    if (i === 0 && header) {
      // Table header row
      cells.forEach((cell, j) => {
        const isSampleValue = cell.textContent.trim().toLowerCase() === 'sample value';
        if (isSampleValue) sampleValueColIndex = j;
        if (hideSampleValue && isSampleValue) return;

        const th = document.createElement('th');
        th.setAttribute('scope', 'column');
        if (j === 0) {
          th.classList.add('attribute-cell');
        }
        th.innerHTML = cell.innerHTML;
        tr.append(th);
      });
      thead.append(tr);
    } else if (isAccordionHeader) {
      // Accordion header - create single cell spanning all columns
      const columnCount = thead.children[0]?.children.length || 4;
      const td = document.createElement('td');
      td.setAttribute('colspan', columnCount);
      td.innerHTML = cells[0].innerHTML;
      td.classList.add('accordion-header-cell');
      tr.append(td);
      tr.classList.add('accordion-header');
      tr.setAttribute('aria-expanded', 'true');
      tr.setAttribute('role', 'button');
      tr.setAttribute('tabindex', '0');
      bodyRows.push({ element: tr, isAccordionHeader: true });
      tbody.append(tr);
    } else if (cells.length === 1) {
      // Single cell row (like notes) - span all columns
      const columnCount = thead.children[0]?.children.length || 4;
      const td = document.createElement('td');
      td.setAttribute('colspan', columnCount);
      td.innerHTML = cells[0].innerHTML;
      td.classList.add('full-width-cell');
      tr.append(td);
      bodyRows.push({ element: tr, isAccordionHeader: false });
      tbody.append(tr);
    } else {
      // Regular data row
      cells.forEach((cell, j) => {
        if (hideSampleValue && j === sampleValueColIndex) return;

        const td = document.createElement('td');
        if (j === 0) {
          td.classList.add('attribute-cell');
        }
        td.innerHTML = cell.innerHTML;
        tr.append(td);
      });
      bodyRows.push({ element: tr, isAccordionHeader: false });
      tbody.append(tr);
    }
  });

  // Group rows into accordion sections and mark content as expanded by default
  let currentSection = null;
  bodyRows.forEach((rowData) => {
    if (rowData.isAccordionHeader) {
      currentSection = rowData.element;
    } else if (currentSection) {
      rowData.element.classList.add('accordion-content', 'expanded');
      rowData.element.setAttribute('data-accordion-parent', currentSection.rowIndex);
    }
  });

  table.append(thead, tbody);
  block.replaceChildren(table);

  // Add click handlers for accordion functionality
  const accordionHeaders = tbody.querySelectorAll('.accordion-header');
  accordionHeaders.forEach((accordionHeader) => {
    const toggleAccordion = () => {
      const isExpanded = accordionHeader.getAttribute('aria-expanded') === 'true';
      accordionHeader.setAttribute('aria-expanded', !isExpanded);

      // Toggle content rows
      let nextRow = accordionHeader.nextElementSibling;
      while (nextRow && nextRow.classList.contains('accordion-content')) {
        if (isExpanded) {
          nextRow.classList.remove('expanded');
        } else {
          nextRow.classList.add('expanded');
        }
        nextRow = nextRow.nextElementSibling;
      }
    };

    accordionHeader.addEventListener('click', toggleAccordion);

    // Keyboard support
    accordionHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion();
      }
    });
  });
}
