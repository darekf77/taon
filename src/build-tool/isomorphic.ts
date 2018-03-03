
import * as fs from 'fs';
import * as _ from 'lodash';

function replace(c = '', words = []) {
    if (words.length === 0) return c;
    let replacement = ''
    let word = words.shift();
    if (Array.isArray(word) && word.length === 2) {
        replacement = word[1];
        word = word[0]
    }
    var regexPattern = new RegExp("[\\t ]*\\/\\/\\s*#?region\\s+" + word + " ?[\\s\\S]*?\\/\\/\\s*#?endregion ?[\\t ]*\\n?", "g")
    c = c.replace(regexPattern, replacement);
    return replace(c, words);
}

export type PkgUsage = 'import' | 'export';

export class IsomorphicRegions {

    public static deleteFrom(file: string): void {
        let fileContent = fs.readFileSync(file, 'utf8').toString();
        fileContent = replace(fileContent, [
            ["@backendFunc", `return undefined;`],
            "@backend",
            "backend",
            "backendFunc"
        ])
        fileContent = IsomorphicRegions.replaceBrowserLib(fileContent, 'import');
        fileContent = IsomorphicRegions.replaceBrowserLib(fileContent, 'export');
        fileContent = IsomorphicRegions.replaceBrowserLibRequire(fileContent);
        fs.writeFileSync(file, fileContent, 'utf8');
    }

    private static packageName(rawImport, usage: PkgUsage) {
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

    private static packageNameRequire(rawImport) {
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
    }

    private static isPackageIsomorphic(packageName) {
        return ['ng2-rest', 'typeorm', 'ng2-logger', 'morphi']
            .filter(p => p == packageName)
            .length >= 1;
    }


    private static flattenImportsForContent(fileContent: string, usage: PkgUsage) {
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
            fileContent = output;
        }
        return fileContent;
    }

    private static flattenRequiresForContent(fileContent: string, usage: PkgUsage) {
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
            fileContent = output;
        }
        return fileContent;
    }

    private static replaceBrowserLibRequire(fileContent: string) {
        if (!_.isString(fileContent)) return;
        // fileContent = IsomorphicRegions.flattenRequiresForContent(fileContent, usage)
        const importRegex = new RegExp(`require\\((\\'|\\").+(\\'|\\")\\)`, 'g')
        let imports = fileContent.match(importRegex)
        // console.log(imports)
        if (_.isArray(imports)) {
            imports.forEach(imp => {
                const pkgName = IsomorphicRegions.packageNameRequire(imp);
                if (IsomorphicRegions.isPackageIsomorphic(pkgName)) {
                    // console.log('isomorphic: ', pkgName)
                    const replacedImp = imp.replace(pkgName, `${pkgName}/browser`);
                    fileContent = fileContent.replace(imp, replacedImp);
                }
            })
        }
        return fileContent;
    }

    private static replaceBrowserLib(fileContent: string, usage: PkgUsage) {
        if (!_.isString(fileContent)) return;
        fileContent = IsomorphicRegions.flattenImportsForContent(fileContent, usage)
        const importRegex = new RegExp(`${usage}.+from\\s+(\\'|\\").+(\\'|\\")`, 'g')
        let imports = fileContent.match(importRegex)

        if (_.isArray(imports)) {
            imports.forEach(imp => {
                const pkgName = IsomorphicRegions.packageName(imp, usage);
                if (IsomorphicRegions.isPackageIsomorphic(pkgName)) {
                    const replacedImp = imp.replace(pkgName, `${pkgName}/browser`);
                    fileContent = fileContent.replace(imp, replacedImp);
                }
            })
        }
        return fileContent;
    }


}

