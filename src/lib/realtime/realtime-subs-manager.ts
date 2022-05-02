import * as _ from 'lodash';
import { Subscriber } from "rxjs";
import { Helpers } from 'tnp-core';
import { FrameworkContext } from "../framework/framework-context";
import { SYMBOL } from "../symbols";
import { RealtimeBase } from "./realtime";


export type SubscribtionRealtime = {
  context: FrameworkContext;
  customEvent: string;
  roomName: string;
  property: string;
  subPath: string;
}
export class RealtimeSubsManager {

  private static idFrm(options: SubscribtionRealtime) {
    return `${options.context.host}|${options.roomName}|${options.subPath}|${options.property}|${options.customEvent}`;
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

  startListenIfNotStarted(realtime: any) {
    if(this.options.context.disabledRealtime) {
      console.warn(`[Firedev][startListenIfNotStarted] socket are disabled`)
      return;
    }

    if(!realtime) {
      console.warn(`[Firedev][startListenIfNotStarted] invalid socket connection`)
      return;
    }

    if (!this.isListening) {
      this.isListening = true;

      if (this.options.customEvent) {
        realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.CUSTOM, this.options.roomName);
      } else {
        if (_.isString(this.options.property)) {
          realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, this.options.roomName);
        } else {
          realtime.emit(SYMBOL.REALTIME.ROOM.SUBSCRIBE.ENTITY_UPDATE_EVENTS, this.options.roomName);
        }
      }

      realtime.on(this.options.subPath, (data) => {
        this.update(data);
      });
    }
  }

  add(observer: Subscriber<any>) {
    this.observers.push(observer);
  }

  remove(observer: Subscriber<any>) {
    this.observers = this.observers.filter(obs => obs !== observer);
    if (this.observers.length === 0) {
      this.isListening = false;
      const { context, customEvent, roomName, property } = this.options;
      const base = RealtimeBase.by(context);
      const realtime = base.socketNamespace.FE_REALTIME;

      if (customEvent) {
        realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.CUSTOM, roomName)
      } else {
        if (_.isString(property)) {
          realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS, roomName)
        } else {
          realtime.emit(SYMBOL.REALTIME.ROOM.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS, roomName)
        }
      }
    }
  }

  private update(data: any) {
    const ngZone = this.options.context.ngZone;
    this.observers.forEach(observer => {
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
