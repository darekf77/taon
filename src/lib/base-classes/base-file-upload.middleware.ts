//#region imports
import crypto from 'crypto';

import express from 'express';
import multer from 'multer';
import {
  TaonClientMiddlewareInterceptOptions,
  TaonServerMiddlewareInterceptOptions,
} from 'ng2-rest/src';
import { Observable } from 'rxjs';
import { crossPlatformPath, path } from 'tnp-core/src';

import { TaonMiddleware } from '../decorators/classes/middleware-decorator';

import {
  BaseMiddleware,
  TaonAddtionalMiddlewareMethodInfo,
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
    { methodName, expressPath }: TaonAddtionalMiddlewareMethodInfo,
  ): Promise<void> {
    return this.middleware(expressPath)(req, res, next);
  }

  //#region upload Dir
  uploadDir(): string {
    return crossPlatformPath([this.ctx.cwd, 'uploaded-files']);
  }
  //#endregion

  //#region storage
  storage(): multer.StorageEngine {
    //#region @backendFunc
    return multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, this.uploadDir()),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path
          .basename(file.originalname, ext)
          .replace(/[^\w.-]/g, '_');
        const uniq = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        cb(null, `${base}-${uniq}${ext}`);
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
      fileFilter: (_req, file, cb) => {
        // accept only .zip by filename extension
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
          return cb(new Error('Only .zip files are allowed'));
        }
        cb(null, true);
      },
    });
    //#endregion
  }
  //#endregion

  //#region middleware
  middleware(expressPath: string): express.RequestHandler {
    //#region @backendFunc
    return this.upload().single(expressPath);
    //#endregion
  }
  //#endregion
}
