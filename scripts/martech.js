/**
 * Adobe MarTech integration for AEM Edge Delivery Services.
 * @see https://www.aem.live/developer/martech-integration
 * @see https://github.com/adobe-rnd/aem-martech
 */
/* eslint-disable import/no-relative-packages */
import {
  initMartech,
  martechEager,
  martechLazy,
  martechDelayed,
  updateUserConsent,
  pushToDataLayer as pluginPushToDataLayer,
} from '../plugins/martech/src/index.js';
import getConfigValue from './config.js';

// Disable martech via ?martech=off for debugging
const disabled = window.location.search.includes('martech=off');

/** Whether martech was initialized */
let initialized = false;

/**
 * Initialize and run the martech eager phase.
 * @returns {Promise<void>}
 */
export async function initAndEager() {
  if (disabled) return undefined;

  const datastreamId = await getConfigValue('web-sdk-datastream-id');
  const orgId = await getConfigValue('web-sdk-org-id');

  const webSDKConfig = {
    datastreamId,
    orgId,
  };

  const martechConfig = {
    personalization: false,
    launchUrls: [],
  };

  initialized = true;
  const martechLoadedPromise = initMartech(webSDKConfig, martechConfig);
  return martechLoadedPromise.then(() => {
    // No consent management: grant all for tracking (must run after initMartech sets config)
    updateUserConsent({
      collect: true,
      marketing: true,
      personalize: true,
      share: true,
    });
    return martechEager();
  });
}

export function isMartechInitialized() {
  return initialized;
}

/**
 * Push a payload to the Adobe Client Data Layer. No-ops if martech is not initialized.
 * @param {Object} payload - Data to push (e.g. { event, internalSearchTerm, ... })
 */
export function pushToDataLayer(payload) {
  if (!initialized) return;
  pluginPushToDataLayer(payload);
}

export { martechLazy, martechDelayed };
