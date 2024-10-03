import * as vscode from 'vscode';
import * as child from 'child_process';
import * as fse from 'fs';
import { ProcesOptions } from './models';

function findGitBash() {
  const possiblePaths = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    `${process.env.ProgramW6432}\\Git\\bin\\bash.exe`,
    `${process.env.ProgramFiles}\\Git\\bin\\bash.exe`,
    `${process.env['ProgramFiles(x86)']}\\Git\\bin\\bash.exe`,
  ];

  for (const gitBashPath of possiblePaths) {
    if (fse.existsSync(gitBashPath)) {
      return gitBashPath;
    }
  }

  console.error('Git Bash not found. Please install Git Bash.');
  process.exit(1);
}

function getShell() {
  if (process.platform === 'win32') {
    // Windows platform
    const gitBashPath = findGitBash();
    if (fse.existsSync(gitBashPath)) {
      return gitBashPath;
    } else {
      console.error('Git Bash not found. Please install Git Bash.');
      process.exit(1);
    }
  } else {
    // Unix-like platform (Linux, macOS)
    return undefined; // '/bin/bash';
  }
}

export const shell = getShell();

export function valueFromCommand({
  command,
  cwd,
  bigBuffer,
}: {
  command: string;
  cwd?: string;
  bigBuffer?: boolean;
}) {
  const decode = true;
  let res = child
    .execSync(command, {
      cwd,
      shell,
      encoding: 'utf8',
      maxBuffer: bigBuffer ? 50 * 1024 * 1024 : void 0,
    })
    .toString()
    .trim();
  const splited = (res || '').split('\n');
  res = splited.pop() || '';
  if (decode) {
    res = decodeURIComponent(res);
  }
  return res;
}

export function deepClone(obj: any, hash = new WeakMap()): any {
  if (Object(obj) !== obj) {
    return obj;
  } // primitives
  if (hash.has(obj)) {
    return hash.get(obj);
  } // cyclic reference
  const result =
    obj instanceof Set
      ? new Set(obj) // See note about this!
      : obj instanceof Map
        ? new Map(Array.from(obj, ([key, val]) => [key, deepClone(val, hash)]))
        : obj instanceof Date
          ? new Date(obj)
          : obj instanceof RegExp
            ? new RegExp(obj.source, obj.flags)
            : // ... add here any specific treatment for other classes ...
              // and finally a catch-all:
              obj.constructor
              ? new obj.constructor()
              : Object.create(null);
  hash.set(obj, result);
  return Object.assign(
    result,
    ...Object.keys(obj).map(key => ({ [key]: deepClone(obj[key], hash) })),
  );
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function escapeStringForRegEx(s: string) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function fixJSONString(s: string) {
  s = s.trim();
  if (s.endsWith(']')) {
    return s;
  }
  if (s.endsWith('}')) {
    return `${s}]`;
  }
  if (s.endsWith('"')) {
    return `${s}}]`;
  }
  return `${s}"}]`;
}

export function optionsFix(options?: ProcesOptions) {
  //#region handle args
  if (!options) {
    options = {};
  }
  if (typeof options.findNearestProject === 'undefined') {
    options.findNearestProject = false;
  }
  if (typeof options.syncProcess === 'undefined') {
    options.syncProcess = false;
  }
  if (typeof options.reloadAfterSuccesFinish === 'undefined') {
    options.reloadAfterSuccesFinish = false;
  }
  if (typeof options.cancellable === 'undefined') {
    options.cancellable = true;
  }
  if (typeof options.tnpNonInteractive === 'undefined') {
    options.tnpNonInteractive = true;
  }
  if (typeof options.debug === 'undefined') {
    options.debug = false;
  }
  if (typeof options.askBeforeExecute === 'undefined') {
    options.askBeforeExecute = false;
  }
  if (typeof options.tnpShowProgress === 'undefined') {
    options.tnpShowProgress = true;
  }
  if (typeof options.showOutputDataOnSuccess === 'undefined') {
    options.showOutputDataOnSuccess = false;
  }
  if (typeof options.showSuccessMessage === 'undefined') {
    options.showSuccessMessage = true;
  }

  if (typeof options.progressLocation === 'undefined') {
    options.progressLocation = 'notification';
  }

  //#endregion
  return options;
}

export function crossPlatformPath(pathStringOrPathParts: string | string[]) {
  if (Array.isArray(pathStringOrPathParts)) {
    pathStringOrPathParts = pathStringOrPathParts.join('/');
  }
  //#region @backend
  if (process.platform !== 'win32') {
    return pathStringOrPathParts;
  }
  //#endregion
  if (typeof pathStringOrPathParts !== 'string') {
    return pathStringOrPathParts;
  }

  const isExtendedLengthPath = /^\\\\\?\\/.test(pathStringOrPathParts);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(pathStringOrPathParts); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return pathStringOrPathParts;
  }

  return pathStringOrPathParts.replace(/\\/g, '/');
}

export async function getModuleName(value: string = 'Filename') {
  const result = await vscode.window.showInputBox({
    value,
    placeHolder: value,
  });
  return !result ? '' : result;
}

export type LogMode = 'dialog' | 'logmsg';
export class Log {
  outputChannel: vscode.OutputChannel;
  constructor(
    private name: string,
    private mode: LogMode = 'dialog',
    private debugMode = false,
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
