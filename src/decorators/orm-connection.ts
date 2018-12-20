import { getClassConfig, ClassConfig } from 'ng2-rest';
import { Global } from '../global-config';


export function OrmConnection(target: Object, propertyName: string) {
  //#region @backend
  const configs = getClassConfig(target.constructor);
  const c: ClassConfig = configs[0];
  c.injections.push({
    propertyName,
    getter: function () {
      return Global.vars.connection;
    }
  });
  //#endregion
}
