// Vitest + DOM helpers
import '@testing-library/jest-dom';

declare global {
  // Optional: guard if a few tests need fetch
  // eslint-disable-next-line no-var
  var fetch: typeof globalThis.fetch | undefined;
}
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = async () => new Response('', { status: 200 });
}
