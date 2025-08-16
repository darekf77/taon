import FormData from 'form-data'; // @backend
import { crossPlatformPath, fse, path } from 'tnp-core/src';

import {
  TaonController,
  TaonFileUploadMethodConfig,
} from '../decorators/classes/controller-decorator';
import { POST } from '../decorators/http/http-methods-decorators';
import { Body } from '../decorators/http/http-params-decorators';
import type { Models } from '../models';

import { BaseInjector } from './base-injector';

export const taonFileUploadDefaultConfig: TaonFileUploadMethodConfig = ({
  crypto,
  cwd,
  expressPath,
  multer,
}) => {
  //#region @backendFunc
  const UPLOAD_DIR = crossPlatformPath([cwd, 'uploaded-files']);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/[^\w.-]/g, '_');
      const uniq = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
      cb(null, `${base}-${uniq}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GiB cap; tweak as needed
    fileFilter: (_req, file, cb) => {
      // accept only .zip by filename extension
      if (path.extname(file.originalname).toLowerCase() !== '.zip') {
        return cb(new Error('Only .zip files are allowed'));
      }
      cb(null, true);
    },
  });
  return upload.single(expressPath);
  //#endregion
};

@TaonController<BaseController>({
  className: 'BaseController',
  fileUpload: {
    uploadFormDataToServer: opt => taonFileUploadDefaultConfig(opt),
  },
})
export class BaseController extends BaseInjector {
  @POST({
    overrideContentType: 'multipart/form-data',
  })
  uploadFormDataToServer(
    @Body() formData: FormData,
  ): Models.Http.Response<string> {
    return async (req, res) => {
      return '';
    };
  }

  @POST()
  uploadLocalFileToServer(absFilePath: string): Models.Http.Response<string> {
    //#region @backendFunc
    const stat = fse.statSync(absFilePath);
    const stream = fse.createReadStream(absFilePath);

    const form = new FormData();
    form.append('file', stream, {
      filename: path.basename(absFilePath),
      knownLength: stat.size,
    });

    return this.uploadFormDataToServer(form);
    //#endregion
  }
}
