function decorateFourColumn(el) {
  const wrapper = el.querySelector(':scope > div');
  const cols = [...wrapper.querySelectorAll(':scope > div')];
  const { parentElement } = el;

  cols.forEach((col) => {
    const card = document.createElement('div');
    [...el.classList].forEach((cls) => card.classList.add(cls));

    // Extract picture into card-image
    const pic = col.querySelector('picture');
    if (pic) {
      const picParent = pic.parentElement;
      const imgDiv = document.createElement('div');
      imgDiv.classList.add('card-image');
      imgDiv.appendChild(pic);
      card.appendChild(imgDiv);
      if (picParent.tagName === 'P' && !picParent.textContent.trim()) {
        picParent.remove();
      }
    }

    // Content
    col.classList.add('card-content');
    card.appendChild(col);

    // CTA - last paragraph with a link
    const ctaPara = col.querySelector('p:last-of-type');
    if (ctaPara?.querySelector('a')) {
      ctaPara.classList.add('card-cta');
    }

    parentElement.insertBefore(card, el);
  });

  el.remove();
}

export default function decorate(el) {
  const wrapper = el.querySelector(':scope > div');
  const divs = Array.from(wrapper.querySelectorAll(':scope > div'));

  // Auto-detect multi-column cards (3+ columns means each column is a card)
  if (divs.length >= 3) {
    if (divs.length >= 4) el.classList.add('four-column');
    decorateFourColumn(el);
    return;
  }

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
