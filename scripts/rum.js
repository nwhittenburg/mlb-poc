/**
 * Operational Telemetry (OT) utilities for AEM Edge Delivery Services.
 *
 * EDS ships with its own Operational Telemetry system (sampleRUM / helix-rum-js).
 * It is NOT the CNCF OpenTelemetry standard, but serves the same purpose:
 * capturing page-load checkpoints, Core Web Vitals, clicks, errors, and custom
 * conversion events, then forwarding them to rum.hlx.page (or the same origin
 * when collectBaseURL is overridden, as configured in deps/rum.js).
 *
 * Automatic instrumentation (CWV, viewblock, click, navigate, formsubmit …) is
 * provided by the helix-rum-enhancer script loaded via loadRumEnhancer().
 *
 * Usage in a block:
 *   import { checkpoint } from '../../scripts/rum.js';
 *   checkpoint('search', { source: '.search-input', target: query });
 *
 * @see https://www.aem.live/developer/operational-telemetry
 * @see https://github.com/adobe/helix-rum-js
 * @see https://github.com/adobe/helix-rum-enhancer
 */

/**
 * Fire a custom Operational Telemetry checkpoint.
 *
 * Checkpoint names must be lowercase letters without special characters.
 * The OT collection service validates checkpoints, so use the well-known names
 * documented at https://www.aem.live/developer/operational-telemetry#checkpoints
 * or define your own for conversion-funnel events (e.g. 'addtocart', 'signup').
 *
 * @param {string} name - checkpoint identifier
 * @param {{ source?: string, target?: string }} [data] - optional context
 *   source: CSS selector / label of the DOM element triggering the event
 *   target: URL or value that is the subject of the event (e.g. search term)
 */
export function checkpoint(name, data = {}) {
  window.hlx?.rum?.sampleRUM?.(name, data);
}

/**
 * Subscribe to Operational Telemetry events dispatched on this page.
 *
 * Every checkpoint — including ones fired on non-sampled page views — emits a
 * `rum` CustomEvent on `document`. This lets you bridge OT data to other systems
 * (e.g. ACDL / Adobe Analytics) for every visitor, not just the sampled fraction.
 *
 * @param {string} name - checkpoint name to filter on, or '*' for all checkpoints
 * @param {function} callback - called with (data: { source, target }, checkpointName)
 */
export function onCheckpoint(name, callback) {
  document.addEventListener('rum', ({ detail }) => {
    if (!detail) return;
    if (name !== '*' && detail.checkpoint !== name) return;
    callback(detail.data || {}, detail.checkpoint);
  });
}

/**
 * Load the helix-rum-enhancer, which adds automatic instrumentation for:
 * - Core Web Vitals (LCP, CLS, INP, TTFB) → `cwv` checkpoint
 * - Click tracking with semantic source selectors → `click` checkpoint
 * - Block viewport entry → `viewblock` checkpoint
 * - Media viewport entry → `viewmedia` checkpoint
 * - Internal navigation / back-button → `navigate`, `reload` checkpoints
 * - External referrer attribution → `enter` checkpoint
 * - Form submissions → `formsubmit` checkpoint
 *
 * This is safe to call multiple times – the enhancer guards against double-loading.
 * Call it in the delayed phase (after LCP) to avoid performance impact.
 *
 * The project sets window.hlx.RUM_MANUAL_ENHANCE = true in deps/rum.js so the
 * enhancer is NOT auto-loaded; this function is the explicit trigger.
 */
export function loadRumEnhancer() {
  window.hlx?.rum?.sampleRUM?.enhance?.();
}
