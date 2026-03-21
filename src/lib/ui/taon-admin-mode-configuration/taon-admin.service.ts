//#region import
import { computed, Injectable } from '@angular/core'; // @browser
import { TaonStor } from 'taon-storage/src';
import { Helpers, _ } from 'tnp-core/src';
//#endregion

export enum TaonAdminPanelMode {
  NONE = 'NONE',
  ICON = 'ICON',
  POPUP = 'POPUP',
  SIDE = 'SIDE',
  FULL_SCREEN = 'FULL_SCREEN',
}

//#region @browser
@Injectable({ providedIn: 'root' })
//#endregion
export class TaonAdminService {
  //#region singleton + constructor
  private static _instance: TaonAdminService;

  constructor() {
    TaonAdminService._instance = this;
    window['Taon'] = this;
    window['taon'] = this;
  }

  static get Instance(): TaonAdminService {
    if (!this._instance) {
      throw new Error(
        'TaonAdminService not initialized yet. Make sure Angular bootstrapped first.',
      );
    }
    return this._instance;
  }
  //#endregion

  //#region fields & getters / admin panel mode

  public adminPanelMode = TaonStor.inLocalstorage(
    {
      defaultValue: TaonAdminPanelMode.ICON,
      keyOrPath: 'adminPanelMode',
    },
    TaonAdminService,
  );
  //#endregion

  //#region fields & getters / keep websql database data after reload
  /**
   * Property used in taon
   */
  public keepWebsqlDbDataAfterReload = TaonStor.inLocalstorage(
    {
      defaultValue: false,
      keyOrPath: 'keepWebsqlDbDataAfterReload',
    },
    TaonAdminService,
  );
  //#endregion

  show(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.POPUP);
  }
}
