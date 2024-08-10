//#region imports
import { Firedev, BaseContext } from 'firedev';
import { MyEntity } from './my-entity';
import { MyEntityController } from './my-entity.controller';
//#endregion

export const MyEntityContext = Firedev.createContext(() => ({
  contextName: 'MyEntityContext',
  abstract: true,
  contexts: { BaseContext },
  entities: { MyEntity },
  controllers: { MyEntityController }
}))
