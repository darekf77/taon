//#region @backend
import { Controllers, Entities } from "./index";
import { Morphi } from 'morphi';

Morphi.init({
  config: {
    database: 'tmp/db.sqlite3',
    type: 'better-sqlite3',
    synchronize: true,
    dropSchema: true,
    logging: false
  },
  host: 'http://localhost:4000',
  controllers: Controllers,
  entities: Entities
});
//#endregion
