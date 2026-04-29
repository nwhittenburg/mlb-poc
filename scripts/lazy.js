(function loadLazy() {
  import('./utils/fonts.js').then(({ default: loadFonts }) => loadFonts());
  import('./utils/lazyhash.js');
  import('./utils/footer.js').then(({ default: footer }) => footer());
  import('../tools/sidekick/sidekick.js');

  const buildVideoParams = (searchParams) => {
    const params = new URLSearchParams(searchParams);
    params.delete('v');
    const videoParams = {};
    params.forEach((value, key) => {
      const num = Number(value);
      videoParams[key] = Number.isNaN(num) ? value : num;
    });
    return videoParams;
  };

  const openVideoFromParam = (videoId, fullSearchParams) => {
    const videoParams = buildVideoParams(fullSearchParams);
    Promise.all([
      import('../blocks/video/video.js'),
      import('./ak.js'),
    ]).then(([{ openVideoModal }, { loadStyle }]) => {
      loadStyle('/blocks/video/video.css').then(() => openVideoModal(videoId, '', videoParams));
    });
  };

  const pageSearchParams = new URLSearchParams(window.location.search);
  const pageVideoId = pageSearchParams.get('v');
  if (pageVideoId) openVideoFromParam(pageVideoId, pageSearchParams);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="v="]');
    if (!a) return;
    const url = new URL(a.href, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
    const v = url.searchParams.get('v');
    if (!v) return;
    e.preventDefault();
    window.history.pushState({}, '', a.href);
    openVideoFromParam(v, url.searchParams);
  });

  if (document.querySelector('.search-results')) {
    const searchCSS = document.createElement('link');
    searchCSS.rel = 'stylesheet';
    searchCSS.href = '/blocks/search-results/search-results.css';
    document.head.appendChild(searchCSS);
  }

  window.setTimeout(() => {
    import('./martech.js').then(({ martechDelayed, isMartechInitialized }) => {
      if (isMartechInitialized()) martechDelayed();
    });
  }, 3000);
}());
