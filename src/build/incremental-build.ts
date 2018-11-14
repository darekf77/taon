import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { watch } from 'chokidar'
import * as glob from 'glob';
import * as dateformat from "dateformat";
import * as _ from "lodash";
import { Helpers } from '../helpers';
export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';




export abstract class IncrementalBuild {

  public compilationFolderPath: string;
  private filesAndFoldesRelativePathes: string[] = []

  private readonly watchDir: string;

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

    this.compilationFolderPath = cwd;

  }

  protected resolveFilesPathPattern() {
    this.filesAndFoldesRelativePathes = glob.sync(path.join(this.location, this.globPattern), {
      cwd: this.compilationFolderPath
    })
    console.log(this.filesAndFoldesRelativePathes.slice(0, 5))
  }


  public init(taskName?: string) {
    if (_.isFunction(this.syncAction)) {
      this.compilationWrapper(() => {
        this.resolveFilesPathPattern()
        this.syncAction(this.filesAndFoldesRelativePathes);
      }, taskName)
    }
  }

  public initAndWatch(taskName?: string) {
    this.init(taskName)

    if (_.isFunction(this.preAsyncAction)) {
      this.compilationWrapper(() => {
        this.preAsyncAction()
      }, `pre-async action for ${taskName}`)
    }
    if (_.isFunction(this.asyncAction)) {
      this.watchFilesAndFolders((f, event) => {
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

    if (fs.existsSync(this.watchDir)) {
      watch(this.watchDir, {
        followSymlinks: false
      })
        .on('change', callBackWithRelativePath('changed'))
        .on('add', callBackWithRelativePath('changed'))
        .on('unlink', callBackWithRelativePath('changed'))

    }


  }

}
