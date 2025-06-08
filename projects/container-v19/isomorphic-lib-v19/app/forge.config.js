const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: path.resolve(__dirname, 'dist/assets/assets-for/navi-cli/assets/icons/electron'),
    appBundleId: 'com.domain.example.navi-cli.navi-cli',
    appCategoryType: 'public.app-category.developer-tools',
    name: 'navi-cli',
    overwrite: true,
    osxSign: {
      entitlements: 'entitlements.plist',
      hardenedRuntime: true,
      'gatekeeper-assess': false,
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
      },
    },
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'navi-cli',
        iconUrl: path.resolve(__dirname, 'dist/assets/assets-for/navi-cli/assets/icons/electron.ico'),
        setupIcon: path.resolve(__dirname, 'dist/assets/assets-for/navi-cli/assets/icons/electron.ico'),
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: path.resolve(__dirname, 'dist/assets/assets-for/navi-cli/assets/icons/electron.png'),
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: path.resolve(__dirname, 'dist/assets/assets-for/navi-cli/assets/icons/electron.png'),
        },
      },
    },
  ],
  publishers: [],
  hooks: {
    generateAssets: async () => {
      // Optional: put logic here to build or copy extra files
    },
    postPackage: async (forgeConfig, options) => {
      const fs = require('fs-extra');
      const path = require('path');

      for (const outputPath of options.outputPaths) {
        await fs.copy(path.resolve(__dirname, 'electron/index.js'), path.join(outputPath, 'index.js'));
        await fs.copy(path.resolve(__dirname, 'electron/package.json'), path.join(outputPath, 'package.json'));
        await fs.copy(path.resolve(__dirname, 'electron/sql-wasm.wasm'), path.join(outputPath, 'sql-wasm.wasm'));
        await fs.copy(path.resolve(__dirname, 'electron/node_modules'), path.join(outputPath, 'electron/node_modules'));
        await fs.copy(path.resolve(__dirname, 'dist'), path.join(outputPath, 'dist'));
      }
    },
  },
  buildIdentifier: '1.0.3',
  configPath: path.resolve(__dirname, 'forge.config.js'),
  electronRebuildConfig: {},
  hooksEnabled: true,
};
