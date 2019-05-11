import { SYMBOL } from '../symbols';
import { Global } from '../global-config';
import { Helpers } from '../helpers';

//#region @backend
if (Helpers.isNode) {
  var { URL } = require('url');
}
//#endregion

export class RealtimeHelper {

  public static pathFor(namespace?: string) {
    const uri: URL = Global.vars.url;
    const href = `${uri.origin}/socketnodejs${
      namespace ? namespace : ''
      }${
      uri.pathname !== '/' ? uri.pathname : ''
      }`;
    console.log(`HREF: ${href}`)
    return new URL(href) as URL;
  }

  private static ngZoneInstance: any;
  public static initNGZone(ngZoneInstance: any) {
    this.ngZoneInstance = ngZoneInstance;
  }





}
