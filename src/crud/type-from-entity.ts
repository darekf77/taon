import * as _ from 'lodash';
import { CLASS } from 'typescript-class-helpers';

export function findTypeForEntity(entity: Function, isArray: boolean = false) {
  if (!_.isArray(RegisterComponentType.prototype.types)) {
    RegisterComponentType.prototype.types = []
  }
  return getRegisteredComponents().find(c => (c.entity === entity && c.isArray === isArray));
}

export type FormlyEntityType = { name: string, component: Function; entity?: Function, isArray?: boolean; };

export function typeFromEntity(component: Function, entity?: Function | Function[]) {
  const isArray = _.isArray(entity);
  if (isArray) {
    entity = _.first(entity as any);
  }
  let name = formlyComponentNameFrom(_.isFunction(entity) ? entity : component)
  let res = { name, component, entity, isArray };
  // console.log(res);
  return res;
}

export function typeFromName(component: Function, name: string) {
  let res = { name, component };
  return res;
}

export function formlyComponentNameFrom(entityOrComponent: Function) {
  let name = (CLASS.getName(entityOrComponent) as string).toLowerCase();
  if (name.endsWith('component')) {
    name = name.replace('component', '');
  }
  return `${name}formly`;
}

export function RegisterComponentTypeForEntity(entity: Function) {
  if (!_.isArray(RegisterComponentType.prototype.types)) {
    RegisterComponentType.prototype.types = []
  }
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    RegisterComponentType.prototype.types.push(typeFromEntity(target, entity))
  } as any;
}

export function RegisterComponentType(className: string, ...optionslNames: string[]) {
  if (!_.isArray(RegisterComponentType.prototype.types)) {
    RegisterComponentType.prototype.types = []
  }
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    CLASS.NAME(className)(target)
    RegisterComponentType.prototype.types.push(typeFromEntity(target))
    optionslNames.forEach(name => {
      RegisterComponentType.prototype.types.push(typeFromName(target, name))
    })
  } as any;
}
// RegisterComponentType.prototype.types = []

export function getRegisteredComponents() {
  let registered = RegisterComponentType.prototype.types as FormlyEntityType[];
  if (!Array.isArray(registered)) {
    return []
  }
  // console.log(registered)
  return registered;
}
