

export class BrowserCodeCut {

    private static IsomorphicLibs = ['ng2-rest', 'typeorm', 'ng2-logger', 'morphi', 'tnp-bundle'];
    public static resolveAndAddIsomorphicLibs(libsNames: string[]) {
        this.IsomorphicLibs = this.IsomorphicLibs.concat(libsNames);
    }




}