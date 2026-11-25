import { trackVideoComplete, trackVideoStart } from '../../scripts/analytics.js';

const ADOBE_TV_ORIGIN = 'https://video.tv.adobe.com';
const ADOBE_TV_HOST = 'video.tv.adobe.com';
const ADOBE_URL_PATTERN = /https?:\/\/video\.tv\.adobe\.com\/v\/\d+[^\s&<>"]*/;

/**
 * Extracts the video ID from an Adobe video URL
 * e.g. https://video.tv.adobe.com/v/3495665/?pls=1 -> 3495665
 * @param {string} url - The Adobe video URL
 * @returns {string|null} The video ID
 */
export function getAdobeVideoId(url) {
  const match = url?.match(/video\.tv\.adobe\.com\/v\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Finds an Adobe video URL in a string, also inside wrapped/encoded links
 * (e.g. Outlook safelinks copied from an email).
 * @param {string} text - An href or text
 * @returns {string|null} The Adobe video URL, including its query params
 */
export function findAdobeVideoUrl(text) {
  if (!text) return null;
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch (e) {
    // keep the raw value
  }
  return decoded.match(ADOBE_URL_PATTERN)?.[0] || null;
}

/**
 * Builds the embeddable player URL, keeping any authored query params (e.g. pls=1)
 * @param {string} url - The authored Adobe video URL
 * @param {boolean} autoplay - Whether the player should start automatically
 * @returns {string|null} The embed URL
 */
export function getEmbedUrl(url, autoplay = false) {
  const id = getAdobeVideoId(url);
  if (!id) return null;
  let search;
  try {
    search = new URL(url).searchParams;
  } catch (e) {
    search = new URLSearchParams();
  }
  if (autoplay) search.set('autoplay', 'true');
  const query = search.toString();
  return `${ADOBE_TV_ORIGIN}/v/${id}/${query ? `?${query}` : ''}`;
}

/**
 * Creates the Adobe player iframe
 * @param {string} src - The player URL
 * @param {string} title - The video title
 * @returns {HTMLIFrameElement}
 */
function createPlayerIframe(src, title) {
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title || 'Video player';
  iframe.loading = 'lazy';
  iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
  iframe.setAttribute('scrolling', 'no');
  return iframe;
}

/**
 * Tracks video start/complete for a player iframe (same data layer events as Vidyard).
 * The Adobe player reports its state to the page with postMessage, as JSON strings like
 * {"type":"mpcStatus","state":"start"|"play"|"pause"|"tick"|"complete","id":"3495665"}.
 * Start and complete are each tracked once per player.
 * @param {HTMLIFrameElement} iframe - The player iframe
 * @param {string} videoName - The video name used for analytics
 * @param {number} startAt - Optional start time in seconds (deep links, e.g. ?second=35)
 * @returns {Function} Cleanup function that removes the listener
 */
function trackPlayer(iframe, videoName, startAt = 0) {
  let started = false;
  let completed = false;

  // start time: the player accepts player.js commands; sent when the player is ready
  // and again on first playback (whichever the player honors), never after that
  const seek = () => {
    if (!(startAt > 0) || started) return;
    const message = { context: 'player.js', version: '0.0.11', method: 'setCurrentTime' };
    message.value = startAt;
    iframe.contentWindow?.postMessage(JSON.stringify(message), ADOBE_TV_ORIGIN);
  };

  const onMessage = (event) => {
    if (event.origin !== ADOBE_TV_ORIGIN || event.source !== iframe.contentWindow) return;
    let { data } = event;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return;
      }
    }
    if (data?.context === 'player.js' && data.event === 'ready') {
      seek();
      return;
    }
    const state = data?.state;
    if ((state === 'start' || state === 'play') && !started) {
      seek();
      started = true;
      trackVideoStart({ videoName });
    } else if ((state === 'complete' || state === 'ended') && !completed) {
      completed = true;
      trackVideoComplete({ videoName });
    }
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}

/**
 * Opens a video modal with the Adobe TV player
 * @param {string} videoUrl - The Adobe TV video URL
 * @param {string} title - The video title
 * @param {Object} options
 * @param {number} options.startAt - Optional start time in seconds
 */
export function openAdobeVideoModal(videoUrl, title, { startAt = 0 } = {}) {
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
  const stopTracking = trackPlayer(iframe, videoName, startAt);

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
  // links pasted from email may be wrapped (e.g. Outlook safelinks), so check the
  // decoded href and the link text, then the plain text, for the real video URL
  const videoUrl = [...row.querySelectorAll('a')]
    .map((a) => findAdobeVideoUrl(a.href) || findAdobeVideoUrl(a.textContent))
    .find(Boolean) || findAdobeVideoUrl(row.textContent);
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
 * Turns the ?v= value of a deep link into an Adobe video URL
 * @param {string} v - An Adobe video ID (e.g. 3495665) or an Adobe video URL
 * @returns {string|null} The Adobe video URL, or null for other values (Vidyard UUIDs)
 */
function getDeepLinkVideoUrl(v) {
  if (/^\d+$/.test(v)) return `${ADOBE_TV_ORIGIN}/v/${v}/`;
  return findAdobeVideoUrl(v);
}

/**
 * Opens the video of a deep link (?v=...) in a modal. Adobe video IDs/URLs play in the
 * Adobe player; other values are legacy Vidyard UUIDs, handed to the video block.
 * Other query params are player params, e.g. second=35 to start at 0:35.
 * @param {string} v - The ?v= value
 * @param {URLSearchParams} searchParams - All query params of the link
 */
async function openVideoFromParam(v, searchParams) {
  const params = new URLSearchParams(searchParams);
  params.delete('v');
  const videoParams = {};
  params.forEach((value, key) => {
    const num = Number(value);
    videoParams[key] = Number.isNaN(num) ? value : num;
  });

  const { loadStyle } = await import('../../scripts/ak.js');
  const adobeUrl = getDeepLinkVideoUrl(v);
  if (adobeUrl) {
    await loadStyle('/blocks/adobe-video/adobe-video.css');
    const startAt = Number(videoParams.second) || 0;
    openAdobeVideoModal(adobeUrl, '', { startAt });
    return;
  }

  // legacy Vidyard links, until the video block is retired
  const [{ openVideoModal }] = await Promise.all([
    import('../video/video.js'),
    loadStyle('/blocks/video/video.css'),
  ]);
  openVideoModal(v, '', videoParams);
}

/**
 * Video deep links: opens the video of a ?v= page URL on load, and of same-page
 * ?v= links when clicked (e.g. /get-help?v=3495665&second=35)
 */
export function initVideoDeepLinks() {
  const pageSearchParams = new URLSearchParams(window.location.search);
  const pageVideoId = pageSearchParams.get('v');
  if (pageVideoId) openVideoFromParam(pageVideoId, pageSearchParams);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="v="]');
    if (!a) return;
    const url = new URL(a.href, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
    const v = url.searchParams.get('v');
    if (!v) return;
    e.preventDefault();
    window.history.pushState({}, '', a.href);
    openVideoFromParam(v, url.searchParams);
  });
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
