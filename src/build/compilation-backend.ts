//#region @backend
import * as child from 'child_process';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as _ from 'lodash';
import { IncCompiler } from 'incremental-compiler';
import { OutFolder } from './models';
import { Helpers } from '../helpers';
import { CodeCut } from './browser-code-cut';
import { config } from './config';


@IncCompiler.Class({ className: 'BackendCompilation' })
export class BackendCompilation extends IncCompiler.Base {

  public get compilationFolderPath() {
    if (_.isString(this.location) && _.isString(this.cwd)) {
      return path.join(this.cwd, this.location);
    }
  }
  public isEnableCompilation = true;

  tscCompilation(cwd: string, watch = false, outDir?: string, generateDeclarations = false, tsExe = 'tsc',
    diagnostics = false) {
    if (!this.isEnableCompilation) {
      console.log(`Compilation disabled for ${_.startCase(BackendCompilation.name)}`)
      return;
    }
    const params = [
      watch ? '-w' : '',
      outDir ? `--outDir ${outDir}` : '',
      !watch ? '--noEmitOnError true' : '',
      diagnostics ? ' --extendedDiagnostics' : '',
    ]

    const commandJsAndMaps = `${tsExe} -d false  ${params.join(' ')}`
    const commandDts = `${tsExe}  ${params.join(' ')}`

    console.log(`(${this.compilerName}) Execute first command : ${commandJsAndMaps}    # inside: ${cwd}`)
    console.log(`(${this.compilerName}) Execute second command : ${commandDts}    # inside: ${cwd}`)

    if (watch) {
      Helpers.log(child.exec(commandJsAndMaps, { cwd }));
      if (generateDeclarations) {
        Helpers.log(child.exec(commandDts, { cwd }));
      }
    } else {
      try {
        child.execSync(commandJsAndMaps, {
          cwd,
          stdio: [0, 1, 2]
        })
      } catch (e) {
        console.error(`Compilation error: ${e}`)
        process.exit(1)
      }


      if (generateDeclarations) {
        try {
          child.execSync(commandDts, {
            cwd,
            stdio: [0, 1, 2]
          })
        } catch (e) {
          console.error(`Compilation error: ${e}`)
          process.exit(1)
        }

      }
    }

  }

  protected compilerName = 'Backend Compiler';
  compile(watch = false) {
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, true)
  }

  async syncAction(filesPathes: string[]) {
    const outDistPath = path.join(this.cwd, this.outFolder);
    // Helpers.System.Operations.tryRemoveDir(outDistPath)
    if (!fse.existsSync(outDistPath)) {
      fse.mkdirpSync(outDistPath);
    }
    this.compile()
  }

  async preAsyncAction() {
    this.compile(true)
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
     * Ex. src | components
     */
    public location: string,
    /**
     * Current cwd same for browser and backend
     * but browser project has own compilation folder
     * Ex. /home/username/project/myproject
     */
    public cwd?: string
  ) {
    super({
      folderPath: [path.join(cwd, location)],
      notifyOnFileUnlink: true,
    });
  }


}



//#endregion
