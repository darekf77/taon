//#region @backend
import * as child from 'child_process';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as _ from 'lodash';
import { OutFolder } from './models';
import { Helpers } from '../helpers';
import { CodeCut } from './browser-code-cut';
import { config } from './config';
import { BackendCompilation } from './compilation-backend';
import { IncCompiler } from 'incremental-compiler';



@IncCompiler.Class({ className: 'BroswerCompilation' })
export class BroswerCompilation extends BackendCompilation {

  public get compilationFolderPath() {
    if (_.isString(this.sourceOutBrowser) && _.isString(this.cwd)) {
      return path.join(this.cwd, this.sourceOutBrowser);
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
    outFolder: OutFolder,
    location: string,
    cwd: string,
    public backendOutFolder: string,
    private customCompiler?: string
  ) {
    super(outFolder, location, cwd)
  }

  async syncAction(files: string[]) {
    // console.log(files)
    if (fse.existsSync(this.compilationFolderPath)) {
      rimraf.sync(this.compilationFolderPath)
    }
    fse.mkdirpSync(this.compilationFolderPath)

    // TODO this may be replaced by filesPathes
    Helpers.System.Operations.tryCopyFrom(`${path.join(this.cwd, this.location)}/`, this.compilationFolderPath, {
      filter: (src: string, dest: string) => {
        return copyToBrowserSrcCodition(src);
      }
    })
    // console.log('browser', this.filesAndFoldesRelativePathes.slice(0, 5))

    this.initCodeCut(files)
    // tsconfig.browser.json
    const source = path.join(this.cwd, this.tsConfigBrowserName);
    const dest = path.join(this.cwd, this.sourceOutBrowser, this.tsConfigName);

    fse.copyFileSync(source, dest)
    this.codecut.files();
    this.compile();
  }

  initCodeCut(filesPathes: string[]) {
    filesPathes = filesPathes.map(f => {
      return f.replace(path.join(this.cwd, this.location), '').replace(/^\//, '');
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
    const absoluteFilePath = event.fileAbsolutePath;
    // noting here for backend
    // console.log('[asyncAction][morphi][cb] event.fileAbsolutePath', event.fileAbsolutePath)
    const relativeFilePath = absoluteFilePath.replace(path.join(this.cwd, this.location), '');
    // console.log('relativeFilePath', relativeFilePath)
    const destinationFilePath = path.join(this.cwd, this.sourceOutBrowser, relativeFilePath);
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

  compile(watch = false) {
    this.tscCompilation(this.compilationFolderPath, watch, `../${this.backendOutFolder}/${this.outFolder}` as any, true,
      this.customCompiler ? this.customCompiler : void 0
    )
  }

}

function copyToBrowserSrcCodition(absoluteFilePath: string) {
  return !absoluteFilePath.endsWith('.backend.ts') && !absoluteFilePath.endsWith('.spec.ts')
}

//#endregion
