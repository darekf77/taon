import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import * as watch from 'watch'
import * as glob from 'glob';

export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';


export class IncrementalBuild {

    constructor(
        private filesGlobPattern: string,
        private actionOnFile: (filePath: string) => void,
        private otherAsyncProcesss?: () => void
    ) {
        this.resoveFiles();
    }

    public init() {

        try {
            console.log(`${this.date()} Building server/browser version of ${path.basename(process.cwd())}...`)
            child.execSync(`${this.options.toolsPathes.tsc} --outDir ${this.options.foldersPathes.dist}`)
            await this.build();

            console.log(`${this.date()} Typescript compilation OK`)
        } catch (error) {
            this.removeLockfile()
            console.log(error);
            console.error(`${this.date()} Typescript compilation ERROR`)
            process.exit(0)
        }


        this.customizableFilesOrFolders.forEach(f => {
            this.actionOnFile(f)
        })
    }

    public initAndWatch() {
        this.init()
        this.watchFilesAndFolders((f, event, data) => {
            this.actionOnFile(f);
        })
    }


    customizableFilesOrFolders: string[];
    location: string;


    private resoveFiles() {
        this.customizableFilesOrFolders = glob.sync(this.filesGlobPattern);
        console.log('this.customizableFilesOrFolders', this.customizableFilesOrFolders)
    }


    private watchFilesAndFolders<WatchData=Object>(filesEventCallback: (absolutePath: string, event: FileEvent, data: WatchData | any) => any) {

        this.customizableFilesOrFolders.forEach(baselieFileOrFolder => {

            const fileOrFolderPath = path.join(this.location, baselieFileOrFolder)

            if (!fs.existsSync(fileOrFolderPath)) {
                console.log(`File ${chalk.bold(chalk.underline(fileOrFolderPath))} doesn't exist and can't be monitored.`)
            }
            if (fs.statSync(fileOrFolderPath).isDirectory()) {
                console.log(`Monitoring directory: ${fileOrFolderPath} `)
                watch.watchTree(fileOrFolderPath, (f, curr, prev) => {
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
            } else {
                console.log(`Monitoring file: ${fileOrFolderPath} `)
                fs.watch(fileOrFolderPath, { recursive: true }, (event: 'rename' | 'change', filename) => {
                    // console.log(`NODE FS WATCH Event: ${ event } for ${ filename }`)
                    filesEventCallback(fileOrFolderPath as any, event === 'change' ? 'changed' : 'rename', {})
                })
            }


        });

    }

}