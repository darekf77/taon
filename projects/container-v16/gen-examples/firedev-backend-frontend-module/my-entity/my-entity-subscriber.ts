//#region @websql
//#region imports
import {
  EntitySubscriberInterface, EventSubscriber, InsertEvent,
  RemoveEvent, UpdateEvent
} from 'firedev-typeorm';
import type { MyEntity } from '../my-entity';
//#endregion

/**
 * Events subscriber for MyEntity
 *
 * + automate your database operation here
 */
@EventSubscriber()
export class MyEntitySubscriber implements EntitySubscriberInterface {

  /**
  * Called after entity update.
  */
  // afterUpdate(event: UpdateEvent<MyEntity>) {
  //   console.log(`AFTER ENTITY UPDATED: `, event.entity)
  // }

}
//#endregion
