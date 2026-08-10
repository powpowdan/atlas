const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

// Stop Metro's file watcher from descending into tooling directories that hold
// files Windows-native Node cannot lstat (e.g. WSL-created symlinks under
// .opencode/node_modules). This prevents EACCES crashes from the FallbackWatcher.
const EXCLUDE_DIRS = [
  /[/\\]\.opencode([/\\]|$)/,
];
const existing = config.resolver.blockList ?? config.resolver.blacklistRE;
config.resolver.blockList = existing
  ? Array.isArray(existing)
    ? [...existing, ...EXCLUDE_DIRS]
    : [existing, ...EXCLUDE_DIRS]
  : EXCLUDE_DIRS;

module.exports = config;
