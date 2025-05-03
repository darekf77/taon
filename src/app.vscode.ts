import { vscodeExtMethods } from 'tnp/src';
import { executeCommand } from 'tnp-helpers/src'; // @backend
import { ExtensionContext } from 'vscode';

const commands = vscodeExtMethods('TAON');
export function activate(context: ExtensionContext) {
  //#region @backendFunc
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

export function deactivate() {}

export default { commands };
