//#region imports
import * as FormData from 'form-data'; // @backend
import { _, Utils } from 'tnp-core/src';
import { CLASS } from 'typescript-class-helpers/src';

import {
  controllerConfigFrom,
  ControllerConfig,
} from '../config/controller-config';
import { MethodConfig } from '../config/method-config';
import { TaonEntityOptions } from '../decorators/classes/entity-decorator';
import { Models } from '../models';
import { Symbols } from '../symbols';
import { Validators } from '../validators';

import { TaonHelpers } from './taon-helpers';
//#endregion

export namespace ClassHelpers {
  //#region get class from name
  /**
   * TODO - repalce in every place when getting class fn from object
   */
  export const getClassFnFromObject = (json: Object) => {
    if (_.isUndefined(json) || _.isNull(json)) {
      return;
    }
    if (json.constructor) {
      return json.constructor;
    }
    const p = Object.getPrototypeOf(json);
    return p && p.constructor && p.constructor.name !== 'Object'
      ? p.constructor
      : void 0;
  };
  //#endregion

  //#region get name
  export const getName = (classFnOrObject: any): string => {
    // exception for FormData
    if (classFnOrObject instanceof FormData) {
      return 'FormData';
    }
    if (!classFnOrObject) {
      console.error('OBJECT OR CLASS', classFnOrObject);
      throw new Error(`Cannot get name from this object or class.`);
    }
    return (
      (classFnOrObject[Symbols.classNameStaticProperty]
        ? classFnOrObject[Symbols.classNameStaticProperty]
        : classFnOrObject?.constructor[Symbols.classNameStaticProperty]) ||
      (_.isFunction(classFnOrObject) ? CLASS.getName(classFnOrObject) : void 0)
    );
  };
  //#endregion

  export const getOrginalClass = (classFnOrObject: any): any => {
    const org = classFnOrObject[Symbols.orignalClass];
    if (!org) {
      return classFnOrObject;
    }
    return getOrginalClass(org);
  };

  //#region get full internal name
  export const getFullInternalName = (classFnOrObject: any): string => {
    // exception for FormData

    if (!classFnOrObject) {
      throw new Error(`Cannot get name from: ${classFnOrObject}`);
    }
    return (
      (classFnOrObject[Symbols.fullClassNameStaticProperty]
        ? classFnOrObject[Symbols.fullClassNameStaticProperty]
        : classFnOrObject?.constructor[Symbols.fullClassNameStaticProperty]) ||
      void 0
    );
  };
  //#endregion

  //#region get unique key
  export const getUniqueKey = (classFnOrObject: any): string => {
    const classFn = _.isFunction(classFnOrObject)
      ? classFnOrObject
      : classFnOrObject.constructor;
    const config = Reflect.getMetadata(
      Symbols.metadata.options.entity,
      classFn,
    ) as TaonEntityOptions;

    return config.uniqueKeyProp;
  };
  //#endregion

  //#region is class object
  export const isContextClassObject = (obj: any): boolean => {
    if (
      !_.isObject(obj) ||
      _.isArray(obj) ||
      _.isRegExp(obj) ||
      _.isBuffer(obj) ||
      _.isArrayBuffer(obj)
    ) {
      return false;
    }
    if (_.isDate(obj)) {
      return true;
    }
    const className = getName(obj);
    return _.isString(className) && className !== 'Object';
  };
  //#endregion

  //#region get name

  export const setName = (target: Function, className: string): void => {
    // console.log('setName', className, target.name)
    Validators.classNameVlidation(className, target);
    target[Symbols.classNameStaticProperty] = className;
  };
  //#endregion

  //#region has parent with class name
  export const hasParentClassWithName = (
    target: Function,
    className: string,
    targets = [],
  ): boolean => {
    if (!target) {
      return false;
    }
    targets.push(target);
    let targetProto = Object.getPrototypeOf(target);

    if (
      _.isFunction(targetProto) &&
      ClassHelpers.getName(targetProto) === className
    ) {
      // console.log(`true  "${_.first(targets).name}" for ${targets.map(d => d.name).join(',')}`)
      return true;
    }
    return hasParentClassWithName(targetProto, className, targets);
  };
  //#endregion

  //#region get methods name

  //#region not allowed as method name
  const notAllowedAsMethodName = [
    'length',
    'name',
    'arguments',
    'caller',
    'constructor',
    'apply',
    'bind',
    'call',
    'toString',
    '__defineGetter__',
    '__defineSetter__',
    'hasOwnProperty',
    '__lookupGetter__',
    '__lookupSetter__',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'valueOf',
    '__proto__',
    'toLocaleString',
  ];
  //#endregion

  /**
   * Express async handler for middleware functions.
   */
  export const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  export const getMethodsNames = (
    classOrClassInstance: any,
    allMethodsNames = [],
  ): string[] => {
    if (!classOrClassInstance) {
      return Utils.uniqArray(allMethodsNames);
    }

    const isClassFunction = _.isFunction(classOrClassInstance);
    const classFun = isClassFunction
      ? classOrClassInstance
      : Object.getPrototypeOf(classOrClassInstance);
    const objectToCheck = isClassFunction
      ? (classOrClassInstance as Function)?.prototype
      : classOrClassInstance;
    const prototypeObj = Object.getPrototypeOf(objectToCheck || {});

    const properties = _.uniq([
      ...Object.getOwnPropertyNames(objectToCheck || {}),
      ...Object.getOwnPropertyNames(prototypeObj || {}),
      ...Object.keys(objectToCheck || {}),
      ...Object.keys(prototypeObj || {}),
    ]).filter(f => !!f && !notAllowedAsMethodName.includes(f));

    properties
      .filter(methodName => typeof objectToCheck[methodName] === 'function')
      .forEach(p => allMethodsNames.push(p));

    if (
      !classFun ||
      !classFun.constructor ||
      classFun?.constructor?.name === 'Object'
    ) {
      return Utils.uniqArray(allMethodsNames);
    }
    return getMethodsNames(Object.getPrototypeOf(classFun), allMethodsNames);
  };
  //#endregion

  //#region get controller configs
  export const getControllerConfigs = (
    target: Function,
    configs: ControllerConfig[] = [],
    callerTarget?: Function,
  ): ControllerConfig[] => {
    if (!_.isFunction(target)) {
      throw `[typescript-class-helper][getControllerConfigs] Cannot get class config from: ${target}`;
    }

    let config: ControllerConfig;
    const parentClass = Object.getPrototypeOf(target);
    const parentName = parentClass ? ClassHelpers.getName(parentClass) : void 0;
    const isValidParent = _.isFunction(parentClass) && parentName !== '';

    config = controllerConfigFrom(getClassConfig(target));

    configs.push(config);

    return isValidParent
      ? getControllerConfigs(parentClass, configs, target)
      : configs;
  };
  //#endregion

  //#region ensure configs

  // Ensure ClassConfig on constructor, clone parent if needed
  export const ensureClassConfig = (
    target: Function,
  ): Partial<ControllerConfig> => {
    let cfg: Partial<ControllerConfig> = Reflect.getOwnMetadata(
      Symbols.metadata.options.controller, // META_KEYS.class,
      target,
    );

    if (!cfg) {
      cfg = { methods: {} };

      const parent = Object.getPrototypeOf(target);
      if (parent && parent !== Function.prototype) {
        const parentCfg: Partial<ControllerConfig> = Reflect.getMetadata(
          Symbols.metadata.options.controller, // META_KEYS.class,
          parent,
        );
        if (parentCfg) {
          // Deep copy each method config so child gets its own objects
          const clonedMethods: Record<
            string | symbol,
            Partial<MethodConfig>
          > = {};
          for (const [k, v] of Object.entries(parentCfg.methods)) {
            clonedMethods[k] = {
              ...v,
              parameters: { ...v.parameters }, // shallow clone parameters too
            };
          }

          cfg = {
            ...parentCfg,
            methods: clonedMethods,
          };
        }
      }

      Reflect.defineMetadata(Symbols.metadata.options.controller, cfg, target);
    }

    return cfg;
  };

  // Ensure MethodConfig inside ClassConfig
  export const ensureMethodConfig = (
    target: any,
    propertyKey: string | symbol,
  ): Partial<MethodConfig> => {
    const classCfg = ensureClassConfig(target.constructor);
    let methodCfg: Partial<MethodConfig> =
      classCfg.methods[propertyKey?.toString()];
    if (!methodCfg) {
      methodCfg = { methodName: propertyKey?.toString(), parameters: {} };
      classCfg.methods[propertyKey?.toString()] = methodCfg as MethodConfig;
    }
    return methodCfg;
  };

  export const getClassConfig = (
    constructor: Function,
  ): Partial<ControllerConfig> | undefined => {
    return Reflect.getMetadata(
      Symbols.metadata.options.controller,
      constructor,
    );
  };
  //#endregion
}
