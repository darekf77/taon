
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const dateformat = require('dateformat');
const pathToConfig = path.join(__dirname, 'out/config');

const params = require('minimist')(process.argv);

if (params.watch) {
  const chokidar = require('chokidar');

  // One-liner for current directory
  chokidar.watch([`${pathToConfig}.js`]).on('all', (event, path) => {
    console.log(`${dateformat(new Date(), 'HH:MM:ss')} updating package.json`);
    updatePackageJson();
    console.log('Done');
  });
} else {
  updatePackageJson();
}

function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

function updatePackageJson() {
  const { commands = [] } = requireUncached(pathToConfig);
  console.log(commands.map(t => t.title))
  const pkgjsonpath = path.join(__dirname, 'package.json');
  const pkgjson = JSON.parse(fs.readFileSync(pkgjsonpath, { encoding: 'utf8' }));

  pkgjson.contributes.commands = commands.map(c => {
    return { command: c.command, title: c.title };
  });

  pkgjson.contributes.menus["explorer/context"] = commands
    .filter(c => !c.hideContextMenu)
    .map(c => {
      return { command: c.command };
    });

  pkgjson.contributes.menus["editor/title/context"] = commands
    .filter(c => !c.hideContextMenu)
    .map(c => {
      return { command: c.command, group: c.group };
    });

  fs.writeFileSync(pkgjsonpath, JSON.stringify(pkgjson, null, 2), { encoding: 'utf8' });
}


