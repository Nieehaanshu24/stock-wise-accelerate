/* Dynamic bridge to the native wrapper for dev/prod environments
 * - Prefers compiled JS: ../native/dist/wrapper (after running build)
 * - Falls back to TS source: ../native/src/wrapper (when running with tsx)
 */

// Use CommonJS require to work with backend's CJS compilation
// eslint-disable-next-line @typescript-eslint/no-var-requires
let mod: any;
try {
  // Compiled wrapper (after `cd backend/native && npm run build:ts`)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('../native/dist/wrapper');
} catch (_err) {
  // Fallback to TypeScript source when using tsx in development
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  mod = require('../native/src/wrapper');
}

export const {
  calculateStockSpan,
  withSegmentTree,
  querySegmentTree,
  withSlidingWindow,
  getWindowResult,
} = mod;