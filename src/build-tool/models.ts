

export type ProcessInfo = { arguments: string; pid: string; command: string; ppid: string; }

export interface FoldersPathes {
  dist?: string;
  browser?: string;
  tmpSrc?: string;
  src?: string;
  tsconfig: {
    browser: string;
    default: string;
  }
}

export interface ToolsPathes {
  tsc: string;
  morphi: string;
}

export interface BuildConfig {
  otherIsomorphicLibs?: string[];
}

export interface BuildPathes {
  watch?: boolean;
  foldersPathes?: FoldersPathes;
  toolsPathes?: ToolsPathes;
  build?: BuildConfig;
}


