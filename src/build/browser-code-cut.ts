
import * as _ from 'lodash'
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { ReplaceOptions, ReplaceOptionsExtended } from './replace-options';
import { TsUsage } from './models';
export class CodeCut {
    files(filesPathes: string[], options: ReplaceOptions) {
    filesPathes.forEach((f, i) => {
      this.file(f, options);
    })
  }

  file(f, options) {
    return new BrowserCodeCut(f)
      .flatTypescriptImportExport('import')
      .flatTypescriptImportExport('export')
      .replaceRegionsForIsomorphicLib(options)
      .replaceRegionsFromTsImportExport('import')
      .replaceRegionsFromTsImportExport('export')
      .replaceRegionsFromJSrequire()
      .saveOrDelete()
  }
}

export class ExtendedCodeCut {




}

export class BrowserCodeCut {

  public static get for() {
    const self = this;
    return {

      isomorphicLib(otherIsomorphicLibs: string[] = [], options: ReplaceOptions) {
        return {

        }
      }
    };
  }

  protected rawContent: string;

  get isEmpty() {
    return this.rawContent.replace(/\s/g, '').trim() === '';
  }
  private static IsomorphicLibs = ['ng2-rest', 'typeorm', 'ng2-logger', 'morphi', 'tnp-bundle'];
  public static resolveAndAddIsomorphicLibs(libsNames: string[]) {
    this.IsomorphicLibs = this.IsomorphicLibs.concat(libsNames);
  }

  constructor(protected absoluteFilePath: string) {
    this.rawContent = fs.readFileSync(absoluteFilePath, 'utf8').toString();
  }


  public flatTypescriptImportExport(usage: TsUsage) {
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
        if (rawImport.startsWith(`./`)) return null;
        const fisrtName = rawImport.match(new RegExp(`[a-zA-z]+\\/`))
        let res: string = (_.isArray(fisrtName) && fisrtName.length > 0) ? fisrtName[0] : rawImport;
        if (res.endsWith('/') && res.length > 1) {
          res = res.substring(0, res.length - 1)
        }
        return res;
      },

      TSimportExport(rawImport, usage: TsUsage) {
        rawImport = rawImport.replace(new RegExp(`${usage}.+from\\s+`), '')
        rawImport = rawImport.replace(new RegExp(`(\'|\")`, 'g'), '').trim()
        if (rawImport.startsWith(`./`)) return null;
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
  private isIsomorphic(packageName: string) {

    // console.log('MORPHI this.isomorphicLibs', this.isomorphicLibs)
    let realName = packageName;
    let isIsomorphic = false;
    if (packageName !== null) {
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

  // REGEX_VALUE = /^\s*(\'|\")[a-z|A-Z|0-9|\_|\-|\.]+(\'|\")/
  protected REGEX_REGION(pattern) {
    return new RegExp("[\\t ]*\\/\\/\\s*#?region\\s+" + pattern + " ?[\\s\\S]*?\\/\\/\\s*#?endregion ?[\\t ]*\\n?", "g")
  }
  protected replaceRegionsWith(stringContent = '', replacementPatterns = [], replacement = '') {

    if (replacementPatterns.length === 0) return stringContent;
    let pattern = replacementPatterns.shift();
    // console.log('replacementPatterns', replacementPatterns)
    if (Array.isArray(pattern) && pattern.length === 2) {
      const funOrString = pattern[1] as Function;
      pattern = pattern[0] as string;
      replacement = funOrString as any;
    }

    stringContent = stringContent.replace(this.REGEX_REGION(pattern), replacement);
    return this.replaceRegionsWith(stringContent, replacementPatterns);
  }



  replaceRegionsFromTsImportExport(usage: TsUsage) {
    if (!_.isString(this.rawContent)) return;
    const importRegex = new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g')
    let imports = this.rawContent.match(importRegex)
    if (_.isArray(imports)) {
      imports.forEach(imp => {
        const pkgName = this.resolvePackageNameFrom.TSimportExport(imp, usage);

        const p = this.isIsomorphic(pkgName)
        if (p.isIsomorphic) {
          const replacedImp = imp.replace(p.realName, `${p.realName}/browser`);
          this.rawContent = this.rawContent.replace(imp, replacedImp);
        }
      })
    }
    return this;
  }

  replaceRegionsFromJSrequire() {
    if (!_.isString(this.rawContent)) return;
    // fileContent = IsomorphicRegions.flattenRequiresForContent(fileContent, usage)
    const importRegex = new RegExp(`require\\((\\'|\\").+(\\'|\\")\\)`, 'g')
    let imports = this.rawContent.match(importRegex)
    // console.log(imports)
    if (_.isArray(imports)) {
      imports.forEach(imp => {
        const pkgName = this.resolvePackageNameFrom.JSrequired(imp);

        const p = this.isIsomorphic(pkgName)
        if (p.isIsomorphic) {
          // console.log('isomorphic: ', pkgName)
          const replacedImp = imp.replace(p.realName, `${p.realName}/browser`);
          this.rawContent = this.rawContent.replace(imp, replacedImp);
        }
      })
    }
    return this;
  }

  replaceRegionsForIsomorphicLib(options: ReplaceOptions) {

    this.rawContent = this.replaceRegionsWith(this.rawContent,
      options.replacements, '')
    return this;
  }

  saveOrDelete() {
    // console.log('saving ismoprhic file', this.filePath)
    if (this.isEmpty) {
      const deletePath = this.absoluteFilePath;
      // console.log(`Delete empty: ${deletePath}`)
      fse.unlinkSync(deletePath)
    } else {
      // console.log(`Not empty: ${this.filePath}`)
      fs.writeFileSync(this.absoluteFilePath, this.rawContent, 'utf8');
    }

  }


}


