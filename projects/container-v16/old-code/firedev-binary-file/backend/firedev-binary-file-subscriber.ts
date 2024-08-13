//#region @websql
//#region imports
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'firedev-typeorm';
import type { FiredevBinaryFile } from '../firedev-binary-file';
//#endregion

/**
 * Events subscriber for FiredevBinaryFile
 *
 * + automate your database operation here
 */
@EventSubscriber()
export class FiredevBinaryFileSubscriber implements EntitySubscriberInterface {
  /**
   * Called after entity update.
   */
  // afterUpdate(event: UpdateEvent<FiredevBinaryFile>) {
  //   console.log(`AFTER ENTITY UPDATED: `, event.entity)
  // }
}
//#endregion
