export default (() => {
  const { host } = window.location;
  if (!['--', 'local'].some((check) => host.includes(check))) return 'prod';
  if (['--'].some((check) => host.includes(check))) return 'stage';
  return 'dev';
})();

// Environment detection utilities
export const isAEMPreview = () => window.location.host.includes('aem.page');

export const isAEMProd = () => window.location.host.includes('aem.live');
