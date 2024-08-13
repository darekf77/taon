//#region imports
import { Firedev } from 'firedev/src';
import { Helpers, Utils, _ } from 'tnp-core/src';
import { map } from 'rxjs';
import type { FiredevBinaryFileController } from './firedev-binary-file.controller';
import { FiredevBinaryFileNonColumnsKeys } from './firedev-binary-file.models';
import {
  FIREDEV_BINARY_FILE_NON_COL_KEY_ARR,
  DEF_MODEL_VALUE_FIREDEV_BINARY_FILE as defaultModelValues,
} from './firedev-binary-file.constants';
//#region @backend
import { Blob } from 'buffer';
//#endregion
//#endregion

/**
 * Entity class for FiredevBinaryFile
 *
 * + use static methods to for backend access encapsulation
 */
@Firedev.Entity({
  //#region entity options
  className: 'FiredevBinaryFile',
  defaultModelValues,
  //#endregion
})
export class FiredevBinaryFile<T = Utils.DbBinaryFormat> extends Firedev.Base
  .Entity {
  //#region static
  static ctrl: FiredevBinaryFileController;
  static from(
    obj: Omit<Partial<FiredevBinaryFile>, FiredevBinaryFileNonColumnsKeys>
  ) {
    obj = _.merge(
      defaultModelValues,
      _.omit(obj, FIREDEV_BINARY_FILE_NON_COL_KEY_ARR)
    );
    return _.merge(new FiredevBinaryFile(), obj) as FiredevBinaryFile;
  }
  static $getAll() {
    return this.ctrl
      .getAll()
      .received?.observable.pipe(map(data => data.body?.json || []));
  }

  public static async save(file: FiredevBinaryFile): Promise<void> {
    //#region @websql
    const repo = this.ctrl.repository;
    const fileForSave = _.merge(new FiredevBinaryFile(), _.cloneDeep(file));
    delete fileForSave.binaryData;
    await repo.save(fileForSave);
    await this.ctrl.save(file.binaryData as Blob, file.src);
    //#endregion
  }

  public static async loadBy(src: string): Promise<FiredevBinaryFile> {
    //#region @browser

    const file = (await this.ctrl.getByUrl(src).received).body.json;
    const binaryData = await this.ctrl.load(src, file.loadAs);
    file.binaryData = binaryData;
    return file;
    //#endregion
    // TODO  backend thing
    return void 0;
  }

  static async getAll() {
    const data = await this.ctrl.getAll().received;
    return data?.body?.json || [];
  }

  static emptyModel() {
    return FiredevBinaryFile.from(defaultModelValues);
  }
  //#endregion

  //#region constructor
  private constructor(...args) {
    // @ts-ignore
    super(...args);
  }
  //#endregion

  //#region fields & getters

  //#region fields & getters / table fields
  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 250,
    default: '',
    unique: true,
  })
  //#endregion
  src?: string;

  //#region @websqlOnly
  //#region @websql
  @Firedev.Orm.Column.Boolean(true)
  //#endregion
  isInIndexedDbCache?: boolean;
  //#endregion

  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 10,
    default: Utils.DbBinaryFormatEnum.Blob,
  })
  //#endregion
  loadAs: Utils.DbBinaryFormatEnum;
  //#endregion

  ctrl: FiredevBinaryFileController;
  binaryData?: T;
  //#endregion

  //#region methods
  clone(options?: {
    propsToOmit: (keyof FiredevBinaryFile)[];
  }): FiredevBinaryFile {
    const { propsToOmit } = options || {
      propsToOmit: FIREDEV_BINARY_FILE_NON_COL_KEY_ARR,
    };
    return _.merge(new FiredevBinaryFile(), _.omit(this, propsToOmit));
  }
  //#endregion
}
