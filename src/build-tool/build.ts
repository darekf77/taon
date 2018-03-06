
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from "glob";
import * as dateformat from "dateformat";

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
  build?: {
    forNPMlink?: boolean;
    withoutBackend?: boolean;
  }
  onlyMainIndex?: boolean;
}

function date() {
  return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
}

export function buildIsomorphic(options?: BuildPathes) {
  try {
    console.log(`${date()} Building server/browser version of ${path.basename(process.cwd())}...`)
    buildIsomorphicVersion(options);
    console.log(`${date()} Typescript compilation OK`)
  } catch (error) {
    console.error(`${date()} Typescript compilation ERROR`)
    process.exit(0)
  }
}


function buildIsomorphicVersion(options?: BuildPathes) {
  if (!options) options = {} as any;
  const { foldersPathes = {}, toolsPathes = {}, build = {} } = options;
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
  const BUILD = _.merge({
    forNPMlink: true,
    withoutBackend: false
  }, build);

  if (!BUILD.withoutBackend) {
    child.execSync(`${TOOLS.rimraf} ${FOLDER.dist}`)
    child.execSync(`${TOOLS.tsc} --outDir ${FOLDER.dist}`, { stdio: [0, 1, 2] })
  }
  child.execSync(`${TOOLS.rimraf} ${FOLDER.browser}  ${FOLDER.tmpSrc}`)
  child.execSync(`${TOOLS.mkdirp} ${FOLDER.tmpSrc}`)
  child.execSync(`${TOOLS.cpr} src/ ${FOLDER.tmpSrc} --overwrite`)
  const tempSrc = path.join(process.cwd(), `${FOLDER.tmpSrc}`);
  fse.copyFileSync(`${FOLDER.tsconfig.browser}`, `${FOLDER.tmpSrc}/${FOLDER.tsconfig.default}`);
  const files = glob.sync(`./${FOLDER.tmpSrc}/**/*.ts`);
  files.forEach(f => {
    IsomorphicRegions.deleteFrom(f);
  })
  child.execSync(`${TOOLS.tsc} --outDir ../${FOLDER.dist}/${FOLDER.browser}`, { stdio: [0, 1, 2], cwd: tempSrc })
  if (BUILD.forNPMlink) {
    child.execSync(`${TOOLS.cpr} ${FOLDER.dist}/${FOLDER.browser} ${FOLDER.browser} --overwrite`)
  }
}

