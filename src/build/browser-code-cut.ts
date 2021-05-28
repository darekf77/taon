//#region @backend
import {
  _,
  path,
  fse,
  crossPlatformPath,
} from 'tnp-core';
import {  ReplaceOptions } from './models';
import { Models } from '../models';
import { ConfigModels } from 'tnp-config';

export class CodeCut {

  browserCodeCut: { new(any?): BrowserCodeCut }
  constructor(
    protected cwd: string,
    protected filesPathes: string[],
    protected options: ReplaceOptions) {
    // console.log('init code cut ', this.options)
    this.browserCodeCut = BrowserCodeCut;
  }

  files() {
    // console.log('options in fiels', this.options)
    this.filesPathes.forEach((relativePathToFile) => {
      const absolutePathToFile = crossPlatformPath(path.join(this.cwd, relativePathToFile))
      // console.log('process', absolutePathToFile)
      this.file(absolutePathToFile);
    })
  }

  file(absolutePathToFile) {
    // console.log('options here ', options)
    return new (this.browserCodeCut)(absolutePathToFile)
      .flatTypescriptImportExport('import')
      .flatTypescriptImportExport('export')
      .replaceRegionsForIsomorphicLib(_.cloneDeep(this.options))
      .replaceRegionsFromTsImportExport('import')
      .replaceRegionsFromTsImportExport('export')
      .replaceRegionsFromJSrequire()
      .saveOrDelete()
  }
}


export class BrowserCodeCut {

  public static IsomorphicLibs = [
    'ng2-rest',
    'typeorm',
    'ng2-logger',
    'morphi',
    'tnp-bundle',
    'typescript-class-helpers',
    'lodash-walk-object',
    'json10',
  ];
  public static resolveAndAddIsomorphicLibs(libsNames: string[]) {
    this.IsomorphicLibs = this.IsomorphicLibs.concat(libsNames);
  }


  protected browserString = 'browser';

  protected isDebuggingFile = false;

  protected rawContent: string;

  get isEmpty() {
    return this.rawContent.replace(/\s/g, '').trim() === '';
  }

  constructor(protected absoluteFilePath: string) {
    this.rawContent = fse.existsSync(absoluteFilePath) ?
      fse.readFileSync(absoluteFilePath, 'utf8').toString()
      : '';
  }


  debug(fileName: string) {
    // console.log('path.basename(this.absoluteFilePath)',path.basename(this.absoluteFilePath))
    this.isDebuggingFile = (path.basename(this.absoluteFilePath) === fileName);
  }

  public flatTypescriptImportExport(usage: ConfigModels.TsUsage) {
    if (!this.absoluteFilePath.endsWith('.ts')) {
      return this;
    }
    const fileContent: string = this.rawContent;
    const regexParialUsage = new RegExp(`${usage}\\s+{`)
    const regexFrom = new RegExp(`from\\s+(\\'|\\").+(\\'|\\")`)
    if (_.isString(fileContent)) {
      let joiningLine = false;
      let output = '';
      fileContent.split(/\r?\n/).forEach((line) => {
        const importOrExportPart = regexParialUsage.test(line);
        const fromLibPart = regexFrom.test(line)
        // console.log(`I(${regexParialUsage.test(line)}) F(${regexFrom.test(line)})\t: ${line} `)
        if (joiningLine) {
          if (!importOrExportPart && !fromLibPart) {
            output += ` ${line}`
          } else if (fromLibPart) {
            joiningLine = false;
            output += ` ${line}\n`
          }
        } else {
          joiningLine = (importOrExportPart && !fromLibPart);
          // if (joiningLine) console.log('line', line)
          output += `\n${line}`
        }
      })
      this.rawContent = output;
    }
    return this;
  }

  /**
   * Get "npm package name" from line of code in .ts or .js files
   */
  private get resolvePackageNameFrom() {
    const self = this;
    return {
      JSrequired(rawImport) {
        rawImport = rawImport.replace(new RegExp(`require\\((\\'|\\")`), '')
        rawImport = rawImport.replace(new RegExp(`(\\'|\\")\\)`), '')
        rawImport = rawImport.trim()
        if (rawImport.startsWith(`./`)) return void 0;
        if (rawImport.startsWith(`../`)) return void 0;
        const fisrtName = rawImport.match(new RegExp(`[a-zA-z]+\\/`))
        let res: string = (_.isArray(fisrtName) && fisrtName.length > 0) ? fisrtName[0] : rawImport;
        if (res.endsWith('/') && res.length > 1) {
          res = res.substring(0, res.length - 1)
        }
        return res;
      },

      TSimportExport(rawImport, usage: ConfigModels.TsUsage) {
        rawImport = rawImport.replace(new RegExp(`${usage}.+from\\s+`), '')
        rawImport = rawImport.replace(new RegExp(`(\'|\")`, 'g'), '').trim()
        if (rawImport.startsWith(`./`)) return void 0;
        if (rawImport.startsWith(`../`)) return void 0;
        const fisrtName = rawImport.match(new RegExp(`([a-zA-z]|\-)+\\/`))
        let res: string = (_.isArray(fisrtName) && fisrtName.length > 0) ? fisrtName[0] : rawImport;
        if (res.endsWith('/') && res.length > 1) {
          res = res.substring(0, res.length - 1)
        }
        return res;
      }
    };
  }

  /**
    * Check if package of isomorphic-lib type
    * @param packageName
    */
  protected getInlinePackage(packageName: string): Models.InlinePkg {

    // console.log('MORPHI this.isomorphicLibs', this.isomorphicLibs)
    let realName = packageName;
    let isIsomorphic = false;
    if (packageName !== void 0) {
      isIsomorphic = !!BrowserCodeCut.IsomorphicLibs
        .find(p => {
          if (p === packageName) {
            return true;
          }
          const slashes = (p.match(new RegExp("\/", "g")) || []).length;
          if (slashes === 0) {
            return p === packageName
          }
          // console.log('am here ', packageName)
          // console.log('p', p)
          if (p.startsWith(packageName)) {
            realName = p;
            // console.log('FOUDNED for ', packageName)
            // console.log('is REAL', p)
            return true;
          }
          return false;
        });
    }
    return {
      isIsomorphic,
      realName
    }
  }

  protected REGEX_REGION(word) {
    return new RegExp("[\\t ]*\\/\\/\\s*#?region\\s+" + word + " ?[\\s\\S]*?\\/\\/\\s*#?endregion ?[\\t ]*\\n?", "g")
  }

  protected replaceRegionsWith(stringContent = '', words = []) {
    if (words.length === 0) return stringContent;
    let word = words.shift();
    let replacement = ''
    if (Array.isArray(word) && word.length === 2) {
      replacement = word[1];
      word = word[0]
    }


    stringContent = stringContent.replace(this.REGEX_REGION(word), replacement);
    return this.replaceRegionsWith(stringContent, words);
  }

  protected replaceFromLine(pkgName: string, imp: string) {
    const p = this.getInlinePackage(pkgName)
    if (p.isIsomorphic) {
      const replacedImp = imp.replace(p.realName, `${p.realName}/${this.browserString}`);
      this.rawContent = this.rawContent.replace(imp, replacedImp);
    }
  }

  replaceRegionsFromTsImportExport(usage: ConfigModels.TsUsage) {
    if (!this.absoluteFilePath.endsWith('.ts')) {
      return this;
    }
    if (!_.isString(this.rawContent)) return;
    const importRegex = new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g')
    let imports = this.rawContent.match(importRegex)
    if (_.isArray(imports)) {
      imports.forEach(imp => {
        const pkgName = this.resolvePackageNameFrom.TSimportExport(imp, usage);
        if (pkgName) {
          this.replaceFromLine(pkgName, imp);
        }
      })
    }
    return this;
  }

  replaceRegionsFromJSrequire() {
    if (!this.absoluteFilePath.endsWith('.ts')) {
      return this;
    }
    if (!_.isString(this.rawContent)) return;
    // fileContent = IsomorphicRegions.flattenRequiresForContent(fileContent, usage)
    const importRegex = new RegExp(`require\\((\\'|\\").+(\\'|\\")\\)`, 'g')
    let imports = this.rawContent.match(importRegex)
    // console.log(imports)
    if (_.isArray(imports)) {
      imports.forEach(imp => {
        const pkgName = this.resolvePackageNameFrom.JSrequired(imp);
        if (pkgName) {
          this.replaceFromLine(pkgName, imp);
        }
      })
    }
    return this;
  }

  replaceRegionsForIsomorphicLib(options: ReplaceOptions) {

    // console.log('options.replacements', options.replacements)
    if (this.absoluteFilePath.endsWith('.ts')) {
      this.rawContent = this.replaceRegionsWith(this.rawContent, options.replacements)
    }
    this.rawContent = this.afterRegionsReplacement(this.rawContent)
    return this;
  }

  protected afterRegionsReplacement(content: string) {
    return content;
  }

  saveOrDelete() {
    // console.log('saving ismoprhic file', this.absoluteFilePath)
    if (this.isEmpty && ['.ts', '.js'].includes(path.extname(this.absoluteFilePath))) {
      if (fse.existsSync(this.absoluteFilePath)) {
        fse.unlinkSync(this.absoluteFilePath)
      }
      // console.log(`Delete empty: ${deletePath}`)
    } else {
      // console.log(`Not empty: ${this.absoluteFilePath}`)
      if (!fse.existsSync(path.dirname(this.absoluteFilePath))) {
        fse.mkdirpSync(path.dirname(this.absoluteFilePath));
      }
      fse.writeFileSync(this.absoluteFilePath, this.rawContent, 'utf8');
    }
    // }
  }


}


//#endregion
