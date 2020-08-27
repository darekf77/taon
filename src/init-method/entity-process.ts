//#region @backend
import * as _ from 'lodash';

import { GlobalConfig } from '../global-config';
import { Helpers } from '../helpers';
import { getTransformFunction, singleTransform } from './transform-to-browser';
import { SYMBOL } from '../symbols';
import * as express from 'express';
import { walk } from 'lodash-walk-object';
import { CLASS } from 'typescript-class-helpers';
import { BASE_ENTITY } from '../framework';
import { ModelDataConfig } from '../crud';
import { config } from '../build/config';

export class EntityProcess {

  static async init(result: any, response: express.Response, mdc: ModelDataConfig) {
    return await (new EntityProcess(result, response).run(mdc));
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
  private mdc: ModelDataConfig;

  public async run(mdc: ModelDataConfig) {
    this.checkAdvancedManiupulation()
    this.data = this.result;
    this.mdc = mdc;

    if (_.isObject(this.result)) {
      if (this.advancedManipulation) {

        this.resolveModelDataConfig();
        this.applayTransformFn()
      }

      this.setHeaders()
    }
    this.send()
  }

  resolveModelDataConfig() {

    if (_.isObject(this.mdc)) {
      if (_.isArray(this.mdc.include) && this.mdc.include.length > 0) {

        const toAdd = this.mdc.include.map(c => `browser.${c}`);
        this.mdc.include.push('browser')
        toAdd.forEach(c => this.mdc.include.push(c))
      } else if (_.isArray(this.mdc.exclude) && this.mdc.exclude.length > 0) {
        const toAdd = this.mdc.exclude.map(c => `browser.${c}`);
        // this.mdc.exclude.push('browser')
        toAdd.forEach(c => this.mdc.exclude.push(c))
      }
    }

  }

  applayTransformFn() {
    if (_.isObject(this.data) && !_.isArray(this.data)) {
      this.data = singleTransform(this.data, this.mdc)
    }
    const { include } = this.mdc || { include: [] };
    walk.Object(this.data, (value, lodashPath, changeValue, { skipObject, isCircural }) => {
      // console.log(`${isCircural ? 'CIR' : 'NOT'} : ${lodashPath}`)
      if (!isCircural) {
        if (!_.isArray(value) && _.isObject(value)) {
          changeValue(singleTransform(value, this.mdc))
        }
      }

    }, { checkCircural: true, breadthWalk: true, include })

    const { circs } = walk.Object(this.data, void 0, { checkCircural: true, breadthWalk: true, include })
    this.circural = circs;
  }

  setHeaders() {
    const { include } = this.mdc || { include: [] };
    const cleaned = Helpers.JSON.cleaned(this.data, void 0, { breadthWalk: true, include })
    this.entityMapping = Helpers.Mapping.decode(cleaned, !this.advancedManipulation);

    this.response.set(SYMBOL.MAPPING_CONFIG_HEADER, JSON.stringify(this.entityMapping));
    if (this.advancedManipulation) {
      this.response.set(SYMBOL.CIRCURAL_OBJECTS_MAP_BODY, JSON.stringify(this.circural));
    }
  }


  send() {
    if (!_.isObject(this.data)) {
      this.response.send(this.data)
      return
    }
    if (this.advancedManipulation) {

      const browserKey = config.folder.browser;
      let toSend = _.isArray(this.data) ? [] : {};


      const { include = [], exclude = [] } = this.mdc || { include: [], exclude: [] };

      walk.Object(this.data, (value, lodashPath, changeVAlue, { isCircural, skipObject }) => {
        // console.log(`${isCircural ? 'CIR' : 'NOT'} ${lodashPath}`)
        if (isCircural) {
          _.set(toSend, lodashPath, null);
        } else {
          const fun = getTransformFunction(CLASS.getFromObject(value), this.mdc);

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
        let funParent = getTransformFunction(CLASS.getFromObject(this.data), this.mdc);
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
                _.isFunction(getTransformFunction(CLASS.getFromObject(v), this.mdc))) {
                toSend[prop] = {
                  [browserKey]: v[browserKey]
                }
                const indexProp = CLASS.OBJECT(v).indexProperty;
                toSend[prop][indexProp] = this.data[prop][indexProp]
                for (const key in v) {
                  if (v.hasOwnProperty(key) &&
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
