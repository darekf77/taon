import { Level, Log } from 'ng2-logger/src';
import { _ } from 'tnp-core/src';
import {
  BroadcastApiClient,
  BroadcastApiIoOptions,
  BroadcastApiIoOptionsClient,
} from './broadcast-api-io.models';
import { IsomorphicBroadCastChannel } from './broadcast-channel-dummy';
const log = Log.create('[CLIENT] broadcast api mock', Level.__NOTHING);

export class BroadcastApiIoMockClient {
  private static _instaceKey(origin: string, pathname: string) {
    // return `${origin}${pathname}`; // TODO quick fix
    return origin;
  }

  private static _instances = {};
  static _isntanceBy(origin: string, options?: BroadcastApiIoOptionsClient) {
    const key = BroadcastApiIoMockClient._instaceKey(
      origin,
      '', // options?.path
    );
    if (!BroadcastApiIoMockClient._instances[key]) {
      BroadcastApiIoMockClient._instances[key] = new BroadcastApiIoMockClient(
        origin,
        options,
      );
    }
    return BroadcastApiIoMockClient._instances[key] as BroadcastApiIoMockClient;
  }

  static connect(origin: string, options?: BroadcastApiIoOptionsClient) {
    return BroadcastApiIoMockClient._isntanceBy(origin, options);
  }

  public allowedToListenRooms: string[] = [];

  private readonly _url: URL;
  /**
   * path name of url.. examples:
   * /
   * /something
   *
   */
  readonly nsp: string;

  private constructor(
    originUrl: string,
    options?: BroadcastApiIoOptionsClient,
  ) {
    this._url = new URL(originUrl);
    this.nsp = this._url.pathname;
  }

  on(
    roomNameAsEvent: 'connect' | string,
    callback: (dataFromServer?: any) => any,
  ) {
    if (roomNameAsEvent === 'connect') {
      setTimeout(() => {
        callback();
      });
      return;
    }

    const room = IsomorphicBroadCastChannel.for(
      roomNameAsEvent,
      this._url.href,
    );
    room.onmessage = (messageEvent: MessageEvent) => {
      if (this.allowedToListenRooms.includes(roomNameAsEvent)) {
        // log.i('PUSHING' + JSON.stringify({ data: messageEvent?.data }))
        callback(messageEvent?.data);
      } else {
        // log.i('NOT PUSHING')
      }
    };
  }

  emit(roomNameForSubOrUnsub: string, data: any) {
    const room = IsomorphicBroadCastChannel.for(
      roomNameForSubOrUnsub,
      this._url.href,
    );
    // log.i('emit data', data)
    room.postMessage(data);
  }
}

export const mockIoClient = BroadcastApiIoMockClient as Pick<
  typeof BroadcastApiIoMockClient,
  'connect'
>;
