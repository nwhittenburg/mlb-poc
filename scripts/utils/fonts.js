export default function loadFonts() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/styles/fonts.css';
  document.head.appendChild(link);
}
