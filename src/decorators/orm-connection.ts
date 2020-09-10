import { Models } from '../models';
import { CLASS } from 'typescript-class-helpers';
import { FrameworkContext } from '../framework/framework-context';

export function OrmConnection(target: Object, propertyName: string) {
  //#region @backend
  const configs = CLASS.getConfig(target.constructor);
  const c: Models.Rest.ClassConfig = configs[0];
  c.injections.push({
    propertyName,
    getter: function () {
      const context = FrameworkContext.findForTraget(target);
      return context.node.connection;
    }
  });
  //#endregion
}
