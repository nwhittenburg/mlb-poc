/**
 * Delayed phase – runs ~3 s after page load, safely after LCP.
 *
 * Load the Operational Telemetry enhancer here so auto-instrumentation
 * (CWV, click attribution, viewblock/viewmedia, formsubmit, navigate …)
 * never competes with rendering or the above-the-fold experience.
 */
import { loadRumEnhancer } from './rum.js';
import { martechDelayed } from './martech.js';

loadRumEnhancer();
martechDelayed();
