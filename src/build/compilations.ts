//#region @backend
import * as child from 'child_process';
import * as fse from 'fs-extra';
import * as path from 'path';
import { IncrementalBuild } from './incremental-build';
import { OutFolder } from './models';
import { HelpersBackend } from '../helpers';
import { CodeCut } from './browser-code-cut';



function compile(cwd: string, watch = false, tsExe = 'tsc') {

  const params = [
    watch ? '-w' : ''
  ]

  const command = `${tsExe} ${params.join(' ')}`
  console.log(`${command} in ${cwd}`)
  // child.execSync(command, {
  //   cwd,
  //   stdio: [0, 1, 2]
  // })
}

export class BackendCompilation extends IncrementalBuild {


  prepareFiles() {
    const outDistPath = path.join(this.cwd, this.outFolder);
    HelpersBackend.tryRemoveDir(outDistPath)
    fse.mkdirpSync(outDistPath);
  }

  syncAction(filesPathes: string[]) {
    this.prepareFiles();
    compile(this.compilationFolderPath)
  }

  preAsyncAction() {
    compile(this.compilationFolderPath, true)
  }
  asyncAction(filePath: string) {
    // noting here for backend
  }


  get tsConfigName() {
    return 'tsconfig.json'
  }
  get tsConfigBrowserName() {
    return 'tsconfig.browser.json'
  }

  constructor(
    /**
     * Output folder
     * Ex. dist
     */
    protected outFolder: OutFolder,
    /**
     * Source location
     * Ex. src
     */
    location?: string,
    /**
     * Current cwd same for browser and backend
     * but browser project has own compilation folder
     * Ex. /home/username/project/myproject
     */
    cwd?: string
  ) {
    super('**/*.ts', location, cwd)

  }


}

export class BroswerCompilation extends BackendCompilation {

  protected codecut: CodeCut = new CodeCut()

  private _recreateTsConfig() {
    const source = path.join(this.cwd, this.tsConfigBrowserName);
    const dest = path.join(this.cwd, this.sourceOut, this.tsConfigName);
    fse.copyFileSync(source, dest)
  }

  private _recreateFolders() {
    const outBrowserFiles = path.join(this.cwd, this.sourceOut);
    HelpersBackend.tryRemoveDir(outBrowserFiles);
    fse.mkdirpSync(outBrowserFiles);
  }

  prepareFiles() {
    super.prepareFiles()

    this._recreateFolders();
    this._recreateTsConfig();
    this.codecut.files(this)


  }


  constructor(
    /**
     * Relative path for browser temporary src
     * Ex.   tmp-src-dist-browser
     */
    public sourceOut: string,
    outFolder: OutFolder,
    location: string,
    cwd: string
  ) {
    super(outFolder, location, cwd)

    this.compilationFolderPath = path.join(cwd, sourceOut);

  }





}


export class BroswerForModuleCompilation extends BroswerCompilation {

  constructor(private module: string, sourceOut: string, outFolder: OutFolder, location: string, cwd: string) {
    super(sourceOut, outFolder, location, cwd)
  }


}
//#endregion
