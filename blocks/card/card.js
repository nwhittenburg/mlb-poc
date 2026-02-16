function decorateEditorial(el) {
  [...el.querySelectorAll(':scope > div')].forEach((row) => {
    const col = row.querySelector(':scope > div');
    if (!col) return;

    // Extract picture into card-image
    const pic = col.querySelector('picture');
    if (pic) {
      const picParent = pic.parentElement;
      const imgDiv = document.createElement('div');
      imgDiv.classList.add('card-image');
      imgDiv.appendChild(pic);
      row.prepend(imgDiv);
      if (picParent.tagName === 'P' && !picParent.textContent.trim()) {
        picParent.remove();
      }
    }

    // Content
    col.classList.add('card-content');

    // CTA - last paragraph with a link
    const ctaPara = col.querySelector('p:last-of-type');
    if (ctaPara?.querySelector('a')) {
      ctaPara.classList.add('card-cta');
    }
  });
}

export default function decorate(el) {
  if (el.classList.contains('editorial')) {
    decorateEditorial(el);
    return;
  }

  const wrapper = el.querySelector(':scope > div');
  const divs = Array.from(wrapper.querySelectorAll(':scope > div'));

  // Handle background-color-{color} class
  const backgroundColorClass = Array.from(el.classList).find((cls) => cls.startsWith('background-color-'));
  if (backgroundColorClass) {
    const color = backgroundColorClass.replace('background-color-', '');
    el.style.setProperty('--card-bg-color', color);
  }

  // Handle picture (image or background-image)
  const pic = el.querySelector('picture');
  if (pic) {
    const img = pic.querySelector('img');
    const picDiv = divs.find((div) => div.contains(pic));

    if (el.classList.contains('background-image')) {
      // Background image variation
      if (img) el.style.setProperty('--card-bg-image', `url('${img.src}')`);
      if (picDiv) picDiv.remove();
    } else {
      // Standard image - wrap and detect position
      picDiv.classList.add('card-image');
      const isImageRight = divs.indexOf(picDiv) > 0;
      if (isImageRight) picDiv.style.order = '2';
    }
  }

  // Decorate content
  const contentDiv = wrapper.querySelector(':scope > div:not(.card-image)');
  if (contentDiv) {
    contentDiv.classList.add('card-content');

    // Decorate CTA link
    const ctaPara = contentDiv.querySelector('p:last-of-type');
    if (ctaPara?.querySelector('a')) {
      ctaPara.classList.add('card-cta');
    }
  }

  // Flatten structure - move children up and remove wrapper
  while (wrapper.firstChild) {
    el.appendChild(wrapper.firstChild);
  }
  wrapper.remove();
}
