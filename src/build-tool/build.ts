
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as glob from "glob";
import * as dateformat from "dateformat";

const ps = require('ps-node');
// const sleep = require('sleep')

import { CodeTransform } from './isomorphic';
import { Helpers } from './helpers';

const lockfile = path.join(process.cwd(), 'tmp-lockfile-isomorphic-build.txt')
type ProcessInfo = { arguments: string; pid: string; command: string; ppid: string; }

export interface BuildPathes {
  foldersPathes?: {
    dist?: string;
    browser?: string;
    tmpSrc?: string;
    src?: string;
  };
  toolsPathes?: {
    tsc: string;
    morphi: string;
  };
  build?: {
    otherIsomorphicLibs?: string[];
  }
}

function date() {
  return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
}

function removeLockfile() {
  if (fs.existsSync(lockfile)) {
    // console.log('REMOVE LOCKIE FILE')
    fs.unlinkSync(lockfile)
  }
}

export async function wrapperIsomorphicBuildProcess(options?: BuildPathes) {
  try {
    console.log(`${date()} Building server/browser version of ${path.basename(process.cwd())}...`)
    child.execSync(`${options.toolsPathes.tsc} --outDir ${options.foldersPathes.dist}`)
    await buildIsomorphicVersion(options);

    console.log(`${date()} Typescript compilation OK`)
  } catch (error) {
    removeLockfile()
    console.log(error);
    console.error(`${date()} Typescript compilation ERROR`)
    process.exit(0)
  }
}

function isCurrent(pid: number, command = 'morphi'): boolean {
  const i: ProcessInfo = JSON.parse(child.execSync(`${command} process-info ${pid}`).toString())
  // console.log(`CHALENGER ppid`, i.ppid)
  return (process.ppid == Number(i.ppid))  // (pid === parseInt(i.pid)) && (i.command === 'node');
}

function preventRaceCodition(morphiCommand = 'morphi') {
  // console.log(`OWN PID ${process.pid}`)
  // console.log(`OWN ppid ${process.ppid}`)
  if (fs.existsSync(lockfile)) {
    const pid = parseInt(fs.readFileSync(lockfile, 'utf8').toString());
    if (isCurrent(pid, morphiCommand)) {
      console.log(`From same process.. ${pid} killing...`)
      process.kill(pid)
    }
    fs.writeFileSync(lockfile, process.pid, 'utf8');
  } else {
    fs.writeFileSync(lockfile, process.pid, 'utf8');
  }
}

export async function buildIsomorphicVersion(options?: BuildPathes) {

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
    tsc: 'npm-run tsc',
    morphi: 'morphi'
  }, toolsPathes);
  const BUILD = _.merge({
    otherIsomorphicLibs: []
  }, build);
  BUILD

  preventRaceCodition(TOOLS.morphi);
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

  const tempSrc = path.join(process.cwd(), `${FOLDER.tmpSrc}`);
  fse.copyFileSync(`${FOLDER.tsconfig.browser}`, `${FOLDER.tmpSrc}/${FOLDER.tsconfig.default}`);

  const files = glob.sync(`./${FOLDER.tmpSrc}/**/*.ts`, {
    nosort: true
  })

  CodeTransform.for.isomorphicLib(files, BUILD.otherIsomorphicLibs);
  try {
    child.execSync(`${TOOLS.tsc}  -d false --outDir ../${FOLDER.dist}/${FOLDER.browser}`,
      { stdio: [0, 1, 2], cwd: tempSrc })

    child.execSync(`${TOOLS.tsc} --noEmitOnError true --outDir ../${FOLDER.dist}/${FOLDER.browser}`,
      { stdio: [0, 1, 2], cwd: tempSrc })

    child.execSync(Helpers.createLink('.', path.join(dist, FOLDER.browser)))
  } catch (error) { }
  removeLockfile()
}

