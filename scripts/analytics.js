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
  pushToDataLayer({
    event: 'pageview',
    pageContext: context,
  });
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
    event: 'videostart',
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
    event: 'videocomplete',
    v13: videoName,
    e14: 1,
  });
}

/** Basic Traffic: v17 Links + link URL, e15 Link Clicks */
export function trackLinkClick({ links, url }) {
  if (!isMartechInitialized()) return;
  const label = links?.trim() || 'Link Click';
  const href = typeof url === 'string' ? url.trim() : '';
  pushToDataLayer({
    event: 'linkclick',
    v17: { Links: label, linkUrl: href },
    e15: { 'Link Clicks': 1 },
  });
}

/** navigationusage — header/footer path in v4 */
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

/** Same origin as this page (mailto/tel count as external). */
function isInternalHref(href) {
  if (/^mailto:/i.test(href) || /^tel:/i.test(href)) return false;
  try {
    return new URL(href, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Internal nav paths → navigationusage; basictraffic except internal header (nav only). */
export function attachNavigationTracking() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#' || /^javascript:/i.test(href)) return;

    const internal = isInternalHref(href);
    const navigation = getNavigationPath(link);

    if (internal) {
      if (navigation) trackNavigation({ navigation });
      if (link.closest('header')) return;
    }

    const linksLabel = navigation
      || link.getAttribute('aria-label')?.trim()
      || link.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim()
      || link.textContent?.trim()
      || 'Link Click';
    trackLinkClick({ links: linksLabel, url: link.href });
  });
}

/**
 * Fetch auth status and push authenticated user identity to the data layer.
 * Only pushes when the user is logged in and a userId is present.
 * Call before pushPageContext so user context is set before the pageview event fires.
 */
export async function pushUserToDataLayer() {
  if (!isMartechInitialized()) return;

  let status;
  try {
    const res = await fetch('/auth/status.json');
    if (!res.ok) return;
    status = await res.json();
  } catch {
    return;
  }

  if (!status?.loggedIn || !status?.userId) return;

  pushToDataLayer({
    event: 'user',
    user: {
      authState: 'authenticated',
      authProvider: 'ims',
      profile: {
        id: status.userId,
        accountType: status.accountType,
      },
    },
  });
}

/** internalsearchanalysis — site search or use-case facet filters */
export function trackSearch({
  searchTerm = '',
  resultCount,
  searchResultsPageType,
  internalSearchTermFilters = '',
}) {
  if (!isMartechInitialized()) return;
  const n = Number(resultCount);
  const isNull = n === 0;
  pushToDataLayer({
    event: 'internalsearchanalysis',
    internalSearchTerm: searchTerm,
    internalSearch: 1,
    nullSearchResults: isNull ? 1 : 0,
    searchResults: { number: String(n) },
    searchResultsPageType: searchResultsPageType ?? (isNull ? 'No Results' : 'Results Page'),
    ...(internalSearchTermFilters ? { internalSearchTermFilters } : {}),
  });
}
