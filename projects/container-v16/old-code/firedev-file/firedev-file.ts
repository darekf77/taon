//#region imports
import { Firedev } from 'firedev/src';
import { path, _, Utils, CoreModels } from 'tnp-core/src';
import { Helpers } from 'tnp-helpers/src';
import type { FiredevFileController } from './firedev-file.controller';
import { FiredevFileDefaultAs, IFiredevFileType } from './firedev-file.models';
import { FiredevFileCss } from './firedev-file-css/firedev-file-css';
import {
  defaultModelValues,
  FiredevFileTypeArr,
} from './firedev-file.constants';
//#region @backend
import * as FromData from 'form-data';
import { Blob } from 'buffer';
//#endregion

//#endregion

/**
 * @deprecated
 */
@Firedev.Entity<FiredevFile>({
  //#region entity config
  className: 'FiredevFile',
  defaultModelMapping: {
    css: 'FiredevFileCss',
  },
  //#endregion
})
export class FiredevFile extends Firedev.Base.Entity {
  //#region static

  //#region static / ctrl
  static ctrl: FiredevFileController;
  //#endregion

  //#region static / from
  static from(obj: Omit<Partial<FiredevFile>, 'ctrl'>) {
    let instance = FiredevFile.empty(); // @ts-ignore
    const clonedObj = _.cloneDeep(obj) as IFiredevFileType;
    instance = _.merge(instance, clonedObj);
    if (!instance.defaultViewAs) {
      instance.defaultViewAs = instance.getDefaultView();
    }
    if (!instance.contentType) {
      instance.contentType = instance.getContentType();
    }
    return instance;
  }
  //#endregion

  //#region static / empty
  static empty() {
    return _.merge(new FiredevFile(), defaultModelValues);
  }
  //#endregion

  //#region static / upload files
  static async uploadFiles(
    files: FileList | File[],
    options?: { dontRestoreBlob?: boolean }
  ): Promise<FiredevFile[]> {
    const { dontRestoreBlob } = options || {};
    const firedevFiles: FiredevFile[] = [];
    for (let index = 0; index < files.length; index++) {
      const formData = new FormData();
      const file = files[index];
      formData.append(`file${index + 1}`, file);
      const resp = await this.ctrl.upload(formData as any).received;
      const firedevFile = resp.body.json;
      if (!dontRestoreBlob) {
        firedevFile.blob = await Utils.binary.fileToBlob(file);
      }
      firedevFiles.push(firedevFile);
    }
    return firedevFiles;
  }
  //#endregion

  //#region static / get blob-less by src
  static async getBloblessBy(src: string) {
    if (src.startsWith('http')) {
      return FiredevFile.from({
        src,
        version: 0,
      });
    }

    src = encodeURIComponent(src);
    const data = await this.ctrl.getBloblessBy(src).received;

    return data.body.json;
  }
  //#endregion

  //#region static / get latest version by src
  static async getLatestVersion(src: string) {
    src = encodeURIComponent(src);

    const data = await this.ctrl.getLatestVersion(src).received;

    return Number(data.body.text);
  }
  //#endregion

  //#region static / get blob-only by src
  static async getBlobOnlyBy(src: string) {
    if (src.startsWith('http')) {
      const blob = await Utils.binary.getBlobFrom(src);
      return FiredevFile.from({
        src,
        blob,
        version: 0,
      });
    }

    src = encodeURIComponent(src);
    const data = await this.ctrl.getBlobOnlyBy(src).received;
    return data.body.blob;
  }
  //#endregion

  //#region static / is
  private static is(
    extensionOrContentType: string,
    isWhat: IFiredevFileType
  ): boolean {
    if (isWhat === 'css') {
      // @ts-ignore
      isWhat = 'text/css';
    }
    if (isWhat === 'js') {
      // @ts-ignore
      isWhat = 'text/javascript';
    }
    if (isWhat === 'html') {
      // @ts-ignore
      isWhat = 'text/html';
    }
    if (isWhat === 'text') {
      // @ts-ignore
      isWhat = 'text/html';
    }
    if (isWhat === 'json') {
      // @ts-ignore
      isWhat = 'application/json';
    }

    const isExt = extensionOrContentType.startsWith('.');
    if (isExt) {
      const contentType = CoreModels.MimeTypesObj[extensionOrContentType];
      return contentType?.startsWith(`${isWhat}`);
    }
    return extensionOrContentType.startsWith(`${isWhat}`);
  }
  //#endregion

  //#endregion

  //#region constructor
  private constructor(...args) {
    // @ts-ignore
    super(...args);
  }
  //#endregion

  //#region fields & getters
  get hasEmptyBlob() {
    return _.isNil(this.blob);
  }

  //#region fields & getters / ctrl
  ctrl: FiredevFileController;
  //#endregion

  /**
   * temporary file
   */
  file: File;
  /**
   * temporary file
   */
  text: string;

  //#region fields & getters / id
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;
  //#endregion

  //#region fields & getters / src
  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 150,
    default: null,
  })
  //#endregion
  src: string;
  //#endregion

  //#region fields & getters / css
  //#region @websql
  @Firedev.Orm.Column.SimpleJson()
  //#endregion
  css: FiredevFileCss;
  //#endregion

  //#region fields & getters / default view as
  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 20,
    default: null,
  })
  //#endregion
  defaultViewAs: FiredevFileDefaultAs;
  //#endregion

  //#region fields & getters / content type
  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 40,
    default: null,
  })
  //#endregion
  contentType: CoreModels.ContentType;
  //#endregion

  //#region fields & getters / version
  /**
   * automatic version increment
   */
  //#region @websql
  @Firedev.Orm.Column.Version()
  //#endregion
  version: number;
  //#endregion

  //#region fields & getters / version
  /**
   * Field is create when initing assets
   */
  //#region @websql
  @Firedev.Orm.Column.Boolean(false)
  //#endregion
  isFromAssets: boolean;
  //#endregion

  //#region fields & getters / blob
  /**
   * Blob stored in database
   */
  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: Helpers.isWebSQL ? 'text' : 'blob',
    default: null,
    transformer: {
      /**
       *
       * @param value from entity type
       * @returns
       */
      to: (value: string) => {
        // console.log('TO', value)
        // if (value instanceof Blob) {
        //   console.log(`TO (BLOB IS BLOB):`, value)
        //   return await Helpers.binary.blobToBase64(value)
        // }
        // console.log(`TO (BLOB IS NOT BLOB):`, value)
        // return

        // if (value instanceof Blob) {
        //   Helpers.binary.arrayBufferToBlob
        // }

        // return Buffer.from(value);
        return value;
      },
      /**
       *
       * @param value in database type
       * @returns
       */
      from: (value: string) => {
        // console.log('FROM', value)
        // if (_.isString(value)) {
        //   console.log(`FROM (value is string):`, value)
        //   return await Helpers.binary.base64toBlob(value);
        // }
        // console.log(`FROM (value is not string):`, value)
        // return value.toString();
        return value;
      },
    },
  })
  //#endregion
  blob: Blob | string;
  //#endregion

  //#region fields & getters / ext
  /**
   * file proper extension (when saved on disc)
   */
  get ext() {
    if (this.defaultViewAs === 'css-tag') {
      return '.css';
    }
    const realSrc = _.first(this.src?.split('?'));
    return realSrc ? path.extname(realSrc) : '';
  }
  //#endregion

  //#region fields & getters / type
  /**
   * General type of content (short alternative to mime):
   * text, audio, video, html, json, js
   */
  get type(): IFiredevFileType {
    for (let index = 0; index < FiredevFileTypeArr.length; index++) {
      const element = FiredevFileTypeArr[index];
      if (FiredevFile.is(this.ext, element)) {
        return element;
      }
    }
  }
  //#endregion

  //#endregion

  //#region methods

  //#region methods / get default view
  getDefaultView(): FiredevFileDefaultAs {
    if (this.type === 'js') {
      return 'script-tag';
    }
    if (this.type === 'css') {
      return 'css-tag';
    }
    if (this.type === 'audio') {
      return 'audio-tag';
    }
    if (this.type === 'video') {
      return 'video-tag';
    }
    if (this.type === 'image') {
      return 'img-tag';
    }
    if (this.type === 'html') {
      return 'html-rendered';
    }
    if (this.type === 'json') {
      return 'json-editor';
    }
  }
  //#endregion

  //#region methods / get content type
  getContentType(): CoreModels.ContentType {
    return CoreModels.MimeTypesObj[this.ext] as CoreModels.ContentType;
  }
  //#endregion

  //#endregion
}
