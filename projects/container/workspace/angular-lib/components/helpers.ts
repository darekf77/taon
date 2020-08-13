declare global {
  const ENV: any;
}

export namespace UIHelpers {

  export function helloWorld() {
    //#region @cutRegionIfFalse ENV.currentProjectName === 'isomorphic-lib'
    if (ENV.currentProjectName === 'isomorphic-lib') {
      console.log('Helloe world isomorphic-lib !')
    }
    //#endregion
    //#region @cutRegionIfFalse ENV.currentProjectName === 'isomorphic-lib'
    if (ENV.currentProjectName === 'angular-lib') {
      console.log('Helloe world angular-lib !')
    }
    //#endregion


  }

}
