//#region @backend
import * as _ from 'lodash';

import { Global } from '../global-config';
import { Helpers } from '../helpers';
import { transformToBrowserVersion, getTransformFunction } from './transform-to-browser';
import { SYMBOL } from '../symbols';
import * as express from 'express';
import { walk } from 'lodash-walk-object';


export class EntityProcess {

  static async init(result: any, res: express.Response) {
    return await (new EntityProcess(result).start(res));
  }

  constructor(
    private result: any
  ) {

  }




  useCircuralFinding = true;
  async start(res: express.Response) {


    if (_.isFunction(this.result)) {
      this.useCircuralFinding = false;
      this.result = this.result()
    }
    // console.log('result', result)
    if (_.isObject(this.result)) {
      let cleanedResult = this.result;
      if (this.useCircuralFinding) {
        var circural = [];
        cleanedResult = Helpers.JSON.cleaned(this.result, circs => {
          circural = circural.concat(_.cloneDeep(circs))
        })

        // let circsCount = 0;

        while (true) {
          let nextCircs = [];
          cleanedResult = transformToBrowserVersion(cleanedResult, (modified) => {
            let resCleanedResult = Helpers.JSON.cleaned(modified);
            const circsToAdd = _.cloneDeep(Helpers.JSON.circural);
            nextCircs = nextCircs.concat(circsToAdd);
            return resCleanedResult;
          })
          cleanedResult = Helpers.JSON.cleaned(cleanedResult)
          nextCircs = nextCircs.concat(_.cloneDeep(Helpers.JSON.circural));
          circural = circural.concat(nextCircs);
          // circsCount++;
          if (Helpers.JSON.circural.length === 0) {
            // console.log(`Exit circ count ${circsCount}`)
            break;
          }
        }

      }

      // console.log('cleaned result', cleanedResult)
      // console.log('circural', circural)
      const entity = Helpers.Mapping.decode(cleanedResult, !Global.vars.isProductionMode);

      res.set(SYMBOL.MAPPING_CONFIG_HEADER, JSON.stringify(entity));
      if (this.useCircuralFinding) {
        res.set(SYMBOL.CIRCURAL_OBJECTS_MAP_BODY, JSON.stringify(circural));
      }

      res.json(cleanedResult);
    }

    else {
      res.send(this.result)
    }
  }


}




//#endregion
