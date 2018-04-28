import * as path from 'path';

export const LOCAL_ENVIRONMENT_NAME = 'local';

//#region @backend
export function environmentName(filename: string, LOCAL_ENVIRONMENT_NAME: string) {
    let name = path.basename(filename)
    name = name.replace(/\.js$/, '')
    name = name.replace('environment', '')
    name = name.replace(/\./g, '');
    return name === '' ? LOCAL_ENVIRONMENT_NAME : name
}
//#endregion
