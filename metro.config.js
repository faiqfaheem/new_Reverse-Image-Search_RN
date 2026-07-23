const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

// Ensure Metro resolves to react-native-svg's CommonJS build when ESM resolution fails.
defaultConfig.resolver.extraNodeModules = {
  ...(defaultConfig.resolver.extraNodeModules || {}),
  // Point directly to the package's CommonJS entry file so Metro resolves the module.
  'react-native-svg': path.resolve(projectRoot, 'node_modules', 'react-native-svg', 'lib', 'commonjs', 'index.js')
};

module.exports = defaultConfig;
