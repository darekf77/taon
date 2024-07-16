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
} from 'firedev-typeorm/src';
import { BaseInjector } from './base-injector';
import { FiredevSubscriber } from '../decorators/classes/subscriber-decorator';

@FiredevSubscriber({
  className: 'BaseSubscriber',
})
export abstract class BaseSubscriber<Entity = any> extends BaseInjector {
  protected __trigger_event__(eventName: keyof Entity) {
    const ctx = this.__endpoint_context__;
    console.log('Trigger event', eventName, ctx);
    // ctx.realtimeServer.triggerCustomEvent/
  }
}
