//#region imports
import type { Readable } from 'node:stream';

import type { Response } from 'express';
import { walk } from 'lodash-walk-object/src';
import { decodeMappingForHeaderJson } from 'ng2-rest/src';
import { _ } from 'tnp-core/src';
import { config } from 'tnp-core/src';

import {
  applayTransformFn,
  getTransformFunction,
} from './entity-process-helpers';
import { ClassHelpers } from './helpers/class-helpers';
import { Models } from './models';
import { Symbols } from './symbols';
//#endregion

export class EntityProcess {
  //#region fields
  /**
   * Data to send
   */
  private data: any;

  /**
   * True when response lifecycle was taken over by
   * circResponse / streamResponse / etc.
   */
  private responseHandled = false;

  //#endregion

  //#region constructor
  constructor(
    /**
     * Data from backend
     */
    private response: Response,
  ) {}
  //#endregion

  //#region run
  public async run(resultFromControllerMethod: any) {
    let advancedManipulation = false;

    if (_.isFunction(resultFromControllerMethod)) {
      advancedManipulation = true;

      const resultFn: Models.Http.SyncResponseFunc<any> =
        resultFromControllerMethod as any;

      await resultFn({
        circResponse: (circData: any) => {
          this.responseHandled = true;

          const { circs, data } = applayTransformFn(circData);

          this.data = data;

          if (_.isObject(this.data)) {
            this.setHeaders(advancedManipulation, circs);
          }

          this.send(advancedManipulation);
        },

        streamResponse: (stream: Readable) => {
          this.responseHandled = true;
          this.streamResponse(stream);
        },
      });

      return;
    }

    this.data = resultFromControllerMethod;

    if (_.isObject(this.data)) {
      this.setHeaders(advancedManipulation, []);
    }

    this.send(advancedManipulation);
  }
  //#endregion

  //#region stream response
  private streamResponse(stream: Readable): void {
    stream.on('error', error => {
      if (!this.response.headersSent) {
        this.response.status(500).end();
        return;
      }

      this.response.destroy(error);
    });

    stream.pipe(this.response);
  }
  //#endregion

  //#region set headers
  setHeaders(advancedManipulation: boolean, circs: any[]): void {
    const className = ClassHelpers.getName(this.data);

    const doNothing = _.isNil(this.data) || ['Object', ''].includes(className);

    if (!doNothing) {
      const entityMapping = decodeMappingForHeaderJson(this.data, {
        useFirstArrayItemClassNameForAllElements: !advancedManipulation,
      });

      this.response.set(
        Symbols.old.MAPPING_CONFIG_HEADER,
        JSON.stringify(entityMapping),
      );

      if (advancedManipulation) {
        this.response.set(
          Symbols.old.CIRCURAL_OBJECTS_MAP_BODY_PARAM,
          JSON.stringify(circs),
        );
      }
    }
  }
  //#endregion

  //#region send
  send(advancedManipulation: boolean) {
    if (advancedManipulation) {
      const browserKey = config.folder.browser;
      let toSend = _.isArray(this.data) ? [] : {};

      const { include = [], exclude = [] } = {
        include: [],
        exclude: [],
      };

      walk.Object(
        this.data,
        (value, lodashPath, changeVAlue, { isCircural, skipObject }) => {
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
            } else {
              _.set(toSend, lodashPath, value);
            }
          }
        },
        {
          checkCircural: true,
          breadthWalk: true,
          include,
          walkGetters: false,
        },
      );

      if (!_.isArray(this.data)) {
        const funParent = getTransformFunction(
          ClassHelpers.getClassFnFromObject(this.data),
        );

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

      this.response.json(toSend);
    } else {
      this.response.json(this.data);
    }
  }
  //#endregion
}
