const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  watchFolders: [
    path.resolve(__dirname),
    path.resolve(__dirname, 'node_modules'),
    path.resolve(__dirname, 'node_modules/react-native'),
    path.resolve(__dirname, 'node_modules/react-native/node_modules'),
  ],
  resolver: {
    ...defaultConfig.resolver,
    unstable_enablePackageExports: true,
    extraNodeModules: {
      '@react-native/virtualized-lists': path.resolve(
        __dirname,
        'node_modules/react-native/node_modules/@react-native/virtualized-lists',
      ),
    },
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, 'node_modules/react-native/node_modules'),
    ],
  },
};

module.exports = mergeConfig(defaultConfig, config);
