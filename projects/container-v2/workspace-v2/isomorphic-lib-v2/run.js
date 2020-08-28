const util = require('util');
const vm = require('vm');
const path = require('path');

const fse = require('fs-extra');

const { RELATIVEPATHoverride } = require('minimist')(process.argv);
const pathToTmpEnv = path.join(process.cwd(), 'tmp-environment.json');
const pathToDist = path.join(process.cwd(), 'dist');
const pathToDistApp = path.join(pathToDist, 'app.js');

var sandbox = {
  require,
  global
}

function assignENV() {
  let ENV = '{}';
  if (fse.existsSync(pathToTmpEnv)) {
    ENV = fse.readFileSync(pathToTmpEnv, {
      encoding: 'utf8'
    });
  } else {
    console.warn('ENV will be not available... tmp-environment.json missing... ')
  }

  let { ENVoverride } = require('minimist')(process.argv);
  if (ENVoverride) {
    ENVoverride = JSON.parse(decodeURIComponent(ENVoverride));
    ENV = JSON.parse(ENV);
    Object.assign(ENV, ENVoverride);
    ENV = JSON.stringify(ENV, null, 4);
  }
  sandbox.ENV = ENV;
}

let { port } = require('minimist')(process.argv);
port = !isNaN(Number(port)) ? Number(port) : 4000;

const encoding = 'utf8';
var secondsWaitAfterDistDetected = 5;

function emptyDistFolder() {
  return !(
    fse.existsSync(pathToDist) &&
    fse.lstatSync(pathToDist).isDirectory() &&
    fse.existsSync(pathToDistApp) &&
    fse.readFileSync(pathToDistApp, { encoding }).toString().search('default') !== -1
  );
}

if (!RELATIVEPATHoverride || RELATIVEPATHoverride.trim().length === 0) {
  var messageWasShown = false;
  while (emptyDistFolder()) {
    var seconds = 2;
    if (!messageWasShown) {
      messageWasShown = true;
      console.log(`Waiting for build process...`);
    }
    var waitTill = new Date(new Date().getTime() + seconds * 1000);
    while (waitTill > new Date()) { }
  }
  if (messageWasShown) {
    var waitTill = new Date(new Date().getTime() + secondsWaitAfterDistDetected * 1000);
    while (waitTill > new Date()) { }
  }

}

assignENV();

let relativePath = './dist/app';
if (RELATIVEPATHoverride) {
  relativePath = RELATIVEPATHoverride.replace(/\.js$/, '')
}
if (relativePath.startsWith('/')) {
  relativePath = `.${relativePath}`;
}
if (!relativePath.startsWith('./')) {
  relativePath = `./${relativePath}`;
}

const script = new vm.Script(`
global["ENV"] = JSON.parse(ENV);
var app = require("${relativePath}").default;
app(${port});
`);

const context = vm.createContext(sandbox);
script.runInContext(context);
