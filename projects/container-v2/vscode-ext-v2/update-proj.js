
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
// import { CommandType } from './src/config';
const { commands = [] } = require(path.join(__dirname, 'src/config'));
const pkgjsonpath = path.join(__dirname, 'package.json');
const pkgjson = JSON.parse(fs.readFileSync(pkgjsonpath, { encoding: 'utf8' }));
// : {
//   contributes: {
//     commands: ({
//       command?: string;
//       title?: string;
//     }[]);
//     menus: {
//       'explorer/context': {
//         command?: string;
//       }[],
//       'editor/title/context': {
//         command?: string;
//         group?: string;
//       }[]
//     }
//   }
// }

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
