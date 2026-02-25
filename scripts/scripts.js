import { loadArea, setConfig } from './ak.js';
import { attachNavigationTracking, pushPageContext } from './analytics.js';
import { initAndEager, isMartechInitialized, martechLazy } from './martech.js';

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

async function loadPage() {
  cleanEmptyMetadata();
  setConfig({ hostnames, locales, widgets, components, decorateArea });

  await Promise.all([
    initAndEager(),
    loadArea(),
  ]);

  if (isMartechInitialized()) {
    await martechLazy();
    pushPageContext();
    attachNavigationTracking();
  }
}
await loadPage();

(function da() {
  const ref = new URL(window.location.href).searchParams.get('dapreview');
  if (ref) import('../tools/da/da.js').then((mod) => mod.default(loadPage));
}());
