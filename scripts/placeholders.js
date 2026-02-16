/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} - camelCase string
 */
export function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (match, chr) => chr.toUpperCase());
}

let placeholders = {};

/**
 * Fetch placeholders for a given prefix
 * @param {string} prefix - Language prefix (e.g., 'en', 'de')
 * @returns {Promise<Object>} - Object with placeholder key-value pairs
 */
export async function fetchPlaceholders(prefix = '') {
  const path = prefix ? `/${prefix}` : '';
  const cacheKey = path || 'default';
  
  // Return cached placeholders if already fetched
  if (placeholders[cacheKey]) {
    return placeholders[cacheKey];
  }
  
  try {
    const response = await fetch(`${path}/placeholders.json`);
    if (!response.ok) {
      // Return empty object if placeholders file doesn't exist
      placeholders[cacheKey] = {};
      return placeholders[cacheKey];
    }
    
    const json = await response.json();
    const data = {};
    
    // Convert placeholder data to camelCase keys
    json.data.forEach((item) => {
      const key = toCamelCase(item.Key);
      data[key] = item.Text;
    });
    
    placeholders[cacheKey] = data;
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to fetch placeholders for ${path}:`, error);
    placeholders[cacheKey] = {};
    return placeholders[cacheKey];
  }
}
