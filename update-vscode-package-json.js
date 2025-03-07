const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const dateformat = require('dateformat');
const outFolder = path.join(__dirname, 'out');
const pathToConfig = path.join(__dirname, 'out/extension');

const params = require('minimist')(process.argv);

if (params.watch) {
  const chokidar = require('chokidar');

  // One-liner for current directory
  chokidar.watch([`${outFolder}/**/*.js`]).on('all', (event, path) => {
    console.log(`${dateformat(new Date(), 'HH:MM:ss')} updating package.json`);
    updatePackageJson();
    console.log('Done');
  });
} else {
  updatePackageJson();
}

function requireUncached(module) {
  const result = _.cloneDeep(require(module));
  purgeCache(module);
  return result;
}

function updatePackageJson() {
  // console.log(fs.readFileSync(pathToConfig + '.js', { encoding: 'utf8' }))
  const extModule = requireUncached(pathToConfig).default;
  // console.log({extModule})
  const  commands  = extModule.commands || [];
  console.log(commands.map(t => t.title))
  const pkgjsonpath = path.join(__dirname, 'package.json');
  const pkgjson = JSON.parse(fs.readFileSync(pkgjsonpath, { encoding: 'utf8' }));

  pkgjson.contributes = pkgjson.contributes || {};
  pkgjson.contributes.commands = pkgjson.contributes.commands || [];
  pkgjson.contributes.menus = pkgjson.contributes.menus || {};

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


/**
 * Removes a module from the cache
 */
function purgeCache(moduleName) {
  // Traverse the cache looking for the files
  // loaded by the specified module name
  searchCache(moduleName, function (mod) {
      delete require.cache[mod.id];
  });

  // Remove cached paths to the module.
  // Thanks to @bentael for pointing this out.
  Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
      if (cacheKey.indexOf(moduleName)>0) {
          delete module.constructor._pathCache[cacheKey];
      }
  });
};

/**
* Traverses the cache to search for all the cached
* files of the specified module name
*/
function searchCache(moduleName, callback) {
  // Resolve the module identified by the specified name
  var mod = require.resolve(moduleName);

  // Check if the module has been resolved and found within
  // the cache
  if (mod && ((mod = require.cache[mod]) !== undefined)) {
      // Recursively go over the results
      (function traverse(mod) {
          // Go over each of the module's children and
          // traverse them
          mod.children.forEach(function (child) {
              traverse(child);
          });

          // Call the specified callback providing the
          // found cached module
          callback(mod);
      }(mod));
  }
};