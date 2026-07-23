//#region @notForNpm
import { vscodeExtMethods, activateMenuTnp, deactivateMenuTnp, vscodePatchingCodium, handleTaonRedirect } from 'tnp/src';
import { executeCommand } from 'tnp-helpers/src'; // @backend
import type { ExtensionContext } from 'vscode';
const FRAMEWORK_NAME = 'taon';

const commands = vscodeExtMethods(FRAMEWORK_NAME);
export async function activate(context: ExtensionContext) {
  //#region @backendFunc
  const vscode = await import('vscode');

  vscodePatchingCodium(context, vscode, FRAMEWORK_NAME);
  handleTaonRedirect(context, vscode);

  activateMenuTnp(context, vscode, FRAMEWORK_NAME);

  for (let index = 0; index < commands.length; index++) {
    const {
      title,
      command = '',
      exec = '',
      options,
      isDefaultBuildCommand,
    } = commands[index];
    const sub = executeCommand(
      title,
      command,
      // @ts-ignore
      exec,
      options,
      isDefaultBuildCommand,
      context,
    );
    if (sub) {
      context.subscriptions.push(sub);
    }
  }
  //#endregion
}

export function deactivate() {
  //#region @backendFunc
  deactivateMenuTnp();
  //#endregion
}

export default { commands };
//#endregion
