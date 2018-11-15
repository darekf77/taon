//#region @backend
import * as child from 'child_process';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as glob from 'glob';
import { IncrementalCompilation } from './incremental-compilation';
import { OutFolder } from './models';
import { HelpersBackend } from '../helpers';
import { CodeCut } from './browser-code-cut';
import { config } from './config';



function tscCompilation(cwd: string, watch = false, outDir?: string, generateDeclarations = false, tsExe = 'tsc') {

    const params = [
        watch ? '-w' : '',
        outDir ? `--outDir ${outDir}` : '',
        !watch? '--noEmitOnError true': ''
    ]

    const commandJsAndMaps = `${tsExe} -d false  ${params.join(' ')}`
    const commandDts = `${tsExe}  ${params.join(' ')}`

    if (watch) {
        HelpersBackend.log(child.exec(commandJsAndMaps, { cwd }));
        if (generateDeclarations) {
            HelpersBackend.log(child.exec(commandDts,  { cwd }));
        }
    } else {
        child.execSync(commandJsAndMaps, {
            cwd,
            stdio: [0, 1, 2]
        })

        if (generateDeclarations) {
            child.execSync(commandDts, {
                cwd,
                stdio: [0, 1, 2]
            })
        }
    }





}

export class BackendCompilation extends IncrementalCompilation {


    prepareFiles() {

        // init fiels
        this.filesAndFoldesRelativePathes = glob.sync(this.globPattern, { cwd: this.compilationFolderPath });
        // console.log('backend', this.filesAndFoldesRelativePathes.slice(0, 5))

        // recreate dist
        const outDistPath = path.join(this.cwd, this.outFolder);
        HelpersBackend.tryRemoveDir(outDistPath)
        fse.mkdirpSync(outDistPath);
    }

    compile(watch = false) {
        tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, false)
    }

    syncAction(filesPathes: string[]) {
        this.prepareFiles();
        this.compile()
    }

    preAsyncAction() {
        this.compile(true)
    }
    asyncAction(filePath: string) {
        // noting here for backend
    }


    get tsConfigName() {
        return 'tsconfig.json'
    }
    get tsConfigBrowserName() {
        return 'tsconfig.browser.json'
    }

    constructor(
        /**
         * Output folder
         * Ex. dist
         */
        public outFolder: OutFolder,
        /**
         * Source location
         * Ex. src
         */
        location?: string,
        /**
         * Current cwd same for browser and backend
         * but browser project has own compilation folder
         * Ex. /home/username/project/myproject
         */
        cwd?: string
    ) {
        super('**/*.ts', location, cwd)
        this.compilationFolderPath = path.join(cwd, config.folder.src);
    }


}

export class BroswerCompilation extends BackendCompilation {


    public codecut: CodeCut;
    constructor(
        /**
         * Relative path for browser temporary src
         * Ex.   tmp-src-dist-browser
         */
        public sourceOutBrowser: string,
        outFolder: OutFolder,
        location: string,
        cwd: string
    ) {
        super(outFolder, location, cwd)
        this.compilationFolderPath = path.join(this.cwd, this.sourceOutBrowser);
        this.initBrowser();
    }

    private initBrowser() {

        if (fse.existsSync(this.compilationFolderPath)) {
            rimraf.sync(this.compilationFolderPath)
        }
        fse.mkdirpSync(this.compilationFolderPath)

        HelpersBackend.tryCopyFrom(`${path.join(this.cwd, this.location)}/`, this.compilationFolderPath)

        this.filesAndFoldesRelativePathes = glob.sync(this.globPattern, { cwd: this.compilationFolderPath });
        // console.log('browser', this.filesAndFoldesRelativePathes.slice(0, 5))
        this.initCodeCut()

    }

    compile(watch = false) {
        tscCompilation(this.compilationFolderPath, watch, `../${this.outFolder}` as any, true)
    }

    initCodeCut() {
        this.codecut = new CodeCut(this.compilationFolderPath, this.filesAndFoldesRelativePathes, {
            replacements: [
                ["@backendFunc", `return undefined;`],
                "@backend"
            ]
        })
    }


    prepareFiles() {

        // recreate dirst
        const outDistPath = path.join(this.cwd, this.outFolder);
        HelpersBackend.tryRemoveDir(outDistPath)
        fse.mkdirpSync(outDistPath);

        // tsconfig.browser.json
        const source = path.join(this.cwd, this.tsConfigBrowserName);
        const dest = path.join(this.cwd, this.sourceOutBrowser, this.tsConfigName);

        fse.copyFileSync(source, dest)
        this.codecut.files()
    }






}


//#endregion
