export default function init(el) {
  const inner = el.querySelector(':scope > div');
  const isTooltip = el.classList.contains('tooltip');

  inner.classList.add(isTooltip ? 'tooltip-container' : 'card-inner');

  // Handle picture
  const pic = el.querySelector('picture');
  if (pic) {
    const picPara = pic.closest('p');
    if (picPara) {
      const picDiv = document.createElement('div');
      picDiv.className = isTooltip ? 'tooltip-image' : 'card-picture-container';
      picDiv.append(pic);
      inner.insertAdjacentElement('afterbegin', picDiv);
      picPara.remove();
    }
  }

  // Decorate content
  const con = inner.querySelector(':scope > div:not([class])');
  if (!con) return;
  con.classList.add(isTooltip ? 'tooltip-copy' : 'card-content-container');

  if (isTooltip) {
    // Heading (H3-H6) gets smaller uppercase style
    const heading = con.querySelector('h3, h4, h5, h6');
    if (heading) heading.classList.add('tooltip-heading');
    // Paragraphs get larger bold style
    con.querySelectorAll('p').forEach((p) => p.classList.add('tooltip-body'));
    return;
  }

  // Decorate CTA (standard card only)
  const ctaPara = inner.querySelector(':scope > div:last-of-type > p:last-of-type');
  if (!ctaPara) return;
  const cta = ctaPara.querySelector('a');
  if (!cta) return;
  if (el.classList.contains('hash-aware')) {
    cta.href = `${cta.getAttribute('href')}${window.location.hash}`;
  }
  ctaPara.classList.add('card-cta-container');
  inner.append(ctaPara);
}
