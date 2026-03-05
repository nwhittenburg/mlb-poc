/**
 * Centralized analytics event tracking for Adobe Client Data Layer.
 * All ACDL push events are maintained here.
 */
import { getMetadata } from './ak.js';
import { isMartechInitialized, pushToDataLayer } from './martech.js';

const PREV_PAGE_KEY = 'acdl_previous_page';

/**
 * Format path segment for display (e.g. "road-illuminators" -> "Road Illuminators")
 */
function formatSegment(segment) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Infer page type from pathname
 */
function getPageType(pathname) {
  if (pathname === '/' || pathname === '') return 'Home';
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) return 'Category';
  if (segments.length >= 2) return 'Product';
  return 'Home';
}

/**
 * Infer content type from pathname or metadata
 */
function getContentType(pathname) {
  const meta = getMetadata('content-type') || getMetadata('contentType');
  if (meta) return meta;
  if (pathname.includes('/articles/')) return 'Article';
  if (pathname.includes('/use-cases/')) return 'Use Case';
  if (pathname.includes('/data-dictionary/')) return 'Data Dictionary';
  if (pathname.includes('/capabilities/')) return 'Capability';
  return 'Home';
}

/**
 * Build page context from current page. Pushed to ACDL on page load.
 */
export function getPageContext() {
  const { pathname, origin } = window.location;
  const domain = window.location.hostname;
  const pageURL = `${origin}${pathname}`;
  const segments = pathname.split('/').filter(Boolean);
  const formatted = segments.map(formatSegment);

  const siteSection = formatted[0] || 'Home';
  const subSection = formatted.slice(0, 2).join(' : ') || siteSection;
  const pageName = formatted.join(' : ') || 'Home';
  const pageType = getPageType(pathname);
  const contentType = getContentType(pathname);
  const previousPage = sessionStorage.getItem(PREV_PAGE_KEY) || '';

  return {
    siteSection,
    contentType,
    pageURL,
    subSection,
    domain,
    pageName,
    pageType,
    previousPage,
  };
}

/**
 * Push page context to the data layer. Call after martech lazy phase.
 */
export function pushPageContext() {
  if (!isMartechInitialized()) return;
  const context = getPageContext();
  pushToDataLayer({ pageContext: context });
  sessionStorage.setItem(PREV_PAGE_KEY, context.pageName);
}

/**
 * Track video start. Call when a video begins playback.
 * @param {Object} params
 * @param {string} params.videoName - Video name (e.g. "How To Videos : Road Runner Traps")
 */
export function trackVideoStart({ videoName }) {
  if (!isMartechInitialized()) return;
  pushToDataLayer({
    event: 'videoanalysis',
    v13: videoName,
    e15: 1,
  });
}

/**
 * Track video complete. Call when a video reaches 100% completion.
 * @param {Object} params
 * @param {string} params.videoName - Video name (e.g. "How To Videos : Road Runner Traps")
 */
export function trackVideoComplete({ videoName }) {
  if (!isMartechInitialized()) return;
  pushToDataLayer({
    event: 'videoanalysis',
    v13: videoName,
    e14: 1,
  });
}

/**
 * Track internal link click (Internal Campaign Analysis).
 * Increments e3 when users click internal CTAs and promotional elements.
 * @param {Object} params
 * @param {string} params.linkText - Text of the clicked link
 */
export function trackLinkClick({ linkText }) {
  if (!isMartechInitialized()) return;
  const text = linkText?.trim() || 'Internal Link Click';
  pushToDataLayer({
    event: 'linkanalysis',
    e3: { [text]: 1 },
  });
}

/**
 * Track navigation usage. Call when a nav link is clicked.
 * @param {Object} params
 * @param {string} params.navigation - Navigation path (e.g. "footer : data dictionary")
 */
export function trackNavigation({ navigation }) {
  if (!isMartechInitialized()) return;
  pushToDataLayer({
    event: 'navigationusage',
    internalNavigation: { v4: navigation },
    internalNavigations: 1,
  });
}

/**
 * Build navigation path for a link (e.g. "header : What It Is : How To Use")
 */
function getNavigationPath(link) {
  const header = link.closest('header');
  const footer = link.closest('footer');
  const linkText = link.textContent?.trim() || '';

  if (header) {
    const navItem = link.closest('.main-nav-item');
    if (navItem) {
      const parentLink = navItem.querySelector(':scope > .main-nav-link, :scope > p');
      const parentText = parentLink?.textContent?.trim();
      if (parentText && parentText !== linkText) {
        return `header : ${parentText} : ${linkText}`;
      }
    }
    return `header : ${linkText}`;
  }
  if (footer) {
    return `footer : ${linkText}`;
  }
  return null;
}

/**
 * Attach navigation tracking to header and footer links.
 */
export function attachNavigationTracking() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    const isJsUrl = /^javascript:/i.test(href);
    if (!href || href === '#' || isJsUrl) return;
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
    } catch {
      return;
    }
    const navigation = getNavigationPath(link);
    if (navigation) trackNavigation({ navigation });
    trackLinkClick({ linkText: link.textContent?.trim() });
  });
}

/**
 * Track internal search. Call when search results are rendered.
 */
export function trackSearch({ searchTerm, resultCount }) {
  if (!isMartechInitialized()) return;
  pushToDataLayer({
    event: 'internalsearchanalysis',
    internalSearchTerm: searchTerm,
    internalSearch: 1,
    nullSearchResults: resultCount === 0 ? 1 : 0,
    searchResults: { number: String(resultCount) },
    searchResultsPageType: resultCount === 0 ? 'No Results' : 'Results Page',
  });
}
