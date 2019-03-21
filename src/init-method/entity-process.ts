//#region @backend
import * as _ from 'lodash';

import { Global } from '../global-config';
import { Helpers } from '../helpers';
import { getTransformFunction, singleTransform } from './transform-to-browser';
import { SYMBOL } from '../symbols';
import * as express from 'express';
import { walk } from 'lodash-walk-object';
import { CLASS } from 'typescript-class-helpers';
import { BASE_ENTITY } from '../framework';
import { ModelDataConfig } from '../crud';

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
  private mdc: ModelDataConfig;

  public async run() {
    this.checkAdvancedManiupulation()
    this.data = this.result;

    if (!_.isObject(this.result)) {
      return;
    }

    if (this.advancedManipulation) {

      this.resolveModelDataConfig();

      const { include, exclude } = this.mdc;
      console.log(`BASE INCLUDE: ${include}`)
      console.log(`BASE EXCLUDE: ${exclude}`)
      this.applayTransformFn()
    }

    this.setHeaders()
    this.send()
  }

  resolveModelDataConfig() {
    this.mdc = ((_.isArray(this.data) ? _.first(this.data) : this.data) as BASE_ENTITY<any>).modelDataConfig
    if (_.isObject(this.mdc) && _.isArray(this.mdc.include) && this.mdc.include.length > 0) {

      const toAdd = this.mdc.include.map(c => `browser.${c}`);
      this.mdc.include.push('browser')
      toAdd.forEach(c => this.mdc.include.push(c))
    }
  }

  applayTransformFn() {
    if (_.isObject(this.data) && !_.isArray(this.data)) {
      this.data = singleTransform(this.data)
    }
    walk.Object(this.data, (value, lodashPath, changeValue, { skipObject, isCircural }) => {

      if (!_.isArray(value) && _.isObject(value) && !isCircural) {
        changeValue(singleTransform(value))
      }
    }, { checkCircural: true, breadthWalk: true })

    const { circs } = walk.Object(this.data, void 0, { checkCircural: true, breadthWalk: true })
    this.circural = circs;
  }

  setHeaders() {
    const { include, exclude } = this.mdc;
    const cleaned = Helpers.JSON.cleaned(this.data, void 0, { breadthWalk: true, include, exclude })
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

      const browserKey = 'browser';
      let toSend = _.isArray(this.data) ? [] : {};
      if (!_.isArray(this.data)) {
        let funParent = getTransformFunction(CLASS.getFromObject(this.data));
        if (_.isFunction(funParent)) {
          toSend[browserKey] = this.data[browserKey];
        }
      }

      const { include, exclude } = this.mdc;

      walk.Object(this.data, (value, lodashPath, changeVAlue, { isCircural }) => {
        if (!isCircural) {
          const fun = getTransformFunction(CLASS.getFromObject(value));
          if (_.isFunction(fun)) {
            _.set(toSend, `${lodashPath}.${browserKey}`, value[browserKey]);
          } else {
            _.set(toSend, lodashPath, value);
          }

        }
      }, { checkCircural: true, breadthWalk: true, include, exclude })
      toSend = Helpers.JSON.cleaned(toSend, void 0, { breadthWalk: true })
      this.response.json(toSend)
    } else {
      this.response.json(this.data)
    }
  }

}

//#endregion
