console.log('hello there')
export * from './lib';
//#region @backend
export * from './build-tool';
//#endregion
//#region @notForNpm
import app from './app';
export default app;
//#endregion
