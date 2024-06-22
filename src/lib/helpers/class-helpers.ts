import { Symbols } from '../symbols';
import { Validators } from '../validators';
import { _ } from 'tnp-core/src';
import { Models } from '../models';
import { FiredevControllerOptions } from '../decorators/classes/controller-decorator';
import { FiredevHelpers } from './firedev-helpers';
import { FiredevEntityOptions } from '../decorators/classes/entity-decorator';
//#region @backend
import * as FormData from 'form-data';

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
      void 0
    );
  };
  //#endregion

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

  //#region get uniqu key
  export const getUniquKey = (classFnOrObject: any): string => {
    const classFn = _.isFunction(classFnOrObject)
      ? classFnOrObject
      : classFnOrObject.constructor;
    const config = Reflect.getMetadata(
      Symbols.metadata.options.controller,
      classFn,
    ) as FiredevEntityOptions;
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

  //#region get all metadata for controller
  export const getControllerConfig = (
    target: Function,
  ): Models.ControllerConfig | undefined => {
    const classMetadataOptions: FiredevControllerOptions = Reflect.getMetadata(
      Symbols.metadata.options.controller,
      target,
    );
    const classMetadata: Models.ControllerConfig = _.merge(
      new Models.ControllerConfig(),
      classMetadataOptions,
    );

    // Iterate over all methods of the class
    const methodNames = ClassHelpers.getMethodsNames(target); //  Object.getOwnPropertyNames(target.prototype);
    // console.log(`methodNames for ${ClassHelpers.getName(target)} `, methodNames)
    for (const methodName of methodNames) {
      const methodMetadata: Models.MethodConfig = Reflect.getMetadata(
        Symbols.metadata.options.controllerMethod,
        target,
        methodName,
      );
      // console.log('methodMetadata for ' + methodName, methodMetadata)
      if (methodMetadata) {
        classMetadata.methods[methodName] = methodMetadata;
      }
    }
    return classMetadata;
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

  export const getMethodsNames = (
    classOrClassInstance: any,
    allMethodsNames = [],
  ): string[] => {
    if (!classOrClassInstance) {
      return allMethodsNames;
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
      return allMethodsNames;
    }
    return getMethodsNames(Object.getPrototypeOf(classFun), allMethodsNames);
  };
  //#endregion

  //#region get controller configs
  export const getControllerConfigs = (
    target: Function,
    configs: Models.ControllerConfig[] = [],
    callerTarget?: Function,
  ): Models.RuntimeControllerConfig[] => {
    if (!_.isFunction(target)) {
      throw `[typescript-class-helper][getClassConfig] Cannot get class config from: ${target}`;
    }

    let config: Models.RuntimeControllerConfig;
    const parentClass = Object.getPrototypeOf(target);
    const isValidParent = _.isFunction(parentClass) && parentClass.name !== '';

    config = getControllerConfig(target);

    configs.push(config);

    return isValidParent
      ? getControllerConfigs(parentClass, configs, target)
      : configs;
  };
  //#endregion

  //#region get path for
  export const getCalculatedPathFor = (target: Function) => {
    const configs = getControllerConfigs(target);

    const parentscalculatedPath = _.slice(configs, 1)
      .reverse()
      .map(bc => {
        if (FiredevHelpers.isGoodPath(bc.path)) {
          return bc.path;
        }
        return bc.className;
      })
      .join('/');

    return `/${parentscalculatedPath}/${ClassHelpers.getName(target)}`;
  };
  //#endregion
}
