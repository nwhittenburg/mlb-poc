/*
 * Accordion Block
 * Recreate an accordion
 * https://www.hlx.live/developer/block-collection/accordion
 */

export default function decorate(block) {
  [...block.children].forEach((row) => {
    // decorate accordion item label
    const label = row.children[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-item-label';
    summary.append(...label.childNodes);
    // decorate accordion item body
    const body = row.children[1];
    const bodyContent = document.createElement('div');
    bodyContent.className = 'accordion-item-body-content';
    bodyContent.append(...body.childNodes);
    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'accordion-item-body';
    bodyWrapper.append(bodyContent);
    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-item';
    details.append(summary, bodyWrapper);
    row.replaceWith(details);
  });
}