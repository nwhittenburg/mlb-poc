(function loadLazy() {
  import('./utils/fonts.js').then(({ default: loadFonts }) => loadFonts());
  import('./utils/lazyhash.js');
  import('./utils/footer.js').then(({ default: footer }) => footer());
  import('../tools/sidekick/sidekick.js');

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
