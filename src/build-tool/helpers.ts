import * as path from 'path';
import * as child from 'child_process';
import * as os from 'os';

export namespace Helpers {
    export function createLink(target, link) {
        console.log('taget', target)
        console.log('link', link)
        let command: string;
        if (os.platform() === 'win32') {
            if (target === '.' || target === './') {
                target = path.win32.normalize(path.join(process.cwd(), path.basename(link)))
            } else {
                target = path.win32.normalize(path.join(target, path.basename(link)))
            }
            command = "mklink \/D "
                + path.win32.normalize(target)
                + " "
                + path.win32.normalize(link)
                + " >nul 2>&1 "
            // console.log('LINK COMMAND', command)
        } else {
            command = `ln -sf "${link}" "${target}"`;
        }
        return child.execSync(command)
    }

}



