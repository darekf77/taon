import { Morphi } from 'morphi'

import { Controllers } from './controllers';
import { Entities } from './entities';
import { Log } from 'ng2-logger';

declare var ENV;
const log = Log.create('app start')

export async function start() {
  // log.i('ENV', ENV);
  const project = ENV.workspace.projects.find(p => p.name === 'isomorphic-lib-v2');
  // log.i('project', project);

  // if (Morphi.IsBrowser) {
  //   console.log('RETURN IN BROWSER')
  //   return;
  // }
  await Morphi.init({
    //#region @backend
    // publicAssets: [{ path: '/assets', location: ENV.pathes.backup.assets }],
    config: project.$db as any,
    //#endregion
    host: ENV.name !== 'local' ?
      `http://${ENV.ip}:${project.port}${project.baseUrl}` :
      `http://${ENV.ip}:${project.port}`
    ,
    controllers: Controllers,
    entities: Entities
  })

  //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'

  //#endregion

}

export default start;


// //#region @cutRegionIfFalse ENV.currentProjectName === 'ss-common-ui'
// if (Morphi.IsBrowser) {
//   start()
// }
// //#endregion
