//#region imports
import * as crypto from 'crypto';

import express from 'express';
import * as multer from 'multer';
import {
  TaonClientMiddlewareInterceptOptions,
  TaonServerMiddlewareInterceptOptions,
} from 'ng2-rest/src';
import { Observable } from 'rxjs';
import { crossPlatformPath, fse, path } from 'tnp-core/src';

import { TaonMiddleware } from '../decorators/classes/middleware-decorator';

import {
  BaseMiddleware,
  TaonAdditionalMiddlewareMethodInfo,
} from './base-middleware';
//#endregion

/**
 * Configurable file upload middleware (multer based)
 */
@TaonMiddleware({
  className: 'BaseFileUploadMiddleware',
})
export class BaseFileUploadMiddleware extends BaseMiddleware {
  async interceptServerMethod(
    { req, res, next }: TaonServerMiddlewareInterceptOptions,
    { methodName, expressPath }: TaonAdditionalMiddlewareMethodInfo,
  ): Promise<void> {
    return this.middleware()(req, res, next);
  }

  //#region upload Dir
  uploadDir(): string {
    return crossPlatformPath([this.ctx.cwd, 'uploaded-files']);
  }
  //#endregion

  //#region storage
  storage(): multer.StorageEngine {
    //#region @backendFunc
    const uploadDir = this.uploadDir();
    if (!fse.existsSync(uploadDir)) {
      try {
        fse.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {}
    }
    return multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadDir),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path
          .basename(file.originalname, ext)
          .replace(/[^\w.-]/g, '_');
        const uniq = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const filenameToProcess = `${base}-${uniq}${ext}`;
        cb(null, filenameToProcess);
      },
    });
    //#endregion
  }
  //#endregion

  //#region upload
  upload(): multer.Multer {
    //#region @backendFunc
    return multer({
      storage: this.storage(),
      limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GiB cap; tweak as needed
      // TODO implement file filter if needed
      // fileFilter: (_req, file, cb) => {
      //   // accept only .zip by filename extension
      //   if (path.extname(file.originalname).toLowerCase() !== '.zip') {
      //     return cb(new Error('Only .zip files are allowed'));
      //   }
      //   cb(null, true);
      // },
    });
    //#endregion
  }
  //#endregion

  //#region middleware
  middleware(): express.RequestHandler {
    //#region @backendFunc
    return this.upload().any();
    //#endregion
  }
  //#endregion
}
