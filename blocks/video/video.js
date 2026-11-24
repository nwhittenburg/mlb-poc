import { trackVideoComplete, trackVideoStart } from '../../scripts/analytics.js';
import {
  ADOBE_TV_HOST,
  createAdobePlayer,
  findAdobeVideoUrl,
  getAdobeEmbedUrl,
  watchAdobePlayer,
} from './adobe-player.js';

/**
 * Extracts the video UUID from a Vidyard share URL
 * @param {string} url - The Vidyard share URL
 * @returns {string} The video UUID
 */
export function getVidyardUuid(url) {
  const match = url.match(/(?:share\.vidyard\.com\/watch\/|play\.vidyard\.com\/?)([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Returns the Adobe video reference (full URL or numeric ID) if the value is an Adobe video
 * @param {string} value - A URL, an Adobe video ID or a Vidyard UUID
 * @returns {string|null} The Adobe video URL or ID
 */
export function getAdobeVideoRef(value) {
  if (!value) return null;
  const str = String(value);
  if (/^\d+$/.test(str)) return str;
  return findAdobeVideoUrl(str);
}

/**
 * Gets the poster image URL from Vidyard UUID
 * @param {string} uuid - The Vidyard video UUID
 * @returns {string} The poster image URL
 */
function getPosterUrl(uuid) {
  return `https://play.vidyard.com/${uuid}.jpg`;
}

const readyListenersRegistered = new Set();

/**
 * Loads Vidyard script if not already loaded
 */
export function ensureVidyardScript() {
  return new Promise((resolve) => {
    if (window.vidyardEmbed) {
      resolve(window.vidyardEmbed);
    } else if (window.onVidyardAPIPromise) {
      window.onVidyardAPIPromise.then(resolve);
    } else {
      // Store promise for other blocks to reuse
      window.onVidyardAPIPromise = new Promise((res) => {
        window.onVidyardAPI = (vyApi) => {
          res(vyApi);
        };
      });

      // Load Vidyard script
      const script = document.createElement('script');
      script.src = 'https://play.vidyard.com/embed/v4.js';
      script.type = 'text/javascript';
      script.async = true;
      document.head.appendChild(script);

      window.onVidyardAPIPromise.then(resolve);
    }
  });
}

/**
 * Opens a video modal (enables progress tracking)
 * - Vidyard: rendered with the Vidyard API
 * - Adobe (video.tv.adobe.com): rendered as an iframe, tracked via the player's messages
 * @param {string} video - Vidyard UUID, Adobe video URL or Adobe video ID
 * @param {string} title - The video title
 * @param {Object} params - Player params (e.g. { second: 35 }). For Adobe videos `second`
 * sets the start time and any other params are added to the player URL.
 */
export function openVideoModal(video, title, params = {}) {
  const videoName = title || 'Video';
  const adobeRef = getAdobeVideoRef(video);
  const uuid = adobeRef ? null : video;
  let adobeIframe;
  let stopAdobeWatch;

  const modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', title || 'Video');

  const modalContent = document.createElement('div');
  modalContent.className = 'video-modal-content';

  const closeButton = document.createElement('button');
  closeButton.className = 'video-modal-close';
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.innerHTML = '&times;';

  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-modal-player';

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
    if (uuid) {
      ensureVidyardScript().then((vyApi) => {
        const players = vyApi.api.getPlayersByUUID(uuid);
        players.forEach((player) => vyApi.api.destroyPlayer(player));
      });
    }
    if (adobeIframe) {
      stopAdobeWatch();
      adobeIframe.remove();
    }
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
  requestAnimationFrame(() => modal.classList.add('show'));

  if (uuid) {
    ensureVidyardScript().then((vyApi) => {
      vyApi.api.renderPlayer({
        uuid,
        container: videoContainer,
        type: 'inline',
        autoplay: 1,
        ...params,
      });
      if (!readyListenersRegistered.has(uuid)) {
        readyListenersRegistered.add(uuid);
        vyApi.api.addReadyListener(() => {
          const players = vyApi.api.getPlayersByUUID(uuid);
          const player = players?.[0];
          if (player) {
            if (typeof player.on === 'function') {
              player.on('play', () => trackVideoStart({ videoName }));
              player.on('playerComplete', () => trackVideoComplete({ videoName }));
            } else {
              vyApi.api.progressEvents((result) => {
                const done = result.event === 95 || result.event === 100;
                if (result.player?.uuid === uuid && done) trackVideoComplete({ videoName });
              }, [95, 100]);
            }
            player.play();
          }
        }, uuid);
      }
    });
  }

  if (adobeRef) {
    const { second, ...urlParams } = params;
    const src = getAdobeEmbedUrl(adobeRef, { autoplay: true, params: urlParams });
    if (src) {
      adobeIframe = createAdobePlayer(src, title);
      adobeIframe.loading = 'eager';
      stopAdobeWatch = watchAdobePlayer(adobeIframe, { videoName, startAt: Number(second) });
      videoContainer.appendChild(adobeIframe);
    }
  }
}

/**
 * Creates the poster button for an Adobe video (Adobe has no public thumbnail URL,
 * so an authored poster is used, or a dark 16:9 placeholder with the play icon)
 * @param {Element} posterImage - Optional authored picture element
 * @param {string} videoTitle - The video title
 * @returns {HTMLButtonElement}
 */
function createAdobePosterButton(posterImage, videoTitle) {
  const btn = document.createElement('button');
  btn.className = 'video-container adobe-poster';
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

function appendVideoTitle(videoItem, videoTitle) {
  if (!videoTitle) return;
  const titleElement = document.createElement('h3');
  titleElement.className = 'video-title';
  titleElement.textContent = videoTitle;
  videoItem.appendChild(titleElement);
}

/**
 * Creates an Adobe video item that plays in a modal on click
 */
function createAdobeModalVideoItem(adobeUrl, posterImage, videoTitle) {
  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';

  const btn = createAdobePosterButton(posterImage, videoTitle);
  btn.addEventListener('click', () => openVideoModal(adobeUrl, videoTitle));
  videoItem.appendChild(btn);

  appendVideoTitle(videoItem, videoTitle);
  return videoItem;
}

/**
 * Creates an inline Adobe video item.
 * With a poster: shows the poster and play icon, loads the player on click.
 * Without a poster: loads the player when the block scrolls near the viewport.
 */
function createAdobeInlineVideoItem(adobeUrl, posterImage, videoTitle) {
  const videoName = videoTitle || 'Video';
  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';

  const embedPlayer = (container, autoplay) => {
    const iframe = createAdobePlayer(getAdobeEmbedUrl(adobeUrl, { autoplay }), videoTitle);
    watchAdobePlayer(iframe, { videoName });
    container.replaceChildren(iframe);
  };

  const createPlayerContainer = () => {
    const container = document.createElement('div');
    container.className = 'video-container adobe-player';
    return container;
  };

  if (posterImage?.querySelector('img')) {
    const btn = createAdobePosterButton(posterImage, videoTitle);
    btn.addEventListener('click', () => {
      const container = createPlayerContainer();
      btn.replaceWith(container);
      embedPlayer(container, true);
    }, { once: true });
    videoItem.appendChild(btn);
  } else {
    const container = createPlayerContainer();
    videoItem.appendChild(container);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        embedPlayer(container, false);
      }
    }, { rootMargin: '100px' });
    observer.observe(container);
  }

  appendVideoTitle(videoItem, videoTitle);
  return videoItem;
}

/**
 * Creates a video item that plays in a modal on click
 * @param {string} videoUrl - The video URL
 * @param {Element} posterImage - Optional poster image element
 * @param {string} videoTitle - Optional video title text
 * @returns {Element} The video item element
 */
function createModalVideoItem(videoUrl, posterImage, videoTitle) {
  const adobeUrl = getAdobeVideoRef(videoUrl);
  if (adobeUrl) return createAdobeModalVideoItem(adobeUrl, posterImage, videoTitle);

  const videoUuid = getVidyardUuid(videoUrl);
  if (!videoUuid) return null;

  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';

  const btn = document.createElement('button');
  btn.className = 'video-container';
  btn.type = 'button';
  btn.setAttribute('aria-label', `Play video: ${videoTitle || 'Video'}`);

  const posterUrl = posterImage?.querySelector('img')?.src || getPosterUrl(videoUuid);
  const img = document.createElement('img');
  img.src = posterUrl;
  img.alt = videoTitle || 'Video player';
  img.loading = 'lazy';

  const playIcon = document.createElement('div');
  playIcon.className = 'video-play-icon';

  btn.appendChild(img);
  btn.appendChild(playIcon);
  videoItem.appendChild(btn);

  btn.addEventListener('click', () => openVideoModal(videoUuid, videoTitle));

  if (videoTitle) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'video-title';
    titleElement.textContent = videoTitle;
    videoItem.appendChild(titleElement);
  }

  return videoItem;
}

/**
 * Creates a single video element using Vidyard image embed (inline playback)
 * @param {string} videoUrl - The video URL
 * @param {Element} posterImage - Optional poster image element
 * @param {string} videoTitle - Optional video title text
 * @returns {Element} The video item element
 */
function createInlineVideoItem(videoUrl, posterImage, videoTitle) {
  const adobeUrl = getAdobeVideoRef(videoUrl);
  if (adobeUrl) return createAdobeInlineVideoItem(adobeUrl, posterImage, videoTitle);

  const videoUuid = getVidyardUuid(videoUrl);
  if (!videoUuid) {
    return null;
  }

  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';

  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';

  const posterUrl = posterImage?.querySelector('img')?.src || getPosterUrl(videoUuid);

  const placeholderImg = document.createElement('img');
  placeholderImg.className = 'vidyard-player-embed';
  placeholderImg.src = posterUrl || getPosterUrl(videoUuid);
  placeholderImg.setAttribute('data-uuid', videoUuid);
  placeholderImg.setAttribute('data-v', '4');
  placeholderImg.setAttribute('data-type', 'inline');
  placeholderImg.style.maxWidth = '100%';
  placeholderImg.style.display = 'block';
  placeholderImg.alt = videoTitle || 'Video player';
  placeholderImg.loading = 'lazy';

  videoContainer.appendChild(placeholderImg);
  videoItem.appendChild(videoContainer);

  if (videoTitle) {
    const titleElement = document.createElement('h3');
    titleElement.className = 'video-title';
    titleElement.textContent = videoTitle;
    videoItem.appendChild(titleElement);
  }

  return videoItem;
}

/**
 * Parses video data from a row
 * Returns { videoUrl, posterImage, title }
 */
function parseVideoRow(row) {
  const isVideoUrlText = (text) => text.includes('share.vidyard.com')
    || text.includes('play.vidyard.com')
    || text.includes(ADOBE_TV_HOST);

  // Adobe video links (also when wrapped, e.g. Outlook safelinks copied from an email)
  let videoUrl = [...row.querySelectorAll('a')]
    .map((a) => findAdobeVideoUrl(a.href) || findAdobeVideoUrl(a.textContent))
    .find(Boolean) || findAdobeVideoUrl(row.textContent);

  if (!videoUrl) {
    const link = row.querySelector('a');
    videoUrl = link?.href || link?.textContent?.trim();
  }
  if (!videoUrl) {
    const [url] = row.textContent.match(/(https?:\/\/share\.vidyard\.com\/watch\/[a-zA-Z0-9]+)/) || [];
    if (url) videoUrl = url;
  }
  const picture = row.querySelector('picture');

  // Extract text that isn't the URL for use as title
  let title = '';
  const allText = row.textContent.split('\n').map((t) => t.trim()).filter(Boolean);
  if (allText.length > 0) {
    // Find text that isn't a URL
    title = allText.find((text) => !isVideoUrlText(text)) || '';
  }
  if (!title) {
    // Paragraphs without line breaks between them
    title = [...row.querySelectorAll('p, h1, h2, h3, h4, h5, h6')]
      .map((el) => el.textContent.trim())
      .find((text) => text && !isVideoUrlText(text)) || '';
  }

  return {
    videoUrl,
    posterImage: picture,
    title,
  };
}

/**
 * Turns a standalone Adobe video link in default content into an inline video block.
 * Links inside blocks (video, embed, etc.) and links within text are left alone, and
 * Vidyard links keep their current behavior (they stay links).
 * @param {HTMLAnchorElement} link The auto-blocked link
 */
function decorateAutoBlock(link) {
  if (link.closest('.block-content')) return;
  const adobeUrl = findAdobeVideoUrl(link.href) || findAdobeVideoUrl(link.textContent);
  if (!adobeUrl) return;

  const parent = link.parentElement;
  const isStandalone = parent?.tagName === 'P'
    && [...parent.childNodes].every((node) => node === link || !node.textContent.trim());
  if (!isStandalone) return;

  const linkText = link.textContent.trim();
  const title = linkText && !linkText.includes(ADOBE_TV_HOST) ? linkText : '';
  const item = createAdobeInlineVideoItem(adobeUrl, null, title);

  const wrapper = document.createElement('div');
  wrapper.className = 'video';
  const videoGrid = document.createElement('div');
  videoGrid.className = 'video-grid video-grid-single';
  videoGrid.appendChild(item);
  wrapper.appendChild(videoGrid);
  parent.replaceWith(wrapper);
}

/**
 * Decorates the video block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Auto-blocked link (see widgets in scripts.js)
  if (block.tagName === 'A') {
    decorateAutoBlock(block);
    return;
  }

  // Extract all rows from the block
  const rows = Array.from(block.querySelectorAll(':scope > div'));

  if (rows.length === 0) {
    return;
  }

  // Create wrapper for grid layout
  const videoGrid = document.createElement('div');
  videoGrid.className = 'video-grid';

  // Collect parsed video data
  const videoData = rows
    .map((row) => parseVideoRow(row))
    .filter(({ videoUrl }) => videoUrl);

  const isMulti = videoData.length >= 2 || block.classList.contains('contained');

  if (isMulti) {
    videoGrid.classList.add('video-grid-multi');
  } else {
    videoGrid.classList.add('video-grid-single');
  }

  const createItem = isMulti ? createModalVideoItem : createInlineVideoItem;
  videoData.forEach(({ videoUrl, posterImage, title }) => {
    const videoItem = createItem(videoUrl, posterImage, title);
    if (videoItem) videoGrid.appendChild(videoItem);
  });

  block.innerHTML = '';
  block.appendChild(videoGrid);

  // Only load Vidyard embed script for inline (single) Vidyard videos
  if (!isMulti && videoData.length > 0 && !getAdobeVideoRef(videoData[0].videoUrl)) {
    const { videoUrl, title } = videoData[0];
    const uuid = getVidyardUuid(videoUrl);
    const videoName = title || 'Video';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          ensureVidyardScript().then((vyApi) => {
            vyApi.api.renderDOMPlayers(block);
            if (uuid) {
              vyApi.api.addReadyListener(() => {
                const players = vyApi.api.getPlayersByUUID(uuid);
                const player = players?.[0];
                if (player) {
                  if (typeof player.on === 'function') {
                    player.on('play', () => trackVideoStart({ videoName }));
                    player.on('playerComplete', () => trackVideoComplete({ videoName }));
                  } else {
                    vyApi.api.progressEvents((result) => {
                      const done = result.event === 95 || result.event === 100;
                      if (result.player?.uuid === uuid && done) trackVideoComplete({ videoName });
                    }, [95, 100]);
                  }
                }
              }, uuid);
            }
          });
        }
      });
    }, { rootMargin: '100px' });
    observer.observe(block);
  }
}
