//#region @backend
import {
  _,
  path,
  fse,
  child_process,
  Helpers,
  crossPlatformPath,
} from 'tnp-core';
import { IncCompiler } from 'incremental-compiler';
import { MorphiHelpers } from '../helpers';
import { ConfigModels } from 'tnp-config';

export type TscCompileOptions = {
  cwd: string;
  watch?: boolean;
  outDir?: string;
  generateDeclarations?: boolean;
  tsExe?: string;
  diagnostics?: boolean;
  hideErrors?: boolean;
  debug?: boolean;
}

@IncCompiler.Class({ className: 'BackendCompilation' })
export class BackendCompilation extends IncCompiler.Base {

  public get compilationFolderPath() {
    if (_.isString(this.location) && _.isString(this.cwd)) {
      return crossPlatformPath(path.join(this.cwd, this.location));
    }
  }
  public isEnableCompilation = true;

  async tscCompilation({
    cwd,
    watch = false,
    outDir,
    generateDeclarations = false,
    tsExe = 'npm-run tsc',
    diagnostics = false,
    hideErrors = false,
    debug = false
  }: TscCompileOptions) {
    if (!this.isEnableCompilation) {
      console.log(`Compilation disabled for ${_.startCase(BackendCompilation.name)}`)
      return;
    }
    if (hideErrors) {
      diagnostics = false;
      generateDeclarations = false;
    }

    const params = [
      watch ? ' -w ' : '',
      outDir ? ` --outDir ${outDir} ` : '',
      !watch ? ' --noEmitOnError true ' : '',
      diagnostics ? ' --extendedDiagnostics ' : '',
      ` --preserveWatchOutput `
      // hideErrors ? '' : ` --preserveWatchOutput `,
      // hideErrors ? ' --skipLibCheck true --noEmit true ' : '',
    ]

    const commandJsAndMaps = `${tsExe} -d false  ${params.join(' ')}`
    const commandDts = `${tsExe}  ${params.join(' ')}`

    debug && console.log(`(${this.compilerName}) Execute first command :

    ${commandJsAndMaps}

    # inside: ${cwd}`)


    if (watch) {
      await Helpers.logProc2(child_process.exec(commandJsAndMaps, { cwd }), ['Watching for file changes.']);
      if (generateDeclarations) {
        debug && console.log(`(${this.compilerName}) Execute second command : ${commandDts}    # inside: ${cwd}`)
        await Helpers.logProc2(child_process.exec(commandDts, { cwd }), ['Watching for file changes.']);
      }
    } else {
      try {
        child_process.execSync(commandJsAndMaps, {
          cwd,
          stdio: [0, 1, 2]
        })
      } catch (e) {
        console.error(`Compilation error: ${e}`)
        process.exit(1)
      }


      if (generateDeclarations) {
        debug && console.log(`(${this.compilerName}) Execute second command : ${commandDts}    # inside: ${cwd}`)
        try {
          child_process.execSync(commandDts, {
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
  async compile(watch = false) {
    await this.tscCompilation({ cwd: this.compilationFolderPath, watch, outDir: (`../${this.outFolder}` as any), generateDeclarations: true })
  }

  async syncAction(filesPathes: string[]) {
    const outDistPath = crossPlatformPath(path.join(this.cwd, this.outFolder));
    // Helpers.System.Operations.tryRemoveDir(outDistPath)
    if (!fse.existsSync(outDistPath)) {
      fse.mkdirpSync(outDistPath);
    }
    await this.compile();
  }

  async preAsyncAction() {
    await this.compile(true)
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
    public outFolder: ConfigModels.OutFolder,
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
