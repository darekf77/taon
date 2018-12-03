//#region @backend
import * as path from 'path'
import * as child from 'child_process';

import { OutFolder } from './models';
import { config } from './config';
import { HelpersBackend } from '../helpers';
import { BroswerCompilation } from './compilation-browser';
import { BackendCompilation } from './compilation-backend';


export class IncrementalBuildProcess {

  protected backendCompilation: BackendCompilation;
  protected browserCompilations: BroswerCompilation[];
  protected compileOnce = false;

  constructor(outFolder: OutFolder = 'dist', relativeLocationToCwd = 'src', cwd = process.cwd()) {

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



  protected browserTaksName(taskName: string, bc: BroswerCompilation) {
    return `browser ${taskName} in ${path.basename(bc.compilationFolderPath)}`
  }

  protected backendTaskName(taskName) {
    return `${taskName} in ${path.basename(this.backendCompilation.compilationFolderPath)}`
  }

  private recreateBrowserLinks(bc: BroswerCompilation) {
    const outDistPath = path.join(bc.cwd, bc.outFolder);
    HelpersBackend.tryRemoveDir(outDistPath)
    const targetOut = path.join(bc.cwd, bc.backendOutFolder, bc.outFolder)
    child.execSync(HelpersBackend.createLink(outDistPath, targetOut))
  }

  start(taskName?: string) {
    if (!this.compileOnce) {
      this.compileOnce = true;
    }
    this.backendCompilation.init(this.backendTaskName(taskName))
    this.browserCompilations.forEach(bc => {
      bc.init(this.browserTaksName(taskName, bc), () => {
        this.recreateBrowserLinks(bc)
      })

    })
  }

  startAndWatch(taskName?: string) {
    if (this.compileOnce) {
      console.log('Watch compilation single run')
      this.start(taskName);
      process.exit(0)
      return
    }
    this.backendCompilation.initAndWatch(this.backendTaskName(taskName))
    this.browserCompilations.forEach(bc => {
      bc.initAndWatch(this.browserTaksName(taskName, bc), () => {
        this.recreateBrowserLinks(bc)
      })
    })
  }

}




//#endregion
