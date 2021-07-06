import * as child from 'child_process';
import { ProcesOptions } from './models';

export function valueFromCommand({
  command,
  cwd,
  bigBuffer,
}: {
  command: string;
  cwd?: string;
  bigBuffer?: boolean,
}) {
  const decode = true
  let res = child.execSync(command, { cwd, encoding: 'utf8', maxBuffer: bigBuffer ? (50 * 1024 * 1024) : void 0 }).toString().trim();
  const splited = (res || '').split('\n');
  res = splited.pop() || '';
  if (decode) {
    res = decodeURIComponent(res);
  }
  return res;
}

export function deepClone(obj: any, hash = new WeakMap()): any {
  if (Object(obj) !== obj) { return obj; } // primitives
  if (hash.has(obj)) { return hash.get(obj); } // cyclic reference
  const result = obj instanceof Set ? new Set(obj) // See note about this!
    : obj instanceof Map ? new Map(Array.from(obj, ([key, val]) =>
      [key, deepClone(val, hash)]))
      : obj instanceof Date ? new Date(obj)
        : obj instanceof RegExp ? new RegExp(obj.source, obj.flags)
          // ... add here any specific treatment for other classes ...
          // and finally a catch-all:
          : obj.constructor ? new obj.constructor()
            : Object.create(null);
  hash.set(obj, result);
  return Object.assign(result, ...Object.keys(obj).map(
    key => ({ [key]: deepClone(obj[key], hash) })));
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

export type LogMode = 'dialog' | 'logmsg';
