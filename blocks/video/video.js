/**
 * Extracts the video UUID from a Vidyard share URL
 * @param {string} url - The Vidyard share URL
 * @returns {string} The video UUID
 */
function getVidyardUuid(url) {
  const match = url.match(/(?:share\.vidyard\.com\/watch\/|play\.vidyard\.com\/?)([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Gets the poster image URL from Vidyard UUID
 * @param {string} uuid - The Vidyard video UUID
 * @returns {string} The poster image URL
 */
function getPosterUrl(uuid) {
  return `https://play.vidyard.com/${uuid}.jpg`;
}

/**
 * Loads Vidyard script if not already loaded
 */
function ensureVidyardScript() {
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
 * Opens a video modal with a Vidyard iframe
 * @param {string} uuid - The Vidyard video UUID
 * @param {string} title - The video title
 */
function openVideoModal(uuid, title) {
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

  const iframe = document.createElement('iframe');
  iframe.src = `https://play.vidyard.com/${uuid}?autoplay=1&type=inline`;
  iframe.loading = 'eager';
  iframe.allow = 'autoplay; fullscreen';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');

  videoContainer.appendChild(iframe);
  modalContent.appendChild(closeButton);
  modalContent.appendChild(videoContainer);
  modal.appendChild(modalContent);

  const closeModal = () => {
    modal.classList.add('closing');
    document.removeEventListener('keydown', handleEscape);
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') closeModal();
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
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.classList.add('show'));
}

/**
 * Creates a video item that plays in a modal on click
 * @param {string} videoUrl - The video URL
 * @param {Element} posterImage - Optional poster image element
 * @param {string} videoTitle - Optional video title text
 * @returns {Element} The video item element
 */
function createModalVideoItem(videoUrl, posterImage, videoTitle) {
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
  const link = row.querySelector('a');
  let videoUrl = link?.href || link?.textContent?.trim();
  if (!videoUrl) {
    const textMatch = row.textContent.match(/(https?:\/\/share\.vidyard\.com\/watch\/[a-zA-Z0-9]+)/);
    if (textMatch) videoUrl = textMatch[1];
  }
  const picture = row.querySelector('picture');
  
  // Extract text that isn't the URL for use as title
  let title = '';
  const allText = row.textContent.split('\n').map((t) => t.trim()).filter(Boolean);
  if (allText.length > 0) {
    // Find text that isn't a URL
    title = allText.find((text) => !text.includes('share.vidyard.com') && !text.includes('play.vidyard.com')) || '';
  }

  return {
    videoUrl,
    posterImage: picture,
    title,
  };
}

/**
 * Decorates the video block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
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

  const isMulti = videoData.length >= 2;

  if (isMulti) {
    videoGrid.classList.add('video-grid-multi');
  } else if (videoData.length === 1) {
    videoGrid.classList.add('video-grid-single');
  }

  const createItem = isMulti ? createModalVideoItem : createInlineVideoItem;
  videoData.forEach(({ videoUrl, posterImage, title }) => {
    const videoItem = createItem(videoUrl, posterImage, title);
    if (videoItem) videoGrid.appendChild(videoItem);
  });

  block.innerHTML = '';
  block.appendChild(videoGrid);

  // Only load Vidyard embed script for inline (single) videos
  if (!isMulti) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          ensureVidyardScript().then((vyApi) => {
            vyApi.api.renderDOMPlayers(block);
          });
        }
      });
    }, { rootMargin: '100px' });

    observer.observe(block);
  }
}
