//#region @websql
import { _ } from 'tnp-core';
import { MorphiHelpers } from '../helpers';
import { getTransformFunction, singleTransform } from './transform-to-browser';
import { SYMBOL } from '../symbols';
import * as express from 'express';
import { walk } from 'lodash-walk-object';
import { CLASS } from 'typescript-class-helpers';
import { config } from 'tnp-config';

export class EntityProcess {

  static async init(result: any, response: express.Response) {
    return await (new EntityProcess(result, response).run());
  }

  /**
   * Data to send
   */
  data: any;

  constructor(
    /**
     * Data from backend
     */
    private result: any,
    private response: express.Response
  ) {

  }

  /**
   * Say yes to:
   * - circural object
   * - transform browser fn in decorator
   */
  private advancedManipulation = false;
  private checkAdvancedManiupulation() {
    if (_.isFunction(this.result)) {
      this.advancedManipulation = true;
      this.result = this.result()
    }
  }

  private entityMapping: any;
  private circural = [];

  public async run() {
    this.checkAdvancedManiupulation()
    this.data = this.result;

    if (_.isObject(this.result)) {
      if (this.advancedManipulation) {
        this.applayTransformFn()
      }

      this.setHeaders()
    }
    this.send()
  }


  applayTransformFn() {
    if (_.isObject(this.data) && !_.isArray(this.data)) {
      this.data = singleTransform(this.data)
    }
    const { include } = { include: [] };
    walk.Object(this.data, (value, lodashPath, changeValue, { skipObject, isCircural }) => {
      // console.log(`${isCircural ? 'CIR' : 'NOT'} : ${lodashPath}`)
      if (!isCircural) {
        if (!_.isArray(value) && _.isObject(value)) {
          changeValue(singleTransform(value))
        }
      }

    }, { checkCircural: true, breadthWalk: true, include })

    const { circs } = walk.Object(this.data, void 0, { checkCircural: true, breadthWalk: true, include })
    this.circural = circs;
  }

  setHeaders() {
    const { include } = { include: [] };

    const className = CLASS.getNameFromObject(this.data);
    // console.log(`CLASS.getNameFromObject(this.data) ${className}`)
    const doNothing = _.isNil(this.data) || ['Object', '', void 0, null].includes(className);
    // console.log('doNothing', doNothing)
    if (!doNothing) {
      const cleaned = MorphiHelpers.JSON.cleaned(this.data, void 0, { breadthWalk: true, include })
      this.entityMapping = MorphiHelpers.Mapping.decode(cleaned, !this.advancedManipulation);

      this.response.set(SYMBOL.MAPPING_CONFIG_HEADER, JSON.stringify(this.entityMapping));
      if (this.advancedManipulation) {
        this.response.set(SYMBOL.CIRCURAL_OBJECTS_MAP_BODY, JSON.stringify(this.circural));
      }
    }
  }


  send() {
    if (!_.isObject(this.data)) {
      if (_.isNumber(this.data)) {
        this.response.send(this.data.toString());
      } else {
        this.response.send(this.data)
      }
      return
    }
    if (this.advancedManipulation) {

      const browserKey = config.folder.browser;
      let toSend = _.isArray(this.data) ? [] : {};


      const { include = [], exclude = [] } = { include: [], exclude: [] };

      walk.Object(this.data, (value, lodashPath, changeVAlue, { isCircural, skipObject }) => {
        // console.log(`${isCircural ? 'CIR' : 'NOT'} ${lodashPath}`)
        if (isCircural) {
          _.set(toSend, lodashPath, null);
        } else {
          const fun = getTransformFunction(CLASS.getFromObject(value));

          if (_.isFunction(fun)) {
            _.set(toSend, `${lodashPath}.${browserKey}`, value[browserKey]);
            const indexProp = CLASS.OBJECT(value).indexProperty;
            _.set(toSend, `${lodashPath}.${indexProp}`, value[indexProp]);
            // skipObject()
          } else {
            _.set(toSend, lodashPath, value);
          }

        }
      }, { checkCircural: true, breadthWalk: true, include })

      if (!_.isArray(this.data)) {
        let funParent = getTransformFunction(CLASS.getFromObject(this.data));
        // if (this.mdc && this.mdc.exclude && this.mdc.exclude.length > 0) {
        //   console.log(`funParent !!! have fun? ${!!funParent} `)
        // }
        if (_.isFunction(funParent)) {
          toSend = {
            [browserKey]: toSend[browserKey]
          };
        }
        Object.keys(this.data).forEach(prop => {
          if (prop !== browserKey) {
            const v = this.data[prop];
            if (!(
              ((include.length > 0) && !include.includes(prop)) ||
              ((exclude.length > 0) && exclude.includes(prop))
            )) {
              if (CLASS.OBJECT(v).isClassObject &&
                _.isFunction(getTransformFunction(CLASS.getFromObject(v)))) {
                toSend[prop] = {
                  [browserKey]: v[browserKey]
                }
                const indexProp = CLASS.OBJECT(v).indexProperty;
                toSend[prop][indexProp] = this.data[prop][indexProp]
                for (const key in v) {
                  if (_.isObject(v) && v.hasOwnProperty(key) &&
                    ![indexProp, config.folder.browser].includes(key) &&
                    (
                      _.isString(v[key]) ||
                      _.isNumber(v[key]) ||
                      _.isDate(v[key]) ||
                      _.isNull(v[key]) ||
                      _.isBoolean(v[key])
                    )
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
      this.response.json(toSend)
    } else {
      this.response.json(this.data)
    }
  }

}

//#endregion
