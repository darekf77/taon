import { Morphi } from 'morphi'



// async function start() {
//   const project = ENV.workspace.projects.find(p => p.name === 'ss-common-logic')
//   await Morphi.init({
//     //#region @backend
//     publicAssets: [{ path: '/assets', location: ENV.pathes.backup.assets }],
//     config: project.$db as any,
//     //#endregion
//     host: ENV.name !== 'local' ?
//       `http://${ENV.ip}:${project.port}${project.baseUrl}` :
//       `http://${ENV.ip}:${project.port}`
//     ,
//     controllers: [],
//     entities: []
//   })

//   //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
//   if (Morphi.IsBrowser) {

//   }
//   //#endregion

// }

// export default start;


// //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
// if (Morphi.IsBrowser) {
//   start()
// }
// //#endregion
