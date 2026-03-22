//#region tnp-helpers cli template
// import { Helpers, BaseCommandLineFeature } from 'tnp-helpers/src';
// import { BaseProject, BaseStartConfig } from 'tnp-helpers/src'; // @backend

// class $Version extends BaseCommandLineFeature<{}> {
//   public _() {
//     console.log(`Hello world from cli`);
//     this._exit();
//   }
// }
//#endregion

/**
 *
 * @param argsv process.argsv
 * @param filename needed if you want ipc communicaiton
 */
export async function startCli(argsv: string[], filename: string): Promise<void> {
  //#region @backendFunc
  console.log('Hello from cli');
  console.log({ argsv });
  process.exit(0);

  //#region start config
  // new BaseStartConfig({
  //   ProjectClass: BaseProject,
  //   functionsOrClasses: [
  //     {
  //       classOrFnName: '$Version',
  //       funcOrClass: $Version,
  //     },
  //   ],
  //   argsv,
  //   useStringArrForArgsFunctions: true,
  //   shortArgsReplaceConfig: {
  //     v: 'version',
  //   },
  //   callbackNotRecognizedCommand: async () => {
  //     Helpers.error(`Command not recognized`, false, true);
  //   },
  // });
  //#endregion
  //#endregion
}

export default startCli;