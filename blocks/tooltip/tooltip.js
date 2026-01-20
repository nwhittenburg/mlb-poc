/**
 * Tooltip block
 * Displays a small card with optional image and text content
 * @param {Element} block The tooltip block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  
  // Collect all paragraphs from all rows
  const allParagraphs = [];
  let imageElement = null;
  
  // Process each row - check both row and cell level
  rows.forEach((row) => {
    // Look in the row and its first cell
    const cell = row.querySelector(':scope > div');
    const searchElement = cell || row;
    
    const picture = searchElement.querySelector('picture');
    const paragraphs = searchElement.querySelectorAll('p');
    
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
  block.innerHTML = '';
  
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
  block.appendChild(container);
}
