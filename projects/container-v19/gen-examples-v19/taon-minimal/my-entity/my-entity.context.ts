//#region imports
import { Taon, BaseContext } from 'taon';
import { MyEntity } from './my-entity';
import { MyEntityController } from './my-entity.controller';
//#endregion

export const MyEntityContext = Taon.createContext(() => ({
  contextName: 'MyEntityContext',
  abstract: true,
  contexts: { BaseContext },
  entities: { MyEntity },
  controllers: { MyEntityController }
}))
