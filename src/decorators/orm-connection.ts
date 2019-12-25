import { Global } from '../global-config';
import { Helpers } from '../helpers';
import { Models } from '../models';
import { CLASS } from 'typescript-class-helpers';


export function OrmConnection(target: Object, propertyName: string) {
  //#region @backend
  const configs = CLASS.getConfig(target.constructor);
  const c: Models.Rest.ClassConfig = configs[0];
  c.injections.push({
    propertyName,
    getter: function () {
      return Global.vars.connection;
    }
  });
  //#endregion
}
