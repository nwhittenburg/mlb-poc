(function loadLazy() {
  import('./utils/fonts.js').then(({ default: loadFonts }) => loadFonts());
  import('./utils/lazyhash.js');
  import('./utils/footer.js').then(({ default: footer }) => footer());
  import('../tools/sidekick/sidekick.js');

  const videoId = new URLSearchParams(window.location.search).get('v');
  if (videoId) {
    Promise.all([
      import('../blocks/video/video.js'),
      import('./ak.js'),
    ]).then(([{ openVideoModal }, { loadStyle }]) => {
      loadStyle('/blocks/video/video.css').then(() => openVideoModal(videoId));
    });
  }

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
