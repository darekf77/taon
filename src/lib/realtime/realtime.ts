import { Socket } from 'socket.io'
import { Server, Namespace } from 'socket.io'
import { FrameworkContext } from '../framework/framework-context';

export class RealtimeBase {

  private socketFrontEnd: any; //  Socket; // TODO QUICK_FIX
  private socketFrontEndRealtime:  any; //  Socket; // TODO QUICK_FIX;
  //#region @backend
  private socketNamespaceBE: Server;
  private socketNamespaceBERealtime: Namespace;
  //#endregion
  public get socketNamespace() {
    const self = this;
    return {
      set FE(v) {
        self.socketFrontEnd = v;
      },
      get FE() {
        return self.socketFrontEnd;
      },
      set FE_REALTIME(v) {
        self.socketFrontEndRealtime = v;
      },
      get FE_REALTIME() {
        return self.socketFrontEndRealtime;
      },
      //#region @backend
      set BE(v) {
        self.socketNamespaceBE = v;
      },
      get BE() {
        return self.socketNamespaceBE;
      },
      set BE_REALTIME(v) {
        self.socketNamespaceBERealtime = v;
      },
      get BE_REALTIME() {
        return self.socketNamespaceBERealtime;
      }
      //#endregion
    }
  }

  constructor(protected context: FrameworkContext) {

  }
  public pathFor(namespace?: string) {
    const uri = this.context.uri;
    const nsp = namespace ? namespace : '';
    const pathname = uri.pathname !== '/' ? uri.pathname : '';
    const morphiPrefix = `socketnodejs`;
    const href = `${uri.origin}${pathname}/${morphiPrefix}${nsp}`;
    // console.log(`HREF: ${href}`)
    return new URL(href) as URL;
  }

}
