import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as watch from 'watch'
import * as glob from 'glob';
import { ChildProcess } from 'child_process';
import * as dateformat from "dateformat";
import * as _ from "lodash";
export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';


export class IncrementalBuild {

    constructor(private options: {
        filesPattern?: string;
        location: string,
        syncAction: (filesPathes: string[]) => void;
        preAsyncAction?: () => void
        asyncAction?: (filePath: string) => void;
    }) {
 
        this.locationBasename = path.basename(this.options.location);
        this.customizableFilesOrFolders = glob.sync(path.join(this.locationBasename, this.options.filesPattern))
        // console.log('this.customizableFilesOrFolders', this.customizableFilesOrFolders)

    }

    private locationBasename: string;

    public init() {
        if (_.isFunction(this.options.syncAction)) {
            this.options.syncAction(this.customizableFilesOrFolders);
        }
    }

    public initAndWatch() {
        this.init()

        if (_.isFunction(this.options.preAsyncAction)) {
            this.options.preAsyncAction()
        }
        if (_.isFunction(this.options.asyncAction)) {
            this.watchFilesAndFolders((f, event, data) => {
                // console.log(`File "${event}" : ${f}`)
                if (event !== 'removed') {
                    this.options.asyncAction(f);
                }
            })
        }
    }

    private date() {
        return `[${dateformat(new Date(), 'HH:MM:ss')}]`;
    }


    customizableFilesOrFolders: string[];


    private resoveFiles() {

    }


    private watchFilesAndFolders<WatchData=Object>(filesEventCallback: (absolutePath: string, event: FileEvent, data: WatchData | any) => any) {

        const monitorDir = this.options.location;
        // console.log(`Monitoring directory: ${monitorDir} `)
        watch.watchTree(monitorDir, (f, curr, prev) => {

            if (_.isString(f)) {
                f = path.join(this.locationBasename, f.replace(monitorDir, ''))
            }
            // console.log(f)
            // process.exit(0)
            if (typeof f == "object" && prev === null && curr === null) {
                // Finished walking the tree
            } else if (prev === null) {
                filesEventCallback(f as any, 'created', {})
            } else if (curr.nlink === 0) {
                filesEventCallback(f as any, 'removed', {})
            } else {
                filesEventCallback(f as any, 'changed', {})
                // f was changed
            }
        })


    }

}
