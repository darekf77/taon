import { FRAMEWORK_NAME } from './constants';
// import { capitalizeFirstLetter } from './helpers';
import { CommandType } from './models';

const group = `FIREDEV CLI essentials`;

export const commands: CommandType[] = (
  [
    //#region MAGIC COPY AND RENAME
    {
      title: `${FRAMEWORK_NAME.toUpperCase()} MAGIC COPY AND RENAME`,
      exec: `${FRAMEWORK_NAME} copy:and:rename '%rules%'`,
      options: {
        title: 'firedev is magically renaming files and folders..',
        cancellable: false,
        resolveVariables: [
          {
            variable: 'rules',
            placeholder: `%fileName% -> %fileName%-new`,
            encode: true,
          },
        ],
      },
    },
    //#endregion
    //#region OPEN ROUTES FILE
    {
      title: `${FRAMEWORK_NAME.toUpperCase()} OPEN ROUTES FILE`,
      exec: `${FRAMEWORK_NAME} open:routes`,
      options: {
        title: 'open vscode routes',
        showSuccessMessage: false,
      },
    },
    //#endregion
    //#region OPEN DB FILE
    {
      title: `${FRAMEWORK_NAME.toUpperCase()} OPEN DATABASE FILE`,
      exec: `${FRAMEWORK_NAME} open:db`,
      options: {
        title: 'open vscode db file',
        showSuccessMessage: false,
      },
    },
    //#endregion
    //#region OPEN CORE CONTAINER
    {
      title: `${FRAMEWORK_NAME.toUpperCase()} OPEN CORE CONTAINER`,
      exec: `${FRAMEWORK_NAME} open:core:container`,
      options: {
        title: 'opening core container',
        findNearestProject: true,
        showSuccessMessage: false,
      },
    },
    //#endregion
    //#region GENERATE firedev minimal
    {
      title: `${FRAMEWORK_NAME.toUpperCase()} CODE GEN. firedev minimal`,
      exec: `${FRAMEWORK_NAME} generate %absolutePath% firedev-minimal %entity%`,
      options: {
        title: 'generating firedev code',
        showSuccessMessage: false,
        resolveVariables: [
          {
            variable: 'entity',
            placeholder: `my-entity`,
            encode: true,
          },
        ],
      },
    },
    //#endregion
    //#region GENERATE firedev minimal
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} CODE GEN. firedev minimal=>full`,
    //   exec: `${FRAMEWORK_NAME} generate %absolutePath% firedev-minimal-to-full %entity%`,
    //   options: {
    //     title: 'generating firedev code',
    //     showSuccessMessage: false,
    //     // resolveVariables: [
    //     //   {
    //     //     variable: 'entity',
    //     //     placeholder: `my-entity`,
    //     //     encode: true,
    //     //   },
    //     // ],
    //   },
    // },
    //#endregion
    //#region GENERATE firedev extended files
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} CODE GEN. firedev full`,
    //   exec: `${FRAMEWORK_NAME} generate %absolutePath% firedev-full %entity%`,
    //   options: {
    //     title: 'generating firedev code',
    //     showSuccessMessage: false,
    //     resolveVariables: [
    //       {
    //         variable: 'entity',
    //         placeholder: `my-entity`,
    //         encode: true,
    //       },
    //     ],
    //   },
    // },
    //#endregion
    //#region CODE GEN.
    {
      title: `${FRAMEWORK_NAME.toUpperCase()} CODE GEN. - select -`,
      exec: `${FRAMEWORK_NAME} generate %absolutePath% %moduleName% %entity%`,
      //  exec: `tnp generate %absolutePath% %moduleName% %entity%`,
      options: {
        title: 'generating firedev code',
        resolveVariables: [
          {
            variable: 'moduleName',
            options: [
              // {
              //   option: 'app-extended_flat',
              //   label: 'Generate extended app.* files for firedev app',
              // },
              {
                option: 'dummy-angular-standalone-component',
                label: 'Generate dummy Angular component structure',
              },
              {
                option: 'dummy-angular-module',
                label: 'Generate dummy Angular module/component structure',
              },
              {
                option: 'dummy-angular-lazy-module',
                label:
                  'Generate dummy Angular lazy routing module/component structure',
              },
              {
                option: 'dummy-angular-lazy-module-container',
                label:
                  'Generate dummy Angular lazy routing module/container structure',
              },
              // {
              //   option: 'firedev-backend-frontend-module',
              //   label: 'Generate Firedev backend/frontend module structure',
              // },
              {
                option: 'ngrx-feature-container-module',
                label: 'Generate NgRx container module structure',
              },
              {
                option: 'ngrx-feature-container-module-for-lazy-routing',
                label:
                  'Generate NgRx container module structure for lazy routing',
              },
              // {
              //   option: 'generated-index-exports_custom',
              //   label: 'Generate in index.ts typescript exports from folders',
              //   skipNextVariableResolve: true
              // },
              // {
              //   option: 'wrap-with-browser-regions_custom',
              //   label: 'Wrap file with @browser regions',
              //   skipNextVariableResolve: true,
              // },
            ],
          },
          {
            variable: 'entity',
            placeholder: `my-entity-name`,
            encode: true,
          },
        ],
      },
    },
    //#endregion

    //#region old commands
    //#region TEMP FILES SHOW
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} TEMP FILES => SHOW`,
    //   exec: `${FRAMEWORK_NAME} vscode:temp:show`,
    //   options: {
    //     title: 'show temporary files',
    //     findNearestProject: true,
    //     debug: true,
    //     cancellable: false,
    //     showSuccessMessage: false,
    //   },
    // },
    //#endregion
    //#region TEMP FILES HIDE
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} TEMP FILES => HIDE`,
    //   exec: `${FRAMEWORK_NAME} vscode:temp:hide`,
    //   options: {
    //     title: 'hide temporary files',
    //     debug: true,
    //     findNearestProject: true,
    //     cancellable: false,
    //     showSuccessMessage: false,
    //   },
    // },
    //#endregion
    //#region OPEN CORE PROJECT
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} OPEN CORE PROJECT`,
    //   exec: `${FRAMEWORK_NAME} open:core:project`,
    //   options: {
    //     title: 'opening core project',
    //     findNearestProject: true,
    //     showSuccessMessage: false,
    //   },
    // },
    //#endregion
    //#region CLEAR ALL AND INIT
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} CLEAR ALL AND INIT`,
    //   exec: [`${FRAMEWORK_NAME} clean`, `${FRAMEWORK_NAME} init`],
    //   options: {
    //     title: 'clear and init project',
    //     findNearestProject: true,
    //     askBeforeExecute: true,
    //   },
    // },
    //#endregion
    //#region GIT COMMIT/PUSH UPDATE
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} GIT COMMIT/PUSH UPDATE`,
    //   exec: `${FRAMEWORK_NAME} push`,
    //   options: {
    //     title: 'quick git commit and push',
    //     findNearestProjectWithGitRoot: true,
    //   },
    // },
    //#endregion
    //#region GENERATE INDEX.TS
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} GENERATE index.ts`,
    //   exec: `${FRAMEWORK_NAME} generate %absolutePath% generated-index-exports_custom`,
    //   options: {
    //     title: 'generating index.ts',
    //     showSuccessMessage: false,
    //   },
    // },
    //#endregion
    //#region WRAP FILE WITH @BROWSER TAG
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} WRAP FILE WITH @browser TAG`,
    //   exec: `${FRAMEWORK_NAME} generate %absolutePath% wrap-with-browser-regions_custom`,
    //   options: {
    //     title: 'wrapping file with @browser',
    //     showSuccessMessage: false,
    //   },
    // },
    //#endregion

    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} OPEN workspace`,
    //   exec: `${FRAMEWORK_NAME} open:workspace`,
    //   options: {
    //     title: 'open vscode workspace',
    //     findNearestProjectType: 'workspace',
    //     showSuccessMessage: false
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} INIT project`,
    //   exec: `${FRAMEWORK_NAME} init`,
    //   options: {
    //     title: 'init project temporary files',
    //     findNearestProject: true,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} OPEN ALL WORKSPACE CHILDS`,
    //   exec: `${FRAMEWORK_NAME} open:workspace:childs`,
    //   options: {
    //     title: 'open vscode workspace childs',
    //     findNearestProjectType: 'workspace',
    //     showSuccessMessage: false
    //   }
    // },

    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} RELEASE PROJECT`,
    //   exec: `${FRAMEWORK_NAME} release`,
    //   options: {
    //     title: 'release project',
    //     findNearestProject: true
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} RESET PROJECT`,
    //   exec: `${FRAMEWORK_NAME} reset`,
    //   options: {
    //     title: 'remove project temporary files',
    //     findNearestProject: true,
    //     cancellable: false,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} TEMP FILES ALL WORKSPACE CHILDS - show`,
    //   exec: 'tnp filesshowall',
    //   options: {
    //     title: `${FRAMEWORK_NAME} temporary files`,
    //     findNearestProject: true,
    //     cancellable: false,
    //     showSuccessMessage: false
    //   }
    // },
    // {
    //   title:`${FRAMEWORK_NAME.toUpperCase()} FILES ALL WORKSPACE CHILDS - hide`,
    //   exec: `${FRAMEWORK_NAME} fileshideall`,
    //   options: {
    //     title: 'hide temporary files',
    //     findNearestProject: true,
    //     cancellable: false,
    //     showSuccessMessage: false
    //   }
    // },
    // {
    //   title: 'FIREDEV BUILD dist',
    //   exec: 'tnp build:dist',
    //   options: {
    //     title: 'distribution build',
    //     findNearestProject: true
    //   }
    // },
    // {
    //   title: 'FIREDEV STATIC REBUILD AND START',
    //   exec: 'tnp static:build:dist && tnp start',
    //   options: {
    //     findNearestProjectType: 'workspace',
    //   }
    // },
    // {
    //   title: 'FIREDEV STATIC REBUILD PROD AND START',
    //   exec: 'tnp static:build:dist:prod && tnp start',
    //   options: {
    //     findNearestProjectType: 'workspace',
    //   }
    // },
    // {
    //   title: 'FIREDEV STATIC START workspace',
    //   exec: 'tnp start',
    //   options: {
    //     findNearestProjectType: 'workspace',
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} STATIC BUILD`,
    //   exec: `${FRAMEWORK_NAME} static:build:dist`,
    //   options: {
    //     title: 'static (for workspace) distribution build',
    //     findNearestProject: true,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} STATIC BUILD PROD`,
    //   exec: `${FRAMEWORK_NAME} static:build:dist:prod`,
    //   options: {
    //     title: 'static (for workspace) distribution production build',
    //     findNearestProject: true,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} PACKAGE.JSON hide deps`,
    //   exec: `${FRAMEWORK_NAME} deps:hide`,
    //   options: {
    //     title: 'package.json hide dependencies',
    //     findNearestProject: true,
    //     cancellable: false,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} PACKAGE.JSON show deps`,
    //   exec: `${FRAMEWORK_NAME} deps:show`,
    //   options: {
    //     title: 'package.json show dependencies',
    //     findNearestProject: true,
    //     cancellable: false,
    //   }
    // },
    //  {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} NEW LOGIC-UI MODULE`,
    //   exec: `${FRAMEWORK_NAME} new model %name% %realtivePath%`,
    //   options: {
    //     title: 'craete new logic-ui model',
    //     findNearestProject: true,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} NEW UI MODULE`,
    //   exec: `${FRAMEWORK_NAME} new model %name% %realtivePath%`,
    //   options: {
    //     title: 'craete new logic-ui model',
    //     findNearestProject: true,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} QUICK GIT reset hard and pull`,
    //   exec: `${FRAMEWORK_NAME} ${camelize('$GIT_QUICK_RESET_HARD_AND_PULL')}`,
    //   options: {
    //     title: 'quick git reset and pull',
    //     findNearestProjectWithGitRoot: true,
    //     askBeforeExecute: true,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} AUTOUPDATE`,
    //   exec: `${FRAMEWORK_NAME} vscode:ext`,
    //   options: {
    //     title: 'firedev vscode extension autoupdate',
    //     reloadAfterSuccesFinish: true,
    //     cancellable: false,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} NEW PREVIEW FOR UI MODULE`,
    //   exec: `${FRAMEWORK_NAME} new model %name% %realtivePath%`,
    //   options: {
    //     title: 'craete new logic-ui model',
    //     findNearestProject: true,
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} OPEN baseline`,
    //   exec: `${FRAMEWORK_NAME} open:baseline`,
    //   options: {
    //     title: 'open baseline for site',
    //     findNearestProject: true,
    //     showSuccessMessage: false
    //   }
    // },
    // {
    //   title: `${FRAMEWORK_NAME.toUpperCase()} RUN DEFAULT BUILD`,
    //   exec: `${FRAMEWORK_NAME} default:build`,
    //   isDefaultBuildCommand: true,
    //   hideContextMenu: true,
    //   options: {
    //     progressLocation: 'statusbar',
    //     title: 'FIREDEV RUN DEFAULT BUILD',
    //     cancellable: true,
    //     findNearestProject: true,
    //   }
    // },
    // {
    //   hideContextMenu: true,
    //   title: `${FRAMEWORK_NAME.toUpperCase()} STOP DEFAULT BUILD`,
    //   exec: `${FRAMEWORK_NAME} stop:default:build`,
    //   options: {
    //     title: 'FIREDEV DEFAULT BUILD',
    //     showSuccessMessage: true,
    //     cancellable: false,
    //     findNearestProject: true,
    //   }
    // }
    // {
    //   title: 'FIREDEV: TEST EXT',
    //   exec: 'tnp show:loop:messages --max 6 --tnpShowProgress',
    //   options: {
    //     cancellable: false,
    //     title: 'Testing progress'
    //   }
    // },
    // {
    //   title: 'FIREDEV: show version',
    //   exec: 'tnp version',
    //   options: {
    //     syncProcess: true,
    //     title: 'Show version of firedev'
    //   }
    // },

    // only for tests
    // {
    //   title: 'FIREDEV TEST nearest project',
    //   exec: 'tnp processcwd',
    //   options: {
    //     findNearestProject: true,
    //     syncProcess: true
    //   }
    // },
    // {
    //   title: 'FIREDEV TEST nearest project with git root',
    //   exec: 'tnp processcwd',
    //   options: {
    //     findNearestProjectWithGitRoot: true,
    //     syncProcess: true
    //   }
    // },
    // {
    //   title: 'FIREDEV TEST nearest project workspace',
    //   exec: 'tnp processcwd',
    //   options: {
    //     findNearestProjectType: 'container',
    //     syncProcess: true
    //   }
    // },
    // {
    //   title: 'FIREDEV TEST nearest project workspace with git root',
    //   exec: 'tnp processcwd',
    //   options: {
    //     findNearestProjectTypeWithGitRoot: 'workspace',
    //     syncProcess: true
    //   }
    // }
    //#endregion
  ] as CommandType[]
).map(c => {
  if (!c.command) {
    c.command = `extension.${camelize(c.title)}`;
  }
  if (!c.group) {
    c.group = group;
  }
  return c;
});

function camelize(str: string = '') {
  str = str.replace(/\W/g, '').toLowerCase();
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index == 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}
