import {
  Repository, EventSubscriber, EntitySubscriberInterface,
  InsertEvent, UpdateEvent, RemoveEvent, UpdateResult, DeepPartial, SaveOptions, FindConditions, ObjectID
} from 'typeorm';
import { Connection } from "typeorm/connection/Connection";
// import { BaseCRUD, CLASSNAME, ENDPOINT, describeClassProperites } from 'morphi';

import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { isBrowser, Log, Level, isNode } from 'ng2-logger';
import { describeClassProperites, CLASSNAME, getClassBy, getClassName, getClassFromObject } from 'ng2-rest';
const log = Log.create('META', Level.__NOTHING)
import {
  ENDPOINT, BaseCRUD
} from './index';
import { Global } from './global-config';
import { SYMBOL } from './symbols';
import { RealtimeNodejs } from './realtime/realtime-nodejs';

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

    constructor() {
      super()
    }

    async update(criteria: string | string[] | number | number[] | Date | Date[] | ObjectID | ObjectID[] | FindConditions<Entity>,
      partialEntity: DeepPartial<Entity>, options?: SaveOptions): Promise<UpdateResult> {
      const m = await super.update(criteria, partialEntity, options);
      const entity = await this.findOne(criteria as any)
      RealtimeNodejs.populate({ entity: entity as any });
      return m;
    }

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

    public static fromRaw(obj: any, prototype: Object): any {
      return _.merge(Object.create(prototype), obj);
    }

    abstract fromRaw(obj: TRAW | T): T;



    private static realtimeEntity: { [className: string]: { [entitiesIds: number]: any[]; } } = {} as any;
    private static realtimeEntityObservables: { [className: string]: { [entitiesIds: number]: Subscription; } } = {} as any;

    public get realtimeEntity() {
      const self = this;

      return {
        subscribe(changesListener: (changedEntity: T) => void) {
          log.i('realtime entity this', self)
          const constructFn = getClassFromObject(self)

          if (!constructFn) {
            log.er(`Activate: Cannot retrive Class function from object`, self)
            return
          }

          const className = getClassName(constructFn);

          if (!BASE_ENTITY.realtimeEntityObservables[className]) {
            BASE_ENTITY.realtimeEntityObservables[className] = {};
          }

          if (!BASE_ENTITY.realtimeEntity[className]) {
            BASE_ENTITY.realtimeEntity[className] = {};
          }

          if (!_.isArray(BASE_ENTITY.realtimeEntity[className][self.id])) {
            BASE_ENTITY.realtimeEntity[className][self.id] = [];
          }

          if (_.isObject(BASE_ENTITY.realtimeEntityObservables[className][self.id])) {
            log.w('alread listen to this object realtime events', self)
            BASE_ENTITY.realtimeEntity[className][self.id].push(self);
            // const currentEntity = BASE_ENTITY.realtimeEntity[className][self.id] as BASE_ENTITY<any>;
            // if (currentEntity.id == self.id) {
            //   log.i('Entity replaced', self)
            //   BASE_ENTITY.realtimeEntity[className][self.id] = self;
            // }
            return
          }
          const roomName = SYMBOL.REALTIME.ROOM_NAME(className, self.id);
          const realtime = Global.vars.socketNamespace.FE_REALTIME;
          const ngZone = Global.vars.ngZone;
          const ApplicationRef = Global.vars.ApplicationRef;

          const subject = new Observable(observer => {

            // realtime.on('connect', () => {
            //   console.log(`conented to namespace ${realtime.nsp && realtime.nsp.name}`)

            realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE_ENTITY_EVENTS, roomName)
            realtime.on(SYMBOL.REALTIME.EVENT.ENTITY_UPDATE_BY_ID(className, self.id), (data) => {

              log.i('data from socket without preparation (ngzone,rjxjs,transform)', data)
              if (ngZone) {
                log.d('next from ngzone')
                ngZone.runOutsideAngular(() => {
                  if (_.isFunction(changesListener)) {
                    observer.next(changesListener(BASE_ENTITY.fromRaw(data, constructFn.prototype)))
                  } else {
                    log.er('Please define changedEntity')
                  }
                })
              } else {
                log.d('next without ngzone')
                if (_.isFunction(changesListener)) {
                  observer.next(changesListener(BASE_ENTITY.fromRaw(data, constructFn.prototype)))
                } else {
                  log.er('Please define changedEntity')
                }
              }
              if (ApplicationRef) {
                log.i('tick application ')
                ApplicationRef.tick()
              }
              // })
            })

            return () => {
              log.i('something on disconnect')
            };
          })
          BASE_ENTITY.realtimeEntity[className][self.id].push(self);

          BASE_ENTITY.realtimeEntityObservables[className][self.id] = subject.subscribe(d => {
            log.i('DATA FROM SOCKET TO MERGE!', d)
          })


        },
        unsubscribe() {

          const constructFn = getClassFromObject(self)
          if (!constructFn) {
            log.er(`Deactivate: Cannot retrive Class function from object`, self)
            return
          }

          const className = getClassName(constructFn);
          const roomName = SYMBOL.REALTIME.ROOM_NAME(className, self.id);

          const obs = BASE_ENTITY.realtimeEntityObservables[className] && BASE_ENTITY.realtimeEntityObservables[className][self.id];
          if (!obs) {
            log.w(`No sunscribtion for entity with id ${self.id}`)
          } else {
            obs.unsubscribe();
            BASE_ENTITY.realtimeEntityObservables[self.id] = undefined;
          }

          BASE_ENTITY.realtimeEntity[className][self.id] = undefined;

          const realtime = Global.vars.socketNamespace.FE_REALTIME;
          realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE_ENTITY_EVENTS, roomName)

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
        // log.i('BASE_CONTROLLER, constructor', this)
      }

      //#region @backend

      this.realtimeEvents = {}
      this.realtimeEvents.afterUpdate = (event) => {

        RealtimeNodejs.populate(event as any);

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


