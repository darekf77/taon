
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from "glob";
import * as dateformat from "dateformat";


import { CodeTransform } from './isomorphic';
import { Helpers } from './helpers';
import { IncrementalBuild } from './incremental';
import { FoldersPathes, ToolsPathes, BuildConfig, BuildPathes, ProcessInfo } from "./models";

export class IsomoprhicBuild {

  FOLDER: FoldersPathes;
  TOOLS: ToolsPathes;
  BUILD: BuildConfig;

  constructor(private options?: BuildPathes) {
    //#region prepare parems
    if (!this.options) this.options = {} as any;
    const { foldersPathes, toolsPathes = {}, build = {}, watch = false } = this.options;

    this.FOLDER = _.merge({
      dist: 'dist',
      browser: 'browser',
      tmpSrc: `tmp-src-${foldersPathes.dist === undefined ? 'dist' : foldersPathes.dist}`,
      src: 'src',
      tsconfig: {
        browser: 'tsconfig.browser.json',
        default: 'tsconfig.json'
      }

    }, foldersPathes);

    this.TOOLS = _.merge({
      tsc: 'npm-run tsc',
      morphi: 'morphi'
    }, toolsPathes);

    this.BUILD = _.merge({
      otherIsomorphicLibs: []
    }, build);
    //#endregion
  }

  public async init() {
    if (this.options.watch) {
      new IncrementalBuild(
        `./${this.FOLDER.tmpSrc}/**/*.ts`,
        CodeTransform.for.isomorphicLib(this.options.build.otherIsomorphicLibs).file
      ).init()
    } else {
      const tempSrc = path.join(process.cwd(), `${this.FOLDER.tmpSrc}`);

      new IncrementalBuild(
        `./${this.FOLDER.tmpSrc}/**/*.ts`,
        CodeTransform.for.isomorphicLib(this.options.build.otherIsomorphicLibs).file,
        () => {
          child.execSync(`${this.TOOLS.tsc} -w -d false --outDir ../${this.FOLDER.dist}/${this.FOLDER.browser}`,
            { stdio: [0, 1, 2], cwd: tempSrc })

          child.execSync(`${this.TOOLS.tsc} -w --noEmitOnError true --outDir ../${this.FOLDER.dist}/${this.FOLDER.browser}`,
            { stdio: [0, 1, 2], cwd: tempSrc })
        }
      ).initAndWatch()
    }
  }



  private date() {
    return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
  }




  public async  build() {
    const dist = path.join(process.cwd(), this.FOLDER.dist)
    const browser = path.join(process.cwd(), this.FOLDER.browser)
    const tmpSrc = path.join(process.cwd(), this.FOLDER.tmpSrc)
    const src = path.join(process.cwd(), this.FOLDER.src)


    // console.log('wainting ')
    // sleep.sleep(1000)
    // console.log('AAAAA')

    // browser folder
    if (fs.existsSync(browser)) {
      fs.unlinkSync(browser);
    }

    // temp typescript source fodler
    if (fs.existsSync(tmpSrc)) {
      fse.emptyDirSync(tmpSrc);
    }

    fse.copySync(`${src}/`, tmpSrc, {
      overwrite: true
    })

    const tempSrc = path.join(process.cwd(), `${this.FOLDER.tmpSrc}`);
    fse.copyFileSync(`${this.FOLDER.tsconfig.browser}`, `${this.FOLDER.tmpSrc}/${this.FOLDER.tsconfig.default}`);

    const files = glob.sync(`./${this.FOLDER.tmpSrc}/**/*.ts`, {
      nosort: true
    })

    CodeTransform.for.isomorphicLib(this.BUILD.otherIsomorphicLibs).files(files);
    try {
      child.execSync(`${this.TOOLS.tsc}  -d false --outDir ../${this.FOLDER.dist}/${this.FOLDER.browser}`,
        { stdio: [0, 1, 2], cwd: tempSrc })

      child.execSync(`${this.TOOLS.tsc} --noEmitOnError true --outDir ../${this.FOLDER.dist}/${this.FOLDER.browser}`,
        { stdio: [0, 1, 2], cwd: tempSrc })

      child.execSync(Helpers.createLink('.', path.join(dist, this.FOLDER.browser)))
    } catch (error) { }
    this.removeLockfile()
  }


}














