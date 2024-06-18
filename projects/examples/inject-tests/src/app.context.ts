import { SharedContext } from 'inject-tests/src';
import { Firedev, BaseContext, createContext } from 'firedev/src';
import { HOST_BACKEND_PORT } from './app.hosts';

const host = 'http://localhost:' + HOST_BACKEND_PORT;
const AppContext = Firedev.createContext(() => ({
  contextName: 'AppContext',
  host,
  contexts: { SharedContext, BaseContext },
  database: true,
  logFramework: true,
  serverLogs: true,
}));


export { AppContext };
