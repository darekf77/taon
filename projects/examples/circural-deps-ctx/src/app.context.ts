import { SharedContext } from 'circural-deps-ctx/src';
import { Firedev, BaseContext, createContext } from 'firedev/src';
import { HOST_BACKEND_PORT } from './app.hosts';
import { GroupContext } from 'circural-deps-ctx/src';

const host = 'http://localhost:' + HOST_BACKEND_PORT;
const AppContext = Firedev.createContext(() => ({
  contextName: 'AppContext',
  host,
  contexts: { SharedContext, BaseContext, GroupContext },
  database: true,
  logFramework: true,
  serverLogs: true,
}));

// AppContext.contexts.SharedContext;
(AppContext.contexts.GroupContext as typeof GroupContext)

export { AppContext };
