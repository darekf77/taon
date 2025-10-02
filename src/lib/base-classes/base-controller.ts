import * as FormData from 'form-data'; // @backend
import { crossPlatformPath, fse, path } from 'tnp-core/src'; // @backend

import { TaonController } from '../decorators/classes/controller-decorator';
import { POST } from '../decorators/http/http-methods-decorators';
import { Body, Path, Query } from '../decorators/http/http-params-decorators';
import type { EndpointContext } from '../endpoint-context';
import type { Models } from '../models';

import { BaseFileUploadMiddleware } from './base-file-upload.middleware';
import { BaseInjector } from './base-injector';

export interface MulterFileUploadResponse {
  ok: boolean;
  originalName: string;
  /**
   * name change to this to avoid confusion with originalname
   * (similar to originalname with added uniq part)
   */
  savedAs: string;
  size: number;
  mimetype: string;
}

@TaonController<BaseController>({
  className: 'BaseController',
})
export class BaseController<T = any> extends BaseInjector {
  /**
   * Hook that is called when taon app is inited
   * (all contexts are created and inited)
   */
  async afterAllCtxInited(allContexts?: {
    [contextName: string]: EndpointContext;
  }): Promise<void> {}

  //#region upload form data to server
  @POST({
    overrideContentType: 'multipart/form-data',
    middlewares: ({ parentMiddlewares }) => ({
      ...parentMiddlewares,
      BaseFileUploadMiddleware,
    }),
  })
  uploadFormDataToServer(
    @Body() formData: FormData,
  ): Models.Http.Response<MulterFileUploadResponse[]> {
    //#region @backendFunc
    return async (req, res) => {
      const files = req.files;
      if (!files) {
        throw 'No file(s) received';
      }
      const responseArr = (files as any[]).map(f => {
        const savedAbs = crossPlatformPath(path.resolve(f.path));
        // const savedRel = crossPlatformPath(
        //   path.relative(this.ctx.cwd, savedAbs),
        // );
        return {
          ok: true,
          originalName: f.originalname,
          savedAs: path.basename(savedAbs),
          // savedPath: void 0, // not needed
          size: f.size,
          mimetype: f.mimetype,
        };
      });
      // console.log(responseArr);
      for (const res of responseArr) {
        await this.afterFileUploadAction(res);
      }
      return responseArr;
    };
    //#endregion
  }
  //#endregion

  //#region after file upload hook
  /**
   * Hook after file is uploaded
   * through `uploadFormDataToServer` or `uploadLocalFileToServer`
   */
  protected afterFileUploadAction(
    file: MulterFileUploadResponse,
  ): void | Promise<void> {
    // empty
  }

  //#region upload local file to server
  async uploadLocalFileToServer(
    absFilePath: string,
    options?: Pick<
      Models.Http.Rest.Ng2RestAxiosRequestConfig,
      'onUploadProgress'
    >,
  ): Promise<MulterFileUploadResponse[]> {
    //#region @backendFunc
    const stat = fse.statSync(absFilePath);
    const stream = fse.createReadStream(absFilePath);

    const form = new FormData();
    form.append('file', stream, {
      filename: path.basename(absFilePath),
      knownLength: stat.size,
    });

    const data = await this.uploadFormDataToServer(form).request(options || {});
    return data.body.json;
    //#endregion
  }
  //#endregion
}
