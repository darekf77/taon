import * as controller from './base-controller';
import * as crudController from './base-crud-controller';
import * as entity from './base-entity';
import * as abstractEntity from './base-abstract-entity';
import * as repository from './base-repository';
import * as provider from './base-provider';
import * as baseClass from './base-class';
import * as baseContext from './base-context';
import * as baseSubscriberEntity from './base-subscriber-for-entity';
export namespace Base {
  export import Controller = controller.BaseController;
  export import CrudController = crudController.BaseCrudController;
  export import Entity = entity.BaseEntity;
  export import AbstractEntity = abstractEntity.BaseAbstractEntity;
  export import AbstractEntityOmitKeys = abstractEntity.AbstractEntityOmitKeys;
  export import Provider = provider.BaseProvider;
  export import Class = baseClass.BaseClass;
  export import Repository = repository.BaseRepository;
  export import SubscriberForEntity = baseSubscriberEntity.BaseSubscriberForEntity;
  export const Context = baseContext.BaseContext;
}
