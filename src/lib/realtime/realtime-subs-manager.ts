import * as _ from 'lodash';
import { Level, Log } from 'ng2-logger/src';
import { Subscriber } from "rxjs";
import { Helpers } from 'tnp-core/src';
import { FrameworkContext } from "../framework/framework-context";
import { SYMBOL } from "../symbols";
import type { BroadcastApiIoMockClient } from './broadcast-api-io-mock-client';
// import type { BroadcastApiIoMockServer } from './broadcast-api-io-mock-server';
import { RealtimeBase } from "./realtime";
//#region @backend
import { URL } from 'url';
//#endregion

const log = Log.create('REALTIME SUBS MANAGER',
  Level.__NOTHING
)

export type SubscribtionRealtime = {
  context: FrameworkContext;
  customEvent: string;
  roomName: string;
  property: string;
}
export class RealtimeSubsManager {

  private static idFrm(options: SubscribtionRealtime) {
    const url = new URL(options.context.host);
    return `${url.origin}|${options.roomName}|${options.property}|${options.customEvent}`;
  }
  private static roomSubs = {};
  public static from(options: SubscribtionRealtime) {
    const pathToInstance = RealtimeSubsManager.idFrm(options);
    if (!RealtimeSubsManager.roomSubs[pathToInstance]) {
      RealtimeSubsManager.roomSubs[pathToInstance] = new RealtimeSubsManager(options);
    }
    return RealtimeSubsManager.roomSubs[pathToInstance] as RealtimeSubsManager;
  }

  private isListening = false;
  private constructor(private options: SubscribtionRealtime) { }

  private observers: Subscriber<any>[] = []

  startListenIfNotStarted(realtime: BroadcastApiIoMockClient) {

    if (this.options.context.disabledRealtime) {
      console.warn(`[Firedev][startListenIfNotStarted] sockets are disabled`)
      return;
    }

    if (!realtime) {
      console.warn(`[Firedev][startListenIfNotStarted] invalid socket connection`)
      return;
    }

    if (!this.isListening) {

      log.i(`subscribe to ${this.options?.roomName}`, this.options)
      this.isListening = true;

      if (this.options.customEvent) { // this means: send to current client custom event notification
        realtime.emit(SYMBOL.REALTIME.ROOM_NAME.SUBSCRIBE.CUSTOM, this.options.roomName);
      } else {
        if (_.isString(this.options.property)) {
          // this means: send to current client entity property events updates
          realtime.emit(SYMBOL.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, this.options.roomName);
        } else {
          // this means: send to current client entity update events
          realtime.emit(SYMBOL.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_UPDATE_EVENTS, this.options.roomName);
        }
      }

      // subPath -> SYMBOL - (customevnet|entityupdatebyid){..}{..}
      realtime.on(this.options.roomName, (data) => {

        this.update(data);
      });
    }
  }

  add(observer: Subscriber<any>) {
    // log.info('Add observer')
    this.observers.push(observer);
  }

  remove(observer: Subscriber<any>) {
    // log.info('Remove observer')
    this.observers = this.observers.filter(obs => obs !== observer);
    if (this.observers.length === 0) {
      // log.info('Emit unsubscribe to server SERVER')
      this.isListening = false;
      const { context, customEvent, roomName, property } = this.options;
      const base = RealtimeBase.by(context);
      const realtime = base.FE_REALTIME;

      if (customEvent) {
        realtime.emit(SYMBOL.REALTIME.ROOM_NAME.UNSUBSCRIBE.CUSTOM, roomName)
      } else {
        if (_.isString(property)) {
          realtime.emit(SYMBOL.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
        } else {
          realtime.emit(SYMBOL.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
        }
      }
    }
  }

  private update(data: any) {

    // log.data(`realtime update!!!!!  observers=${this.observers?.length} `)
    const ngZone = this.options.context.ngZone;
    // console.log('updating', data);
    // console.log('ngzone', ngZone);
    this.observers.forEach(observer => {
      // console.log(`observer closed: ${observer.closed}`,observer);
      if (!observer.closed) {
        if (ngZone) {
          ngZone.run(() => {
            observer.next(data);
          })
        } else {
          observer.next(data);
        }
      }
    });
  }

}
