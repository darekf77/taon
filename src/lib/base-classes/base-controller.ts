import * as FormData from 'form-data'; // @backend
import { crossPlatformPath, fse, path } from 'tnp-core/src'; // @backend

import { TaonController } from '../decorators/classes/controller-decorator';
import { POST } from '../decorators/http/http-methods-decorators';
import { Body } from '../decorators/http/http-params-decorators';
import type { Models } from '../models';

import { BaseFileUploadMiddleware } from './base-file-upload.middleware';
import { BaseInjector } from './base-injector';

export interface MulterFileUploadResponse {
  ok: boolean;
  originalName: string;
  savedAs: string;
  savedPath: string;
  size: number;
  mimetype: string;
}

@TaonController<BaseController>({
  className: 'BaseController',
})
export class BaseController extends BaseInjector {
  //#region upload form data to server
  @POST({
    overrideContentType: 'multipart/form-data',
    middlewares: [BaseFileUploadMiddleware],
  })
  uploadFormDataToServer(
    @Body() formData: FormData,
  ): Models.Http.Response<MulterFileUploadResponse> {
    //#region @backendFunc
    return async (req, res) => {
      const f = req.file;
      if (!f) {
        throw 'No file received';
      }

      // Response info
      const savedAbs = path.resolve(f.path);
      const savedRel = path.relative(process.cwd(), savedAbs);
      return {
        ok: true,
        originalName: f.originalname,
        savedAs: path.basename(savedAbs),
        savedPath: savedRel,
        size: f.size,
        mimetype: f.mimetype,
      };
    };
    //#endregion
  }
  //#endregion

  //#region upload local file to server
  async uploadLocalFileToServer(
    absFilePath: string,
  ): Promise<MulterFileUploadResponse> {
    //#region @backendFunc
    const stat = fse.statSync(absFilePath);
    const stream = fse.createReadStream(absFilePath);

    const form = new FormData();
    form.append('file', stream, {
      filename: path.basename(absFilePath),
      knownLength: stat.size,
    });

    const data = await this.uploadFormDataToServer(form).received;
    return data.body.json;
    //#endregion
  }
  //#endregion
}
