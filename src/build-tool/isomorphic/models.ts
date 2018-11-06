

export interface FoldersPathes {
  dist?: string;
  browser?: string;
  tmpSrc?: string;
  src?: string;
  tsconfig?: {
    browser: string;
    default: string;
  }
}

export interface ToolsPathes {
  tsc: string;
}

export interface BuildConfig {
  generateDeclarations?: boolean; // QUICK_FIX
  buildBackend?: boolean;
  otherIsomorphicLibs: string[];
  environmentFileName?: string;
}

export interface BuildOptions {
  watch?: boolean;
  foldersPathes?: FoldersPathes;
  toolsPathes?: ToolsPathes;
  build?: BuildConfig;
}


