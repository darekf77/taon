//#region @backend
import {
  _,
  path,
  fse,
  crossPlatformPath,
  Helpers,
} from 'tnp-core';
import { BrowserCodeCut } from './browser-code-cut';
import { config } from 'tnp-config';

export const FILE_NAME_ISOMORPHIC_PACKAGES = 'tmp-isomorphic-packages.json';

export class PackagesRecognition {

  static FILE_NAME_ISOMORPHIC_PACKAGES = FILE_NAME_ISOMORPHIC_PACKAGES;
  static From(cwd: string) {
    return new PackagesRecognition(crossPlatformPath(cwd));
  }

  protected recognizedPackages: string[];

  constructor(protected cwd: string) {

  }

  get count() {
    return _.isArray(this.recognizedPackages) ? this.recognizedPackages.length : 0;
  }

  start(force?: boolean, reasonToSearch?: string) {
    debugger
    Helpers.log(`[morphi][force = ${force}] ${reasonToSearch}`);
    const pjPath = crossPlatformPath(path.join(this.cwd, FILE_NAME_ISOMORPHIC_PACKAGES));
    if (!Helpers.exists(pjPath)) {
      Helpers.writeJson(pjPath, {});
    }
    if (!force) {
      try {
        const pj = Helpers.readJson(pjPath);
        if (_.isArray(pj[config.array.isomorphicPackages])) {
          this.recognizedPackages = pj[config.array.isomorphicPackages];
          BrowserCodeCut.IsomorphicLibs = _.cloneDeep(this.recognizedPackages);
          Helpers.log(`[morphi] Recognized (${this.recognizedPackages}) in ${pjPath}`)
          return;
        }
      } catch (error) {
        Helpers.log(`[morphi] ERROR not recognized in`)
      }
    }
    const node_modules = crossPlatformPath(path.join(this.cwd, config.folder.node_modules));

    let folders = Helpers.foldersFrom(node_modules);
    folders = folders
      .map(f => path.basename(f))
      .filter(packageName => {
        Helpers.log(`Checking package node_modules/${packageName}`)
        try {
          return this.checkIsomorphic(node_modules, packageName);
        } catch (error) {
          return false;
        }
      });
    this.recognizedPackages = folders;
    this.updateCurrentPackageJson()
  }

  protected updateCurrentPackageJson() {
    Helpers.log('[morphi] updateCurrentPackageJson')
    try {
      const pjPath = crossPlatformPath(path.join(this.cwd, FILE_NAME_ISOMORPHIC_PACKAGES));
      if (!Helpers.exists(pjPath)) {
        Helpers.writeJson(pjPath, {});
      }
      const pj = Helpers.readJson(pjPath);
      pj[config.array.isomorphicPackages] = this.recognizedPackages;
      Helpers.writeJson(pjPath, pj);
      BrowserCodeCut.IsomorphicLibs = _.cloneDeep(this.recognizedPackages);
    } catch (e) {
      Helpers.log(`[morphi]`, e)
      Helpers.log(`[morphi] Error during update ismorphic packages list cache`);
    }
  }

  protected checkIsomorphic(node_modules: string, packageName: string) {
    const browser = crossPlatformPath(path.join(crossPlatformPath(node_modules), packageName, config.folder.browser));
    return Helpers.exists(browser)
  }

}
//#endregion
