import * as vscode from 'vscode';
import * as path from 'path';
import * as fse from 'fs';
import * as child from 'child_process';
import { window, ProgressLocation } from 'vscode';
import { ProcesOptions, ProgressData, ResolveVariable } from './models';
import {
  capitalizeFirstLetter, optionsFix, Log, getModuleName, shell,
  escapeStringForRegEx, deepClone, valueFromCommand, crossPlatformPath
} from './helpers';

const log = Log.instance(`execute-command`, 'logmsg');

export function executeCommand(registerName: string, commandToExecute: string | string[],
  pOptions?: ProcesOptions, isDefaultBuildCommand?: boolean, context?: vscode.ExtensionContext) {

  const commandToExecuteReadable = '"' +
    (
      (Array.isArray(commandToExecute) ? commandToExecute.join(',') : commandToExecute)
    )
    + '"';


  return vscode.commands.registerCommand(registerName, function (uri) {
    const options = optionsFix(deepClone(pOptions));
    let progressLocation = ProgressLocation.Notification;
    if (options.progressLocation === 'statusbar') {
      progressLocation = ProgressLocation.Window;
    }

    let { findNearestProject, findNearestProjectType, reloadAfterSuccesFinish,
      findNearestProjectTypeWithGitRoot, findNearestProjectWithGitRoot,
      syncProcess, cancellable, title, tnpNonInteractive, askBeforeExecute, resolveVariables,
      tnpShowProgress, showOutputDataOnSuccess, showSuccessMessage } = options;

    //#region prevent incorrect uri
    if (typeof uri === 'undefined') {
      if (vscode.window.activeTextEditor) {
        uri = vscode.window.activeTextEditor.document.uri;
      }
    }
    //#endregion

    //#region resovle cwd, relative path
    log.data(`root path ${vscode.workspace.rootPath?.toString()}`);
    var relativePathToFileFromWorkspaceRoot = uri ? vscode.workspace.asRelativePath(uri) : '';
    log.data(`relativePath: '${relativePathToFileFromWorkspaceRoot}' `);
    const isAbsolute = !uri ? true : path.isAbsolute(relativePathToFileFromWorkspaceRoot);
    log.data(`isAbsolute: ${isAbsolute} `);
    relativePathToFileFromWorkspaceRoot = crossPlatformPath(relativePathToFileFromWorkspaceRoot);
    log.data(`relativePath replaced \ '${relativePathToFileFromWorkspaceRoot}' `);
    // @ts-ignore
    const cwd = crossPlatformPath(vscode.workspace.rootPath);
    log.data(`cwd: ${cwd} `);
    if (typeof cwd !== 'string') {
      log.error(`Not able to get cwd`);
      return;
    }
    //#endregion

    //#region handle first asking about executing command
    if (askBeforeExecute) {
      const continueMsg = `Continue: ` + (title ? title : `command: ${commandToExecuteReadable}`);
      window.showQuickPick(['Abort', continueMsg], {
        canPickMany: false,
      }).then((data) => {
        if (data === continueMsg) {
          process();
        }
      });
    } else {
      process();
    }
    //#endregion

    //#region process
    async function process() {
      let MAIN_TITLE = capitalizeFirstLetter(title ? title : `Executing: ${commandToExecuteReadable}`);
      const resolveVars: ResolveVariable[] = [
        {
          variable: 'relativePath',
          variableValue: relativePathToFileFromWorkspaceRoot
        } as any,
        {
          variable: 'fileName',
          variableValue: path.basename(relativePathToFileFromWorkspaceRoot)
        } as any,
      ];

      resolveVars.forEach((v) => {
        MAIN_TITLE = MAIN_TITLE.replace(
          new RegExp(escapeStringForRegEx(`%${v.variable}%`), 'g'),
          v.variableValue
        );
      });

      window.withProgress({
        //#region initialize progress
        location: progressLocation,
        title: MAIN_TITLE,
        cancellable,
        //#endregion
      }, (progress, token) => {


        progress.report({ increment: 0 });

        var endPromise = new Promise(async (resolve, reject) => {
          let dataToDisplayInLog = '';

          //#region resolving variables

          if (resolveVariables) {
            let skipNextVariableResolve = false;
            for (let index = 0; index < resolveVariables.length; index++) {

              const item = resolveVariables[index];
              if (typeof item.variableValue !== 'undefined') {
                continue;
              }
              if (skipNextVariableResolve) {
                skipNextVariableResolve = false;
                continue;
              }

              //#region apply previous resolved vars
              resolveVars.forEach(resolved => {
                [
                  'exitWithMessgeWhenNoOptions',
                  'resolveValueFromCommand',
                  'options',
                  'placeholder',
                  'prompt'
                ].forEach(stringKey => {
                  // @ts-ignore
                  let propValue = item[stringKey];
                  // @ts-ignore
                  if (typeof propValue === 'string') {
                    // @ts-ignore
                    propValue = propValue.replace(
                      new RegExp(escapeStringForRegEx(`%${resolved.variable}%`), 'g'),
                      resolved.variableValue
                    );
                    // @ts-ignore
                    item[stringKey] = propValue;
                  }
                });
              });
              //#endregion
              const { placeholder, prompt } = item;
              let placeHolder;
              if (typeof placeholder === 'string') {
                placeHolder = placeholder;
              }

              //#region handle select
              if (item.options) {
                if (typeof item.options === 'string') {
                  try {
                    const cmdToExec = item.options.replace(`%relativePath%`, relativePathToFileFromWorkspaceRoot);
                    log.data(`cmdToExec: ${cmdToExec}`)
                    const res = valueFromCommand({ command: cmdToExec, cwd, bigBuffer: true })
                    item.optionsResolved = JSON.parse(res);
                  } catch (error) {
                    item.optionsResolved = [] as any;
                    window.showInformationMessage(`There is nothing baseline fork that matches:`
                      + ` "${path.basename(relativePathToFileFromWorkspaceRoot)}"`)
                    reject();
                    return;
                  }
                } else {
                  item.optionsResolved = JSON.parse(JSON.stringify(item.options));
                }

                if (typeof placeholder === 'function') {
                  placeHolder = placeholder({ relativePath: relativePathToFileFromWorkspaceRoot, cwd, path, options: item.optionsResolved });
                }
                const itemForQuicPick = item.optionsResolved.slice(0, 20);
                if (item.exitWithMessgeWhenNoOptions && itemForQuicPick.length === 0) {
                  window.showInformationMessage(item.exitWithMessgeWhenNoOptions);
                  resolve(void 0);
                  return;
                } else {
                  const res = await window.showQuickPick(itemForQuicPick, {
                    canPickMany: false,
                    placeHolder,
                    ignoreFocusOut: true,
                  });
                  skipNextVariableResolve = !!res?.skipNextVariableResolve;
                  item.variableValue = res?.option;
                }

                log.data(`Resolve from select: ${item.variableValue}`);


              } else {
                if (typeof placeholder === 'function') {
                  placeHolder = placeholder({ relativePath: relativePathToFileFromWorkspaceRoot, cwd, path });
                }
                let res: string | undefined;
                if (item.resolveValueFromCommand) {
                  try {
                    res = valueFromCommand({ command: item.resolveValueFromCommand, cwd });
                  } catch (err) {
                    reject();
                    return;
                  }
                } else {
                  res = await vscode.window.showInputBox({
                    value: placeHolder,
                    placeHolder,
                    ignoreFocusOut: true,
                    prompt
                  });
                }
                res = !res ? '' : res;
                item.variableValue = res;
                log.data(`Resolve from input: ${item.variableValue}`)
              }
              //#endregion

              //#region regject when undefined
              if (!item.variableValue && item.variableValue !== null) {
                reject();
                return;
              }
              //#endregion

              //#region handle result as link
              if (item.useResultAsLinkAndExit) {
                try {
                  // TODO @LAST refactor this
                  // @ts-ignore
                  child.execSync(`navi goto ${item.variableValue}`, { shell });
                } catch (error) { }
                resolve(void 0);
                return;
              }
              //#endregion

              //#region handle quick fill next
              if (item.fillNextVariableResolveWhenSelectedIsActionOption
                && !!item?.variableValue?.action
              ) {
                const nextItem = resolveVariables[index + 1];
                if (!nextItem) {
                  reject();
                  return;
                }
                nextItem.variableValue = item.variableValue.action;
                break;
              }
              //#endregion
              resolveVars.push(item);
            }
          }
          //#endregion

          //#region endactions

          //#region finish action
          function finishAction(childResult: any) {
            if (reloadAfterSuccesFinish) {
              vscode.commands.executeCommand('workbench.action.reloadWindow');
            } else {
              if (showSuccessMessage) {
                let doneMsg = title ? MAIN_TITLE : `command: ${commandToExecuteReadable}`;
                const message = `Done executing - ${doneMsg}.\n\n` + (childResult ? childResult.toString() : '');
                log.data(message);
                window.showInformationMessage(message);
              }
            }
            resolve(void 0);
          }
          //#endregion

          //#region finish error
          function finishError(err: any, data?: string) {
            let doneMsg = title ? title : `command: ${commandToExecuteReadable}`;
            const message = `Execution of ${doneMsg} failed:\n ${commandToExecuteReadable}
            ${err}
            ${data}
            `;
            log.error(message);
            window.showErrorMessage(message);
            resolve(void 0);
          }
          //#endregion

          //#endregion

          //#region cancle action
          token.onCancellationRequested(() => {
            if (proc) {
              proc.kill('SIGINT');
            }
            const message = `User canceled command: ${commandToExecuteReadable}`;
            log.data(message);
            window.showWarningMessage(message);
          });
          //#endregion

          //#region resolving cwd
          try {
            let newCwd = isAbsolute ? cwd : crossPlatformPath(path.join(cwd as string, relativePathToFileFromWorkspaceRoot));
            log.data(`first newCwd : ${newCwd}, relativePath: "${relativePathToFileFromWorkspaceRoot}"`)
            if (!fse.existsSync(newCwd as string)) {
              // QUICK_FIX for vscode workspace
              const cwdBase = path.basename(cwd as string);
              log.data(`cwdBase ${cwdBase}`)
              const testCwd = (newCwd as string).replace(`/${cwdBase}/${cwdBase}/`, `/${cwdBase}/`);
              if (fse.existsSync(testCwd)) {
                log.data(`cwdBaseExists`);
                newCwd = testCwd;
              }
            }
            log.data(`newCwd: ${newCwd}`)
            if (fse.existsSync(newCwd as string)) {
              if (!fse.lstatSync(newCwd as string).isDirectory()) {
                newCwd = crossPlatformPath(path.dirname(newCwd as string));
              }
            } else {
              const cwdFixed = (typeof newCwd === 'string') ? crossPlatformPath(path.dirname(newCwd)) : void 0;
              if (cwdFixed && fse.existsSync(cwdFixed) && fse.lstatSync(cwdFixed).isDirectory()) {
                newCwd = cwdFixed;
                log.data(`newCwd fixed: ${newCwd}`)
              } else {
                window.showErrorMessage(`[vscode] Cwd not found: ${newCwd}`);
                resolve(void 0);
                return;
              }
            }
            //#endregion

            //#region applying flags
            const flags = [
              tnpShowProgress && '--tnpShowProgress',
              tnpNonInteractive && '--tnpNonInteractive',
              findNearestProject && '--findNearestProject',
              findNearestProjectWithGitRoot && '--findNearestProjectWithGitRoot',
              findNearestProjectType && `--findNearestProjectType=${findNearestProjectType}`,
              findNearestProjectTypeWithGitRoot && `--findNearestProjectTypeWithGitRoot=${findNearestProjectTypeWithGitRoot}`,
              '-verbose'
            ].filter(f => !!f).join(' ');

            let cmd = (typeof commandToExecute === 'string') ? `${commandToExecute} --cwd ${newCwd} ${flags}` :
              commandToExecute.map(c => `${c} --cwd ${newCwd} ${flags}`).join(' && ');
            //#endregion

            log.data(`commandToExecuteReadable before: ${commandToExecuteReadable}`);

            let execCommand = commandToExecuteReadable;

            //#region handle %paramName% variables
            const execParams = execCommand.match(/\%[a-zA-Z]+\%/g);
            if (Array.isArray(execParams) && execParams.length > 0) {
              for (let index = 0; index < execParams.length; index++) {
                const paramToResolve = execParams[index];
                if (paramToResolve === '%name%' && resolveVariables &&
                  (typeof resolveVariables.find(({ variable }) => variable === 'name') === 'undefined')
                ) {
                  const name = await getModuleName();
                  execCommand = execCommand
                    .replace(paramToResolve, name);
                  cmd = cmd
                    .replace(paramToResolve, name);
                  if (options?.title) {
                    options.title = options.title.replace(paramToResolve, relativePathToFileFromWorkspaceRoot);
                  }
                }

                if (paramToResolve === '%absolutePath%') {
                  // @ts-ignore
                  const absolutePath = crossPlatformPath(path.join(cwd, relativePathToFileFromWorkspaceRoot));
                  execCommand = execCommand.replace(paramToResolve, absolutePath);
                  cmd = cmd.replace(paramToResolve, absolutePath);
                  if (options?.title) {
                    options.title = options.title.replace(paramToResolve, relativePathToFileFromWorkspaceRoot);
                  }
                }

                // if (paramToResolve === '%cwd%') {
                //   // @ts-ignore
                //   const cwdToReplace = cwdToReplace || '';
                //   execCommand = execCommand.replace(paramToResolve, cwdToReplace);
                //   cmd = cmd.replace(paramToResolve, cwdToReplace);
                // }

                if (paramToResolve === '%relativePath%') {
                  log.data(`paramToResolve: '${paramToResolve}'`);
                  log.data(`relativePath: '${relativePathToFileFromWorkspaceRoot}'`);
                  execCommand = execCommand.replace(paramToResolve, relativePathToFileFromWorkspaceRoot);
                  cmd = cmd.replace(paramToResolve, relativePathToFileFromWorkspaceRoot);
                  if (options?.title) {
                    options.title = options.title.replace(paramToResolve, relativePathToFileFromWorkspaceRoot);
                  }
                }
                if (paramToResolve === '%relativePathDirname%') {
                  execCommand = execCommand.replace(paramToResolve, crossPlatformPath(path.dirname(relativePathToFileFromWorkspaceRoot)));
                  cmd = cmd.replace(paramToResolve, crossPlatformPath(path.dirname(relativePathToFileFromWorkspaceRoot)));
                  if (options?.title) {
                    options.title = options.title.replace(paramToResolve, relativePathToFileFromWorkspaceRoot);
                  }
                }
              }
              if (resolveVariables) {
                for (let index = 0; index < resolveVariables.length; index++) {
                  const { variable, variableValue, encode } = resolveVariables[index];
                  const variableInsidPrecentSign = `%${variable}%`;
                  const variableValueFinal = encode ? encodeURIComponent(variableValue) : variableValue;
                  execCommand = execCommand.replace(variableInsidPrecentSign, variableValueFinal);
                  cmd = cmd.replace(variableInsidPrecentSign, variableValueFinal);
                  if (options?.title) {
                    options.title = options.title.replace(variableInsidPrecentSign, variableValueFinal);
                  }
                }
              }
            }
            //#endregion

            log.data(`cmd after replacing: ${cmd}`);
            log.data(`execCommand after replacing: ${execCommand}`);

            dataToDisplayInLog += `commandToExecute: ${execCommand}`;

            if (syncProcess) {
              //#region handle sync process
              let childResult = child.execSync(cmd, { shell });
              progress.report({ increment: 50 });
              if (typeof childResult !== 'object') {
                throw `Child result is not a object`
              }
              progress.report({ increment: 50 });
              finishAction(showOutputDataOnSuccess ? childResult : '');
              //#endregion
            } else {
              //#region handle async process events
              if (isDefaultBuildCommand) {
                var outputChannel = vscode.window.createOutputChannel('FIREDEV CLI');
                outputChannel.show();
              }

              var proc = child.exec(cmd, { cwd, shell });
              if (!proc) {
                await window.showErrorMessage(`Incorrect execution of: ${cmd}`);
                return;
              }
              // @ts-ignore
              proc.stdout.on('data', (message) => {
                // tslint:disable-next-line: no-unused-expression
                log.data(message.toString());
                if (isDefaultBuildCommand) {
                  outputChannel.appendLine(message.toString().trim());
                } else {
                  dataToDisplayInLog += message.toString();
                  ProgressData.resolveFrom(message.toString(), (json) => {
                    progress.report({ message: json.msg, increment: json.value / 100 });
                  });
                }

              });

              // @ts-ignore
              proc.stdout.on('error', (err) => {
                // tslint:disable-next-line: no-unused-expression
                if (isDefaultBuildCommand) {
                  outputChannel.appendLine(err.toString().trim());
                } else {
                  dataToDisplayInLog += err.toString();
                  window.showErrorMessage(`Error: ${JSON.stringify(err, null, 2)}`)
                }

              });

              // @ts-ignore
              proc.stderr.on('data', (message) => {
                // tslint:disable-next-line: no-unused-expression
                const msg = message.toString();

                if (msg.search('UnhandledPromiseRejectionWarning: Error') !== -1) {
                  if (isDefaultBuildCommand) {
                    outputChannel.appendLine(msg.toString().trim());
                  } else {
                    dataToDisplayInLog += msg.toString();
                    window.showErrorMessage(`Error: \n${msg}`)
                  }
                  finishError(`Command crashed with message: \n ${msg}`, dataToDisplayInLog);
                } else {
                  if (isDefaultBuildCommand) {
                    outputChannel.appendLine(message.toString().trim());
                  } else {
                    dataToDisplayInLog += message.toString();
                    ProgressData.resolveFrom(message.toString(), (json) => {
                      progress.report({ message: json.msg, increment: json.value / 100 });
                    });
                  }
                }

              });

              // @ts-ignore
              proc.stderr.on('error', (err) => {
                // tslint:disable-next-line: no-unused-expression
                if (isDefaultBuildCommand) {
                  outputChannel.appendLine(err.toString().trim());
                } else {
                  dataToDisplayInLog += (err.toString());
                  window.showErrorMessage(`Error: ${JSON.stringify(err, null, 2)}`);
                }
              });
              proc.on('exit', (code) => {
                if (isDefaultBuildCommand) {
                  outputChannel.appendLine(`--- BUILD TASK ENDED --- code ${code}`.trim());
                  resolve(void 0);
                } else {
                  if (code == 0) {
                    finishAction(showOutputDataOnSuccess ? dataToDisplayInLog : '');
                  } else {
                    finishError(`Command exited with code: ${code}`, dataToDisplayInLog);
                  }
                }

              });
              //#endregion
            }

          } catch (err) {
            finishError(err, dataToDisplayInLog);
          }
        });
        return endPromise;
      });
    }
    //#endregion
  });
}
