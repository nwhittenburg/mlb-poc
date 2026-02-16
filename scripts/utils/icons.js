import { getConfig } from '../ak.js';

// Fetch promise to avoid multiple requests during page load
let iconDataPromise = null;

/**
 * Fetches the icons JSON once per page load
 * @returns {Promise<Set>} Set of icon keys that exist in /media
 */
async function fetchIconsData() {
  if (!iconDataPromise) {
    iconDataPromise = fetch('/docs/library/icons.json')
      .then((resp) => (resp.ok ? resp.json() : { data: [] }))
      .then((json) => {
        const iconSet = new Set();
        if (json.data) {
          json.data.forEach((item) => {
            if (item.key) iconSet.add(item.key);
          });
        }
        return iconSet;
      })
      .catch(() => new Set());
  }
  return iconDataPromise;
}

export default async function loadIcons(icons) {
  const { codeBase } = getConfig();
  const iconData = await fetchIconsData();

  for (const icon of icons) {
    const name = icon.classList[1].substring(5);

    // Check if icon exists in JSON data
    const iconPath = iconData.has(name)
      ? `${codeBase}/media/icons/${name}.svg`
      : `${codeBase}/img/icons/${name}.svg`;

    const img = document.createElement('img');
    img.className = icon.className;
    img.src = iconPath;
    img.alt = name;
    img.loading = 'lazy';

    icon.replaceWith(img);
  }
}
