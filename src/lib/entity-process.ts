//#region imports
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
   * Data to send.
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
     * Express response.
     */
    private response: Response,
  ) {}

  //#endregion

  //#region run

  public async run(resultFromControllerMethod: any): Promise<void> {
    let advancedManipulation = false;

    if (_.isFunction(resultFromControllerMethod)) {
      const resultFn: Models.Http.SyncResponseFunc<any> =
        resultFromControllerMethod as any;

      await resultFn({
        circResponse: (circData: any) => {
          advancedManipulation = true;
          this.responseHandled = true;

          const { circs, data } = applayTransformFn(circData);

          this.data = data;

          if (_.isObject(this.data)) {
            this.setHeaders(advancedManipulation, circs);
          }

          this.send(advancedManipulation);
        },

        streamResponse: async (
          options: Models.Http.TaonStreamResponseOptions,
        ) => {
          this.responseHandled = true;

          await this.streamResponse(options);
        },
      });

      /**
       * Advanced response function may theoretically decide not to call
       * circResponse/streamResponse. Do not automatically send anything here.
       *
       * The response lifecycle belongs to the advanced response callback.
       */
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

  private async streamResponse(
    options: Models.Http.TaonStreamResponseOptions,
  ): Promise<void> {
    const {
      stream,
      statusCode = 200,
      contentType = 'application/octet-stream',
      filename,
      disposition = filename ? 'attachment' : undefined,
      contentLength,
      headers = {},
    } = options;

    if (this.response.headersSent) {
      throw new Error(
        '[taon] Cannot start stream response - response headers were already sent.',
      );
    }

    //#region headers

    this.response.status(statusCode);

    this.response.setHeader('Content-Type', contentType);

    if (!_.isNil(contentLength)) {
      this.response.setHeader('Content-Length', String(contentLength));
    }

    if (disposition) {
      const value = filename
        ? `${disposition}; filename="${this.escapeHeaderFilename(filename)}"`
        : disposition;

      this.response.setHeader('Content-Disposition', value);
    }

    for (const [headerName, headerValue] of Object.entries(headers)) {
      this.response.setHeader(headerName, headerValue);
    }

    //#endregion

    const reader = stream.getReader();

    let clientDisconnected = false;
    let streamCompleted = false;

    const onResponseClose = () => {
      /**
       * "close" can also happen after a normal response finish.
       * Only treat it as cancellation when streaming has not completed.
       */
      if (!streamCompleted) {
        clientDisconnected = true;

        /**
         * Do not await inside the event callback.
         * reader.cancel() propagates cancellation upstream through
         * the Web Streams pipeline.
         */
        void reader.cancel(
          new Error('[taon] HTTP client disconnected during stream response.'),
        );
      }
    };

    this.response.once('close', onResponseClose);

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          streamCompleted = true;
          break;
        }

        if (clientDisconnected || this.response.destroyed) {
          break;
        }

        if (!value || value.byteLength === 0) {
          continue;
        }

        const canContinue = this.response.write(Buffer.from(value));

        if (!canContinue) {
          await this.waitForDrainOrClose();
        }
      }

      if (
        streamCompleted &&
        !clientDisconnected &&
        !this.response.destroyed &&
        !this.response.writableEnded
      ) {
        this.response.end();
      }
    } catch (error) {
      /**
       * If the browser/client intentionally disconnected, there is no HTTP
       * response left to report the error through.
       */
      if (clientDisconnected || this.response.destroyed) {
        return;
      }

      if (!this.response.headersSent) {
        this.response.status(500).end();
        return;
      }

      this.response.destroy(
        error instanceof Error
          ? error
          : new Error(`[taon] Stream response failed: ${String(error)}`),
      );
    } finally {
      this.response.off('close', onResponseClose);

      try {
        reader.releaseLock();
      } catch {
        // Reader may already have been released/cancelled.
      }
    }
  }

  private waitForDrainOrClose(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const onDrain = () => {
        cleanup();
        resolve();
      };

      const onClose = () => {
        cleanup();
        resolve();
      };

      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        this.response.off('drain', onDrain);
        this.response.off('close', onClose);
        this.response.off('error', onError);
      };

      this.response.once('drain', onDrain);
      this.response.once('close', onClose);
      this.response.once('error', onError);
    });
  }

  private escapeHeaderFilename(filename: string): string {
    return filename
      .replace(/[\r\n]/g, '')
      .replace(/\\/g, '_')
      .replace(/"/g, "'");
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

  send(advancedManipulation: boolean): void {
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
