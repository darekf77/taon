//#region @backend
import * as path from 'path'

import { BackendCompilation, BroswerCompilation } from './compilations';
import { BroswerForModuleCompilation } from './compilations';
import { OutFolder } from './models';
import { config } from './config';



export class IncrementalBuildProcess {

  readonly backendCompilation: BackendCompilation;
  readonly browserCompilations: BroswerCompilation[];



  constructor(outFolder: OutFolder = 'dist', relativeLocationToCwd = 'src', cwd = process.cwd()) {

    this.backendCompilation = new BackendCompilation(outFolder, relativeLocationToCwd, cwd)

    let browserOutFolder = config.folder.browser;
    if (outFolder === 'bundle') {
      browserOutFolder = path.join(outFolder, browserOutFolder);
    }
    this.browserCompilations = [new BroswerCompilation(
      `tmp-src-${outFolder}-${browserOutFolder}`,
      browserOutFolder as any,
      relativeLocationToCwd,
      cwd)]
  }

  protected browserTaksName(taskName: string, bc: BroswerCompilation) {
    return `browser ${taskName} in ${path.basename(bc.compilationFolderPath)}`
  }

  protected backendTaskName(taskName) {
    return `${taskName} in ${path.basename(this.backendCompilation.compilationFolderPath)}`
  }

  start(taskName?: string) {
    this.backendCompilation.init(this.backendTaskName(taskName))
    this.browserCompilations.forEach(bc => {
      bc.init(this.browserTaksName(taskName, bc))
    })
  }

  startAndWatch(taskName?: string) {
    this.backendCompilation.initAndWatch(this.backendTaskName(taskName))
    this.browserCompilations.forEach(bc => {
      bc.initAndWatch(this.browserTaksName(taskName, bc))
    })
  }

}


export class IncrementalBuildProcessExtended extends IncrementalBuildProcess {



  private get resolveModulesLocations(): string[] {
    throw 'Implement this'
  }


  constructor(outFolder: OutFolder = 'dist', relativeLocationToCwd = 'src', cwd = process.cwd()) {
    super(outFolder, relativeLocationToCwd, cwd);
    this.resolveModulesLocations
      .forEach(location => {
        const moduleName = path.basename(location);
        let browserOutFolder = `${config.folder.browser}-for-${moduleName}`
        if (outFolder === 'bundle') {
          browserOutFolder = path.join(outFolder, browserOutFolder);
        }

        this.browserCompilations.push(
          new BroswerForModuleCompilation(moduleName,
            `tmp-src-${outFolder}-${browserOutFolder}`,
            browserOutFolder as any,
            relativeLocationToCwd,
            cwd)
        )
      })

  }



}




//#endregion
