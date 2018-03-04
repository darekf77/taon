
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from "glob";

import { IsomorphicRegions } from './isomorphic';

export interface BuildPathes {
  foldersPathes?: {
    dist?: string;
    browser?: string;
    tmpSrc?: string;
  };
  toolsPathes?: {
    rimraf: string;
    tsc: string;
    cpr: string;
    mkdirp: string;
  };
  onlyMainIndex?: boolean;
}

export function buildIsomorphicVersion(options?: BuildPathes) {
  if (!options) options = {} as any;
  const { foldersPathes = {}, toolsPathes = {}, onlyMainIndex = true } = options;
  const FOLDER = _.merge({
    dist: 'dist',
    browser: 'browser',
    tmpSrc: 'tmp-src',
    tsconfig: {
      browser: 'tsconfig.browser.json',
      default: 'tsconfig.json'
    }
  }, foldersPathes);
  const TOOLS = _.merge({
    rimraf: 'npm-run rimraf',
    tsc: 'npm-run tsc',
    cpr: 'npm-run cpr',
    mkdirp: 'npm-run mkdirp'
  }, toolsPathes);

  child.execSync(`${TOOLS.rimraf} ${FOLDER.dist}`)
  child.execSync(`${TOOLS.tsc} --outDir ${FOLDER.dist}`)
  child.execSync(`${TOOLS.rimraf} ${FOLDER.browser}  ${FOLDER.tmpSrc}`)
  child.execSync(`${TOOLS.mkdirp} ${FOLDER.tmpSrc}`)
  child.execSync(`${TOOLS.cpr} src/ ${FOLDER.tmpSrc}`)
  const tempSrc = path.join(process.cwd(), `${FOLDER.tmpSrc}`);
  if (onlyMainIndex) {
    const folders = fs.readdirSync(tempSrc)
    folders.forEach(f => {
      const file = path.join(tempSrc, f);
      // console.log(`f`, f)
      // console.log(`file`, file)
      if (f !== `index.ts` && !fs.lstatSync(file).isDirectory()) {
        child.execSync(`${TOOLS.rimraf} ${file}`)
      }
    })
  }
  fse.copyFileSync(`${FOLDER.tsconfig.browser}`, `${FOLDER.tmpSrc}/${FOLDER.tsconfig.default}`);
  const files = glob.sync(`./${FOLDER.tmpSrc}/**/*.ts`);
  files.forEach(f => {
    IsomorphicRegions.deleteFrom(f);
  })
  child.execSync(`${TOOLS.tsc} --outDir ../${FOLDER.dist}/${FOLDER.browser}`, { cwd: tempSrc })
  child.execSync(`${TOOLS.cpr} ${FOLDER.dist}/${FOLDER.browser} ${FOLDER.browser}`)
}

