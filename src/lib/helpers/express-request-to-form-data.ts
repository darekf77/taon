import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises'; // @esmRemove

import { R2Bucket } from '@cloudflare/workers-types';
import type express from 'express';
import { path, fse } from 'tnp-core/src';
import { GlobalStorage, UtilsOs, UtilsTempFolder } from 'tnp-core/src';

//#region models / taon uplaoded file
export interface TaonUploadedFile {
  /**
   * multipart/form-data field name.
   */
  fieldName: string;

  /**
   * Original filename sent by the browser.
   */
  fileName: string;

  /**
   * MIME type reported by multipart/form-data.
   */
  mimeType: string;

  /**
   * Local filesystem path on Node.js.
   * R2 object key on Cloudflare.
   */
  tempKeyOrPath: string;
}
//#endregion

//#region models / taon parsed form data
export interface TaonParsedFormData {
  /**
   * Normal non-file multipart fields.
   */
  formData: FormData;

  /**
   * Files stored temporarily outside memory.
   */
  files: TaonUploadedFile[];
}
//#endregion

//#region request express request to form data
export async function requestToFormData(
  req: express.Request,
): Promise<TaonParsedFormData> {
  //#region @backendFunc

  if (UtilsOs.isRunningInCloudflareWorker()) {
    return await cloudflareRequestToFormData(req);
  }

  //#region @esmRemove
  return await nodeExpressRequestToFormData(req);
  //#endregion

  //#endregion
}
//#endregion

//#region node express request to form data
async function nodeExpressRequestToFormData(
  req: express.Request,
): Promise<TaonParsedFormData> {
  //#region @backendFunc
  //#region @esmRemove

  const Busboy = (await import('busboy')) as any as typeof import('busboy');

  const tempFolder = await UtilsTempFolder.getPath({
    prefix: 'taon-form-data',
    everytimeNew: true,
    deleteAfterDays: 1,
  });

  await fse.ensureDir(tempFolder);

  return await new Promise<TaonParsedFormData>((resolve, reject) => {
    const formData = new FormData();
    const files: TaonUploadedFile[] = [];
    const pendingFiles: Promise<void>[] = [];

    const busboy = Busboy({
      headers: req.headers,
    });

    busboy.on('field', (name: string, value: string) => {
      formData.append(name, value);
    });

    busboy.on('file', (fieldName, stream, info) => {
      const tempFileName = `${Date.now()}-${crypto.randomUUID()}-${info.filename}`;

      const tempPath = path.join(tempFolder, tempFileName);

      const uploadedFile: TaonUploadedFile = {
        fieldName,
        fileName: info.filename,
        mimeType: info.mimeType || 'application/octet-stream',
        tempKeyOrPath: tempPath,
      };

      const promise = pipeline(stream, fse.createWriteStream(tempPath));

      pendingFiles.push(
        promise.then(() => {
          files.push(uploadedFile);
        }),
      );
    });

    busboy.on('error', reject);

    busboy.on('finish', async () => {
      try {
        await Promise.all(pendingFiles);

        resolve({
          formData,
          files,
        });
      } catch (error) {
        reject(error);
      }
    });

    req.pipe(busboy);
  });

  //#endregion
  return void 0 as any;
  //#endregion
}
//#endregion

//#region cloudflare request to form data
async function cloudflareRequestToFormData(
  req: express.Request,
): Promise<TaonParsedFormData> {
  //#region @backendFunc

  /**
   * IMPORTANT:
   * The Cloudflare -> Express adapter needs to preserve
   * the original native Fetch Request here.
   */
  const request = (req as any).raw as Request;

  if (!request) {
    throw new Error(
      'Original Cloudflare Request is missing on Express request.',
    );
  }

  const nativeFormData = await request.formData();

  const formData = new FormData();
  const files: TaonUploadedFile[] = [];

  const tempFolder = await UtilsTempFolder.getPath({
    prefix: 'taon-form-data',
    everytimeNew: true,
    deleteAfterDays: 1,
  });

  // @ts-ignore
  for (const [fieldName, value] of nativeFormData.entries()) {
    // Normal form field
    if (typeof value === 'string') {
      formData.append(fieldName, value);
      continue;
    }

    // File
    const file = value as File;

    const tempFileName = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;

    const tempKey = `${tempFolder}/${tempFileName}`;

    const mimeType = file.type || 'application/octet-stream';

    // @ts-ignore
    await saveStreamToCloudflareTempStorage(tempKey, file.stream(), mimeType);

    files.push({
      fieldName,
      fileName: file.name,
      mimeType,
      tempKeyOrPath: tempKey,
    });
  }

  return {
    formData,
    files,
  };

  //#endregion
}
//#endregion

//#region save stream to cloud flare temp storage

async function saveStreamToCloudflareTempStorage(
  key: string,
  stream: NodeJS.ReadableStream,
  mimeType: string,
): Promise<void> {
  //#region @backendFunc

  const bucket = GlobalStorage.get('TAON_TEMP_STORAGE') as R2Bucket;

  if (!bucket) {
    throw new Error(`Missing TAON_TEMP_STORAGE.`);
  }

  // const webStream = Readable.toWeb(stream as Readable) as ReadableStream;
  // await bucket.put(key, webStream as any, {
  //   httpMetadata: {
  //     contentType: mimeType,
  //   },
  // });

  await bucket.put(key, stream as any, {
    httpMetadata: {
      contentType: mimeType,
    },
  });

  //#endregion
}

//#endregion
