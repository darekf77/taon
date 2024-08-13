//#region imports
import { Firedev } from 'firedev/src';
import { map } from 'rxjs';
import { _ } from 'tnp-core/src';
import type { FiredevFileCssController } from './firedev-file-css.controller';
import {
  BrowserUnit,
  BrowserUnitArr,
  DisplayOpt,
  DisplayOptArr,
  FiredevFileCssNonColumnsKeys,
  FiredevFileCssNonColumnsKeysArr,
} from './firedev-file-css.models';
import { defaultModelValuesFiredevFileCss as defaultModelValues } from './firedev-file-css.models';
//#endregion

/**
 * Entity class for FiredevFileCss
 *
 * + use static methods to for backend access encapsulation
 */
@Firedev.Entity({
  className: 'FiredevFileCss',
  //#region @websql
  createTable: false,
  //#endregion,
  defaultModelValues,
})
export class FiredevFileCss extends Firedev.Base.Entity {
  //#region static
  static ctrl: FiredevFileCssController;
  static from(
    obj: Omit<Partial<FiredevFileCss>, FiredevFileCssNonColumnsKeys>
  ) {
    obj = _.merge(
      defaultModelValues,
      _.omit(obj, FiredevFileCssNonColumnsKeysArr)
    );
    return _.merge(new FiredevFileCss(), obj) as FiredevFileCss;
  }
  static $getAll() {
    return this.ctrl
      .getAll()
      .received?.observable.pipe(map(data => data.body.json));
  }

  static async getAll() {
    const data = await this.ctrl.getAll().received;
    return data?.body?.json || [];
  }

  static emptyModel() {
    return FiredevFileCss.from(defaultModelValues);
  }

  static getOptionsFor(classProperty: keyof FiredevFileCss) {
    const map = (arr: string[]) =>
      arr.map(value => {
        return {
          value,
          label: value,
        };
      });
    switch (classProperty) {
      case 'display':
        return map(DisplayOptArr);
      case 'heightUnit':
        return map(BrowserUnitArr);
      case 'widthUnit':
        return map(BrowserUnitArr);
    }
  }
  //#endregion

  //#region constructor
  private constructor(...args) {
    // @ts-ignore
    super(...args);
  }
  //#endregion

  //#region fields & getters
  ctrl: FiredevFileCssController;

  //#region @websql
  @Firedev.Orm.Column.Generated()
  //#endregion
  id: string;

  //#region @websql
  @Firedev.Orm.Column.Custom({
    type: 'varchar',
    length: 100,
    default: defaultModelValues.description,
  })
  //#endregion
  description?: string;
  display?: DisplayOpt;
  width?: 'auto' | 'inheirt' | number;
  widthUnit?: BrowserUnit;
  height?: 'auto' | 'inheirt' | number;
  heightUnit?: BrowserUnit;
  //#endregion

  //#region methods
  clone(options?: { propsToOmit: (keyof FiredevFileCss)[] }): FiredevFileCss {
    const { propsToOmit } = options || {
      propsToOmit: FiredevFileCssNonColumnsKeysArr,
    };
    return _.merge(new FiredevFileCss(), _.omit(this, propsToOmit));
  }
  //#endregion
}
