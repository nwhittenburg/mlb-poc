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

  const datastreamId = 'c62742e3-1bf5-4d85-a442-4fa95cb7306b';
  const orgId = 'A65F776A5245B01B0A490D44@AdobeOrg';

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
