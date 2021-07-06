import * as vscode from 'vscode';
import { LogMode } from './helpers';

export async function getModuleName(value: string = 'Filename') {
  const result = await vscode.window.showInputBox({
    value,
    placeHolder: value
  });
  return !result ? '' : result;
}


export class Log {

  outputChannel: vscode.OutputChannel;
  constructor(
    private name: string,
    private mode: LogMode = 'dialog',
    private debugMode = false
  ) {
    this.outputChannel = vscode.window.createOutputChannel(name);
    if (debugMode) {
      this.outputChannel.show();
    }
  }

  public static instance(name: string, mode: LogMode, debugMode = false) {
    return new Log(name, mode, debugMode);
  }

  public data(data: string) {
    if (!this.debugMode) {
      return;
    }
    const message = `[${this.name}] ${data}`;
    if (this.mode === 'dialog') {
      vscode.window.showInformationMessage(message);
    } else {
      this.outputChannel.appendLine(message);
    }
  }

  public info(data: string) {
    const message = `[${this.name}] ${data}`;
    if (this.mode === 'dialog') {
      vscode.window.showInformationMessage(message);
    } else {
      this.outputChannel.appendLine(message);
    }
  }

  public error(data: string) {
    const message = `[${this.name}] ${data}`;
    if (this.mode === 'dialog') {
      vscode.window.showErrorMessage(message);
    } else {
      this.outputChannel.appendLine(`[error] ${message}`);
    }
  }

}
