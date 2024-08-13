//#region imports
import { Firedev } from 'firedev/src';
import { CoreModels } from 'tnp-core/src';
import { FiredevBinaryFile } from './firedev-binary-file';
import { Helpers, Utils, _, crossPlatformPath, path } from 'tnp-core/src';
import { randUserName, randAddress } from '@ngneat/falso'; // faking data
import { IFiredevBinaryFile } from './firedev-binary-file.models';
import { FORM_DATA_FILENAME } from './firedev-binary-file.constants';
import { FiredevDbEntity } from './firedev-db-entity';
//#region @websql
import { FIREDEV_BINARY_FILE } from './firedev-binary-file.models';
import { FiredevBinaryFileBackend } from './backend/firedev-binary-file-backend';
//#endregion
//#region @backend
import { Blob } from 'buffer';
import * as FormData from 'form-data';
import { first } from 'rxjs';
import { blob } from 'stream/consumers';
//#endregion
//#endregion

//#region consts
declare const ENV: any;
//#endregion

/**
 * Isomorphic Controller for FiredevBinaryFile
 *
 * + only create here isomorphic controller methods
 * + use this.backend for any backend/db operations
 */
@Firedev.Controller({
  //#region controller options
  className: 'FiredevBinaryFileController',
  //#endregion
})
export class FiredevBinaryFileController extends Firedev.Base
  .CrudController<FiredevBinaryFile> {
  //#region fields
  entity() {
    return FiredevBinaryFile;
  }
  //#region @websql
  readonly backend = FiredevBinaryFileBackend.for(this);
  //#endregion
  //#endregion

  //#region methods

  //#region methods / save
  public async save(
    binaryData: Utils.DbBinaryFormatForBrowser,
    relativePathOnServer: string
  ): Promise<void> {
    console.log('SAVING', binaryData);
    //#region @backend
    if (Helpers.isBuffer(binaryData)) {
      this.backend.saveFileNodejs(binaryData, relativePathOnServer);
    }
    if (_.isString(binaryData)) {
      this.backend.saveFileNodejs(binaryData, relativePathOnServer);
    }
    if (Helpers.isBlob(binaryData)) {
      this.backend.saveFileNodejs(binaryData, relativePathOnServer);
    }
    //#endregion
    //#region @browser
    if (binaryData instanceof File) {
      await this.saveFile(binaryData as File, relativePathOnServer);
    }
    if (Helpers.isBlob(binaryData)) {
      await this.saveBlob(binaryData as Blob, relativePathOnServer);
    }
    if (_.isString(binaryData)) {
      await this.saveText(binaryData as string, relativePathOnServer);
    }
    //#endregion
  }
  //#endregion

  //#region methods / load
  public async load<T = Utils.DbBinaryFormat>(
    relativePathOnServer: string,
    loadAs: Utils.DbBinaryFormatEnum = Utils.DbBinaryFormatEnum.Blob
  ): Promise<T> {
    //#region @browser
    if (loadAs === Utils.DbBinaryFormatEnum.Blob) {
      const blob = await this.getBlob(relativePathOnServer);
      return blob as any;
    }

    if (loadAs === Utils.DbBinaryFormatEnum.File) {
      const file = await this.getFile(relativePathOnServer);
      return file as any;
    }

    if (loadAs === Utils.DbBinaryFormatEnum.string) {
      const text = await this.getText(relativePathOnServer);
      return text as any;
    }
    //#endregion
    return void 0;
  }
  //#endregion

  //#region methods / save file
  protected async saveFile(
    file: File,
    relativePathOnServer?: string
  ): Promise<FiredevBinaryFile> {
    //#region @browser
    const formData = new FormData();
    formData.append(FORM_DATA_FILENAME, file);
    await this.saveFormData(
      formData,
      crossPlatformPath([
        // 'files',
        relativePathOnServer ? relativePathOnServer : file.name,
      ])
    ).received;
    //#endregion
    return void 0;
  }
  //#endregion

  //#region methods / save blob
  //#region @browser
  protected async saveBlob(
    blob: Blob,
    relativePathOnServer: string
  ): Promise<void> {
    const formData = new FormData();
    const file = await Utils.binary.blobToFile(
      blob,
      path.basename(relativePathOnServer)
    );
    formData.append(FORM_DATA_FILENAME, file);
    await this.saveFormData(
      formData,
      crossPlatformPath([
        // 'blobs',
        relativePathOnServer,
      ])
    ).received;
    return void 0;
  }
  //#endregion
  //#endregion

  //#region methods / save text
  //#region @browser
  protected async saveText(text: string, filename: string): Promise<void> {
    const file = await Utils.binary.textToFile(text, filename);
    const formData = new FormData();
    formData.append(FORM_DATA_FILENAME, file);
    const data = this.saveFormData(
      formData,
      crossPlatformPath([
        // 'text',
        filename,
      ])
    );
    await data.received;
  }
  //#endregion
  //#endregion

  //#region methods / get text
  //#region @browser
  protected async getText(relativePathOnServer: string): Promise<string> {
    const data = await this._getBlob(relativePathOnServer).received;
    return await data.body.blob.text();
  }
  //#endregion
  //#endregion

  //#region methods / get blob
  //#region @browser
  protected async getBlob(relativePathOnServer: string): Promise<Blob> {
    const data = await this._getBlob(relativePathOnServer).received; // @ts-ignore
    return data.body.blob;
  }
  //#endregion
  //#endregion

  //#region methods / get file
  //#region @browser
  protected async getFile(relativePathOnServer: string): Promise<File> {
    const data = await this._getBlob(relativePathOnServer).received;
    const blob = data.body.blob; // @ts-ignore
    const binaryData = await Utils.binary.blobToFile(
      blob,
      relativePathOnServer
    );
    return binaryData;
  }
  //#endregion
  //#endregion

  //#region methods / init example data
  //#region @websql
  public async initExampleDbData(isWorker?: boolean): Promise<void> {
    const repo = this.repository;

    // @LAST simplyfi this and make api for access files/entities easy
    // - load entity (with binary data)
    // - save entity (with binary data)

    /* tests
    //#region hamster image
    const blobStringHamster = (await import('./media-examples/hamster-image')).default;
    const hammyBlob = await Utils.binary.base64toDbBinaryFormat(blobStringHamster);

    const hammyFile = FiredevBinaryFile.from({
      src: '/src/assets/upload/hamsters/my-hammy.jpeg',
      binaryData: hammyBlob as Blob,
    });
    await FiredevBinaryFile.save(hammyFile);
    //#endregion


    //#region my nigga blbo
    const myniggaHtml = `Hell my niga <strong>html</strong>`;

    const myNiggaFile = FiredevBinaryFile.from({
      src: '/src/assets/upload/post-templates/post.html',
      binaryData: myniggaHtml
    })
    await FiredevBinaryFile.save(myNiggaFile);
    //#endregion


    //#region samble sound
    const sound =  (await import('./media-examples/binary-sound')).default;
    const soundBlob = await Utils.binary.base64toDbBinaryFormat(sound);
    const soundFile = FiredevBinaryFile.from({
      src: '/src/assets/upload/sounds/sound1.ogg',
      binaryData: soundBlob as Blob,
    });
    await FiredevBinaryFile.save(soundFile);
    //#endregion
*/
    //#region @websql
    if (ENV.dontLoadAssets) {
      return;
    }

    // console.log('getting asset start')
    const assets = await this.backend.getAssets();
    // console.log(`getting asset done, length = ${assets.length}`)
    // console.log('saving asset start')
    const filesToSave = [];
    for (let index = 0; index < assets.length; index++) {
      const src = assets[index];
      const file = FiredevBinaryFile.from({
        src: `/src/${src}`,
        //#region @websqlOnly
        isInIndexedDbCache: false,
        //#endregion
      });
      filesToSave.push(file);
    }
    await repo.save(filesToSave);
    // console.log('saving asset done')
    //#endregion
  }
  //#endregion
  //#endregion

  //#region methods / _ get blob
  @Firedev.Http.GET({
    overridResponseType: 'blob',
    path: '/get/blob',
  })
  private _getBlob(
    @Firedev.Http.Param.Query('by-path') relativePathOnServer: string
  ): Firedev.Response<Blob> {
    //#region @websqlFunc
    return async (req, res) => {
      relativePathOnServer = relativePathOnServer;
      //#region @websqlOnly
      if (Helpers.isWebSQL) {
        const file = await this.backend.getByUrl(relativePathOnServer);

        if (!file.isInIndexedDbCache) {
          let assetBlob: Blob;
          assetBlob =
            await this.backend.getAssetFromWebsqlMode(relativePathOnServer);
          await this.backend.saveFileWebsql(assetBlob, relativePathOnServer);
          file.isInIndexedDbCache = true;
          await this.repository.update(file.id, file);
          return assetBlob;
        }
        // console.log('restored file')
        const restoreFileFromIndexeDb =
          await this.backend.getFileWebsql(relativePathOnServer);
        return restoreFileFromIndexeDb;
      }
      //#endregion

      //#region @backend
      if (Helpers.isNode) {
        // TODO @LAST reading form filesystem does not work... in bd should be
        // sparate browser and backend path
        const restoreFileFromFileSystem =
          await this.backend.getFileNodejs(relativePathOnServer);
        let blob = await Utils.binary.bufferToBlob(restoreFileFromFileSystem);
        blob = blob.slice(
          0,
          blob.size,
          CoreModels.mimeTypes[path.extname(relativePathOnServer)]
        );
        return blob;
        // return restoreFileFromFileSystem as any;
      }
      //#endregion
      return void 0;
    };
    //#endregion
  }
  //#endregion

  //#region methods / save form data
  @Firedev.Http.POST({
    overrideContentType: 'multipart/form-data',
    path: '/blob/read',
  })
  private saveFormData(
    @Firedev.Http.Param.Body() formData: any, // FormData & { getAll(name: string): File[]; },
    @Firedev.Http.Param.Query('filepath') relativePathOnServer: string
  ): Firedev.Response<void> {
    //#region @websqlFunc
    return async (req, res) => {
      relativePathOnServer = relativePathOnServer;
      console.log({
        formData,
        relativePathOnServer,
        req,
        res,
      });

      //#region @websqlOnly
      const websqlfile = formData.getAll(FORM_DATA_FILENAME) as File[];
      await this.backend.saveFileWebsql(
        _.first(websqlfile),
        relativePathOnServer
      );
      //#endregion

      //#region @backend
      // @ts-ignore
      if (!req.files || Object.keys(req.files).length === 0) {
        console.log('NOTHING TO UPLOAD');
        res.status(400).send('No files were uploaded.');
        return;
      }
      const files = _.values(req['files']) as CoreModels.UploadedBackendFile[];
      await this.backend.saveFileNodejs(_.first(files), relativePathOnServer);
      //#endregion

      return void 0;
    };
    //#endregion
  }
  //#endregion

  //#region methods / get entity by url
  @Firedev.Http.GET({
    path: '/get/blobless/enitiy/by',
  })
  getByUrl(
    @Firedev.Http.Param.Query('by-path') relativePathOnServer: string
  ): Firedev.Response<FiredevBinaryFile> {
    //#region @websqlFunc
    return async (req, res) => {
      return await this.backend.getByUrl(relativePathOnServer);
    };
    //#endregion
  }
  //#endregion

  //#endregion

  //#region get all db entities
  @Firedev.Http.GET()
  public getAllEntities(): Firedev.Response<FiredevDbEntity[]> {
    //#region @websqlFunc
    return async (req, res) => {
      let tables: FiredevDbEntity[];

      //#region @websqlOnly
      if (Helpers.isWebSQL) {
        tables = await this.connection.query(`
        SELECT
        name
    FROM
        sqlite_schema
    WHERE
        type ='table' AND
        name NOT LIKE 'sqlite_%';
           `);
      }
      //#endregion

      //#region @backend
      if (Helpers.isNode) {
        tables = await this.connection.query(`
        SELECT
        name
    FROM
        sqlite_schema
    WHERE
        type ='table' AND
        name NOT LIKE 'sqlite_%';
           `);
      }
      //#endregion

      tables = (tables || []).map(c => FiredevDbEntity.from(c));

      for (let index = 0; index < tables.length; index++) {
        const table = tables[index];
        table.columns = (
          await this.connection.query(`
        SELECT c.name FROM pragma_table_info('${table.name}') c;
        `)
        ).map(c => c.name);
      }

      return tables;
    };
    //#endregion
  }
  //#endregion
}
