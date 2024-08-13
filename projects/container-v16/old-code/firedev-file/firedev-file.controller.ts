//#region imports
import { Firedev } from 'firedev/src';
import { Project } from 'tnp/src';
import { Repository } from 'firedev-typeorm/src'; // must be
import { FiredevFile } from './firedev-file';
import { crossPlatformPath, path, _, Utils } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';

//#region @backend
import * as FormData from 'form-data';
import { FiredevUploadedFile } from '../firedev.models';
const pathDest = path.join(process.cwd(), 'src/assets/private/uploaded');
import { Blob } from 'buffer';
//#endregion
//#region @websql
import { FiredevFileBackend } from './backend/firedev-file-backend';
//#endregion
//#endregion

declare const ENV: any;

/**
 * @deprecated
 */
@Firedev.Controller({
  //#region controller config
  className: 'FiredevFileController',
  //#endregion
})
export class FiredevFileController extends Firedev.Base
  .CrudController<FiredevFile> {
  //#region fields
  entity() {
    return FiredevFile;
  }
  //#region @websql
  readonly backend = FiredevFileBackend.for(this);
  //#endregion
  //#endregion

  //#region get latest version by src
  @Firedev.Http.GET('/version/:src')
  getLatestVersion(
    @Firedev.Http.Param.Path('src') src: string
  ): Firedev.Response<number> {
    //#region @websqlFunc
    return async (req, res) => {
      const repo = this.repository;
      src = decodeURIComponent(src);

      let item = await repo.findOne({
        where: {
          src,
        },
      });

      return item?.version || 0;
    };
    //#endregion
  }
  //#endregion

  //#region get blobless by src
  @Firedev.Http.GET('/blobless/:src')
  getBloblessBy(
    @Firedev.Http.Param.Path('src') src: string
  ): Firedev.Response<FiredevFile> {
    //#region @websqlFunc
    src = decodeURIComponent(src);
    return async (req, res) => {
      const repo = this.repository;

      let item = await repo.findOne({
        where: {
          src,
        },
      });

      if (item?.blob) {
        delete item.blob;
      }
      return item;
    };
    //#endregion
  }
  //#endregion

  //#region get blob only by src
  @Firedev.Http.GET({
    overridResponseType: 'blob',
    path: '/blobonly/:src',
  })
  getBlobOnlyBy(
    @Firedev.Http.Param.Path('src') src: string
  ): Firedev.Response<Blob> {
    //#region @websqlFunc
    src = decodeURIComponent(src);
    return async (req, res) => {
      const repo = this.repository;
      let item = await repo.findOne({
        where: {
          src,
        },
      });
      item = await this.backend.restoreBlobWhenFileFromAsset(item);
      const blob = await Utils.binary.base64toBlob(item.blob as string);
      return blob;
    };
    //#endregion
  }
  //#endregion

  //#region delete by src
  @Firedev.Http.DELETE({
    overridResponseType: 'blob',
    path: '/blobonly/:src',
  })
  deleteBy(
    @Firedev.Http.Param.Path('src') src: string
  ): Firedev.Response<FiredevFile> {
    //#region @websqlFunc
    return async (req, res) => {
      const repo = this.repository;
      let item = await repo.findOne({
        where: {
          src: decodeURI(src),
        },
      });
      // await repo.delete

      delete item.blob;
      return item;
    };
    //#endregion
  }
  //#endregion

  //#region upload form data
  /**
   * in angular:
   * const formData = new FormData();
   * formData.append('myfile1.png',files[0])
   * formData.append('myfile2.png',files[1])
   *
   * files -> from evemt from input with type="file"
   *
   * @param formData
   * @returns
   */
  @Firedev.Http.POST({ overrideContentType: 'multipart/form-data' as any })
  upload(
    @Firedev.Http.Param.Body() formData: FormData
  ): Firedev.Response<FiredevFile> {
    //#region @websqlFunc
    return async (req, res) => {
      //#region @backendFunc
      // @ts-ignore
      if (!req.files || Object.keys(req.files).length === 0) {
        res.status(400).send('No files were uploaded.');
        return;
      }

      // @ts-ignore
      const files = _.values(req.files);
      if (!Helpers.exists(path.dirname(pathDest))) {
        Helpers.mkdirp(path.dirname(pathDest));
      }

      const repo = this.repository;

      const file = _.first(files) as FiredevUploadedFile;
      const uploadPath = crossPlatformPath([
        pathDest,
        file.md5 + '_' + file.name,
      ]);
      await repo.save(
        FiredevFile.from({
          contentType: file.mimetype,
          id: file.md5,
          blob: file.data as any,
          src: uploadPath,
        })
      );

      await new Promise((resolve, reject) => {
        file.mv(uploadPath, err => {
          if (err) {
            throw err;
          } else {
            resolve(void 0);
          }
        });
      });
      console.log('Files uploaded: ', req['files']);
      const fileInstance = await repo.findOneOrFail({
        where: { id: file.md5 },
      });
      delete fileInstance.blob;
      return fileInstance;
      //#endregion
    };
    //#endregion
  }
  //#endregion

  //#region init example data
  //#region @websql
  async initExampleDbData() {
    await this.backend.initExampleDbData();
  }
  //#endregion
  //#endregion
}
