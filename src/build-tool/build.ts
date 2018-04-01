
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from "glob";
import * as dateformat from "dateformat";

import { CodeTransform } from './isomorphic';

export interface BuildPathes {
  foldersPathes?: {
    dist?: string;
    browser?: string;
    tmpSrc?: string;
    src?: string;
  };
  toolsPathes?: {
    rimraf: string;
    tsc: string;
    cpr: string;
    mkdirp: string;
    ln: string
  };
  build?: {
    forNPMlink?: boolean;
    withoutBackend?: boolean;
    forSitePurpose?: boolean;
    otherIsomorphicLibs?: string[];
  }
  onlyMainIndex?: boolean;
}

function date() {
  return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
}

export function wrapperIsomorphicBuildProcess(options?: BuildPathes) {
  try {
    console.log(`${date()} Building server/browser version of ${path.basename(process.cwd())}...`)
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
  const TOOLS = _.merge({
    rimraf: 'npm-run rimraf',
    tsc: 'npm-run tsc',
    cpr: 'npm-run cpr',
    mkdirp: 'npm-run mkdirp',
    ln: 'morphi ln'
  }, toolsPathes);
  const BUILD = _.merge({
    forNPMlink: true,
    withoutBackend: false,
    forSitePurpose: false,
    otherIsomorphicLibs: []
  }, build);



  if (BUILD.forSitePurpose) {
    const siteSrc = `tmp-site-${FOLDER.src}`;
    child.execSync(`rimraf ${siteSrc}`);
    child.execSync(`${TOOLS.cpr} ${FOLDER.src} ${siteSrc} --overwrite`)
    FOLDER.src = siteSrc;
    FOLDER.tsconfig.default = 'tsconfig.site.json'
    FOLDER.tsconfig.browser = 'tsconfig.site.browser.json'
    const filesForSite = glob.sync(`./${siteSrc}/**/*.ts`);
    CodeTransform.for.baselineSite(filesForSite);
  }

  if (!BUILD.withoutBackend) {
    child.execSync(`${TOOLS.rimraf} ${FOLDER.dist}`)
    child.execSync(`${TOOLS.tsc} -p ${FOLDER.tsconfig.default} --outDir ${FOLDER.dist}`, { stdio: [0, 1, 2] })
  }
  child.execSync(`${TOOLS.rimraf} ${FOLDER.browser}  ${FOLDER.tmpSrc}`)
  child.execSync(`${TOOLS.mkdirp} ${FOLDER.tmpSrc}`)
  child.execSync(`${TOOLS.cpr} ${FOLDER.src}/ ${FOLDER.tmpSrc} --overwrite`)
  const tempSrc = path.join(process.cwd(), `${FOLDER.tmpSrc}`);
  fse.copyFileSync(`${FOLDER.tsconfig.browser}`, `${FOLDER.tmpSrc}/${FOLDER.tsconfig.default}`);
  const files = glob.sync(`./${FOLDER.tmpSrc}/**/*.ts`);

  CodeTransform.for.isomorphicLib(files, BUILD.otherIsomorphicLibs);
  child.execSync(`${TOOLS.tsc} --outDir ../${FOLDER.dist}/${FOLDER.browser}`, { stdio: [0, 1, 2], cwd: tempSrc })
  if (BUILD.forNPMlink) {
    child.execSync(`${TOOLS.ln} ${FOLDER.dist}/${FOLDER.browser} .`)
  }
}

