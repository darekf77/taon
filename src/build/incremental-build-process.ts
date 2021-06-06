//#region @backend
import {
  _,
  path,
  child_process,
  Helpers,
  crossPlatformPath,
} from 'tnp-core';
import { CLI } from 'tnp-cli';
import { MorphiHelpers } from '../helpers';
import { config, ConfigModels } from 'tnp-config';
import { BroswerCompilation } from './compilation-browser';
import { BackendCompilation } from './compilation-backend';
import { IncCompiler } from 'incremental-compiler';


export class IncrementalBuildProcess {

  protected backendCompilation: BackendCompilation;
  protected browserCompilations: BroswerCompilation[];
  protected compileOnce = false;


  constructor(outFolder: ConfigModels.OutFolder = 'dist', relativeLocationToCwd = 'src', cwd = process.cwd(),
    addStandaloneBrowserCompilation = true) {

    if (_.isString(outFolder) && _.isString(relativeLocationToCwd) && _.isString(cwd)) {


      this.backendCompilation = new BackendCompilation(outFolder, relativeLocationToCwd, cwd)

      let browserOutFolder = config.folder.browser;

      this.browserCompilations = []
      if (addStandaloneBrowserCompilation) {
        const browser = new BroswerCompilation(
          `tmp-src-${outFolder}-${browserOutFolder}`,
          browserOutFolder as any,
          relativeLocationToCwd,
          cwd,
          outFolder);
        this.browserCompilations.push(browser)
      }

    }
  }



  protected browserTaksName(taskName: string, bc: BroswerCompilation) {
    return `browser ${taskName} in ${path.basename(bc.compilationFolderPath)}`
  }

  protected backendTaskName(taskName) {
    return `${taskName} in ${path.basename(this.backendCompilation.compilationFolderPath)}`
  }

  private recreateBrowserLinks(bc: BroswerCompilation) {
    const outDistPath = crossPlatformPath(path.join(bc.cwd, bc.outFolder));
    Helpers.log(`recreateBrowserLinks: outDistPath: ${outDistPath}`)
    MorphiHelpers.System.Operations.tryRemoveDir(outDistPath)
    const targetOut = crossPlatformPath(path.join(bc.cwd, bc.backendOutFolder, bc.outFolder))
    Helpers.log(`recreateBrowserLinks: targetOut: ${targetOut}`)
    Helpers.createSymLink(targetOut, outDistPath, { continueWhenExistedFolderDoesntExists: true });
  }

  async start(taskName?: string, afterInitCallBack?: () => void) {
    if (!this.compileOnce) {
      this.compileOnce = true;
    }

    if (this.backendCompilation) {
      await this.backendCompilation.start(this.backendTaskName(taskName))
    }


    for (let index = 0; index < this.browserCompilations.length; index++) {
      const browserCompilation = this.browserCompilations[index];
      await browserCompilation.start(this.browserTaksName(taskName, browserCompilation), () => {
        this.recreateBrowserLinks(browserCompilation)
      })
    }
    if (_.isFunction(afterInitCallBack)) {
      await Helpers.runSyncOrAsync(afterInitCallBack);
    }
  }

  // @ts-ignore
  async startAndWatch(taskName?: string, options?: IncCompiler.Models.StartAndWatchOptions) {
    const { watchOnly, afterInitCallBack } = options || {};
    if (this.compileOnce && watchOnly) {
      console.error(`[morphi] Dont use "compileOnce" and "watchOnly" options together.`);
      process.exit(0)
    }
    if (this.compileOnce) {
      console.log('Watch compilation single run')
      await this.start(taskName, afterInitCallBack);
      process.exit(0);
    }
    if (watchOnly) {
      console.log(CLI.chalk.gray(
        `Watch mode only for "${taskName}"` +
        ` -- morphi only starts starAndWatch anyway --`
      ));
    } else {
      // THIS IS NOT APPLIED FOR TSC
      // await this.start(taskName, afterInitCallBack);
    }

    if (this.backendCompilation) {
      // @ts-ignore
      await this.backendCompilation.startAndWatch(this.backendTaskName(taskName), { watchOnly })
    }


    for (let index = 0; index < this.browserCompilations.length; index++) {
      const browserCompilation = this.browserCompilations[index];
      await browserCompilation.startAndWatch(
        this.browserTaksName(taskName, browserCompilation), {
        // @ts-ignore
        afterInitCallBack: () => {
          this.recreateBrowserLinks(browserCompilation)
        },
        watchOnly
      });
    }
    if (_.isFunction(afterInitCallBack)) {
      await Helpers.runSyncOrAsync(afterInitCallBack);
    }
  }

}




//#endregion
