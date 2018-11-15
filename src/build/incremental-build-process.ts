//#region @backend
import * as path from 'path'

import { BackendCompilation, BroswerCompilation } from './compilations';
import { OutFolder } from './models';
import { config } from './config';
import { HelpersBackend } from '../helpers';



export class IncrementalBuildProcess {

    readonly backendCompilation: BackendCompilation;
    readonly browserCompilations: BroswerCompilation[];



    constructor(outFolder: OutFolder = 'dist', relativeLocationToCwd = 'src', cwd = process.cwd()) {

        this.backendCompilation = new BackendCompilation(outFolder, relativeLocationToCwd, cwd)

        let browserOutFolder = config.folder.browser;

        const browser = new BroswerCompilation(
            `tmp-src-${outFolder}-${browserOutFolder}`,
            browserOutFolder as any,
            relativeLocationToCwd,
            cwd);
        this.browserCompilations = [browser]
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
            bc.init(this.browserTaksName(taskName, bc), () => {
                HelpersBackend.tryCopyFrom(
                    path.join(bc.cwd, bc.outFolder),
                    path.join(bc.cwd, this.backendCompilation.outFolder, bc.outFolder)
                )
            })

        })
    }

    startAndWatch(taskName?: string) {
        this.backendCompilation.initAndWatch(this.backendTaskName(taskName))
        this.browserCompilations.forEach(bc => {
            bc.initAndWatch(this.browserTaksName(taskName, bc), () => {
                HelpersBackend.tryCopyFrom(
                    path.join(bc.cwd, bc.outFolder),
                    path.join(bc.cwd, this.backendCompilation.outFolder, bc.outFolder)
                )
            })
        })
    }

}




//#endregion
