//#region imports
//#region @backend
import { URL } from 'url';
//#endregion
import { _ } from 'tnp-core/src';
import { Subscriber } from 'rxjs';
import { Symbols } from '../symbols';
import { Socket as SocketClient } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { RealtimeModels } from './realtime.models';
//#endregion

export class RealtimeSubsManager {
  private isListening = false;
  private observers: Subscriber<any>[] = [];
  constructor(private options: RealtimeModels.SubsManagerOpt) {}

  //#region methods & getters / start listen if not started
  startListenIfNotStarted(
    realtime: SocketClient<DefaultEventsMap, DefaultEventsMap>,
  ) {
    if (this.options.core.ctx.disabledRealtime) {
      console.warn(`[Firedev][startListenIfNotStarted] sockets are disabled`);
      return;
    }

    if (!realtime) {
      console.warn(
        `[Firedev][startListenIfNotStarted] invalid socket connection`,
      );
      return;
    }

    if (!this.isListening) {
      console.info(`subscribe to ${this.options?.roomName}`, this.options);
      this.isListening = true;

      if (this.options.customEvent) {
        // this means: send to current client custom event notification
        realtime.emit(
          Symbols.REALTIME.ROOM_NAME.SUBSCRIBE.CUSTOM(
            this.options.core.ctx.contextName,
          ),
          this.options.roomName,
        );
      } else {
        if (_.isString(this.options.property)) {
          // this means: send to current client entity property events updates
          realtime.emit(
            Symbols.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS(
              this.options.core.ctx.contextName,
            ),
            this.options.roomName,
          );
        } else {
          // this means: send to current client entity update events
          realtime.emit(
            Symbols.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_UPDATE_EVENTS(
              this.options.core.ctx.contextName,
            ),
            this.options.roomName,
          );
        }
      }

      // subPath -> SYMBOL - (customevnet|entityupdatebyid){..}{..}
      realtime.on(this.options.roomName, data => {
        this.update(data);
      });
    }
  }
  //#endregion

  //#region methods & getters / add observer
  add(observer: Subscriber<any>) {
    // log.info('Add observer')
    this.observers.push(observer);
  }
  //#endregion

  //#region methods & getters / remove observer
  remove(observer: Subscriber<any>) {
    // log.info('Remove observer')
    this.observers = this.observers.filter(obs => obs !== observer);
    if (this.observers.length === 0) {
      // log.info('Emit unsubscribe to server SERVER')
      this.isListening = false;
      const { core, customEvent, roomName, property } = this.options;

      const realtime = core.FE_REALTIME;

      if (customEvent) {
        realtime.emit(
          Symbols.REALTIME.ROOM_NAME.UNSUBSCRIBE.CUSTOM(
            this.options.core.ctx.contextName,
          ),
          roomName,
        );
      } else {
        if (_.isString(property)) {
          realtime.emit(
            Symbols.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS(
              this.options.core.ctx.contextName,
            ),
            roomName,
          );
        } else {
          realtime.emit(
            Symbols.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS(
              this.options.core.ctx.contextName,
            ),
            roomName,
          );
        }
      }
    }
  }
  //#endregion

  //#region methods & getters / update
  private update(data: any) {
    // log.data(`realtime update!!!!!  observers=${this.observers?.length} `)
    const ngZone = this.options.core.ctx.ngZone;
    // console.log('updating', data);
    // console.log('ngzone', ngZone);
    this.observers.forEach(observer => {
      // console.log(`observer closed: ${observer.closed}`,observer);
      if (!observer.closed) {
        if (ngZone) {
          ngZone.run(() => {
            observer.next(data);
          });
        } else {
          observer.next(data);
        }
      }
    });
  }
  //#endregion
}
