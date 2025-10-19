const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'mjs', 'cjs'],
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
};

module.exports = config;
