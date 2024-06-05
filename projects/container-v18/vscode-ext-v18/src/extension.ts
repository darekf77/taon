// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { executeCommand } from './execute-command';
import { commands } from './config';

export function activate(context: vscode.ExtensionContext) {
  for (let index = 0; index < commands.length; index++) {
    const { command = '', exec = '', options, isDefaultBuildCommand } = commands[index];
    const sub = executeCommand(command, exec, options, isDefaultBuildCommand, context);
    if (sub) {
      context.subscriptions.push(sub);
    }
  }
}

export function deactivate() { }
