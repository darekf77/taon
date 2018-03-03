//#region @backend
import * as _ from 'lodash';
import * as path from 'path';
import * as child from 'child_process';
import * as fs from 'fs';
import * as glob from "glob";
import { IsomorphicRegions } from './isomorphic';
import { Helpers } from './helpers';

export function run(argsv: string[]) {

    if (argsv.length >= 3) {
        const commandName: 'build' | 'ln' = argsv[2] as any;

        console.log('HEELLOEOEO')
        if (commandName === 'build') {
            // child.execSync('npm-run rimraf dist/')
            // child.execSync('npm-run tsc')
            // child.execSync('npm-run rimraf browser/ temp-src/')
            // child.execSync('mkdir temp-src')
            // child.execSync('npm-run cpr src/ temp-src')
            // const tempSrc = path.join(process.cwd(), 'temp-src');
            // const folders = fs.readdirSync(tempSrc)
            // folders.forEach(f => {
            //     const file = path.join(tempSrc, f);
            //     if (f !== 'tsconfig.json' && f !== 'index.ts' && !fs.lstatSync(file).isDirectory()) {
            //         child.execSync(`npm-run rimraf ${file}`)
            //     }
            // })
            // const files = glob.sync('./temp-src/**/*.ts');
            // files.forEach(f => {
            //     IsomorphicRegions.deleteFrom(path.join(tempSrc, f));
            // })

            // child.execSync('tsc')


        } else if (commandName === 'ln') {
            console.log('IAM HERE')
            // console.log(args)
            if (!Array.isArray(argsv) || argsv.length < 2) {
                throw new Error(`To few arguments for linking function...`);
            }
            const link = argsv[3]
            let target = argsv[4]
            Helpers.createLink(target, link)
            process.exit(0)
        }

    }

}
//#endregion


