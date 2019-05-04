//#region @backend
import * as child from 'child_process';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as glob from 'glob';
import * as _ from 'lodash';
import { IncrementalCompilation } from './incremental-compilation';
import { OutFolder } from './models';
import { Helpers } from '../helpers';
import { CodeCut } from './browser-code-cut';
import { config } from './config';


export class BackendCompilation extends IncrementalCompilation {

  public isEnableCompilation = true;

  tscCompilation(cwd: string, watch = false, outDir?: string, generateDeclarations = false, tsExe = 'tsc') {
    if (!this.isEnableCompilation) {
      console.log(`Compilation disabled for ${_.startCase(BackendCompilation.name)}`)
      return;
    }
    const params = [
      watch ? '-w' : '',
      outDir ? `--outDir ${outDir}` : '',
      !watch ? '--noEmitOnError true' : ''
    ]

    const commandJsAndMaps = `${tsExe} -d false  ${params.join(' ')}`
    const commandDts = `${tsExe}  ${params.join(' ')}`

    if (watch) {
      Helpers.log(child.exec(commandJsAndMaps, { cwd }));
      if (generateDeclarations) {
        Helpers.log(child.exec(commandDts, { cwd }));
      }
    } else {
      child.execSync(commandJsAndMaps, {
        cwd,
        stdio: [0, 1, 2]
      })

      if (generateDeclarations) {
        child.execSync(commandDts, {
          cwd,
          stdio: [0, 1, 2]
        })
      }
    }

  }


  prepareFiles() {

    // init fiels
    this.filesAndFoldesRelativePathes = glob.sync(this.globPattern, { cwd: this.compilationFolderPath });
    // console.log('backend', this.filesAndFoldesRelativePathes.slice(0, 5))

    // recreate dist
    const outDistPath = path.join(this.cwd, this.outFolder);
    // Helpers.System.Operations.tryRemoveDir(outDistPath)
    if (!fse.existsSync(outDistPath)) {
      fse.mkdirpSync(outDistPath);
    }
  }


  compile(watch = false) {
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, true)
  }

  syncAction(filesPathes: string[]) {
    this.prepareFiles();
    this.compile()
  }

  preAsyncAction() {
    this.compile(true)
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
    public outFolder: OutFolder,
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
    super('**/*.+(ts|css|scss|sass|html)', location, cwd)
    if (_.isString(location) && _.isString(cwd) && !_.isUndefined(config)) {

      this.compilationFolderPath = path.join(cwd, config.folder.src);
    }
  }


}



//#endregion
