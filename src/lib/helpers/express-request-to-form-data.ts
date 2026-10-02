import type express from 'express';

export async function expressRequestToFormData(
  req: express.Request,
): Promise<FormData> {
  //#region @backendFunc
  const BusboyData = (await import('busboy'));

  return await new Promise<FormData>((resolve, reject) => {
    const formData = new FormData();

    // @ts-ignore
    const busboy = BusboyData({
      headers: req.headers,
    });

    busboy.on('field', (name: string, value: string) => {
      formData.append(name, value);
    });

    busboy.on('file', (name, stream, info) => {
      const chunks: Uint8Array[] = [];

      stream.on('data', chunk => {
        chunks.push(chunk);
      });

      stream.on('error', reject);

      stream.on('end', () => {
        const blob = new Blob(chunks as any, {
          type: info.mimeType || 'application/octet-stream',
        });

        const file = new File([blob], info.filename, {
          type: info.mimeType || 'application/octet-stream',
        });

        formData.append(name, file);
      });
    });

    busboy.on('error', reject);

    busboy.on('finish', () => {
      resolve(formData);
    });

    req.pipe(busboy);
  });
  //#endregion
}
