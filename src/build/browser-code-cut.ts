//#region @backend
import * as _ from 'lodash'
import * as fs from 'fs';
import * as path from 'path';
import * as fse from 'fs-extra';
import { TsUsage, ReplaceOptions } from './models';


export class CodeCut {


    constructor(
            protected cwd: string,
            protected filesPathes: string[],
        protected options: ReplaceOptions) {
            // console.log('init code cut ', this.options)
    }

    files() {
        // console.log('options in fiels', this.options)
        this.filesPathes.forEach((relativePathToFile) => {
            const absolutePathToFile = path.join(this.cwd, relativePathToFile)
            // console.log('process', absolutePathToFile)
            this.file(absolutePathToFile);
        })
    }

    file(absolutePathToFile) {
        // console.log('options here ', options)
        return new BrowserCodeCut(absolutePathToFile)
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


    private replaceRegionsWith(stringContent = '', words = []) {
        if (words.length === 0) return stringContent;
        let word = words.shift();
        let replacement = ''
        if (Array.isArray(word) && word.length === 2) {
            replacement = word[1];
            word = word[0]
        }
        let regexPattern = new RegExp("[\\t ]*\\/\\/\\s*#?region\\s+" + word + " ?[\\s\\S]*?\\/\\/\\s*#?endregion ?[\\t ]*\\n?", "g")

        stringContent = stringContent.replace(regexPattern, replacement);
        return this.replaceRegionsWith(stringContent, words);
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

        // console.log('options.replacements', options.replacements)
        this.rawContent = this.replaceRegionsWith(this.rawContent, options.replacements)
        return this;
    }

    saveOrDelete() {
        // console.log('saving ismoprhic file', this.absoluteFilePath)
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


//#endregion
