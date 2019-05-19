//#region @backend
import * as path from 'path'
import * as child from 'child_process';
import * as _ from 'lodash'

import { OutFolder } from './models';
import { config } from './config';
import { Helpers } from '../helpers';
import { BroswerCompilation } from './compilation-browser';
import { BackendCompilation } from './compilation-backend';


export class IncrementalBuildProcess {

  protected backendCompilation: BackendCompilation;
  protected browserCompilations: BroswerCompilation[];
  protected compileOnce = false;

  constructor(outFolder: OutFolder = 'dist', relativeLocationToCwd = 'src', cwd = process.cwd()) {

    if (_.isString(outFolder) && _.isString(relativeLocationToCwd) && _.isString(cwd)) {


      this.backendCompilation = new BackendCompilation(outFolder, relativeLocationToCwd, cwd)

      let browserOutFolder = config.folder.browser;

      const browser = new BroswerCompilation(
        `tmp-src-${outFolder}-${browserOutFolder}`,
        browserOutFolder as any,
        relativeLocationToCwd,
        cwd,
        outFolder);
      this.browserCompilations = [browser]
    }
  }



  protected browserTaksName(taskName: string, bc: BroswerCompilation) {
    return `browser ${taskName} in ${path.basename(bc.compilationFolderPath)}`
  }

  protected backendTaskName(taskName) {
    return `${taskName} in ${path.basename(this.backendCompilation.compilationFolderPath)}`
  }

  private recreateBrowserLinks(bc: BroswerCompilation) {
    const outDistPath = path.join(bc.cwd, bc.outFolder);
    Helpers.System.Operations.tryRemoveDir(outDistPath)
    const targetOut = path.join(bc.cwd, bc.backendOutFolder, bc.outFolder)
    child.execSync(Helpers.createLink(outDistPath, targetOut))
  }

  async start(taskName?: string) {
    if (!this.compileOnce) {
      this.compileOnce = true;
    }
    await this.backendCompilation.init(this.backendTaskName(taskName))

    for (let index = 0; index < this.browserCompilations.length; index++) {
      const browserCompilation = this.browserCompilations[index];
      await browserCompilation.init(this.browserTaksName(taskName, browserCompilation), () => {
        this.recreateBrowserLinks(browserCompilation)
      })
    }
  }

  async startAndWatch(taskName?: string) {
    if (this.compileOnce) {
      console.log('Watch compilation single run')
      await this.start(taskName);
      process.exit(0)
      return
    }
    await this.backendCompilation.initAndWatch(this.backendTaskName(taskName))

    for (let index = 0; index < this.browserCompilations.length; index++) {
      const browserCompilation = this.browserCompilations[index];
      await browserCompilation.initAndWatch(this.browserTaksName(taskName, browserCompilation), () => {
        this.recreateBrowserLinks(browserCompilation)
      })
    }
  }

}




//#endregion
