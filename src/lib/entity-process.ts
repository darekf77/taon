//#region imports
import { _ } from 'tnp-core/src';
import { Symbols } from './symbols';
import { walk } from 'lodash-walk-object/src';
import { config } from 'tnp-config/src';
import { JSON10 } from 'json10/src';
import { ClassHelpers } from './helpers/class-helpers';
import { Mapping } from 'ng2-rest/src';
import { Response } from 'express';
//#endregion

//#region get transform function
/**
 * @deprecated
 */
export const getTransformFunction = (target: Function) => {
  if (!target) {
    return;
  }

  // const className = ClassHelpers.getName(target)
  // target = ClassHelpers.getBy(className);

  if (!target) {
    return void 0;
  }
  const configs = ClassHelpers.getControllerConfigs(target);
  // console.log(`CONFIGS TO CHECK`, configs)
  const functions = configs
    .map(c => {
      if (_.isFunction(c.browserTransformFn)) {
        return c.browserTransformFn;
      }
    })
    .filter(f => _.isFunction(f));
  return functions.length === 0
    ? void 0
    : function (entity) {
        for (let index = functions.length - 1; index >= 0; index--) {
          const transformFun = functions[index];
          transformFun(entity);
        }
        return entity;
      };
};
//#endregion

//#region single transform
/**
 * @deprecated
 */
export const singleTransform = (json: any) => {
  let ptarget = ClassHelpers.getClassFnFromObject(json);
  let pbrowserTransformFn = getTransformFunction(ptarget);
  if (pbrowserTransformFn) {
    const newValue = pbrowserTransformFn(json);
    if (!_.isObject(newValue)) {
      console.error(
        `Please return object in transform function for class: ` +
          `${ClassHelpers.getName(json)}`,
      );
    } else {
      json = newValue;
    }
  }
  return json;
};
//#endregion

export class EntityProcess {
  //#region init
  static async init(result: any, response: Response) {
    return await new EntityProcess(result, response).run();
  }
  //#endregion

  //#region fields
  /**
   * Data to send
   */
  data: any;

  /**
   * Say yes to:
   * - circural object
   * - transform browser fn in decorator
   */
  private advancedManipulation: boolean = false;
  private entityMapping: any;
  private circural = [];
  //#endregion

  //#region constructor
  constructor(
    /**
     * Data from backend
     */
    private result: any,
    private response: Response,
  ) {}
  //#endregion

  //#region check advanced manipulation
  private checkAdvancedManiupulation() {
    if (_.isFunction(this.result)) {
      this.advancedManipulation = true;
      this.result = this.result();
    }
  }
  //#endregion

  //#region run
  public async run() {
    this.checkAdvancedManiupulation();
    this.data = this.result;

    if (_.isObject(this.result)) {
      if (this.advancedManipulation) {
        this.applayTransformFn();
      }

      this.setHeaders();
    }
    this.send();
  }
  //#endregion

  //#region apply transform function
  applayTransformFn() {
    if (_.isObject(this.data) && !_.isArray(this.data)) {
      this.data = singleTransform(this.data);
    }
    const { include } = { include: [] };
    walk.Object(
      this.data,
      (value, lodashPath, changeValue, { skipObject, isCircural }) => {
        // console.log(`${isCircural ? 'CIR' : 'NOT'} : ${lodashPath}`)
        if (!isCircural) {
          if (!_.isArray(value) && _.isObject(value)) {
            changeValue(singleTransform(value));
          }
        }
      },
      { checkCircural: true, breadthWalk: true, include },
    );

    const { circs } = walk.Object(this.data, void 0, {
      checkCircural: true,
      breadthWalk: true,
      include,
    });
    this.circural = circs;
  }
  //#endregion

  //#region set headers
  setHeaders(): void {
    const { include } = { include: [] };

    const className = ClassHelpers.getName(this.data);
    const doNothing =
      _.isNil(this.data) ||
      [
        'Object',
        '',
        //  void 0, null // TODO  not sure about commenting this
      ].includes(className);
    // console.log('doNothing', doNothing)
    if (!doNothing) {
      const cleaned = JSON10.cleaned(this.data, void 0, {
        breadthWalk: true,
        include,
      });
      this.entityMapping = Mapping.decode(cleaned, !this.advancedManipulation);

      this.response.set(
        Symbols.old.MAPPING_CONFIG_HEADER,
        JSON.stringify(this.entityMapping),
      );
      if (this.advancedManipulation) {
        this.response.set(
          Symbols.old.CIRCURAL_OBJECTS_MAP_BODY,
          JSON.stringify(this.circural),
        );
      }
    }
  }
  //#endregion

  //#region send
  send() {
    if (!_.isObject(this.data)) {
      if (_.isNumber(this.data)) {
        this.response.send(this.data.toString());
      } else {
        this.response.send(this.data);
      }
      return;
    }
    if (this.advancedManipulation) {
      const browserKey = config.folder.browser;
      let toSend = _.isArray(this.data) ? [] : {};

      const { include = [], exclude = [] } = { include: [], exclude: [] };

      walk.Object(
        this.data,
        (value, lodashPath, changeVAlue, { isCircural, skipObject }) => {
          // console.log(`${isCircural ? 'CIR' : 'NOT'} ${lodashPath}`)
          if (isCircural) {
            _.set(toSend, lodashPath, null);
          } else {
            const fun = getTransformFunction(
              ClassHelpers.getClassFnFromObject(value),
            );

            if (_.isFunction(fun)) {
              _.set(toSend, `${lodashPath}.${browserKey}`, value[browserKey]);
              const indexProp = ClassHelpers.getUniqueKey(value);
              _.set(toSend, `${lodashPath}.${indexProp}`, value[indexProp]);
              // skipObject()
            } else {
              _.set(toSend, lodashPath, value);
            }
          }
        },
        { checkCircural: true, breadthWalk: true, include },
      );

      if (!_.isArray(this.data)) {
        let funParent = getTransformFunction(
          ClassHelpers.getClassFnFromObject(this.data),
        );
        // if (this.mdc && this.mdc.exclude && this.mdc.exclude.length > 0) {
        //   console.log(`funParent !!! have fun? ${!!funParent} `)
        // }
        if (_.isFunction(funParent)) {
          toSend = {
            [browserKey]: toSend[browserKey],
          };
        }
        Object.keys(this.data).forEach(prop => {
          if (prop !== browserKey) {
            const v = this.data[prop];
            if (
              !(
                (include.length > 0 && !include.includes(prop)) ||
                (exclude.length > 0 && exclude.includes(prop))
              )
            ) {
              if (
                ClassHelpers.isContextClassObject(v) &&
                _.isFunction(
                  getTransformFunction(ClassHelpers.getClassFnFromObject(v)),
                )
              ) {
                toSend[prop] = {
                  [browserKey]: v[browserKey],
                };
                const indexProp = ClassHelpers.getUniqueKey(v);
                toSend[prop][indexProp] = this.data[prop][indexProp];
                for (const key in v) {
                  if (
                    _.isObject(v) &&
                    v.hasOwnProperty(key) &&
                    ![indexProp, config.folder.browser].includes(key) &&
                    (_.isString(v[key]) ||
                      _.isNumber(v[key]) ||
                      _.isDate(v[key]) ||
                      _.isNull(v[key]) ||
                      _.isBoolean(v[key]))
                  ) {
                    toSend[prop][key] = v[key];
                  }
                }
              } else {
                toSend[prop] = v;
              }
            }
          }
        });
      }

      // toSend = Helpers.JSON.cleaned(toSend, void 0, { breadthWalk: true })
      this.response.json(toSend);
    } else {
      this.response.json(this.data);
    }
  }
  //#endregion
}
