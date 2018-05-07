
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';


import { CodeTransform } from './isomorphic';
import { Helpers } from './helpers';
import { IncrementalBuild } from './incremental';
import { FoldersPathes, ToolsPathes, BuildConfig, BuildPathes } from "./models";

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
      tmpSrc: `tmp-src-${(foldersPathes && foldersPathes.dist) ? foldersPathes.dist : 'dist'}`,
      src: 'src',
      tsconfig: {
        browser: 'tsconfig.browser.json',
        default: 'tsconfig.json'
      }

    }, foldersPathes);

    this.TOOLS = _.merge({
      tsc: 'tsc'
    }, toolsPathes);

    this.BUILD = _.merge({
      otherIsomorphicLibs: []
    }, build);
    //#endregion

  }

  removeRootFolder(filePath: string) {
    const pathPart = `(\/([a-zA-Z0-9]|\\-|\\_|\\.)*)`
    return filePath.replace(new RegExp(`^${pathPart}`, 'g'), '')
  }

  public init() {
    const self = this;
    const src = path.join(process.cwd(), this.FOLDER.src)
    const browser = path.join(process.cwd(), this.FOLDER.browser)
    const tmpSrc = path.join(process.cwd(), this.FOLDER.tmpSrc)
    const dist = path.join(process.cwd(), this.FOLDER.dist)
    const browserOut = `../${this.FOLDER.dist}/${this.FOLDER.browser}`;

    function tempVersion(file) {
      return path.join(tmpSrc, file.replace(new RegExp(`^${self.FOLDER.src}`), ''));
    }

    const build = new IncrementalBuild({

      filesPattern: `**/*.ts`,

      location: src,

      syncAction: (files) => {
        // console.log('Sync action files: ', files)

        files = files.map(f => tempVersion(f))


        if (fs.existsSync(browser)) {
          fs.unlinkSync(browser);
        }

        if (fs.existsSync(tmpSrc)) {
          fse.emptyDirSync(tmpSrc);
        }

        fse.copySync(`${src}/`, tmpSrc, {
          overwrite: true
        })
        fse.copyFileSync(`${this.FOLDER.tsconfig.browser}`, `${this.FOLDER.tmpSrc}/${this.FOLDER.tsconfig.default}`);
        CodeTransform.for.isomorphicLib(this.options.build.otherIsomorphicLibs).files(files)

        try {
          child.execSync(`${this.TOOLS.tsc} -d false --outDir ${browserOut}`, { stdio: [0, 1, 2], cwd: tmpSrc })
          child.execSync(`${this.TOOLS.tsc} --noEmitOnError true --outDir ${browserOut}`, { stdio: [0, 1, 2], cwd: tmpSrc })
          child.execSync(Helpers.createLink('.', path.join(dist, this.FOLDER.browser)))
        } catch (error) { }
      },

      preAsyncAction: () => {
        child.exec(`${this.TOOLS.tsc} -w -d false --outDir ${browserOut}`, { cwd: tmpSrc })
        child.exec(`${this.TOOLS.tsc} -w --noEmitOnError true --outDir ${browserOut}`, { cwd: tmpSrc })
        console.log('Watching isomorphic files for changes.. ')
      },

      asyncAction: (file) => {
        console.log('Ismorphic compilation for file: ', file)
        const tmpFile = tempVersion(file)
        fse.copyFileSync(file, tmpFile)
        CodeTransform.for.isomorphicLib(this.options.build.otherIsomorphicLibs).file(tmpFile)
      }

    })


    if (this.options.watch) {
      build.initAndWatch()
    } else {
      build.init()
    }
  }




}














