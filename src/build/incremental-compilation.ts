//#region @backend
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { watch } from 'chokidar'
import * as glob from 'glob';
import * as dateformat from "dateformat";
import * as _ from "lodash";
import { Helpers } from '../helpers';
import { FileEvent } from './models';




export abstract class IncrementalCompilation {

  public compilationFolderPath: string;
  public filesAndFoldesRelativePathes: string[] = []

  protected readonly watchDir: string;

  protected abstract syncAction(filesPathes: string[]): void;;
  protected abstract preAsyncAction(): void;
  protected abstract asyncAction(filePath: string); void;

  compilationWrapper(fn: () => void, taskName: string = 'Task', executionType: 'Compilation' | 'Code execution' = 'Compilation') {
    function currentDate() {
      return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
    }
    if (!fn || !_.isFunction(fn)) {
      console.error(`${executionType} wrapper: "${fs}" is not a function.`)
      process.exit(1)
    }

    if (Helpers.isAsync(fn)) {
      return new Promise(async (resolve, reject) => {
        try {
          console.log(chalk.gray(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" started...`))
          await fn()
          console.log(chalk.green(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" finish OK...`))
          resolve()
        } catch (error) {
          console.log(chalk.red(error));
          console.log(`${currentDate()} ${executionType} of ${taskName} ERROR`)
          reject(error)
        }
      })
    } else {
      try {
        console.log(chalk.gray(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" started...`))
        fn()
        console.log(chalk.green(`${currentDate()} ${executionType} of "${chalk.bold(taskName)}" finish OK...`))
      } catch (error) {
        console.log(chalk.red(error));
        console.log(`${currentDate()} ${executionType} of ${taskName} ERROR`)
      }
    }

  }


  constructor(

    public globPattern: string,
    /**
     * Relative to cwd
     */
    public location = 'src',

    public cwd: string = process.cwd(),
  ) {

    this.watchDir = path.join(cwd, location, globPattern)
  }

  public init(taskName?: string, afterInitCallBack?: () => void) {
    if (_.isFunction(this.syncAction)) {
      this.compilationWrapper(() => {
        this.syncAction(this.filesAndFoldesRelativePathes);
      }, taskName)
    }
    if (_.isFunction(afterInitCallBack)) {
      afterInitCallBack()
    }
  }

  private firstTimeFix = {};

  public initAndWatch(taskName?: string, afterInitCallBack?: () => void) {
    this.init(taskName, afterInitCallBack)

    if (_.isFunction(this.preAsyncAction)) {
      // this.compilationWrapper(() => {
      this.preAsyncAction()
      // }, `pre-async action for ${taskName}`)
    }
    if (_.isFunction(this.asyncAction)) {
      this.watchFilesAndFolders((f, event) => {
        if(!this.firstTimeFix[f]) {
          this.firstTimeFix[f] = true;
          return
        }
        // console.log(`File "${event}" : ${f}`)
        if (event !== 'removed') {
          this.asyncAction(f);
        }
      })
    }
  }


  private watchFilesAndFolders<WatchData=Object>(filesEventCallback: (absolutePath: string, event: FileEvent) => any) {

    const self = this;
    function callBackWithRelativePath(event: FileEvent) {
      return function (absoluteFilePath) {
        filesEventCallback(absoluteFilePath.replace(self.watchDir, ''), event);
      }
    }


    watch(this.watchDir, {
      followSymlinks: false,
    })
      .on('change', callBackWithRelativePath('changed'))
      .on('change', callBackWithRelativePath('rename'))
      .on('add', callBackWithRelativePath('created'))
      .on('unlink', callBackWithRelativePath('removed'))


  }

}
//#endregion
