import { loadArea, setConfig } from './ak.js';
import {
  attachNavigationTracking,
  attachRumBridge,
  pushPageContext,
  pushUserToDataLayer,
} from './analytics.js';
import { initAndEager, isMartechInitialized, martechLazy } from './martech.js';
import getConfigValue from './config.js';
import env from './utils/env.js';

const hostnames = ['aep-docs.mlb.com'];

const locales = { '': { lang: 'en' } };

// Widget patterns to look for (video block handles both YouTube and Vidyard)
const widgets = [
  { fragment: '/fragments/' },
  { video: 'vidyard.com' },
  { video: 'https://www.youtube' },
];

// Blocks with self-managed styles
const components = ['fragment'];

// How to decorate an area before loading it
const decorateArea = ({ area = document }) => {
  const eagerLoad = (parent, selector) => {
    const img = parent.querySelector(selector);
    if (!img) return;
    img.removeAttribute('loading');
    img.fetchPriority = 'high';
  };

  eagerLoad(area, 'img');
};

function cleanEmptyMetadata() {
  document.head.querySelectorAll('meta[content=""]').forEach((meta) => meta.remove());
}

function injectLaunchScript(url) {
  if (!url) return;
  const s = document.createElement('script');
  s.src = url;
  s.async = true;
  document.head.appendChild(s);
}

async function loadPage() {
  cleanEmptyMetadata();
  setConfig({ hostnames, locales, widgets, components, decorateArea });

  const launchKeyMap = { dev: 'adobe-launch-dev-url', stage: 'adobe-launch-staging-url', prod: 'adobe-launch-url' };
  const launchUrl = await getConfigValue(launchKeyMap[env] || 'adobe-launch-url');
  injectLaunchScript(launchUrl);

  await Promise.all([
    initAndEager(),
    loadArea(),
  ]);

  // Set up the OT → ACDL bridge early so no events are missed.
  attachRumBridge();

  if (isMartechInitialized()) {
    await martechLazy();
    await pushUserToDataLayer();
    pushPageContext();
    attachNavigationTracking();
  }

  // Delayed phase: load the RUM enhancer + martechDelayed after LCP, with no
  // race against rendering. Using a 3 s delay is the standard AEM pattern.
  setTimeout(() => import('./delayed.js').catch(() => {}), 3000);
}
await loadPage();

(function da() {
  const ref = new URL(window.location.href).searchParams.get('dapreview');
  if (ref) import('../tools/da/da.js').then((mod) => mod.default(loadPage));
}());
