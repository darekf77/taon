import * as abstractEntity from './base-abstract-entity';
import * as baseService from './base-angular-service';
import * as baseClass from './base-class';
import * as baseContext from './base-context';
import * as controller from './base-controller';
import * as crudController from './base-crud-controller';
import * as customRepository from './base-custom-repository';
import * as entity from './base-entity';
import * as baseMiddleware from './base-middleware';
import * as baseMigration from './base-migration';
import * as provider from './base-provider';
import * as repository from './base-repository';
import * as baseSubscriberEntity from './base-subscriber-for-entity';

// TODO new 5.8 typescript is not allowing this
// export namespace Base {
//   export import Controller = controller.TaonBaseController;
//   export import CrudController = crudController.TaonBaseCrudController;
//   export import Entity = entity.TaonBaseEntity;
//   export import AbstractEntity = abstractEntity.TaonBaseAbstractEntity;
//   export import AbstractEntityOmitKeys = abstractEntity.AbstractEntityOmitKeys;
//   export import Provider = provider.TaonBaseProvider;
//   export import Class = baseClass.TaonBaseClass;
//   export import Repository = repository.TaonBaseRepository;
//   export import CustomRepository = customRepository.TaonBaseCustomRepository;
//   export import SubscriberForEntity = baseSubscriberEntity.TaonBaseSubscriberForEntity;
//   export import Migration = baseMigration.TaonBaseMigration;
//   export import Middleware = baseMiddleware.TaonBaseMiddleware;
//   export import AngularService = baseService.TaonBaseAngularService;
//   export const Context = baseContext.TaonBaseContext;
// }
