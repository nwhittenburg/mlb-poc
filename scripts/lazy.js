(function loadLazy() {
  import('./utils/fonts.js').then(({ default: loadFonts }) => loadFonts());
  import('./utils/lazyhash.js');
  import('./utils/footer.js').then(({ default: footer }) => footer());
  import('../tools/sidekick/sidekick.js');

  const openVideoFromParam = (videoId) => {
    Promise.all([
      import('../blocks/video/video.js'),
      import('./ak.js'),
    ]).then(([{ openVideoModal }, { loadStyle }]) => {
      loadStyle('/blocks/video/video.css').then(() => openVideoModal(videoId));
    });
  };

  const videoId = new URLSearchParams(window.location.search).get('v');
  if (videoId) openVideoFromParam(videoId);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="v="]');
    if (!a) return;
    const url = new URL(a.href, location.origin);
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    const v = url.searchParams.get('v');
    if (!v) return;
    e.preventDefault();
    history.pushState({}, '', a.href);
    openVideoFromParam(v);
  });

  const searchCSS = document.createElement('link');
  searchCSS.rel = 'stylesheet';
  searchCSS.href = '/blocks/search-results/search-results.css';
  document.head.appendChild(searchCSS);

  window.setTimeout(() => {
    import('./martech.js').then(({ martechDelayed, isMartechInitialized }) => {
      if (isMartechInitialized()) martechDelayed();
    });
  }, 3000);
}());
