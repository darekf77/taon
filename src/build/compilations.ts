//#region @backend
import * as child from 'child_process';
import * as fse from 'fs-extra';
import * as path from 'path';
import { IncrementalBuild } from './incremental-build';
import { OutFolder } from './models';

export class BackendCompilation extends IncrementalBuild {

    tsExe = 'tsc';

    syncAction = (filesPathes: string[]) => {

        this.compile()
    }

    preAsyncAction = () => {
        this.compileAndWatch();
    }
    asyncAction = (filePath: string) => {

    }

    protected compile() {
        child.execSync(`${this.tsExe}`, {
            cwd: this.cwd
        })
    }

    protected compileAndWatch() {
        child.execSync(`${this.tsExe} -w`, {
            cwd: this.cwd
        })
    }

    get tsConfigName() {
        return 'tsconfig.json'
    }
    get tsConfigBrowserName() {
        return 'tsconfig.browser.json'
    }

    constructor(protected outFolder: OutFolder, location?: string, cwd?: string) {
        super('**/*.ts', location, cwd)

    }


}

export class BroswerCompilation extends BackendCompilation {

    get cwdForBroswer() {
        return path.join(this.cwd, this.sourceOut);
    }
    protected compile() {
        child.execSync(`${this.tsExe}`, {
            cwd: this.cwdForBroswer
        })
    }

    protected compileAndWatch() {
        child.execSync(`${this.tsExe} -w`, {
            cwd: this.cwdForBroswer
        })
    }


    constructor(protected sourceOut: string, outFolder: OutFolder, location: string, cwd: string) {
        super(outFolder, location, cwd)
    }

    recreateSource() {

    }

    recreateTsConfig() {
        const source = path.join(this.cwd, this.tsConfigBrowserName);
        const dest = path.join(this.cwd, this.sourceOut, this.tsConfigName);
        fse.copyFileSync(source, dest)
    }


}


export class BroswerForModuleCompilation extends BroswerCompilation {

    constructor(private module: string, sourceOut: string, outFolder: OutFolder, location: string, cwd: string) {
        super(sourceOut, outFolder, location, cwd)
    }


}
//#endregion