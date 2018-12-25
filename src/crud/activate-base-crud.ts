
import { Helpers } from '../helpers';


const abstractClasses = ['BASE_CONTROLLER']

export function activateBaseCrud(target: Function, entity: Function) {

  if (Helpers.hasParentClassWithName(target, 'BaseCRUD') &&
    !abstractClasses.includes(Helpers.Class.getName(target))) {
    if (!entity) {
      if (Helpers.Class.getName(target) === Helpers.Class.getName(target['__proto__'])) {
        // console.log(`Site class override curd for ${getClassName(target)}`)
        return;
      }

      throw `Please provide "entity" property
@Morphi.Controller({
  ...
  entity: <YOUR ENTITY CLASS HERE>
  ...
})
class ${Helpers.Class.getName(target)} extends  ...
      `
    } else {
      // console.log(`Traget ${target.name} has parent BaseCrud`)
      target.prototype['entity'] = entity;
    }
  } else {
    // console.log(`Traget ${target.name} don't have parent BaseCrud`)
  }


}
