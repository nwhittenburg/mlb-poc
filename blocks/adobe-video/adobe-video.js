import {
  ADOBE_TV_HOST,
  createAdobePlayer as createPlayerIframe,
  getAdobeEmbedUrl,
  getAdobeVideoId,
  watchAdobePlayer,
} from '../video/adobe-player.js';

export { getAdobeVideoId };

/**
 * Builds the embeddable player URL, keeping any authored query params (e.g. pls=1)
 * @param {string} url - The authored Adobe video URL
 * @param {boolean} autoplay - Whether the player should start automatically
 * @returns {string|null} The embed URL
 */
export function getEmbedUrl(url, autoplay = false) {
  return getAdobeEmbedUrl(url, { autoplay });
}

/**
 * Tracks video start/complete for a player iframe
 * @returns {Function} Cleanup function that removes the listener
 */
function trackPlayer(iframe, videoName) {
  return watchAdobePlayer(iframe, { videoName });
}

/**
 * Opens a video modal with the Adobe TV player
 * @param {string} videoUrl - The Adobe TV video URL
 * @param {string} title - The video title
 */
export function openAdobeVideoModal(videoUrl, title) {
  const src = getEmbedUrl(videoUrl, true);
  if (!src) return;
  const videoName = title || 'Video';

  const modal = document.createElement('div');
  modal.className = 'adobe-video-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', title || 'Video');

  const modalContent = document.createElement('div');
  modalContent.className = 'adobe-video-modal-content';

  const closeButton = document.createElement('button');
  closeButton.className = 'adobe-video-modal-close';
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.innerHTML = '&times;';

  const videoContainer = document.createElement('div');
  videoContainer.className = 'adobe-video-modal-player';

  const iframe = createPlayerIframe(src, title);
  iframe.loading = 'eager';
  videoContainer.appendChild(iframe);
  const stopTracking = trackPlayer(iframe, videoName);

  modalContent.appendChild(closeButton);
  modalContent.appendChild(videoContainer);
  modal.appendChild(modalContent);

  const { scrollY } = window;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  Object.assign(document.body.style, {
    position: 'fixed',
    top: `-${scrollY}px`,
    right: '0',
    left: '0',
    paddingRight: `${scrollbarWidth}px`,
    overflow: 'hidden',
  });

  let closeModal;
  const handleEscape = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  closeModal = () => {
    modal.classList.add('closing');
    document.removeEventListener('keydown', handleEscape);
    stopTracking();
    // remove the iframe right away so playback stops
    iframe.remove();
    setTimeout(() => {
      modal.remove();
      ['position', 'top', 'right', 'left', 'paddingRight', 'overflow'].forEach(
        (prop) => { document.body.style[prop] = ''; },
      );
      window.scrollTo(0, scrollY);
    }, 300);
  };

  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', handleEscape);
  document.body.appendChild(modal);
  requestAnimationFrame(() => {
    modal.classList.add('show');
    closeButton.focus();
  });
}

/**
 * Creates the poster button (image + play icon)
 * @param {Element} posterImage - Optional authored picture element
 * @param {string} videoTitle - The video title
 * @returns {HTMLButtonElement}
 */
function createPosterButton(posterImage, videoTitle) {
  const btn = document.createElement('button');
  btn.className = 'video-container';
  btn.type = 'button';
  btn.setAttribute('aria-label', `Play video: ${videoTitle || 'Video'}`);

  const posterUrl = posterImage?.querySelector('img')?.src;
  if (posterUrl) {
    const img = document.createElement('img');
    img.src = posterUrl;
    img.alt = videoTitle || 'Video player';
    img.loading = 'lazy';
    btn.appendChild(img);
  } else {
    btn.classList.add('no-poster');
  }

  const playIcon = document.createElement('div');
  playIcon.className = 'video-play-icon';
  btn.appendChild(playIcon);

  return btn;
}

/**
 * Appends the title heading to a video item
 */
function appendTitle(videoItem, videoTitle) {
  if (!videoTitle) return;
  const titleElement = document.createElement('h3');
  titleElement.className = 'video-title';
  titleElement.textContent = videoTitle;
  videoItem.appendChild(titleElement);
}

/**
 * Creates a video item that plays in a modal on click
 * @param {string} videoUrl - The video URL
 * @param {Element} posterImage - Optional poster image element
 * @param {string} videoTitle - Optional video title text
 * @returns {Element} The video item element
 */
function createModalVideoItem(videoUrl, posterImage, videoTitle) {
  if (!getAdobeVideoId(videoUrl)) return null;

  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';

  const btn = createPosterButton(posterImage, videoTitle);
  btn.addEventListener('click', () => openAdobeVideoModal(videoUrl, videoTitle));
  videoItem.appendChild(btn);

  appendTitle(videoItem, videoTitle);
  return videoItem;
}

/**
 * Creates a single inline video item.
 * With a poster: shows the poster with a play button, swaps in the player on click.
 * Without a poster: the player is embedded when the block scrolls into view.
 * @param {string} videoUrl - The video URL
 * @param {Element} posterImage - Optional poster image element
 * @param {string} videoTitle - Optional video title text
 * @returns {Element} The video item element
 */
function createInlineVideoItem(videoUrl, posterImage, videoTitle) {
  if (!getAdobeVideoId(videoUrl)) return null;
  const videoName = videoTitle || 'Video';

  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';

  const embedPlayer = (container, autoplay) => {
    const iframe = createPlayerIframe(getEmbedUrl(videoUrl, autoplay), videoTitle);
    trackPlayer(iframe, videoName);
    container.replaceChildren(iframe);
    container.classList.add('has-player');
  };

  if (posterImage?.querySelector('img')) {
    const btn = createPosterButton(posterImage, videoTitle);
    btn.addEventListener('click', () => {
      const container = document.createElement('div');
      container.className = 'video-container';
      btn.replaceWith(container);
      embedPlayer(container, true);
    }, { once: true });
    videoItem.appendChild(btn);
  } else {
    const container = document.createElement('div');
    container.className = 'video-container';
    videoItem.appendChild(container);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          embedPlayer(container, false);
        }
      });
    }, { rootMargin: '100px' });
    observer.observe(container);
  }

  appendTitle(videoItem, videoTitle);
  return videoItem;
}

/**
 * Parses video data from a row
 * Returns { videoUrl, posterImage, title }
 */
function parseVideoRow(row) {
  let videoUrl;
  [...row.querySelectorAll('a')].some((a) => {
    // links pasted from email may be wrapped (e.g. Outlook safelinks), so also
    // check the decoded href and the link text for the real video URL
    let decoded = a.href;
    try {
      decoded = decodeURIComponent(a.href);
    } catch (e) {
      // keep the raw href
    }
    const found = [decoded, a.textContent]
      .map((candidate) => candidate.match(/https?:\/\/video\.tv\.adobe\.com\/v\/\d+[^\s&<"]*/)?.[0])
      .find(Boolean);
    if (found) videoUrl = found;
    return !!found;
  });
  if (!videoUrl) {
    const [url] = row.textContent.match(/https?:\/\/video\.tv\.adobe\.com\/v\/\d+[^\s<]*/) || [];
    if (url) videoUrl = url;
  }
  const picture = row.querySelector('picture');

  // Use the first text that isn't the URL as the title
  const textBlocks = [...row.querySelectorAll('p, h1, h2, h3, h4, h5, h6')]
    .map((el) => el.textContent.trim());
  const allText = textBlocks.length
    ? textBlocks
    : row.textContent.split('\n').map((t) => t.trim());
  const title = allText.find((text) => text && !text.includes(ADOBE_TV_HOST)) || '';

  return {
    videoUrl,
    posterImage: picture,
    title,
  };
}

/**
 * Decorates the adobe-video block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = Array.from(block.querySelectorAll(':scope > div'));
  if (rows.length === 0) return;

  const videoGrid = document.createElement('div');
  videoGrid.className = 'video-grid';

  const videoData = rows
    .map((row) => parseVideoRow(row))
    .filter(({ videoUrl }) => getAdobeVideoId(videoUrl));

  const isMulti = videoData.length >= 2 || block.classList.contains('contained');
  videoGrid.classList.add(isMulti ? 'video-grid-multi' : 'video-grid-single');

  const createItem = isMulti ? createModalVideoItem : createInlineVideoItem;
  videoData.forEach(({ videoUrl, posterImage, title }) => {
    const videoItem = createItem(videoUrl, posterImage, title);
    if (videoItem) videoGrid.appendChild(videoItem);
  });

  block.replaceChildren(videoGrid);
}
