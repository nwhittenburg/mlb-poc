(function loadLazy() {
  import('./utils/fonts.js').then(({ default: loadFonts }) => loadFonts());
  import('./utils/lazyhash.js');
  import('./utils/footer.js').then(({ default: footer }) => footer());
  import('../tools/sidekick/sidekick.js');
}());
