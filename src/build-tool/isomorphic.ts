
import * as fs from "fs";
import * as _ from "lodash";

export type TsUsage = 'import' | 'export';
export class CodeTransform {

  private rawContent: string;
  private constructor(public filePath: string, otherIsomorphicLibs: string[] = []) {
    this.isomorphicLibs = this.isomorphicLibs.concat(otherIsomorphicLibs);
    this.rawContent = fs.readFileSync(filePath, 'utf8').toString();
  }

  public static get for() {
    return {

      isomorphicLib(filesPathes: string[], otherIsomorphicLibs: string[] = []) {
        filesPathes.forEach(f => {
          new CodeTransform(f, otherIsomorphicLibs)
            .flatTypescriptImportExport('import')
            .flatTypescriptImportExport('export')
            .replace.regionsFor.isomorphicLib()
            .replace.ismorphicLibsFrom.fromTsImportExport('import')
            .replace.ismorphicLibsFrom.fromTsImportExport('export')
            .replace.ismorphicLibsFrom.fromJSrequire()
            .save()
        })
      }
    };
  }


  private flatTypescriptImportExport(usage: TsUsage) {
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

  private isomorphicLibs = ['ng2-rest', 'typeorm', 'ng2-logger', 'morphi'];

  /**
   * Check if package of isomorphic-lib type
   * @param packageName 
   */
  private isIsomorphic(packageName: string) {

    // console.log('MORPHI this.isomorphicLibs', this.isomorphicLibs)
    let realName = packageName;
    let isIsomorphic = false;
    if (packageName !== null) {
      isIsomorphic = !!this.isomorphicLibs
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

  private replaceRegionsWith(stringContent = '', words = [], replacement = '') {
    if (words.length === 0) return stringContent;
    let word = words.shift();
    if (Array.isArray(word) && word.length === 2) {
      replacement = word[1];
      word = word[0]
    }
    var regexPattern = new RegExp("[\\t ]*\\/\\/\\s*#?region\\s+" + word + " ?[\\s\\S]*?\\/\\/\\s*#?endregion ?[\\t ]*\\n?", "g")
    stringContent = stringContent.replace(regexPattern, replacement);
    return this.replaceRegionsWith(stringContent, words);
  }

  public get replace() {

    const self = this as any; // TODO Quick fix
    return {
      get ismorphicLibsFrom() {
        return {
          fromTsImportExport(usage: TsUsage) {
            if (!_.isString(self.rawContent)) return;
            const importRegex = new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g')
            let imports = self.rawContent.match(importRegex)
            if (_.isArray(imports)) {
              imports.forEach(imp => {
                const pkgName = self.resolvePackageNameFrom.TSimportExport(imp, usage);

                const p = self.isIsomorphic(pkgName)
                if (p.isIsomorphic) {
                  const replacedImp = imp.replace(p.realName, `${p.realName}/browser`);
                  self.rawContent = self.rawContent.replace(imp, replacedImp);
                }
              })
            }
            return self;
          },
          fromJSrequire() {
            if (!_.isString(self.rawContent)) return;
            // fileContent = IsomorphicRegions.flattenRequiresForContent(fileContent, usage)
            const importRegex = new RegExp(`require\\((\\'|\\").+(\\'|\\")\\)`, 'g')
            let imports = self.rawContent.match(importRegex)
            // console.log(imports)
            if (_.isArray(imports)) {
              imports.forEach(imp => {
                const pkgName = self.resolvePackageNameFrom.JSrequired(imp);

                const p = self.isIsomorphic(pkgName)
                if (p.isIsomorphic) {
                  // console.log('isomorphic: ', pkgName)
                  const replacedImp = imp.replace(p.realName, `${p.realName}/browser`);
                  self.rawContent = self.rawContent.replace(imp, replacedImp);
                }
              })
            }
            return self;
          }
        };
      },
      get regionsFor() {
        return {
          isomorphicLib() {
            self.rawContent = self.replaceRegionsWith(self.rawContent, [
              ["@backendFunc", `return undefined;`],
              "@backend"
            ], '')
            return self;
          }
        }
      }
    };

  }

  save() {
    fs.writeFileSync(this.filePath, this.rawContent, 'utf8');
  }

}


