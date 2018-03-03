//#region @backend
import { Controllers, Entities } from "./index";
import MockData from "./db-mocks";

let config = require(`../../environment${process.env.environmentName}`);

import { start } from './helpers';
import * as path from 'path';

start({
  config: config.db as any,
  host: config.host(path.join('..', __dirname)),
  Controllers: Controllers as any,
  Entities: Entities as any,
  MockData
});

//#endregion
