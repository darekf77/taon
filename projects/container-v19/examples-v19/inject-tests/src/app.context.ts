import { SharedContext } from 'inject-tests/src';
import { Taon, BaseContext, createContext } from 'taon/src';
import { HOST_BACKEND_PORT } from './app.hosts';

const host = 'http://localhost:' + HOST_BACKEND_PORT;
const AppContext = Taon.createContext(() => ({
  contextName: 'AppContext',
  host,
  contexts: { SharedContext, BaseContext },
  database: true,
  logFramework: true,
  serverLogs: true,
}));


export { AppContext };
