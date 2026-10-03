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
export async function expressRequestToFormData(
  req: express.Request,
): Promise<TaonParsedFormData> {
  //#region @backendFunc

  const Busboy = await import('busboy');

  const tempFolder = await UtilsTempFolder.getPath({
    prefix: 'taon-form-data',
    everytimeNew: true,
    deleteAfterDays: 1,
  });

  if (!UtilsOs.isRunningInCloudflareWorker()) {
    //#region @esmRemove
    await fse.ensureDir(tempFolder);
    //#endregion
  }

  return await new Promise<TaonParsedFormData>((resolve, reject) => {
    const formData = new FormData();
    const files: TaonUploadedFile[] = [];

    const pendingFiles: Promise<void>[] = [];

    // @ts-ignore
    const busboy = Busboy({
      headers: req.headers,
    });

    busboy.on('field', (name: string, value: string) => {
      formData.append(name, value);
    });

    // @ts-ignore
    busboy.on('file', (fieldName, stream, info) => {
      const tempFileName = `${Date.now()}-${crypto.randomUUID()}-${info.filename}`;

      const tempPath = UtilsOs.isRunningInCloudflareWorker()
        ? `${tempFolder}/${tempFileName}`
        : path.join(tempFolder, tempFileName);

      const uploadedFile: TaonUploadedFile = {
        fieldName,
        fileName: info.filename,
        mimeType: info.mimeType || 'application/octet-stream',
        tempKeyOrPath: tempPath,
      };

      let promise: Promise<void>;

      if (UtilsOs.isRunningInCloudflareWorker()) {
        promise = saveStreamToCloudflareTempStorage(
          tempPath,
          stream,
          uploadedFile.mimeType,
        );
      } else {
        //#region @esmRemove
        promise = pipeline(stream, fse.createWriteStream(tempPath));
        //#endregion
      }

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

  const webStream = Readable.toWeb(stream as Readable) as ReadableStream;

  await bucket.put(key, webStream as any, {
    httpMetadata: {
      contentType: mimeType,
    },
  });

  //#endregion
}

//#endregion
