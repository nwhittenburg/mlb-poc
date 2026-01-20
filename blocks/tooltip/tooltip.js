/**
 * Tooltip block
 * Displays a small card with optional image and text content
 * @param {Element} block The tooltip block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  
  // Collect all paragraphs from all rows (each row has one cell with content)
  const allParagraphs = [];
  let imageElement = null;
  
  // Process each row
  rows.forEach((row) => {
    const picture = row.querySelector('picture');
    const paragraph = row.querySelector('p');
    
    if (picture && !imageElement) {
      // First picture we find becomes the image
      imageElement = picture;
    } else if (paragraph) {
      // Collect text paragraphs
      allParagraphs.push(paragraph);
    }
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
    imageWrapper.appendChild(imageElement);
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
