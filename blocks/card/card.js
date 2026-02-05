export default function init(el) {
  const inner = el.querySelector(':scope > div');
  const isTooltip = el.classList.contains('tooltip');
  const isBackgroundImage = el.classList.contains('background-image');

  inner.classList.add(isTooltip ? 'tooltip-container' : 'card-inner');

  // Handle background-color-* classes
  const backgroundColorClass = Array.from(el.classList).find((cls) => cls.startsWith('background-color-'));
  if (backgroundColorClass) {
    const color = backgroundColorClass.split('-').pop();
    inner.style.setProperty('--background-color', color);
    inner.classList.add('has-background-color');
  }

  // Get all child divs
  const divs = Array.from(inner.querySelectorAll(':scope > div'));
  
  // Handle picture
  const pic = el.querySelector('picture');
  if (pic && isBackgroundImage) {
    // Background-image variation: apply as background and remove picture div
    const img = pic.querySelector('img');
    if (img) {
      inner.style.setProperty('--background-image-url', `url('${img.src}')`);
    }
    const picDiv = divs.find((div) => div.contains(pic));
    if (picDiv) picDiv.remove();
  } else if (pic) {
    // Standard card: create card-image-container
    const imageDiv = document.createElement('div');
    imageDiv.className = isTooltip ? 'tooltip-image' : 'card-image-container';
    imageDiv.append(pic);
    inner.insertAdjacentElement('afterbegin', imageDiv);
    
    // Remove the original div that contained the picture
    const picDiv = divs.find((div) => div.querySelector('picture') || !div.textContent.trim());
    if (picDiv) picDiv.remove();
  }

  // Decorate content container
  const con = inner.querySelector(':scope > div:not([class])');
  if (!con) return;
  con.classList.add(isTooltip ? 'tooltip-copy' : 'card-content-container');

  if (isTooltip) {
    const heading = con.querySelector('h3, h4, h5, h6');
    if (heading) heading.classList.add('tooltip-heading');
    con.querySelectorAll('p').forEach((p) => p.classList.add('tooltip-body'));
    return;
  }

  // Decorate CTA
  const ctaPara = con.querySelector('p:last-of-type');
  if (ctaPara && ctaPara.querySelector('a')) {
    if (el.classList.contains('hash-aware')) {
      const cta = ctaPara.querySelector('a');
      cta.href = `${cta.getAttribute('href')}${window.location.hash}`;
    }
    ctaPara.classList.add('card-cta-container');
  }
}
