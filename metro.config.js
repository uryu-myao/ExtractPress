// Metro config. Only needed for the web target (the dev harness / browser
// checks); native builds use expo-sqlite's native module and ignore this.
//
// expo-sqlite on web runs SQLite as WebAssembly (wa-sqlite) in a worker:
//  - Metro must treat .wasm as an asset, or the worker's
//    `import './wa-sqlite/wa-sqlite.wasm'` fails to resolve.
//  - The worker needs SharedArrayBuffer, which browsers only allow on a
//    cross-origin-isolated page, hence the COOP / COEP headers on the dev server.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// site/ is the smallpress.app pages (Cloudflare Workers static assets,
// deployed with wrangler), not part of the app: Metro neither crawls nor
// resolves anything under it, so it can't reach a bundle or slow the
// dev server's file map.
const path = require('path');
const siteDir = path.join(__dirname, 'site') + path.sep;
config.resolver.blockList = [
  ...[].concat(config.resolver.blockList ?? []),
  new RegExp(`^${siteDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
];

config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  middleware(req, res, next);
};

module.exports = config;
