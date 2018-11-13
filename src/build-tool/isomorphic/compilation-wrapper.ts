import * as child from 'child_process';



export class Compilation {
  constructor(
    protected readonly cwd: string
  ) {

  }


}


export class TsFile {

  private static readonly REGEX_FOR_ENV_SPECYFIC = new RegExp('ENV.currentProjectName', 'g')

  readonly path: string;
  readonly content: string;

  get isForEnvSpecyfic() {
    return TsFile.REGEX_FOR_ENV_SPECYFIC.test(this.content);
  }

}


export class CodeCompilation {

  constructor(
    protected readonly cwd: string,
    protected readonly srcForTsFiles: string,
    protected readonly compilationOutFolder: 'dist' | 'bundle' = 'dist',
    protected readonly tscExe = 'npm-run tsc',
    protected readonly generateDtsFiles = false
  ) {

  }

  onFileChange()

  compile() {

    // const argsBackend = {
    //   jsAndMaps: `--noEmitOnError true --noEmit true --outDir ${this.compilationOutFolder}`,
    //   dTs: `-d ${generateDeclarations} --outDir ${this.FOLDER.dist}`
    // }

    // child.execSync(`${this.tscExe} ${this.argsBackend.jsAndMaps}`,
    //   { stdio: [0, 1, 2], cwd: processCWD })
    // child.execSync(`${this.TOOLS.tsc} ${this.argsBackend.dTs}`,
    //   { stdio: [0, 1, 2], cwd: processCWD })
  }

}

export class CodeCompilationBrowser extends CodeCompilation {

  constructor(

    protected readonly cwd: string,
    protected readonly srcForTsFiles: string,
    protected readonly compilationOutFolder: 'dist' | 'bundle' = 'dist',
    protected readonly tscExe = 'npm-run tsc',
  ) {
    super(cwd, srcForTsFiles, compilationOutFolder, tscExe, true);
  }


}

export class CodeCompilationBrowserForProject extends CodeCompilationBrowser {


  constructor(
    protected readonly cwd: string,
    protected readonly libOrClientProject,
    protected readonly srcForTsFiles: string,
    protected readonly compilationOutFolder: 'dist' | 'bundle' = 'dist',
    protected readonly tscExe = 'npm-run tsc',

  ) {
    super(cwd, srcForTsFiles, compilationOutFolder, tscExe);
  }

}





