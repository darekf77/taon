import * as _ from 'lodash';
import { CLASS } from 'typescript-class-helpers';


export function typeFromEntity(entity: Function) {
  let name = formlyComponentNameFrom(entity)
  let res = { name, component: entity };
  // console.log(res);
  return res;
}

export function formlyComponentNameFrom(entity: Function) {
  let name = (CLASS.getName(entity) as string).toLowerCase();
  if (name.endsWith('component')) {
    name = name.replace('component', '');
  }
  return name;
}

export function RegisterComponentType(className: string) {
  if (!_.isArray(RegisterComponentType.prototype.types)) {
    RegisterComponentType.prototype.types = []
  }
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    CLASS.NAME(className)(target)
    RegisterComponentType.prototype.types.push(typeFromEntity(target))
  } as any;
}

export function getRegisteredComponents() {
  let registered = RegisterComponentType.prototype.types as { name: string, component: Function; }[];
  // console.log(registered)
  return registered;
}
