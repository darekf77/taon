
import * as fs from "fs";
import * as _ from "lodash";

export type TsUsage = 'import' | 'export';
export class CodeTransform {

  private rawContent: string;
  private constructor(public filePath: string) {
    this.rawContent = fs.readFileSync(filePath, 'utf8').toString();
  }

  public static get for() {
    return {
      baselineSite(filesPathes: string[]) {
        filesPathes.forEach(f => {
          new CodeTransform(f)
            .replace.regionsFor.baselineSite()
            .save()
        })

      },
      isomorphicLib(filesPathes: string[]) {
        filesPathes.forEach(f => {
          new CodeTransform(f)
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
    this.rawContent = fileContent;
  }

  private get resolvePackageNameFrom() {
    const slef = this;
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
        const fisrtName = rawImport.match(new RegExp(`[a-zA-z]+\\/`))
        let res: string = (_.isArray(fisrtName) && fisrtName.length > 0) ? fisrtName[0] : rawImport;
        if (res.endsWith('/') && res.length > 1) {
          res = res.substring(0, res.length - 1)
        }
        return res;
      }
    };
  }



  private isPackageIsomorphic(packageName) {
    return ['ng2-rest', 'typeorm', 'ng2-logger', 'morphi']
      .filter(p => p == packageName)
      .length >= 1;
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

    const self = this;
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
                if (self.isPackageIsomorphic(pkgName)) {
                  const replacedImp = imp.replace(pkgName, `${pkgName}/browser`);
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
                if (self.isPackageIsomorphic(pkgName)) {
                  // console.log('isomorphic: ', pkgName)
                  const replacedImp = imp.replace(pkgName, `${pkgName}/browser`);
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
              "@backend",
              "backend",
              "backendFunc"
            ], '')
            return self;
          },
          baselineSite() {
            self.rawContent = self.replaceRegionsWith(self.rawContent, [
              '@cutForSite'
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


