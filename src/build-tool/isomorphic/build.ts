
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';


import { CodeTransform, ReplaceOptions, ReplaceOptionsExtended } from './code-transform';
import { Helpers, tryRemoveDir, tryCopyFrom } from '../helpers';
import { IncrementalBuild } from './incremental';
import { FoldersPathes, ToolsPathes, BuildConfig, BuildOptions } from "./models";

const replacements: ReplaceOptions = {
  replacements: [
    ["@backendFunc", `return undefined;`],
    "@backend"
  ]
}

const replacementsExtended: ReplaceOptionsExtended = {
  replacements: replacements.replacements.concat(
    ["@cutExpression ", (e, expression) => {
      return eval(`(function(ENV){ ${expression} })(e)`);
    }] as any
  )
}

export class IsomoprhicBuild {

  public incrementalBuildClass = IncrementalBuild;
  public CodeTransform = CodeTransform;
  FOLDER: FoldersPathes;
  TOOLS: ToolsPathes;
  BUILD: BuildConfig;

  constructor(private options?: BuildOptions) {

    //#region prepare parems
    if (!this.options) this.options = {} as any;
    const { foldersPathes, toolsPathes, build, watch = false } = this.options;

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
      buildBackend: true,
      generateDeclarations: false,
      otherIsomorphicLibs: [],
    } as BuildConfig, build);
    //#endregion

  }

  removeRootFolder(filePath: string) {
    const pathPart = `(\/([a-zA-Z0-9]|\\-|\\_|\\.)*)`
    return filePath.replace(new RegExp(`^${pathPart}`, 'g'), '')
  }



  public init(processCWD: string = process.cwd()) {

    const self = this;
    const src = path.join(processCWD, this.FOLDER.src)
    const browser = path.join(processCWD, this.FOLDER.browser)
    const tmpSrc = path.join(processCWD, this.FOLDER.tmpSrc)
    const dist = path.join(processCWD, this.FOLDER.dist)
    const tsconfig_browser = path.join(processCWD, this.FOLDER.tsconfig && this.FOLDER.tsconfig.browser);
    const tsconfig_default = path.join(processCWD, this.FOLDER.tsconfig && this.FOLDER.tsconfig.default);
    const generateDeclarations = (_.isBoolean(this.BUILD.generateDeclarations) && this.BUILD.generateDeclarations) ? 'true' : 'false';
    // console.log('generateDeclarations', generateDeclarations)
    function tempVersion(file) {
      return path.join(tmpSrc, file.replace(new RegExp(`^${self.FOLDER.src}`), ''));
    }

    const argsBackend = {
      jsAndMaps: `--noEmitOnError true --noEmit true --outDir ${this.FOLDER.dist}`,
      dTs: `-d ${generateDeclarations} --outDir ${this.FOLDER.dist}`
    }

    const browserOut = `../${this.FOLDER.dist}/${this.FOLDER.browser}`;
    const argsBrowser = {
      jsAndMaps: `--noEmitOnError true --outDir ${browserOut}`,
      dTs: `-d ${generateDeclarations} --outDir ${browserOut}`
    }

    const build = new (this.incrementalBuildClass as { new(any?): IncrementalBuild })({

      filesPattern: `**/*.ts`,

      location: src,

      syncAction: (files) => {

        console.log('Backend compilation started... ')
        if (this.BUILD.buildBackend) {
          child.execSync(`${this.TOOLS.tsc} ${argsBackend.jsAndMaps}`,
            { stdio: [0, 1, 2], cwd: processCWD })
          child.execSync(`${this.TOOLS.tsc} ${argsBackend.dTs}`,
            { stdio: [0, 1, 2], cwd: processCWD })
        }
        console.log('Backend compilation finish. ')
        console.log('Browser compilation started... ')
        // console.log('Sync action files: ', files)

        files = files.map(f => tempVersion(f))


        if (fs.existsSync(browser)) {
          fs.unlinkSync(browser);
        }

        if (fs.existsSync(tmpSrc)) {
          tryRemoveDir(tmpSrc);
        }

        tryCopyFrom(`${src}/`, tmpSrc);

        fse.copyFileSync(`${tsconfig_browser}`, `${tmpSrc}/${this.FOLDER.tsconfig.default}`);
        this.CodeTransform.for.isomorphicLib(this.options.build.otherIsomorphicLibs).files(files);

        try {

          child.execSync(`${this.TOOLS.tsc} ${argsBrowser.jsAndMaps}`, { stdio: [0, 1, 2], cwd: tmpSrc })
          child.execSync(`${this.TOOLS.tsc} ${argsBrowser.dTs}`, { stdio: [0, 1, 2], cwd: tmpSrc })
          child.execSync(Helpers.createLink('.', path.join(dist, this.FOLDER.browser)), { cwd: processCWD })
        } catch (error) { }
        console.log('Browser compilation finish. ')
      },

      preAsyncAction: () => {
        if (this.BUILD.buildBackend) {
          child.exec(`${this.TOOLS.tsc} -w ${argsBackend.jsAndMaps}`, { cwd: processCWD })
          child.exec(`${this.TOOLS.tsc} -w ${argsBackend.dTs}`, { cwd: processCWD })
        }

        child.exec(`${this.TOOLS.tsc} -w ${argsBrowser.jsAndMaps}`, { cwd: tmpSrc })
        child.exec(`${this.TOOLS.tsc} -w ${argsBrowser.dTs}`, { cwd: tmpSrc })
        child.execSync(Helpers.createLink('.', path.join(dist, this.FOLDER.browser)), { cwd: processCWD })
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














