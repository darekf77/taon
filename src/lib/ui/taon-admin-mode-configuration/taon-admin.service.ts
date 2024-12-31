//#region import
import { Stor } from 'taon-storage/src';
import { Helpers, _ } from 'tnp-core/src';
import { Subject, take, takeUntil, tap } from 'rxjs';
import type { TaonAdminModeConfigurationComponent } from './taon-admin-mode-configuration.component';
import { globalPublicStorage } from '../../storage';
import { config } from 'tnp-config/src';
import { Injectable } from '@angular/core';
//#endregion

const ENV = Helpers.isBrowser ? window['ENV'] : global['ENV'];

@Injectable({ providedIn: 'root' })
export class TaonAdminService {
  //#region singleton
  private static _instance: TaonAdminService;
  public static get Instance() {
    return this._instance;
  }
  //#endregion

  //#region fields & getters
  public scrollableEnabled = false; // TOOD false by default
  private onEditMode = new Subject();
  onEditMode$ = this.onEditMode.asObservable();

  //#region fields & getters / popup is open

  @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public adminPanelIsOpen: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin

  @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public draggablePopupMode: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin

  @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public draggablePopupModeFullScreen: boolean;
  //#endregion

  //#region fields & getters / keep websql database data after reload
  /**
   * Property used in taon
   */
  @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public keepWebsqlDbDataAfterReload: boolean;
  //#endregion

  //#endregion

  //#region constructor
  constructor() {
    TaonAdminService._instance = this;
    this.scrollableEnabled = !!ENV?.useGlobalNgxScrollbar;
  }
  //#endregion

  //#region methods
  setEditMode(value: boolean) {
    this.onEditMode.next(value);
  }

  setKeepWebsqlDbDataAfterReload(value: boolean) {
    // if (value && !this.keepWebsqlDbDataAfterReload) {
    //   this.firstTimeKeepWebsqlDbDataTrue = true;
    // }
    this.keepWebsqlDbDataAfterReload = value;
  }

  enabledTabs = [];

  hide() {
    this.draggablePopupMode = false;
    this.adminPanelIsOpen = false;
  }

  show() {
    this.draggablePopupMode = false;
    this.adminPanelIsOpen = true;
  }

  logout() {}
  //#endregion
}
