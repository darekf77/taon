//#region import
import { Level, Log } from 'ng2-logger/src';
import { _ } from 'tnp-core/src';
import { Symbols } from '../symbols';
import { BroadcastApiIoMockClient } from './broadcast-api-io-mock-client';
import { BroadcastApiIoOptions } from './broadcast-api-io.models';
import { IsomorphicBroadCastChannel } from './broadcast-channel-dummy';
//#endregion

const log = Log.create('[SERVER] broadcast api mock',
  Level.__NOTHING
)


//#region server - namespace
export class BroadcastApiIoMockServerSocket {

  constructor(
    public readonly server: BroadcastApiIoMockServer
  ) {

  }

  private get currentClient() {

    const ins = BroadcastApiIoMockClient._isntanceBy(
      this.server._url.origin,
      { path: this.server._url.pathname },
    );
    return ins;
  }

  get nsp() {
    return {
      get name() {
        return '/'; /// I am actuall not using namespaces
      }
    }
  }


  /**
   * Backend gets notyfications from client
   */
  on(roomNameToListen: string, callback: (roomNameForEvents: string) => any) {

    if ([
      Symbols.old.REALTIME.ROOM_NAME.SUBSCRIBE.CUSTOM,
      Symbols.old.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_UPDATE_EVENTS,
      Symbols.old.REALTIME.ROOM_NAME.SUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS,
      Symbols.old.REALTIME.ROOM_NAME.UNSUBSCRIBE.CUSTOM,
      Symbols.old.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_UPDATE_EVENTS,
      Symbols.old.REALTIME.ROOM_NAME.UNSUBSCRIBE.ENTITY_PROPERTY_UPDATE_EVENTS,
    ].includes(roomNameToListen)) {
      const room = IsomorphicBroadCastChannel.for(
        roomNameToListen,
        this.server._url.href,
      );
      room.onmessage = (e) => {
        callback(e.data);
      };
    }
  }

  join(roomName: string) {

    this.currentClient.allowedToListenRooms.push(roomName);
  }

  leave(roomName: string) {
    const roomToClose = IsomorphicBroadCastChannel.for(roomName, this.server._url.href);
    if (roomToClose) {
      roomToClose.close();
      this.currentClient.allowedToListenRooms = this.currentClient.allowedToListenRooms
        .filter(allowedRoomTolisten => allowedRoomTolisten !== roomName);
    }

  }
}
//#endregion

//#region server
export class BroadcastApiIoMockServer {
  readonly _url: URL;

  path() {
    return this._url.pathname;
  }

  readonly socket: BroadcastApiIoMockServerSocket;
  constructor(httpServer: any, options?: BroadcastApiIoOptions) {
    //#region @browser
    this._url = new URL(options.href);
    // this.nsp = _.camelCase(options.path).toLowerCase();
    this.socket = new BroadcastApiIoMockServerSocket(this);
    //#endregion
  }

  on(action: 'connection' | string, callback: (socket: BroadcastApiIoMockServerSocket) => any) {
    setTimeout(() => {
      callback(this.socket);
    });
  }

  in(roomName: string) {
    return {
      // eventName=roomName
      emit: (eventName: string, data: any) => {
        const room = IsomorphicBroadCastChannel.for(roomName, this._url.href)
        room.postMessage(data);
      }
    }
  }
}
//#endregion

//#region io
export const mockIoServer = (httpServer: any, options?: BroadcastApiIoOptions) => {
  return new BroadcastApiIoMockServer(httpServer, options)
};
//#endregion
