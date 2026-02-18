/**
 * Loads the Vidyard embed script lazily
 */
export default function loadVidyard() {
  const script = document.createElement('script');
  script.src = 'https://play.vidyard.com/embed/v4.js';
  script.type = 'text/javascript';
  script.async = true;
  document.head.appendChild(script);
}
