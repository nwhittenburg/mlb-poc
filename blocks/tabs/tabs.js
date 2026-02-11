/**
 * Convert text to class name format
 * @param {string} text - Text to convert
 * @returns {string} - Class name
 */
function toClassName(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract Vidyard video ID from URL
 * @param {string} url - Vidyard URL
 * @returns {string} - Video ID
 */
function getVidyardId(url) {
  const match = url.match(/watch\/([^?]+)/);
  return match ? match[1] : '';
}

/**
 * Create and show video modal
 * @param {Object} video - Video data object
 */
function openVideoModal(video) {
  const videoId = getVidyardId(video.url);

  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'video-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', video.title);

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'video-modal-content';

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'video-modal-close';
  closeButton.setAttribute('type', 'button');
  closeButton.setAttribute('aria-label', 'Close video');
  closeButton.innerHTML = '&times;';

  // Create video container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-modal-player';

  // Create Vidyard iframe - optimized for fast loading
  const iframe = document.createElement('iframe');
  iframe.className = 'vidyard-player-embed';
  iframe.src = `https://play.vidyard.com/${videoId}?autoplay=1&type=inline`;
  iframe.loading = 'eager';
  iframe.allow = 'autoplay; fullscreen';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');

  videoContainer.appendChild(iframe);

  modalContent.appendChild(closeButton);
  modalContent.appendChild(videoContainer);
  modal.appendChild(modalContent);

  // Close modal function
  const closeModal = () => {
    modal.classList.add('closing');
    document.removeEventListener('keydown', handleEscape);
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 300);
  };

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  // Close on button click
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Add keyboard listener
  document.addEventListener('keydown', handleEscape);

  // Add to DOM and show
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Trigger animation
  requestAnimationFrame(() => {
    modal.classList.add('show');
  });
}

/**
 * Create a video card element
 * @param {Object} video - Video data object
 * @returns {HTMLElement} - Video card element
 */
function createVideoCard(video) {
  const card = document.createElement('button');
  card.className = 'video-card';
  card.setAttribute('type', 'button');
  card.setAttribute('aria-label', `Play video: ${video.title}`);

  const videoId = getVidyardId(video.url);

  // Create thumbnail container
  const thumbnail = document.createElement('div');
  thumbnail.className = 'video-thumbnail';

  // Create thumbnail image
  const img = document.createElement('img');
  img.src = `https://play.vidyard.com/${videoId}.jpg`;
  img.alt = video.title;
  img.loading = 'lazy';

  // Create play icon overlay
  const playIcon = document.createElement('div');
  playIcon.className = 'video-play-icon';

  thumbnail.appendChild(img);
  thumbnail.appendChild(playIcon);

  // Create title
  const title = document.createElement('div');
  title.className = 'video-title';
  title.textContent = video.title;

  card.appendChild(thumbnail);
  card.appendChild(title);

  // Add click handler to open modal
  card.addEventListener('click', () => {
    openVideoModal(video);
  });

  return card;
}

/**
 * Fetch video data from JSON endpoint
 * @returns {Promise<Array>} - Array of video objects
 */
async function fetchVideoData() {
  try {
    const response = await fetch('/docs/playlist-get-help.json');
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    
    const json = await response.json();
    return json.data || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching video data:', error);
    return [];
  }
}

/**
 * Loads and decorates the tabs block with video content
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // Extract authored categories from each row
  const categories = [...block.children].map((row) => {
    const categoryCell = row.firstElementChild;
    return categoryCell?.textContent.trim();
  }).filter(Boolean);

  if (categories.length === 0) {
    block.textContent = 'No categories provided';
    return;
  }

  // Clear the block
  block.innerHTML = '';

  // Fetch all video data
  const allVideos = await fetchVideoData();
  
  if (allVideos.length === 0) {
    block.textContent = 'No videos found';
    return;
  }

  // Build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  // Create tabs and panels for each authored category
  categories.forEach((category, i) => {
    const id = toClassName(category);
    
    // Filter videos for this category
    const videos = allVideos.filter((video) => video.category === category);

    // Create tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.textContent = category;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', i === 0);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');

    // Create tab panel
    const tabpanel = document.createElement('div');
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', i !== 0);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // Create video grid
    const videoGrid = document.createElement('div');
    videoGrid.className = 'video-grid';
    
    if (videos.length > 0) {
      videos.forEach((video) => {
        const card = createVideoCard(video);
        videoGrid.appendChild(card);
      });
    } else {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = `No videos available for ${category}`;
      emptyMessage.className = 'video-grid-empty';
      videoGrid.appendChild(emptyMessage);
    }

    tabpanel.appendChild(videoGrid);

    // Add click event to tab button
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });

    tablist.appendChild(button);
    block.appendChild(tabpanel);
  });

  block.prepend(tablist);
}