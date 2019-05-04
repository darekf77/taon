//#region @backend
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { watch } from 'chokidar'
import * as glob from 'glob';
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


  constructor(

    public globPattern: string,
    /**
     * Relative to cwd
     */
    public location = 'src',

    public cwd: string = process.cwd(),
  ) {
    if (_.isString(globPattern) && _.isString(location) && _.isString(cwd)) {
      this.watchDir = path.join(cwd, location, globPattern)
    }
  }

  public async init(taskName?: string, afterInitCallBack?: () => void) {
    if (_.isFunction(this.syncAction)) {
      await Helpers.compilationWrapper(() => {
        this.syncAction(this.filesAndFoldesRelativePathes);
      }, taskName)
    }
    if (_.isFunction(afterInitCallBack)) {
      afterInitCallBack()
    }
  }

  protected firstTimeFix = {};

  public async initAndWatch(taskName?: string, afterInitCallBack?: () => void) {
    await this.init(taskName, afterInitCallBack)

    if (_.isFunction(this.preAsyncAction)) {
      // this.compilationWrapper(() => {
      this.preAsyncAction()
      // }, `pre-async action for ${taskName}`)
    }
    if (_.isFunction(this.asyncAction)) {
      this.watchFilesAndFolders((f, event) => {
        if (!this.firstTimeFix[f]) {
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


  protected watchFilesAndFolders<WatchData=Object>(filesEventCallback: (absolutePath: string, event: FileEvent) => any) {

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
