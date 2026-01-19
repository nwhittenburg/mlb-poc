/**
 * Tooltip block
 * Displays a small card with optional image and text content
 * @param {Element} block The tooltip block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  
  // Extract image (first row if present)
  const imageRow = rows[0];
  const imageElement = imageRow?.querySelector('picture');
  
  // Extract text paragraphs (second row)
  const textRow = rows[1] || rows[0];
  const paragraphs = [...textRow.querySelectorAll('p')];
  
  // Clear block
  block.innerHTML = '';
  
  // Create tooltip container
  const container = document.createElement('div');
  container.classList.add('tooltip-container');
  
  // Add image if present
  if (imageElement) {
    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('tooltip-image');
    imageWrapper.appendChild(imageElement);
    container.appendChild(imageWrapper);
  }
  
  // Create copy container
  const copyContainer = document.createElement('div');
  copyContainer.classList.add('tooltip-copy');
  
  // Handle text based on paragraph count
  if (paragraphs.length === 2) {
    // Two paragraphs: first is body (small), second is heading
    const bodyText = paragraphs[0];
    bodyText.classList.add('tooltip-body');
    copyContainer.appendChild(bodyText);
    
    const headingText = paragraphs[1];
    headingText.classList.add('tooltip-heading');
    copyContainer.appendChild(headingText);
  } else if (paragraphs.length === 1) {
    // Single paragraph: use heading style
    const headingText = paragraphs[0];
    headingText.classList.add('tooltip-heading');
    copyContainer.appendChild(headingText);
  }
  
  container.appendChild(copyContainer);
  block.appendChild(container);
}
