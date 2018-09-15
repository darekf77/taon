import {
  Repository, EventSubscriber, EntitySubscriberInterface,
  InsertEvent, UpdateEvent, RemoveEvent
} from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
// import { BaseCRUD, CLASSNAME, ENDPOINT, describeClassProperites } from 'morphi';

import * as _ from 'lodash';
import { isBrowser, Log, Level } from 'ng2-logger';
import { describeClassProperites, CLASSNAME } from 'ng2-rest';
const log = Log.create('META', Level.__NOTHING)
import {
  ENDPOINT, BaseCRUD
} from './index';

export namespace META {


  export function tableNameFrom(entityClass: Function | BASE_ENTITY<any>) {
    entityClass = entityClass as Function;
    return `tb_${entityClass.name.toLowerCase()}`
  }

  //#region @backend
  export function repositoryFrom<E, R=Repository<E>>(connection: Connection, entity: Function, repository?: Function): R {

    let repo: Repository<any>;
    if (repository) {
      repo = connection.getCustomRepository(repository);
    } else {
      repo = connection.getRepository(entity) as any;
    }
    repo['_'] = {};
    repo['__'] = {};

    const compolexProperties = (repo as META.BASE_REPOSITORY<any, any>).globalAliases;

    if (Array.isArray(compolexProperties)) {

      compolexProperties.forEach(alias => {
        repo['__'][alias] = {};

        const describedProps = describeClassProperites(entity)
        // console.log(`describedProps  "${describedProps}" for ${entity.name}`)

        describedProps.concat(compolexProperties as any).forEach(prop => {
          repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO temp solution
        })

        const props = describeClassProperites(entity)
        // console.log(`props  "${props}" for ${entity.name}`)
        props.forEach(prop => {
          repo['__'][alias][prop] = `${alias as any}.${prop}`; // TODO ideal solution
        })

      })

      compolexProperties.forEach(alias => {
        repo['_'][alias] = alias; // TODO make it getter with reference
      })
    }

    return repo as any;
  }
  //#endregion


  // TODO fix it whe typescipt stable
  export abstract class BASE_REPOSITORY<Entity, GlobalAliases> extends Repository<Entity> {
    //#region @backend
    __: { [prop in keyof GlobalAliases]: { [propertyName in keyof Entity]: string } };
    _: GlobalAliases;

    abstract globalAliases: (keyof GlobalAliases)[];

    pagination() {
      // TODO
    }
    //#endregion

  }

  export abstract class BASE_ENTITY<T, TRAW=T> {

    abstract id: number;

    abstract fromRaw(obj: TRAW): T

  }

  export interface EntityEvents<T =any> {
    beforeInsert?: (event: InsertEvent<T>) => void;
    beforeUpdate?: (event: UpdateEvent<T>) => void;
    beforeRemove?: (event: RemoveEvent<T>) => void;
    afterInsert?: (event: InsertEvent<T>) => void;
    afterUpdate?: (event: UpdateEvent<T>) => void;
    afterRemove?: (event: RemoveEvent<T>) => void;
    afterLoad?: (entity: T) => void;
  };

  @ENDPOINT()
  @CLASSNAME('BASE_CONTROLLER')
  //#region @backend
  @EventSubscriber()
  //#endregion
  export abstract class BASE_CONTROLLER<T> extends BaseCRUD<T>
    //#region @backend
    implements EntitySubscriberInterface<T>
  //#endregion
  {

    constructor
      (
      //#region @backend
      private entityEvents: EntityEvents<T> = {}
      //#endregion
      ) {
      super();
      if (isBrowser) {
        log.i('BASE_CONTROLLER, constructor', this)
      }
    }




    //#region @backend


    listenTo() {
      // console.log('listen to ', this.entity)
      return this.entity as any;
    }


    beforeInsert(event: InsertEvent<T>) {
      if (this.entityEvents && _.isFunction(this.entityEvents.beforeInsert)) {
        this.entityEvents.beforeInsert.call(this, event)
      }
    }

    beforeUpdate(event: UpdateEvent<T>) {
      if (this.entityEvents && _.isFunction(this.entityEvents.beforeUpdate)) {
        this.entityEvents.beforeUpdate.call(this, event)
      }
    }


    beforeRemove(event: RemoveEvent<T>) {
      if (this.entityEvents && _.isFunction(this.entityEvents.beforeRemove)) {
        this.entityEvents.beforeRemove.call(this, event)
      }
    }


    afterInsert(event: InsertEvent<T>) {
      if (this.entityEvents && _.isFunction(this.entityEvents.afterInsert)) {
        this.entityEvents.afterInsert.call(this, event)
      }
    }


    afterUpdate(event: UpdateEvent<T>) {
      if (this.entityEvents && _.isFunction(this.entityEvents.afterUpdate)) {
        this.entityEvents.afterUpdate.call(this, event)
      }
    }


    afterRemove(event: RemoveEvent<T>) {
      if (this.entityEvents && _.isFunction(this.entityEvents.afterRemove)) {
        this.entityEvents.afterRemove.call(this, event)
      }
    }


    afterLoad(entity: T) {
      if (this.entityEvents && _.isFunction(this.entityEvents.afterLoad)) {
        this.entityEvents.afterLoad.call(this, entity)
      }
    }

    // listenToChangesOf(entity: T) {
    //   let observable = new Observable(observer => {

    //     Global.vars.socket.FE.on('clearbuildend', (data) => {
    //       this.ngZone.run(() => {
    //         observer.next(data);
    //       })
    //     })

    //     return () => {
    //       log.i('something on disconnect')
    //     };
    //   })
    //   return observable;
    // }


    abstract get db(): { [entities: string]: Repository<any> }
    abstract get ctrl(): { [controller: string]: META.BASE_CONTROLLER<any> }

    abstract async initExampleDbData();

    //#endregion

  }




}


