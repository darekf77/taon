
import { Controllers, Entities } from "./index";
import MockData from "./db-mocks";

//#region backend
import { start } from './helpers';

start({
    config: {
        database: 'tmp/db.sqlite3',
        type: 'sqlite',
        synchronize: true,
        dropSchema: true,
        logging: false
    },
    host: 'http://localhost:4000',
    Controllers: Controllers as any,
    Entities: Entities as any,
    MockData
});
//#endregion
