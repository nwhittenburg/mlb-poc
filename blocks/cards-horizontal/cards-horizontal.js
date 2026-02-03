/**
 * Cards Horizontal Block
 * Displays cards in a horizontal 3-up layout with eyebrow and heading text.
 * Migrated from Figma: MLB Horizontal Cards - 3up (node 22229:46195)
 */

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');

    // Move all content from row to li
    while (row.firstElementChild) {
      li.append(row.firstElementChild);
    }

    // Process each div inside the card
    [...li.children].forEach((div) => {
      // Check if this div contains a picture (image card variant)
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-horizontal-card-image';
      } else {
        // Text content - look for eyebrow and heading structure
        div.className = 'cards-horizontal-card-body';

        // Find paragraphs and structure them
        const paragraphs = div.querySelectorAll('p');
        if (paragraphs.length >= 2) {
          // First paragraph is eyebrow, rest is heading/body
          paragraphs[0].classList.add('cards-horizontal-eyebrow');
          for (let i = 1; i < paragraphs.length; i++) {
            paragraphs[i].classList.add('cards-horizontal-heading');
          }
        } else if (paragraphs.length === 1) {
          // Single paragraph - treat as heading
          paragraphs[0].classList.add('cards-horizontal-heading');
        }
      }
    });

    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
