import { Socket } from 'socket.io'
import { Server, Namespace } from 'socket.io'
import { FrameworkContext } from '../framework/framework-context';

export class RealtimeBase {

  private static contexts = [];
  private static instances = [];
  public static by(context: FrameworkContext) {
    const indexContext = this.contexts.findIndex(c => c === context);
    if (indexContext === -1) {
      this.contexts.push(context);
      const instance = new RealtimeBase(context)
      this.instances.push(instance);
      return instance;
    } else {
      return this.instances[indexContext];
    }
  }

  private socketFrontEnd: any; //  Socket; // TODO QUICK_FIX
  private socketFrontEndRealtime: any; //  Socket; // TODO QUICK_FIX;
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

  private constructor(protected context: FrameworkContext) {

  }

  public pathFor(namespace?: string) {
    const uri = this.context.uri;
    const nsp = namespace ? namespace : '';
    const pathname = uri.pathname !== '/' ? uri.pathname : '';
    const prefix = `socketnodejs`;
    const href = `${uri.origin}${pathname}/${prefix}${nsp}`;
    // console.log(`HREF: ${href}`)
    return new URL(href) as URL;
  }

}
