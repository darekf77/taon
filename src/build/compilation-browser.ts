//#region @backend
import {
  _,
  path,
  fse,
  rimraf,
  crossPlatformPath,
} from 'tnp-core';
import { MorphiHelpers } from '../helpers';
import { CodeCut } from './browser-code-cut';
import { BackendCompilation } from './compilation-backend';
import { IncCompiler } from 'incremental-compiler';
import { ConfigModels } from 'tnp-config';

@IncCompiler.Class({ className: 'BroswerCompilation' })
export class BroswerCompilation extends BackendCompilation {

  public get compilationFolderPath() {
    if (_.isString(this.sourceOutBrowser) && _.isString(this.cwd)) {
      return crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser));
    }
  }
  compilerName = 'Browser standard compiler'

  public codecut: CodeCut;
  constructor(
    /**
     * Relative path for browser temporary src
     * Ex.   tmp-src-dist-browser
     */
    public sourceOutBrowser: string,
    outFolder: ConfigModels.OutFolder,
    location: string,
    cwd: string,
    public backendOutFolder: string,
    private customCompiler?: string
  ) {
    super(outFolder, location, cwd)
  }

  async syncAction(files: string[]) {
    // console.log('[morphi] syncAction', files)
    if (fse.existsSync(this.compilationFolderPath)) {
      rimraf.sync(this.compilationFolderPath)
    }
    fse.mkdirpSync(this.compilationFolderPath)
    const dereference = true; // Copy symlinks as normal files
    // console.log(`copying ${path.join(this.cwd, this.location)}/ to  ${this.compilationFolderPath} dereference: ${dereference},`)

    // TODO_NOT_IMPORTANT this may be replaced by filesPathes
    MorphiHelpers.System.Operations.tryCopyFrom(`${crossPlatformPath(path.join(this.cwd, this.location))}/`, this.compilationFolderPath, {
      dereference,
      filter: (src: string, dest: string) => {
        return copyToBrowserSrcCodition(src);
      }
    })
    // console.log('browser', this.filesAndFoldesRelativePathes.slice(0, 5))

    this.initCodeCut(files)
    // tsconfig.browser.json
    const source = crossPlatformPath(path.join(this.cwd, this.tsConfigBrowserName));
    const dest = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, this.tsConfigName));

    fse.copyFileSync(source, dest)
    this.codecut.files();
    await this.compile();
  }

  initCodeCut(filesPathes: string[]) {
    filesPathes = filesPathes.map(f => {
      f = crossPlatformPath(f);
      return f.replace(crossPlatformPath(path.join(this.cwd, this.location)), '').replace(/^\//, '');
    })
    this.codecut = new CodeCut(this.compilationFolderPath, filesPathes, {
      replacements: [
        ["@backendFunc",
          `return undefined;
`],
        "@backend"
      ]
    })
  }


  @IncCompiler.methods.AsyncAction()
  async asyncAction(event: IncCompiler.Change) {
    const absoluteFilePath = crossPlatformPath(event.fileAbsolutePath);
    // noting here for backend
    // console.log('[asyncAction][morphi][cb] event.fileAbsolutePath', event.fileAbsolutePath)
    const relativeFilePath = absoluteFilePath.replace(crossPlatformPath(path.join(this.cwd, this.location)), '');
    // console.log('relativeFilePath', relativeFilePath)
    const destinationFilePath = crossPlatformPath(path.join(this.cwd, this.sourceOutBrowser, relativeFilePath));
    // console.log('this.cwd', this.cwd)
    // console.log('this.sourceOutBrowser', this.sourceOutBrowser)
    // console.log('destinationFilePath', destinationFilePath)
    // console.log('[asyncAction][morphi][cb] absoluteFilePath', absoluteFilePath)
    // console.log('[asyncAction][morphi][cb] destinationFilePath', destinationFilePath)
    if (copyToBrowserSrcCodition(absoluteFilePath)) {
      if (event.eventName === 'unlink') {
        if (fse.existsSync(destinationFilePath)) {
          fse.unlinkSync(destinationFilePath)
        }
        if (['module', 'component']
          .map(c => `.${c}.ts`)
          .filter(c => destinationFilePath.endsWith(c)).length > 0) {
          const orgFil = `${destinationFilePath}.orginal`;
          if (fse.existsSync(orgFil)) {
            fse.unlinkSync(orgFil)
          }
        }
      } else {
        if (fse.existsSync(absoluteFilePath)) {
          if (!fse.existsSync(path.dirname(destinationFilePath))) {
            fse.mkdirpSync(path.dirname(destinationFilePath));
          }
          if (fse.existsSync(destinationFilePath) && fse.lstatSync(destinationFilePath).isDirectory()) {
            fse.removeSync(destinationFilePath);
          }
          fse.copyFileSync(absoluteFilePath, destinationFilePath);
        }
      }
      this.codecut.file(destinationFilePath);
    }
  }

  async compile(watch = false) {
    await this.tscCompilation({
      cwd: this.compilationFolderPath,
      watch,
      outDir: (`../${this.backendOutFolder}/${this.outFolder}` as any),
      generateDeclarations: true,
      tsExe: this.customCompiler ? this.customCompiler : void 0
    })
  }

}

function copyToBrowserSrcCodition(absoluteFilePath: string) {
  return !absoluteFilePath.endsWith('.backend.ts') && !absoluteFilePath.endsWith('.spec.ts')
}

//#endregion
