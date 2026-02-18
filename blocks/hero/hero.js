function setBackgroundFocus(img) {
  const { title } = img.dataset;
  if (!title?.includes('data-focal')) return;
  delete img.dataset.title;
  const [x, y] = title.split(':')[1].split(',');
  img.style.objectPosition = `${x}% ${y}%`;
}

function decorateBackground(bg) {
  const bgPic = bg.querySelector('picture');
  if (!bgPic) return;

  const img = bgPic.querySelector('img');
  setBackgroundFocus(img);

  const vidLink = bgPic.closest('a[href*=".mp4"]');
  if (!vidLink) return;
  const video = document.createElement('video');
  video.src = vidLink.href;
  video.loop = true;
  video.muted = true;
  video.inert = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'none');
  video.load();
  video.addEventListener('canplay', () => {
    video.play();
    bgPic.remove();
  });
  vidLink.parentElement.append(video, bgPic);
  vidLink.remove();
}

function decorateForeground(fg) {
  const { children } = fg;
  for (const [idx, child] of [...children].entries()) {
    const heading = child.querySelector('h1, h2, h3, h4, h5, h6');
    const text = heading || child.querySelector('p');
    if (heading) {
      heading.classList.add('hero-heading');
      
      // Paragraph before heading is breadcrumb text
      const detail = heading.previousElementSibling;
      if (detail && detail.tagName === 'P') {
        detail.classList.add('hero-breadcrumb');
      }
      
      // Paragraphs after heading are body text
      let nextSibling = heading.nextElementSibling;
      while (nextSibling) {
        if (nextSibling.tagName === 'P') {
          // Check if paragraph contains only a link (button pattern)
          const link = nextSibling.querySelector('a');
          const hasOnlyLink = link && nextSibling.childNodes.length === 1;
          
          if (hasOnlyLink) {
            link.classList.add('button', 'hero-button');
            nextSibling.classList.add('button-container');
          } else {
            nextSibling.classList.add('hero-body');
          }
        }
        nextSibling = nextSibling.nextElementSibling;
      }
    }
    // Determine foreground column types
    if (text) {
      child.classList.add('fg-text');
      if (idx === 0) {
        child.closest('.hero').classList.add('hero-text-start');
      } else {
        child.closest('.hero').classList.add('hero-text-end');
      }
    } else if (child.querySelector('picture, video, a[href*=".mp4"]')) {
      child.classList.add('fg-image');
    }
  }
}

export default async function init(el) {
  const rows = [...el.querySelectorAll(':scope > div')];
  const fg = rows.pop();
  fg.classList.add('hero-foreground');
  decorateForeground(fg);
  if (rows.length) {
    const bg = rows.pop();
    bg.classList.add('hero-background');
    decorateBackground(bg);
  }
}