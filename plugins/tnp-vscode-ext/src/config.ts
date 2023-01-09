import { FRAMEWORK_NAME } from './constants';
import { capitalizeFirstLetter } from './helpers';
import { CommandType } from './models';

const group = `${capitalizeFirstLetter(FRAMEWORK_NAME)} CLI essentials`;

export const commands: CommandType[] = ([
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} TEMP FILES - show`,
    exec: `${FRAMEWORK_NAME} vscode:temp:show`,
    options: {
      title: 'show temporary files',
      findNearestProject: true,
      debug: true,
      cancellable: false,
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} TEMP FILES - hide`,
    exec: `${FRAMEWORK_NAME} vscode:temp:hide`,
    options: {
      title: 'hide temporary files',
      debug: true,
      findNearestProject: true,
      cancellable: false,
      showSuccessMessage: false
    }
  },
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
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} INIT project`,
    exec: `${FRAMEWORK_NAME} init`,
    options: {
      title: 'init project temporary files',
      findNearestProject: true,
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} OPEN routes`,
    exec: `${FRAMEWORK_NAME} open:routes`,
    options: {
      title: 'open vscode routes',
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} OPEN db file`,
    exec: `${FRAMEWORK_NAME} open:db`,
    options: {
      title: 'open vscode db file',
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} OPEN workspace`,
    exec: `${FRAMEWORK_NAME} open:workspace`,
    options: {
      title: 'open vscode workspace',
      findNearestProjectType: 'workspace',
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} OPEN ALL WORKSPACE CHILDS`,
    exec: `${FRAMEWORK_NAME} open:workspace:childs`,
    options: {
      title: 'open vscode workspace childs',
      findNearestProjectType: 'workspace',
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} OPEN baseline`,
    exec: `${FRAMEWORK_NAME} open:baseline`,
    options: {
      title: 'open baseline for site',
      findNearestProject: true,
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} OPEN core project`,
    exec: `${FRAMEWORK_NAME} open:core:project`,
    options: {
      title: 'opening core project',
      findNearestProject: true,
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} OPEN core container`,
    exec: `${FRAMEWORK_NAME} open:core:container`,
    options: {
      title: 'opening core container',
      findNearestProject: true,
      showSuccessMessage: false
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} RELEASE PROJECT`,
    exec: `${FRAMEWORK_NAME} release`,
    options: {
      title: 'release project',
      findNearestProject: true
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} RESET PROJECT`,
    exec: `${FRAMEWORK_NAME} reset`,
    options: {
      title: 'remove project temporary files',
      findNearestProject: true,
      cancellable: false,
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} CLEAN ALL AND INIT`,
    exec: [`${FRAMEWORK_NAME} clean:all`, `${FRAMEWORK_NAME} init`],
    options: {
      title: 'clean all project and init projects current',
      findNearestProject: true,
      askBeforeExecute: true,
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} NEW LOGIC-UI MODULE`,
    exec: `${FRAMEWORK_NAME} new model %name% %realtivePath%`,
    options: {
      title: 'craete new logic-ui model',
      findNearestProject: true,
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} NEW UI MODULE`,
    exec: `${FRAMEWORK_NAME} new model %name% %realtivePath%`,
    options: {
      title: 'craete new logic-ui model',
      findNearestProject: true,
    }
  },
  // {
  //   title: `${FRAMEWORK_NAME.toUpperCase()} NEW PREVIEW FOR UI MODULE`,
  //   exec: `${FRAMEWORK_NAME} new model %name% %realtivePath%`,
  //   options: {
  //     title: 'craete new logic-ui model',
  //     findNearestProject: true,
  //   }
  // },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} QUICK GIT commit and push update`,
    exec: `${FRAMEWORK_NAME} ${camelize('$GIT_QUICK_COMMIT_AND_PUSH')}`,
    options: {
      title: 'quick git commit and push',
      findNearestProjectWithGitRoot: true,
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} QUICK GIT reset hard and pull`,
    exec: `${FRAMEWORK_NAME} ${camelize('$GIT_QUICK_RESET_HARD_AND_PULL')}`,
    options: {
      title: 'quick git reset and pull',
      findNearestProjectWithGitRoot: true,
      askBeforeExecute: true,
    }
  },
  {
    title: `${FRAMEWORK_NAME.toUpperCase()} AUTOUPDATE`,
    exec: `${FRAMEWORK_NAME} vscode:ext`,
    options: {
      title: 'firedev vscode extension autoupdate',
      reloadAfterSuccesFinish: true,
      cancellable: false,
    }
  },
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
] as CommandType[]).map(c => {
  if (!c.command) {
    c.command = `extension.${camelize(c.title)}`;
  }
  if (!c.group) {
    c.group = group;
  }
  return c;
})


function camelize(str: string = '') {
  str = str.replace(/\W/g, '').toLowerCase();
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}
