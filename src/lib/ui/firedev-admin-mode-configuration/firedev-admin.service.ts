//#region import
import { Stor } from 'firedev-storage/src';
import { Helpers, _ } from 'tnp-core/src';
import { Subject, take, takeUntil, tap } from 'rxjs';
import type { FiredevAdminModeConfigurationComponent } from './firedev-admin-mode-configuration.component';
import { globalPublicStorage } from '../../storage';
import { config } from 'tnp-config/src';
import { Injectable } from '@angular/core';
//#endregion

const ENV = Helpers.isBrowser ? window['ENV'] : global['ENV'];

@Injectable({ providedIn: 'root' })
export class FiredevAdmin {
  public scrollableEnabled = false; // TOOD @LAST false by default

  //#region singleton
  private constructor() {
    // Private constructor ensures the class cannot be instantiated from outside
    this.scrollableEnabled = !!ENV?.useGlobalNgxScrollbar;
  }
  public static get Instance(): FiredevAdmin {
    if (!globalPublicStorage[config.frameworkNames.firedev]) {
      globalPublicStorage[config.frameworkNames.firedev] = new FiredevAdmin();
    }
    return globalPublicStorage[config.frameworkNames.firedev];
  }
  //#endregion

  //#region fields & getters
  public cmp: FiredevAdminModeConfigurationComponent;
  private onEditMode = new Subject();
  onEditMode$ = this.onEditMode.asObservable();
  //#endregion

  //#region fields & getters / popup is open
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public adminPanelIsOpen: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public draggablePopupMode: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public draggablePopupModeFullScreen: boolean;
  //#endregion

  //#region fields & getters / kepp websql database data after reload
  /**
   * Property used in firedev
   */
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public keepWebsqlDbDataAfterReload: boolean;
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
