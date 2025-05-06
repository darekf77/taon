import { SharedContext } from 'inject-tests/src';
import { Taon, BaseContext, createContext } from 'taon/src';
import { Helpers } from 'tnp-core/src';

import { CLIENT_DEV_NORMAL_APP_PORT, CLIENT_DEV_WEBSQL_APP_PORT, HOST_BACKEND_PORT } from './app.hosts';

const host = 'http://localhost:' + HOST_BACKEND_PORT;
const frontendHost =
  'http://localhost:' +
  (Helpers.isWebSQL ? CLIENT_DEV_WEBSQL_APP_PORT : CLIENT_DEV_NORMAL_APP_PORT);

const AppContext = Taon.createContext(() => ({
  contextName: 'AppContext',
  frontendHost,
  host,
  contexts: { SharedContext, BaseContext },
  database: true,
  logFramework: true,
  serverLogs: true,
}));


export { AppContext };
