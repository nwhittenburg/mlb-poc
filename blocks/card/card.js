/**
 * Tooltip variation - compact horizontal card
 * @param {Element} el The card block element
 */
function decorateTooltip(el) {
  const rows = [...el.querySelectorAll(':scope > div > div')];
  
  // Collect all paragraphs from all rows
  const allParagraphs = [];
  let imageElement = null;
  
  // Process each row - check both row and cell level
  rows.forEach((row) => {
    const picture = row.querySelector('picture');
    const paragraphs = row.querySelectorAll('p');
    
    if (picture && !imageElement) {
      // First picture we find becomes the image
      imageElement = picture;
    }
    
    // Collect all paragraphs from this row
    paragraphs.forEach((p) => {
      if (p.textContent.trim()) {
        allParagraphs.push(p.cloneNode(true));
      }
    });
  });
  
  // Clear block
  el.innerHTML = '';
  
  // Create tooltip container
  const container = document.createElement('div');
  container.classList.add('tooltip-container');
  
  // Add image if present
  if (imageElement) {
    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('tooltip-image');
    imageWrapper.appendChild(imageElement.cloneNode(true));
    container.appendChild(imageWrapper);
  }
  
  // Create copy container
  const copyContainer = document.createElement('div');
  copyContainer.classList.add('tooltip-copy');
  
  // Handle text based on paragraph count
  if (allParagraphs.length === 2) {
    // Two paragraphs: first is body (small), second is heading
    const bodyText = allParagraphs[0];
    bodyText.classList.add('tooltip-body');
    copyContainer.appendChild(bodyText);
    
    const headingText = allParagraphs[1];
    headingText.classList.add('tooltip-heading');
    copyContainer.appendChild(headingText);
  } else if (allParagraphs.length === 1) {
    // Single paragraph: use heading style
    const headingText = allParagraphs[0];
    headingText.classList.add('tooltip-heading');
    copyContainer.appendChild(headingText);
  } else if (allParagraphs.length > 2) {
    // More than 2 paragraphs: first is body, rest are combined as heading
    const bodyText = allParagraphs[0];
    bodyText.classList.add('tooltip-body');
    copyContainer.appendChild(bodyText);
    
    // Combine remaining paragraphs
    allParagraphs.slice(1).forEach((p) => {
      p.classList.add('tooltip-heading');
      copyContainer.appendChild(p);
    });
  }
  
  container.appendChild(copyContainer);
  el.appendChild(container);
}

export default function init(el) {
  // Handle tooltip variation
  if (el.classList.contains('tooltip')) {
    decorateTooltip(el);
    return;
  }

  const inner = el.querySelector(':scope > div');
  inner.classList.add('card-inner');
  const pic = el.querySelector('picture');
  if (pic) {
    const picPara = pic.closest('p');
    if (picPara) {
      const picDiv = document.createElement('div');
      picDiv.className = 'card-picture-container';
      picDiv.append(pic);
      inner.insertAdjacentElement('afterbegin', picDiv);
      picPara.remove();
    }
  }
  // Decorate content
  const con = inner.querySelector(':scope > div:not([class])');
  if (!con) return;
  con.classList.add('card-content-container');

  // Decorate CTA
  const ctaPara = inner.querySelector(':scope > div:last-of-type > p:last-of-type');
  if (!ctaPara) return;
  const cta = ctaPara.querySelector('a');
  if (!cta) return;
  const hashAware = el.classList.contains('hash-aware');
  if (hashAware) {
    cta.href = `${cta.getAttribute('href')}${window.location.hash}`;
  }
  ctaPara.classList.add('card-cta-container');
  inner.append(ctaPara);
}
