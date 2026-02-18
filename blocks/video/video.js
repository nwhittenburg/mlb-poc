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
 * Creates a single video element using Vidyard image embed
 * @param {string} videoUrl - The video URL
 * @param {Element} posterImage - Optional poster image element
 * @param {string} videoTitle - Optional video title text
 * @returns {Element} The video item element
 */
function createVideoItem(videoUrl, posterImage, videoTitle) {
  const videoUuid = getVidyardUuid(videoUrl);
  if (!videoUuid) {
    return null;
  }

  const videoItem = document.createElement('div');
  videoItem.className = 'video-item';

  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';

  // Create the Vidyard embed placeholder image
  // Use custom poster if provided, otherwise use Vidyard's thumbnail
  let posterUrl = posterImage ? null : getPosterUrl(videoUuid);
  
  if (posterImage) {
    const img = posterImage.querySelector('img');
    if (img) {
      posterUrl = img.src;
    }
  }

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

  // Add optional video title
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

  // Process each row as a potential video
  const videoItems = [];
  rows.forEach((row) => {
    const { videoUrl, posterImage, title } = parseVideoRow(row);
    
    if (videoUrl) {
      const videoItem = createVideoItem(videoUrl, posterImage, title);
      if (videoItem) {
        videoItems.push(videoItem);
        videoGrid.appendChild(videoItem);
      }
    }
  });

  // Add class based on number of videos
  if (videoItems.length === 1) {
    videoGrid.classList.add('video-grid-single');
  } else if (videoItems.length >= 2) {
    videoGrid.classList.add('video-grid-multi');
  }

  // Clear the block and add the grid
  block.innerHTML = '';
  block.appendChild(videoGrid);

  // Load Vidyard script only when video block is in view
  // Use Intersection Observer to defer script load until needed
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Unobserve so we only load once
        observer.unobserve(entry.target);
        
        // Load Vidyard and render players
        ensureVidyardScript().then((vyApi) => {
          vyApi.api.renderDOMPlayers(block);
        });
      }
    });
  }, { rootMargin: '100px' });

  observer.observe(block);
}
