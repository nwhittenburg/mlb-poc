/**
 * Loads and decorates the notification block
 * Supports single-column (image + content in one cell)
 * and two-column (image in first cell, content in second) authoring
 * @param {Element} el The notification block element
 */
export default function decorate(el) {
  const wrapper = el.querySelector(':scope > div');
  const divs = Array.from(wrapper.querySelectorAll(':scope > div'));

  const isTwoCol = divs.length >= 2;
  const imageSource = isTwoCol ? divs[0] : wrapper;
  const contentDiv = isTwoCol ? divs[1] : divs[0];

  const pic = imageSource.querySelector('picture');
  if (pic) {
    const picParent = pic.parentElement;
    const imgDiv = document.createElement('div');
    imgDiv.classList.add('notification-image');
    imgDiv.appendChild(pic);
    if (picParent.tagName === 'P' && !picParent.textContent.trim()) {
      picParent.remove();
    }
    el.insertBefore(imgDiv, wrapper);
  }

  if (contentDiv) {
    contentDiv.classList.add('notification-content');
    el.insertBefore(contentDiv, wrapper);
  }

  wrapper.remove();
}
