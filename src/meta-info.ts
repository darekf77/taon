import {
  Repository, EventSubscriber, EntitySubscriberInterface,
  InsertEvent, UpdateEvent, RemoveEvent
} from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
// import { BaseCRUD, CLASSNAME, ENDPOINT, describeClassProperites } from 'morphi';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { isBrowser, Log, Level, isNode } from 'ng2-logger';
import { describeClassProperites, CLASSNAME, getClassBy, getClassName, getClassFromObject } from 'ng2-rest';
const log = Log.create('META')
import {
  ENDPOINT, BaseCRUD
} from './index';
import { Global } from './global-config';
import { SYMBOL } from './symbols';

export namespace META {


  function realtimeEntityRoomName(className, entityId) {
    return `${className}-${entityId}`;
  }

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

    abstract fromRaw(obj: TRAW): T;

    private static realtimeEntityObservables: { [className: string]: { [entitiesIds: number]: Subscription; } } = {} as any;

    public get realtimeEntity() {
      const self = this;
      log.i('sefl', this)
      return {
        activate(tarnsformFn?: (changedEntity: T) => T) {

          const constructFn = getClassFromObject(self)

          if (!constructFn) {
            log.er(`Activate: Cannot retrive Class function from object`, self)
            return
          }

          const className = getClassName(constructFn);

          if (!BASE_ENTITY.realtimeEntityObservables[className]) {
            BASE_ENTITY.realtimeEntityObservables[className] = {};
          }

          if (_.isObject(BASE_ENTITY.realtimeEntityObservables[className][self.id])) {
            log.w('alread listen to this object realtime events', self)
            return
          }


          const ngZone = Global.vars.ngZone;

          const subject = new Observable(observer => {

            const modelSocketRoomPath = realtimeEntityRoomName(className, self.id);
            log.i(`Initiaing frontend sockets, path: ${modelSocketRoomPath}`)

            const m = Global.vars.socket.FE;

            m.on('connection', socket => {

              socket.on(modelSocketRoomPath, data => {
                log.i('data from socket without preparation (ngzone,rjxjs,transform)', data)
                if (ngZone) {
                  ngZone.run(() => {
                    if (_.isFunction(tarnsformFn)) {
                      observer.next(tarnsformFn(data))
                    }
                    observer.next(data);
                  })
                } else {
                  if (_.isFunction(tarnsformFn)) {
                    observer.next(tarnsformFn(data))
                  }
                  observer.next(data);
                }
              })

            })

            return () => {
              log.i('something on disconnect')
            };
          })




          BASE_ENTITY.realtimeEntityObservables[className][self.id] = subject.subscribe(d => {
            log.i('DATA FROM SOCKET TO MERGE!', d)
            // _.merge(this, d);
          })


        },
        deactivate() {

          const constructFn = getClassFromObject(self)

          if (!constructFn) {
            log.er(`Deactivate: Cannot retrive Class function from object`, self)
            return
          }

          const className = getClassName(constructFn);

          const obs = BASE_ENTITY.realtimeEntityObservables[className] && BASE_ENTITY.realtimeEntityObservables[className][self.id];
          if (!obs) {
            log.w(`No sunscribtion for entity with id ${self.id}`)
          } else {
            obs.unsubscribe();
            BASE_ENTITY.realtimeEntityObservables[self.id] = undefined;
          }

        }

      }
    }




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

      //#region @backend
      const self = this;

      this.realtimeEvents = {}
      this.realtimeEvents.afterUpdate = (event) => {

        try {
          console.log('event afer update', event);
          console.log('controller', self)
          const entity = event.entity
          const id = entity['id'];
          // Global.vars.socket.BE.sockets.in()\

          const constructFn = getClassFromObject(event.entity);
          console.log('construcFN', constructFn)
          if (!constructFn) {
            console.log('not found class function from', event.entity)
          } else {
            const className = getClassName(constructFn);

            const modelSocketRoomPath = realtimeEntityRoomName(className, id);
            console.log(`Push entity to room with path: ${modelSocketRoomPath}`)

            const s = Global.vars.socket.BE.of(SYMBOL.MORPHI_REALTIME_NAMESPACE);
            s.in(modelSocketRoomPath).emit(SYMBOL.REALTIME_MODEL_UPDATE, event.entity);
          }

        } catch (err) {

          console.log('err update ', err)

        }



      }

      //#endregion
    }


    //#region @backend
    private realtimeEvents: EntityEvents<T>;

    protected __realitmeUpdate(model: T) {
      this.realtimeEvents.afterUpdate({ entity: model } as any)
    }

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


    abstract get db(): { [entities: string]: Repository<any> }
    abstract get ctrl(): { [controller: string]: META.BASE_CONTROLLER<any> }

    abstract async initExampleDbData();

    //#endregion

  }




}


