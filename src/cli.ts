// @firedev-ignore
let tnpStart = require('tnp/cli').start;
//#region @notForNpm
let tnpStartLocal = require('tnp/src').start;
//#endregion

let startFn = tnpStart;
//#region @notForNpm
startFn = tnpStartLocal; // locally I wanna use compiled tnp code / inside minified versions
//#endregion

export const start = async (args, frameworkName, mode) => {
  await (startFn as any)(args, frameworkName, mode);
}
// DONT CHANGE THIS FILE!
