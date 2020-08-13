const util = require('util');
const vm = require('vm');

const fse = require('fs-extra');


let ENV = '{}';
if (fse.existsSync('./tmp-environment.json')) {
  ENV = fse.readFileSync('./tmp-environment.json', {
    encoding: 'utf8'
  });
} else {
  console.warn('ENV will be not available... tmp-environment.json missing... ')
}


const sandbox = {
  animal: 'cat',
  count: 2,
  ENV,
  require,
  global
};

const script = new vm.Script(`
global["ENV"] = JSON.parse(ENV);
var app = require("./dist/app").default;
app();
`);

const context = vm.createContext(sandbox);
script.runInContext(context);
