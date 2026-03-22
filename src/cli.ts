//#region @backend
global.frameworkName = 'taon';
//#endregion
// @taon-ignore
let tnpStart = require('tnp/cli').startCli;
//#region @notForNpm
let tnpStartLocal = require('tnp/src').startCli;
//#endregion

let startFn = tnpStart;
//#region @notForNpm
startFn = tnpStartLocal; // locally I wanna use compiled tnp code / inside minified versions
//#endregion

export const startCli = async (argv, filename) => {
  await (startFn as any)(argv, filename);
};
// DONT CHANGE THIS FILE!

export default startCli;
