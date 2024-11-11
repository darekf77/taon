import {
  EntitySubscriberInterface,
  RecoverEvent,
  SoftRemoveEvent,
  InsertEvent,
  TransactionStartEvent,
  TransactionCommitEvent,
  TransactionRollbackEvent,
  RemoveEvent,
  UpdateEvent,
} from 'taon-typeorm/src';
import { BaseInjector } from './base-injector';
import { TaonSubscriber } from '../decorators/classes/subscriber-decorator';
import { _ } from 'tnp-core/src';

@TaonSubscriber({
  className: 'BaseSubscriberForEntity',
})
export abstract class BaseSubscriberForEntity<Entity = any>
  extends BaseInjector
  implements EntitySubscriberInterface
{
  abstract listenTo(): new (...args) => Entity;

  /**
   * Called after entity is loaded.
   */
  afterLoad(entity: any) {
    this.__endpoint_context__.logDb &&
      console.log(`AFTER ENTITY LOADED: `, entity);
  }

  /**
   * Called before query execution.
   */
  beforeQuery(event: any) {
    // BeforeQueryEvent<any>
    this.__endpoint_context__.logDb &&
      console.log(`BEFORE QUERY: `, event.query);
  }

  /**
   * Called after query execution.
   */
  afterQuery(event: any) {
    // AfterQueryEvent<any>
    this.__endpoint_context__.logDb &&
      console.log(`AFTER QUERY: `, event.query);
  }

  /**
   * Called before entity insertion.
   */
  beforeInsert(event: InsertEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(`BEFORE ENTITY INSERTED: `, event.entity);
  }

  /**
   * Called after entity insertion.
   */
  afterInsert(event: InsertEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(`AFTER ENTITY INSERTED: `, event.entity);
  }

  /**
   * Called before entity update.
   */
  beforeUpdate(event: UpdateEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(`BEFORE ENTITY UPDATED: `, event.entity);
  }

  /**
   * Called after entity update.
   */
  afterUpdate(event: UpdateEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(`AFTER ENTITY UPDATED: `, event.entity);
  }

  /**
   * Called before entity removal.
   */
  beforeRemove(event: RemoveEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(
        `BEFORE ENTITY WITH ID ${event.entityId} REMOVED: `,
        event.entity,
      );
  }

  /**
   * Called after entity removal.
   */
  afterRemove(event: RemoveEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(
        `AFTER ENTITY WITH ID ${event.entityId} REMOVED: `,
        event.entity,
      );
  }

  /**
   * Called before entity removal.
   */
  beforeSoftRemove(event: SoftRemoveEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(
        `BEFORE ENTITY WITH ID ${event.entityId} SOFT REMOVED: `,
        event.entity,
      );
  }

  /**
   * Called after entity removal.
   */
  afterSoftRemove(event: SoftRemoveEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(
        `AFTER ENTITY WITH ID ${event.entityId} SOFT REMOVED: `,
        event.entity,
      );
  }

  /**
   * Called before entity recovery.
   */
  beforeRecover(event: RecoverEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(
        `BEFORE ENTITY WITH ID ${event.entityId} RECOVERED: `,
        event.entity,
      );
  }

  /**
   * Called after entity recovery.
   */
  afterRecover(event: RecoverEvent<any>) {
    this.__endpoint_context__.logDb &&
      console.log(
        `AFTER ENTITY WITH ID ${event.entityId} RECOVERED: `,
        event.entity,
      );
  }

  /**
   * Called before transaction start.
   */
  beforeTransactionStart(event: TransactionStartEvent) {
    this.__endpoint_context__.logDb &&
      console.log(`BEFORE TRANSACTION STARTED: `, event);
  }

  /**
   * Called after transaction start.
   */
  afterTransactionStart(event: TransactionStartEvent) {
    this.__endpoint_context__.logDb &&
      console.log(`AFTER TRANSACTION STARTED: `, event);
  }

  /**
   * Called before transaction commit.
   */
  beforeTransactionCommit(event: TransactionCommitEvent) {
    this.__endpoint_context__.logDb &&
      console.log(`BEFORE TRANSACTION COMMITTED: `, event);
  }

  /**
   * Called after transaction commit.
   */
  afterTransactionCommit(event: TransactionCommitEvent) {
    this.__endpoint_context__.logDb &&
      console.log(`AFTER TRANSACTION COMMITTED: `, event);
  }

  /**
   * Called before transaction rollback.
   */
  beforeTransactionRollback(event: TransactionRollbackEvent) {
    this.__endpoint_context__.logDb &&
      console.log(`BEFORE TRANSACTION ROLLBACK: `, event);
  }

  /**
   * Called after transaction rollback.
   */
  afterTransactionRollback(event: TransactionRollbackEvent) {
    this.__endpoint_context__.logDb &&
      console.log(`AFTER TRANSACTION ROLLBACK: `, event);
  }
}
