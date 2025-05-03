//#region imports
import { Taon, BaseContext } from 'taon';

import { MyEntity } from './my-entity';
import { MyEntityController } from './my-entity.controller';
import { MyEntityRepository } from './my-entity.repository';
//#endregion

export const MyEntityContext = Taon.createContext(() => ({
  contextName: 'MyEntityContext',
  abstract: true,
  contexts: { BaseContext },
  entities: { MyEntity },
  controllers: { MyEntityController },
  repositories: { MyEntityRepository }
}))
