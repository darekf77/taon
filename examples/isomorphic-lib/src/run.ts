//#region @backend
import { Controllers, Entities } from "./index";
import { Morphi } from 'morphi';

Morphi.init({
  config: {
    database: 'tmp/db.sqlite3',
    type: 'sqlite',
    synchronize: true,
    dropSchema: true,
    logging: false
  },
  host: 'http://localhost:4000',
  controllers: Controllers,
  entities: Entities
});
//#endregion
