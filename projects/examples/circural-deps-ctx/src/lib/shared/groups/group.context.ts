import { Firedev, createContext } from "firedev/src";
import { GroupController } from "./group.controller";
import { Group } from "./group";

export const GroupContext = Firedev.createContext(() => ({
  contextName: 'GroupContext',
  host: 'http://abstract.host.com',
  abstract: true,
  entities: { Group },
  controllers: { GroupController },
}));

// export { GroupContext: GroupContext as typeof GroupContext };
