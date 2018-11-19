//#region @backend
export type OutFolder = 'dist' | 'bundle' | 'browser'

export type TsUsage = 'import' | 'export';


export type FileEvent = 'created' | 'changed' | 'removed' | 'rename';

export interface ReplaceOptions {
    replacements: (string | [string, string])[];
}


//#endregion
