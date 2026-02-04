(function loadLazy() {
  import('./utils/fonts.js').then(({ default: loadFonts }) => loadFonts());
  import('./utils/lazyhash.js');
  import('./utils/favicon.js');
  import('./utils/footer.js').then(({ default: footer }) => footer());
  import('../tools/scheduler/scheduler.js');
  import('../tools/sidekick/sidekick.js');
  
  // Show experimentation overlay (for authoring)
  if (window.mlb?.showExperimentationOverlay) {
    window.mlb.showExperimentationOverlay(document, window.mlb.experimentationConfig);
  }
}());
