/**
 * Helpers for Adobe-hosted videos (video.tv.adobe.com, Adobe Media Publishing Cloud).
 *
 * The Adobe player runs in an iframe and reports its state to the parent page with
 * postMessage, as JSON strings such as:
 *   {"type":"mpcStatus","state":"load","id":"3495665","length":651}
 *   {"type":"mpcStatus","state":"start","id":"3495665"}   first playback
 *   {"type":"mpcStatus","state":"play" | "pause" | "seek" | "tick" | "milestone", ...}
 *   {"type":"mpcStatus","state":"complete","id":"3495665"} video reached the end
 * It also accepts player.js commands (play, pause, setCurrentTime, ...).
 */
import { trackVideoComplete, trackVideoStart } from '../../scripts/analytics.js';

export const ADOBE_TV_ORIGIN = 'https://video.tv.adobe.com';
export const ADOBE_TV_HOST = 'video.tv.adobe.com';

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
 * Builds the player URL, keeping the authored query params (e.g. pls=1)
 * @param {string} urlOrId - Adobe video URL or video ID
 * @param {Object} options
 * @param {boolean} options.autoplay - Start playback automatically
 * @param {Object} options.params - Extra query params
 * @returns {string|null} The player URL
 */
export function getAdobeEmbedUrl(urlOrId, { autoplay = false, params = {} } = {}) {
  const id = /^\d+$/.test(String(urlOrId)) ? String(urlOrId) : getAdobeVideoId(urlOrId);
  if (!id) return null;
  let search;
  try {
    search = new URL(urlOrId).searchParams;
  } catch (e) {
    search = new URLSearchParams();
  }
  Object.entries(params).forEach(([key, value]) => search.set(key, value));
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
export function createAdobePlayer(src, title) {
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title || 'Video player';
  iframe.loading = 'lazy';
  iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('scrolling', 'no');
  return iframe;
}

function parseMessage(data) {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

/**
 * Sends a player.js command to the Adobe player
 * @param {HTMLIFrameElement} iframe - The player iframe
 * @param {string} method - e.g. 'play', 'pause', 'setCurrentTime'
 * @param {*} value - Optional value
 */
export function sendAdobePlayerCommand(iframe, method, value) {
  const message = { context: 'player.js', version: '0.0.11', method };
  if (value !== undefined) message.value = value;
  iframe.contentWindow?.postMessage(JSON.stringify(message), ADOBE_TV_ORIGIN);
}

/**
 * Wires analytics (video start / complete) and an optional start time to an Adobe player.
 * @param {HTMLIFrameElement} iframe - The player iframe
 * @param {Object} options
 * @param {string} options.videoName - The video name used for analytics
 * @param {number} options.startAt - Optional start time in seconds
 * @returns {Function} Cleanup function that removes the listener
 */
export function watchAdobePlayer(iframe, { videoName = 'Video', startAt } = {}) {
  let started = false;
  let completed = false;
  // start time: sent when the player is ready and again on first playback, until the
  // player confirms the seek
  let seekDone = !(startAt > 0);
  const seek = () => {
    if (!seekDone) sendAdobePlayerCommand(iframe, 'setCurrentTime', startAt);
  };

  const onMessage = (event) => {
    if (event.origin !== ADOBE_TV_ORIGIN || event.source !== iframe.contentWindow) return;
    const data = parseMessage(event.data);
    if (data?.context === 'player.js' && data.event === 'ready') {
      seek();
      return;
    }
    if (data?.type !== 'mpcStatus') return;

    const { state } = data;
    if (state === 'seek') {
      seekDone = true;
    } else if (!seekDone && (state === 'load' || state === 'start' || state === 'play')) {
      seek();
    }
    if ((state === 'start' || state === 'play') && !started) {
      started = true;
      trackVideoStart({ videoName });
    } else if (state === 'complete' && !completed) {
      completed = true;
      trackVideoComplete({ videoName });
    }
  };

  window.addEventListener('message', onMessage);
  return () => window.removeEventListener('message', onMessage);
}
