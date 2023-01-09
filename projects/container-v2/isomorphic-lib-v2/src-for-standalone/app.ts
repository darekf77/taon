import { Morphi } from 'morphi'

import { Controllers } from './controllers';
import { Entities } from './entities';
import { Log } from 'ng2-logger';

declare var ENV;
const log = Log.create('app start')

const host = 'http://localhost:3000';

 //#region @backend
 const config = {
  type: 'better-sqlite3',
  database: 'tmp-db.sqlite',
  synchronize: true,
  dropSchema: true,
  logging: false
} as any;
//#endregion

export async function start() {

  await Morphi.init({
    //#region @backend
    // publicAssets: [{ path: '/assets', location: ENV.pathes.backup.assets }],
    config,
    //#endregion
    host,
    controllers: Controllers,
    entities: Entities
  })

  // console.log('hello')

}

export default start;
