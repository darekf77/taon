
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from "glob";
import * as cpr from 'cpr'
import * as dateformat from "dateformat";

import { CodeTransform } from './isomorphic';
import { Helpers } from './helpers';

export interface BuildPathes {
  foldersPathes?: {
    dist?: string;
    browser?: string;
    tmpSrc?: string;
    src?: string;
  };
  toolsPathes?: {
    tsc: string;
  };
  build?: {
    otherIsomorphicLibs?: string[];
  }
}

function date() {
  return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
}

export function wrapperIsomorphicBuildProcess(options?: BuildPathes) {
  try {
    console.log(`${date()} Building server/browser version of ${path.basename(process.cwd())}...`)
    child.execSync(`${options.toolsPathes.tsc} --outDir ${options.foldersPathes.dist}`)
    buildIsomorphicVersion(options);
    console.log(`${date()} Typescript compilation OK`)
  } catch (error) {
    console.log(error);
    console.error(`${date()} Typescript compilation ERROR`)
    process.exit(0)
  }
}


export function buildIsomorphicVersion(options?: BuildPathes) {
  if (!options) options = {} as any;
  const { foldersPathes = {}, toolsPathes = {}, build = {} } = options;
  const FOLDER = _.merge({
    dist: 'dist',
    browser: 'browser',
    tmpSrc: `tmp-src-${foldersPathes.dist === undefined ? 'dist' : foldersPathes.dist}`,
    src: 'src',
    tsconfig: {
      browser: 'tsconfig.browser.json',
      default: 'tsconfig.json'
    }
  }, foldersPathes);

  const dist = path.join(process.cwd(), FOLDER.dist)
  const browser = path.join(process.cwd(), FOLDER.browser)
  const tmpSrc = path.join(process.cwd(), FOLDER.tmpSrc)
  const src = path.join(process.cwd(), FOLDER.src)

  const TOOLS = _.merge({
    tsc: 'npm-run tsc'
  }, toolsPathes);
  const BUILD = _.merge({
    otherIsomorphicLibs: []
  }, build);
  BUILD

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

  const tempSrc = path.join(process.cwd(), `${FOLDER.tmpSrc}`);
  fse.copyFileSync(`${FOLDER.tsconfig.browser}`, `${FOLDER.tmpSrc}/${FOLDER.tsconfig.default}`);

  const files = glob.sync(`./${FOLDER.tmpSrc}/**/*.ts`, {
    nosort: true
  })

  CodeTransform.for.isomorphicLib(files, BUILD.otherIsomorphicLibs);
  child.execSync(`${TOOLS.tsc} --outDir ../${FOLDER.dist}/${FOLDER.browser}`, { stdio: [0, 1, 2], cwd: tempSrc })

  child.execSync(Helpers.createLink('.', path.join(dist, FOLDER.browser)))

}

