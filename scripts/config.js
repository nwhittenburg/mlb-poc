/* eslint-disable no-console */
import { setSessionStorageItem, getPropFromSessionStorageObj } from './utils/sessionStorge.js';

const CONFIG_KEY = 'config';

/**
 * Fetches and caches configuration from /configs.json
 * @returns {Promise<void>}
 */
const fetchAndStoreConfig = async () => {
  try {
    const response = await fetch('/config.json');
    if (!response.ok) throw new Error(`Failed to fetch config: ${response.status}`);
    const config = await response.json();

    // Store flattened key-value pairs
    const flatConfig = {};
    config.data?.forEach((item) => {
      if (item.key) flatConfig[item.key] = item.value;
    });
    setSessionStorageItem(CONFIG_KEY, JSON.stringify(flatConfig));
  } catch (e) {
    console.error('Error fetching config:', e);
  }
};

/**
 * Retrieves a configuration value by key using session storage
 * @param {string} key - The configuration key to retrieve
 * @returns {Promise<string|undefined>} The configuration value or undefined
 */
export default async function getConfigValue(key) {
  // Check if config is already cached
  let value = getPropFromSessionStorageObj(CONFIG_KEY, key);

  // If not found, fetch and cache config
  if (!value) {
    await fetchAndStoreConfig();
    value = getPropFromSessionStorageObj(CONFIG_KEY, key);
  }

  return value || undefined;
}
