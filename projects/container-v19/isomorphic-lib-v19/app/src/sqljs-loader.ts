const basename = '<<<TO_REPLACE_BASENAME>>>';
import { Helpers } from 'tnp-core'; // <- this is to replace by taon
// import { TaonAdmin } from 'taon';  // <- this is to replace by taon
// import { Stor } from 'taon-storage'; // <- this is to replace by taon

export const loadSqlJs = async () => {
  if (Helpers.isWebSQL) {
    let win: any;
    if (typeof window !== 'undefined') {
      win = window;
    }
    win = win || globalThis;

    const localForge = await import('localforage');
    // @ts-ignore
    (win as any)['localforage'] = localForge;
    // @ts-ignore
    const { default: initSqlJs } = await import('sql.js');
    // or if you are in a browser:
    // const initSqlJs = win.initSqlJs;

    const SQL = await initSqlJs({
      // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
      // You can omit locateFile completely when running in node
      // @ts-ignore
      locateFile: file => {
        const wasmPath = `${win.location.origin}${basename}assets/${file}`;
        // console.log(`Trying to get sql.js wasm from: ${wasmPath}`)
        return wasmPath;
        // return `https://sql.js.org/dist/${file}`;
      },
    });

    // @ts-ignore
    win['SQL'] = SQL;
    console.log('WEBSQL LOADED');
  } else {
    console.log('WEBSQL NOT LOADED');
  }
  // await Stor.awaitPendingOperatios();
};
