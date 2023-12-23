import { _ } from 'tnp-core/src';
import { Log, Level } from "ng2-logger/src";
import { Observable, Subject, Subscription } from "rxjs";
//#region @backend
import { URL } from 'url';
//#endregion
const log = Log.create('[CLIENT/SERVER] broadcast dummy channel',
  Level.__NOTHING
);

export class IsomorphicBroadCastChannel {

  public static hosts: {
    [serverHref: string]: {
      events: { [eventName: string]: IsomorphicBroadCastChannel; }
    }
  } = {};

  static for(eventName: string, serverHref: string) {
    const url = new URL(serverHref);
    // TODO QUICK FIX
    serverHref = url.origin;
    if (!IsomorphicBroadCastChannel.hosts[serverHref]) {
      IsomorphicBroadCastChannel.hosts[serverHref] = {
        events: {}
      };
    }

    if (!IsomorphicBroadCastChannel.hosts[serverHref].events[eventName]) {
      IsomorphicBroadCastChannel.hosts[serverHref].events[eventName] = new IsomorphicBroadCastChannel(
        serverHref,
        eventName,
      );
    }
    const event = IsomorphicBroadCastChannel.hosts[serverHref].events[eventName] as IsomorphicBroadCastChannel;
    return event;
  }

  private callbacks = [];

  public set onmessage(callback: (a: MessageEvent) => any) {
    this.callbacks.push(callback);
  }

  private sub = new Subject();
  private subscribtion: Subscription;

  private constructor(
    public readonly serverHref: string,
    public readonly eventName: string
  ) {
    // log.info(`Creating room for event: ${eventName} on server href: ${serverHref}`);
    this.subscribtion = (this.sub as Observable<any>).subscribe((data) => {
      // log.info(`NEW SUBSCRIBE DATA  ${eventName} / ${serverHref}`, {
      //   calbacksCount: this.callbacks.length,
      //   rooms: IsomorphicBroadCastChannel.hosts,
      // });
      this.callbacks.forEach(callback => {
        // log.info(`Trigger callback ${eventName} / ${serverHref}`);
        // console.log({ callback })
        callback({
          data
        })
      });
    })
  }

  postMessage(data) {
    setTimeout(() => {
      this.sub.next(data);
    });
  }

  close() {
    // log.info('closing');
    this.subscribtion.unsubscribe()
    delete IsomorphicBroadCastChannel.hosts[this.serverHref].events[this.eventName];
  }

}
